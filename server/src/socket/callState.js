// server/src/socket/callState.js
import { SOCKET_EVENTS } from '../../shared/socketEvents.js';
import { registry } from './userSocketRegistry.js';

// Active calls registry: userId -> { peerId, callId, startedAt }
const activeCalls = new Map();

export const registerActiveCall = (from, to, callId) => {
  const fromStr = String(from);
  const toStr = String(to);
  activeCalls.set(fromStr, { peerId: toStr, callId, startedAt: Date.now() });
  activeCalls.set(toStr, { peerId: fromStr, callId, startedAt: Date.now() });
};

export const clearActiveCall = (a, b) => {
  const aStr = String(a);
  const bStr = String(b);
  activeCalls.delete(aStr);
  activeCalls.delete(bStr);
};

export const cleanupUserActiveCall = async (userId, io, userSockets) => {
  const userIdStr = String(userId);
  const active = activeCalls.get(userIdStr);
  if (!active) return;

  // Try registry first (UI socket preferred for active call peer), fall back to local Map
  let peerSocketId = null;
  try {
    peerSocketId = await registry.getSocket(String(active.peerId), 'UI');
  } catch (err) {
    // Registry unavailable
  }
  if (!peerSocketId) {
    peerSocketId = userSockets.get(String(active.peerId));
  }

  if (peerSocketId) {
    io.to(peerSocketId).emit(SOCKET_EVENTS.CALL_ENDED, { from: userIdStr, reason: 'peer-disconnected' });
  }
  activeCalls.delete(userIdStr);
  activeCalls.delete(String(active.peerId));
};