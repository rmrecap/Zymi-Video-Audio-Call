import { getCurrentCall as getHistoryCurrentCall, missCall, rejectCall as rejectCallDB, endCall as endCallDB } from './callHistoryService.js';

export const CALL_TIMEOUT_MS = 30000; // 30 seconds

let pendingCalls = new Map(); // callerId -> { targetId, offer, type, timestamp, timeoutId }
// Per-caller timeout registry instead of singleton — supports concurrent calls
const callTimeouts = new Map(); // callerId -> timeoutId

export const initCallState = () => {
  pendingCalls = new Map();
  callTimeouts.clear();
};

export const addPendingCall = (callerId, targetId, offer, type) => {
  const callerKey = String(callerId);
  // Clear any existing pending call for this caller
  removePendingCall(callerKey);

  const timeoutId = setTimeout(() => {
    pendingCalls.delete(callerKey);
    callTimeouts.delete(callerKey);
  }, CALL_TIMEOUT_MS);

  pendingCalls.set(callerKey, {
    targetId,
    offer,
    type,
    timestamp: Date.now(),
    timeoutId
  });
};

export const removePendingCall = (callerId) => {
  const callerKey = String(callerId);
  const pending = pendingCalls.get(callerKey);
  if (pending?.timeoutId) {
    clearTimeout(pending.timeoutId);
  }
  return pendingCalls.delete(callerKey);
};

export const getPendingCall = (callerId) => pendingCalls.get(String(callerId));

export const hasPendingCall = (callerId) => pendingCalls.has(String(callerId));

export const startCallTimeout = (callerId, onTimeout, timeoutMs = CALL_TIMEOUT_MS) => {
  const callerKey = String(callerId);
  clearCallTimeout(callerKey);
  const timeoutId = setTimeout(() => {
    callTimeouts.delete(callerKey);
    onTimeout();
  }, timeoutMs);
  callTimeouts.set(callerKey, timeoutId);
  return timeoutId;
};

export const clearCallTimeout = (callerId) => {
  if (callerId) {
    const callerKey = String(callerId);
    const timeoutId = callTimeouts.get(callerKey);
    if (timeoutId) {
      clearTimeout(timeoutId);
      callTimeouts.delete(callerKey);
    }
  } else {
    // Backward compatibility: clear all timeouts
    for (const [key, tid] of callTimeouts) {
      clearTimeout(tid);
    }
    callTimeouts.clear();
  }
};

export const getCallState = () => ({
  pendingCalls: Array.from(pendingCalls.keys()),
  activeTimeouts: Array.from(callTimeouts.keys())
});

// Timeout handler to be used by callSocket
export const handleCallTimeout = async (callerId) => {
  const currentCall = getHistoryCurrentCall(callerId);
  if (currentCall) {
    await missCall(currentCall.id);
    return currentCall;
  }
  return null;
};
