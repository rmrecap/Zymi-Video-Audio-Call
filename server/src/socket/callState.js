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

  io.to(String(active.peerId)).emit(SOCKET_EVENTS.CALL_ENDED, { from: userIdStr, reason: 'peer-disconnected' });
  activeCalls.delete(userIdStr);
  activeCalls.delete(String(active.peerId));
};