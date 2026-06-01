import { SOCKET_EVENTS } from '../../shared/socketEvents.js';
import { incrementCallsToday, incrementFailedCalls } from '../services/metricsService.js';
import { logAudit } from '../services/auditService.js';
import { startCall, endCall, rejectCall as rejectCallDB, getCurrentCall } from '../services/callHistoryService.js';
import { CALL_TIMEOUT_MS, addPendingCall, removePendingCall, startCallTimeout, clearCallTimeout, handleCallTimeout } from '../services/callStateService.js';
import { registerActiveCall, clearActiveCall, cleanupUserActiveCall } from './callState.js';
import { registry } from './userSocketRegistry.js';

import { getRedisClient } from './redisAdapter.js';
import { get } from '../db/postgres.js';
import { isBlocked } from '../routes/blockRoutes.js';
import * as inAppNotificationService from '../services/inAppNotificationService.js';

/**
 * Resolve the best socket ID for a user.
 * For incoming calls: prefer BACKGROUND socket (persistent daemon) for wake-up.
 * For media negotiation (answer/ICE): prefer UI socket (active renderer).
 * Falls back to local Map if registry lookup fails.
 */
const resolveSocket = async (userId, preferredType, userSockets) => {
  try {
    const socketId = await registry.getSocket(userId, preferredType);
    if (socketId) return socketId;
  } catch (err) {
    // Registry unavailable, fall through to local Map
  }
  return userSockets.get(String(userId)) || null;
};

async function getActiveIceServers() {
  const redisClient = getRedisClient();
  let healthyRelays = [];
  if (redisClient) {
    try {
      healthyRelays = await redisClient.sMembers('zymi:healthy_relays');
    } catch (e) {
      console.error('[CALL_SOCKET] Error fetching ICE servers', e);
    }
  }

  if (healthyRelays.length === 0) {
    return [{ urls: 'stun:stun.l.google.com:19302' }];
  }

  return healthyRelays.map(url => ({
    urls: `turn:${url}`,
    username: process.env.TURN_USER,
    credential: process.env.TURN_PASSWORD
  }));
}

const checkToken = async (socket, userId) => {
  try {
    if (!userId) return true; // Skip check if no userId available
    const user = await get('SELECT token_version FROM users WHERE id = $1', [userId]);
    if (user && socket.tokenVersion !== user.token_version) {
      return false;
    }
    return true;
  } catch (err) {
    console.error('[CALL_SOCKET] checkToken error:', err);
    return false;
  }
};

