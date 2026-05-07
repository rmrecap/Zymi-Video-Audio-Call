import { SOCKET_EVENTS } from '../../shared/socketEvents.js';
import { incrementCallsToday, incrementFailedCalls } from '../services/metricsService.js';
import { logAudit } from '../services/auditService.js';
import { startCall, endCall, rejectCall as rejectCallDB, getCurrentCall } from '../services/callHistoryService.js';
import { CALL_TIMEOUT_MS, addPendingCall, removePendingCall, startCallTimeout, clearCallTimeout, handleCallTimeout } from '../services/callStateService.js';
import { registerActiveCall, clearActiveCall, cleanupUserActiveCall } from './callState.js';

import { get } from '../db/postgres.js';
import { isBlocked } from '../routes/blockRoutes.js';
import * as inAppNotificationService from '../services/inAppNotificationService.js';

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

        callActivity.totalCalls++;
        incrementCallsToday();

        const targetSocketId = userSockets.get(to);
        console.log('[CALL_SOCKET] Looking for target user:', to, '-> socketId:', targetSocketId);
        console.log('[CALL_SOCKET] All connected sockets:', Array.from(userSockets.entries()));
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

        safeBroadcast(targetSocketId, SOCKET_EVENTS.INCOMING_CALL, { from, offer, type });
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