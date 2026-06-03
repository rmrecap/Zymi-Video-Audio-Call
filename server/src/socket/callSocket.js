import { SOCKET_EVENTS } from '../../shared/socketEvents.js';
import { incrementCallsToday, incrementFailedCalls } from '../services/metricsService.js';
import { logAudit } from '../services/auditService.js';
import { startCall, endCall, rejectCall as rejectCallDB, getCurrentCall } from '../services/callHistoryService.js';
import { CALL_TIMEOUT_MS, addPendingCall, removePendingCall, startCallTimeout, clearCallTimeout, handleCallTimeout } from '../services/callStateService.js';
import { registerActiveCall, clearActiveCall, cleanupUserActiveCall } from './callState.js';
import { registry } from './userSocketRegistry.js';
import * as groupChatService from '../services/groupChatService.js';

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

        const blocked = await isBlocked(to, from);
        if (blocked) {
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
      for (const [callId, state] of groupCalls.entries()) {
        if (state.participants.includes(String(socket.userId))) {
          state.participants = state.participants.filter(p => p !== String(socket.userId));
          if (state.participants.length === 0) {
            state.active = false;
            removeGroupCallState(callId);
          }
        }
      }
      clearInterval(groupCallCleanupInterval);
    });

    // ═══════════════════════════════════════════════════════════════════
    // Group Call Signaling (Phase 5B)
    // ═══════════════════════════════════════════════════════════════════

    const groupCalls = new Map();

    const getGroupCallState = (callId) => {
      return groupCalls.get(callId) || null;
    };

    const setGroupCallState = (callId, state) => {
      groupCalls.set(callId, state);
    };

    const removeGroupCallState = (callId) => {
      groupCalls.delete(callId);
    };

    socket.on(SOCKET_EVENTS.GROUP_CALL_START, async (data) => {
      try {
        const { groupId, callType, offer } = data || {};
        if (!groupId || !callType || !offer || !socket.userId) return;

        const callId = `group_${groupId}_${Date.now()}`;
        const members = await groupChatService.getMembers(groupId);
        const isMember = members.some(m => String(m.id) === String(socket.userId) && m.role);
        if (!isMember) return;

        const participants = [String(socket.userId)];
        setGroupCallState(callId, {
          callId,
          groupId,
          callType,
          initiator: socket.userId,
          participants,
          startTime: Date.now(),
          active: true
        });

        for (const member of members) {
          if (String(member.id) === String(socket.userId)) continue;
          const memberSocketId = await resolveSocket(member.id, 'BACKGROUND', userSockets);
          if (memberSocketId) {
            io.to(memberSocketId).emit(SOCKET_EVENTS.GROUP_CALL_STARTED, {
              callId,
              groupId,
              callType,
              initiator: socket.userId,
              participants: [socket.userId],
              offer
            });
          }
        }

        const senderInfo = await get('SELECT username FROM users WHERE id = $1', [socket.userId]);
        socket.emit(SOCKET_EVENTS.GROUP_CALL_PARTICIPANTS, {
          callId,
          participants: [socket.userId],
          callType
        });

        logAudit(socket.userId, 'group_call_started', null, `Group call started: ${callId} type=${callType}`);
      } catch (err) {
        console.error('[CALL_SOCKET] GROUP_CALL_START error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_CALL_JOIN, async (data) => {
      try {
        const { callId, sdp } = data || {};
        if (!callId || !socket.userId) return;

        const state = getGroupCallState(callId);
        if (!state || !state.active) return;

        if (!state.participants.includes(String(socket.userId))) {
          state.participants.push(String(socket.userId));
        }
        setGroupCallState(callId, state);

        for (const pid of state.participants) {
          const participantSocketId = await resolveSocket(pid, 'UI', userSockets);
          if (participantSocketId) {
            io.to(participantSocketId).emit(SOCKET_EVENTS.GROUP_CALL_JOINED, {
              callId,
              userId: socket.userId,
              participants: state.participants,
              sdp: String(pid) === String(socket.userId) ? undefined : sdp
            });
          }
        }

        logAudit(socket.userId, 'group_call_joined', null, `Joined group call: ${callId}`);
      } catch (err) {
        console.error('[CALL_SOCKET] GROUP_CALL_JOIN error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_CALL_LEAVE, async (data) => {
      try {
        const { callId } = data || {};
        if (!callId || !socket.userId) return;

        const state = getGroupCallState(callId);
        if (state) {
          state.participants = state.participants.filter(p => p !== String(socket.userId));
          if (state.participants.length === 0) {
            state.active = false;
            removeGroupCallState(callId);
          } else {
            setGroupCallState(callId, state);
          }
        }

        for (const pid of (state?.participants || [])) {
          const participantSocketId = await resolveSocket(pid, 'UI', userSockets);
          if (participantSocketId) {
            io.to(participantSocketId).emit(SOCKET_EVENTS.GROUP_CALL_LEFT, {
              callId,
              userId: socket.userId,
              participants: state?.participants || []
            });
          }
        }
      } catch (err) {
        console.error('[CALL_SOCKET] GROUP_CALL_LEAVE error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_CALL_OFFER, async (data) => {
      try {
        const { callId, to, offer } = data || {};
        if (!callId || !to || !offer || !socket.userId) return;

        const targetSocketId = await resolveSocket(to, 'UI', userSockets);
        if (targetSocketId) {
          io.to(targetSocketId).emit(SOCKET_EVENTS.GROUP_CALL_OFFER, {
            callId,
            from: socket.userId,
            offer
          });
        }
      } catch (err) {
        console.error('[CALL_SOCKET] GROUP_CALL_OFFER error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_CALL_ANSWER, async (data) => {
      try {
        const { callId, to, answer } = data || {};
        if (!callId || !to || !answer || !socket.userId) return;

        const targetSocketId = await resolveSocket(to, 'UI', userSockets);
        if (targetSocketId) {
          io.to(targetSocketId).emit(SOCKET_EVENTS.GROUP_CALL_ANSWER, {
            callId,
            from: socket.userId,
            answer
          });
        }
      } catch (err) {
        console.error('[CALL_SOCKET] GROUP_CALL_ANSWER error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_CALL_ICE_CANDIDATE, async (data) => {
      try {
        const { callId, to, candidate } = data || {};
        if (!callId || !to || !candidate || !socket.userId) return;

        const targetSocketId = await resolveSocket(to, 'UI', userSockets);
        if (targetSocketId) {
          io.to(targetSocketId).emit(SOCKET_EVENTS.GROUP_CALL_ICE_CANDIDATE, {
            callId,
            from: socket.userId,
            candidate
          });
        }
      } catch (err) {
        console.error('[CALL_SOCKET] GROUP_CALL_ICE_CANDIDATE error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_CALL_END, async (data) => {
      try {
        const { callId } = data || {};
        if (!callId || !socket.userId) return;

        const state = getGroupCallState(callId);
        if (state) {
          state.active = false;
          const callDuration = Math.floor((Date.now() - state.startTime) / 1000);
          for (const pid of state.participants) {
            const participantSocketId = await resolveSocket(pid, 'UI', userSockets);
            if (participantSocketId) {
              io.to(participantSocketId).emit(SOCKET_EVENTS.GROUP_CALL_ENDED, {
                callId,
                endedBy: socket.userId,
                duration: callDuration
              });
            }
          }
          removeGroupCallState(callId);

          try {
            const { addGroupCallHistory } = await import('../services/callHistoryService.js');
            await addGroupCallHistory({
              groupId: state.groupId,
              initiatorId: state.initiator,
              callType: state.callType,
              duration: callDuration,
              participants: state.participants
            });
          } catch (histErr) {
            console.error('[CALL_SOCKET] Group call history save error:', histErr);
          }

          logAudit(socket.userId, 'group_call_ended', null, `Group call ended: ${callId} duration=${callDuration}s`);
        }
      } catch (err) {
        console.error('[CALL_SOCKET] GROUP_CALL_END error:', err);
      }
    });

    // Group call timeout handling
    socket.on(SOCKET_EVENTS.GROUP_CALL_REJECT, async (data) => {
      try {
        const { callId } = data || {};
        if (!callId || !socket.userId) return;

        const state = getGroupCallState(callId);
        if (state) {
          const rejectMsg = { callId, userId: socket.userId, reason: 'rejected' };
          for (const pid of state.participants) {
            const participantSocketId = await resolveSocket(pid, 'UI', userSockets);
            if (participantSocketId) {
              io.to(participantSocketId).emit(SOCKET_EVENTS.GROUP_CALL_REJECTED, rejectMsg);
            }
          }
        }
      } catch (err) {
        console.error('[CALL_SOCKET] GROUP_CALL_REJECT error:', err);
      }
    });

    // Auto-cleanup stale group calls on disconnect
    const cleanupStaleGroupCalls = async () => {
      const now = Date.now();
      for (const [callId, state] of groupCalls.entries()) {
        if (state.active && (now - state.startTime) > CALL_TIMEOUT_MS) {
          state.active = false;
          for (const pid of state.participants) {
            const participantSocketId = await resolveSocket(pid, 'UI', userSockets);
            if (participantSocketId) {
              io.to(participantSocketId).emit(SOCKET_EVENTS.GROUP_CALL_TIMEOUT, { callId });
            }
          }
          removeGroupCallState(callId);
          console.log('[CALL_SOCKET] Group call timed out:', callId);
        }
      }
    };

    const groupCallCleanupInterval = setInterval(cleanupStaleGroupCalls, 30000);

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