export const setupCallSocket = (io, userSockets, callActivity) => {
  io.on('connection', (socket) => {
    console.log('[CALL_SOCKET] User connected:', socket.id);

    const safeEmit = (event, data) => {
      try {
        socket.emit(event, data);
      } catch (err) {
        console.error('[CALL_SOCKET] Emit error:', err);
      }
    };

    const safeBroadcast = (targetSocketId, event, data) => {
      try {
        if (targetSocketId) {
          io.to(targetSocketId).emit(event, data);
        }
      } catch (err) {
        console.error('[CALL_SOCKET] Broadcast error:', err);
      }
    };

    socket.on(SOCKET_EVENTS.CALL_USER, async (data) => {
      try {
        console.log('[CALL_SOCKET] call-user received:', data);
        let { to, from, offer, type } = data || {};

        // Normalize to string for consistent Map lookups
        to = String(to);
        from = String(from);

        console.log('[CALL_SOCKET] Normalized - to:', to, 'from:', from);

        // Validate all required fields before proceeding
        if (!to || !from || !offer || !type) {
          console.log('[CALL_SOCKET] Invalid call data - to:', to, 'from:', from, 'offer:', !!offer, 'type:', type);
          safeEmit(SOCKET_EVENTS.CALL_REJECTED, { reason: 'Invalid call data' });
          return;
        }

        if (!socket.tokenVersion || !(await checkToken(socket, from))) {
          console.log('[CALL_SOCKET] Authentication failed for user:', from);
          safeEmit(SOCKET_EVENTS.CALL_REJECTED, { reason: 'Authentication failed' });
          return;
        }

        // Fallthrough Security: Check feature-gate status in Redis/DB before executing call logic
        const isCallEnabled = async (callType, userId) => {
          const redisClient = getRedisClient();
          const flagKey = callType === 'video' ? 'video_call_enabled' : 'audio_call_enabled';
          if (redisClient) {
            try {
              const val = await redisClient.hGet('zymi:features', flagKey);
              if (val === 'false') return false;
              if (val === 'true') return true;
            } catch (e) {
              console.error('[CALL_SOCKET] Redis feature check error:', e);
            }
          }
          const featureFlagService = await import('../services/featureFlagService.js');
          return await featureFlagService.checkFeatureAccess({
            featureKey: flagKey,
            userId
          });
        };

        const callingAllowed = await isCallEnabled(type, from);
        if (!callingAllowed) {
          console.log('[CALL_SOCKET] Call feature disabled:', type);
          safeEmit(SOCKET_EVENTS.CALL_REJECTED, { reason: 'Calling features are currently disabled by administrator.' });
          return;
        }

        callActivity.totalCalls++;
        incrementCallsToday();

        // Prefer BACKGROUND socket for wake-up signal (persistent daemon)
        const targetSocketId = await resolveSocket(to, 'BACKGROUND', userSockets);
        console.log('[CALL_SOCKET] Looking for target user:', to, '-> socketId:', targetSocketId);
        if (!targetSocketId) {
          console.log('[CALL_SOCKET] User offline - no socket found for:', to);
          incrementFailedCalls();
          safeEmit(SOCKET_EVENTS.CALL_REJECTED, { reason: 'User offline' });
          return;
        }

        if (isBlocked(to, from)) {
          safeEmit(SOCKET_EVENTS.CALL_REJECTED, { reason: 'Cannot call this user' });
          callActivity.totalCalls--;
          return;
        }

        const call = await startCall(from, to, type);
        addPendingCall(from, to, offer, type);

        // Wrap timeout callback in try-catch to prevent uncaught exceptions
        startCallTimeout(from, async () => {
          try {
            if (removePendingCall(from)) {
              const timedOutCall = await handleCallTimeout(from);
              if (timedOutCall) {
                safeBroadcast(userSockets.get(from), SOCKET_EVENTS.CALL_TIMEOUT, { to, callId: timedOutCall.id });
                safeBroadcast(targetSocketId, SOCKET_EVENTS.CALL_REJECTED, { reason: 'Call timed out' });
                logAudit(from, 'call_timeout', to, `Call timed out after ${CALL_TIMEOUT_MS}ms`);

                // Phase 57: Missed call notification
                const caller = await get('SELECT username FROM users WHERE id = $1', [from]);
                inAppNotificationService.createNotification({
                  user_id: to,
                  type: 'call_missed',
                  title: 'Missed Call',
                  body: `You missed a call from ${caller?.username || 'Unknown'}`,
                  related_user_id: from
                });
              }
            }
          } catch (timeoutErr) {
            console.error('[CALL_SOCKET] Timeout handler error:', timeoutErr);
          }
        });

        const senderInfo = await get('SELECT username, avatar FROM users WHERE id = $1', [from]);
        const iceServers = await getActiveIceServers();

        safeBroadcast(targetSocketId, SOCKET_EVENTS.INCOMING_CALL, { 
          from, 
          offer, 
          type,
          callerName: senderInfo?.username || 'Unknown',
          callerAvatar: senderInfo?.avatar || '',
          callId: Date.now().toString(),
          iceServers
        });
        logAudit(from, 'call_started', to, `Call initiated: ${type}`);
      } catch (err) {
        console.error('[CALL_SOCKET] CALL_USER error:', err);
        safeEmit(SOCKET_EVENTS.CALL_FAILED, { reason: 'Call setup failed' });
        callActivity.failedCalls++;
      }
    });

    socket.on(SOCKET_EVENTS.MAKE_ANSWER, async (data) => {
      try {
        let { to, answer } = data || {};

        if (!to || !answer) {
          console.warn('[CALL_SOCKET] MAKE_ANSWER: missing required data');
          return;
        }
        to = String(to);

        if (!socket.tokenVersion || !(await checkToken(socket, socket.userId))) {
          return;
        }
        callActivity.activeCalls++;
        clearCallTimeout(socket.userId);
        const currentCall = getCurrentCall(socket.userId);
        if (currentCall) {
          await endCall(currentCall.id, 'accepted');
        }
        removePendingCall(socket.userId);

        // Register active call
        registerActiveCall(socket.userId, to, currentCall?.id);

        safeBroadcast(userSockets.get(to), SOCKET_EVENTS.CALL_ANSWER, { answer });
      } catch (err) {
        console.error('[CALL_SOCKET] MAKE_ANSWER error:', err);
        callActivity.failedCalls++;
      }
    });

    socket.on(SOCKET_EVENTS.ICE_CANDIDATE, async (data) => {
      try {
        let { to, candidate } = data || {};

        // Both to and candidate are required for ICE relay
        if (!to || !candidate) {
          return;
        }
        to = String(to);

        if (!socket.tokenVersion || !(await checkToken(socket, socket.userId))) {
          return;
        }
        safeBroadcast(userSockets.get(to), SOCKET_EVENTS.ICE_CANDIDATE, { candidate });
      } catch (err) {
        console.error('[CALL_SOCKET] ICE_CANDIDATE error:', err);
        callActivity.failedCalls++;
      }
    });

    socket.on(SOCKET_EVENTS.END_CALL, async (data) => {
      try {
        let { to, from } = data || {};
        if (!to) return;
        to = String(to);
        if (process.env.NODE_ENV === 'development') console.log('[CALL] end-call emit', {to, from});

        if (!socket.tokenVersion || !(await checkToken(socket, socket.userId))) {
          return;
        }
        callActivity.activeCalls = Math.max(0, callActivity.activeCalls - 1);
        clearCallTimeout(socket.userId);
        const currentCall = getCurrentCall(socket.userId);
        if (currentCall) {
          await endCall(currentCall.id, 'ended');
        }
        removePendingCall(socket.userId);

        // Clear active call
        clearActiveCall(socket.userId, to);

        const targetSocket = userSockets.get(String(to)) || userSockets.get(to);
        if (targetSocket) {
          io.to(targetSocket).emit(SOCKET_EVENTS.CALL_ENDED, { from });
        }
      } catch (err) {
        console.error('[CALL_SOCKET] END_CALL error:', err);
        callActivity.failedCalls++;
      }
    });

    socket.on(SOCKET_EVENTS.REJECT_CALL, async (data) => {
      try {
        let { to, from } = data || {};
        if (!to) return;
        to = String(to);

        if (!socket.tokenVersion || !(await checkToken(socket, socket.userId))) {
          return;
        }
        clearCallTimeout(socket.userId);
        const currentCall = getCurrentCall(socket.userId);
        if (currentCall) {
          await rejectCallDB(currentCall.id);
        }
        removePendingCall(socket.userId);

        // Clear active call (if any)
        clearActiveCall(socket.userId, to);

        const targetSocket = userSockets.get(String(to)) || userSockets.get(to);
        if (targetSocket) {
          io.to(targetSocket).emit(SOCKET_EVENTS.CALL_REJECTED, { from });
        }
        logAudit(socket.userId, 'call_rejected', to, 'Call rejected');
      } catch (err) {
        console.error('[CALL_SOCKET] REJECT_CALL error:', err);
        callActivity.failedCalls++;
      }
    });

    // Heartbeat from Background Isolate — keep-alive acknowledgment
    socket.on('heartbeat_ping', async (data) => {
      // Root: Sliding TTL refresh (48h) to prevent registry decay for long-running daemons
      if (socket.userId) {
        const redisClient = getRedisClient();
        if (redisClient) {
          await redisClient.expire(`${registry.keyPrefix}${socket.userId}`, 172800);
        }
      }
      // Acknowledge heartbeat to reset server-side ping timeout
      socket.emit('heartbeat-ack', { ts: Date.now() });
    });

    socket.on('disconnect', () => {
      console.log('[CALL_SOCKET] User disconnected:', socket.id);
      if (socket.userId) {
        cleanupUserActiveCall(socket.userId, io, userSockets);
      }
    });

    // Phase 59: Connectivity Additive Events
    socket.on('ice-retry-requested', (data) => {
      const { to, reason } = data;
      if (!to) return;
      const targetSocket = userSockets.get(String(to));
      if (targetSocket) {
        io.to(targetSocket).emit('ice-retry-requested', { from: socket.userId, reason });
      }
    });

    socket.on('relay-mode-activated', (data) => {
      const { to } = data;
      if (!to) return;
      const targetSocket = userSockets.get(String(to));
      if (targetSocket) {
        io.to(targetSocket).emit('relay-mode-activated', { from: socket.userId });
      }
    });
  });
};