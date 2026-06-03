import { exec, get, all, run } from '../db/postgres.js';

const tableExists = async (tableName) => {
  const result = await get(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  `, [tableName]);
  return !!result;
};

const columnExists = async (tableName, columnName) => {
  const result = await get(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = $1 
    AND column_name = $2
  `, [tableName, columnName]);
  return !!result;
};

export const createCallHistoryTable = async () => {
  if (!(await tableExists('call_history'))) {
    await exec(`
      CREATE TABLE IF NOT EXISTS call_history (
        id SERIAL PRIMARY KEY,
        caller_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        call_type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        answered_at TIMESTAMP,
        ended_at TIMESTAMP,
        duration INTEGER DEFAULT 0,
        FOREIGN KEY (caller_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      )
    `);
    console.log('[MIGRATION] Created call_history table');
  } else {
    // Check if answered_at column exists, add if missing
    if (!(await columnExists('call_history', 'answered_at'))) {
      await exec('ALTER TABLE call_history ADD COLUMN answered_at TIMESTAMP');
      console.log('[MIGRATION] Added answered_at column to call_history');
    }
  }
};

// Per-caller call registry instead of singleton — supports concurrent calls
const activeCalls = new Map(); // callerId -> { id, callerId, receiverId, startTime }

export const startCall = async (callerId, receiverId, callType) => {
  const callerKey = String(callerId);
  const result = await run(
    'INSERT INTO call_history (caller_id, receiver_id, call_type, status) VALUES ($1, $2, $3, $4) RETURNING id',
    [callerId, receiverId, callType, 'started']
  );
  const callData = {
    id: result.lastID,
    callerId,
    receiverId,
    startTime: Date.now()
  };
  activeCalls.set(callerKey, callData);
  return callData;
};

export const endCall = async (callId, status = 'completed') => {
  // Find the call by ID in the map
  let call = null;
  let callerKey = null;
  for (const [key, c] of activeCalls) {
    if (c.id === callId) {
      call = c;
      callerKey = key;
      break;
    }
  }
  if (!call) return null;

  const duration = Math.floor((Date.now() - call.startTime) / 1000);

  let answeredAt = null;
  if (status === 'accepted' || status === 'ended') {
    // approximate answer time
    answeredAt = new Date(new Date(call.startTime).getTime() + 5000); 
  }

  await run(
    'UPDATE call_history SET status = $1, answered_at = $2, ended_at = CURRENT_TIMESTAMP, duration = $3 WHERE id = $4',
    [status, answeredAt, duration, callId]
  );

  const ended = { ...call, status, answeredAt, endedAt: new Date(), duration };
  activeCalls.delete(callerKey);
  return ended;
};

export const missCall = async (callId) => {
  let call = null;
  let callerKey = null;
  for (const [key, c] of activeCalls) {
    if (c.id === callId) {
      call = c;
      callerKey = key;
      break;
    }
  }
  if (!call) return null;

  await run(
    'UPDATE call_history SET status = $1, ended_at = CURRENT_TIMESTAMP, duration = 0 WHERE id = $2',
    ['missed', callId]
  );

  const ended = { ...call, status: 'missed', endedAt: new Date(), duration: 0 };
  activeCalls.delete(callerKey);
  return ended;
};

export const rejectCall = async (callId) => {
  let call = null;
  let callerKey = null;
  for (const [key, c] of activeCalls) {
    if (c.id === callId) {
      call = c;
      callerKey = key;
      break;
    }
  }
  if (!call) return null;

  await run(
    'UPDATE call_history SET status = $1, ended_at = CURRENT_TIMESTAMP, duration = 0 WHERE id = $2',
    ['rejected', callId]
  );

  const ended = { ...call, status: 'rejected', endedAt: new Date(), duration: 0 };
  activeCalls.delete(callerKey);
  return ended;
};

export const getCallHistory = async (userId, limit = 50) => {
  return await all(`
    SELECT 
      h.id,
      h.caller_id,
      h.receiver_id,
      h.call_type,
      h.status,
      h.started_at,
      h.ended_at,
      h.duration,
      u.username as caller_username,
      r.username as receiver_username
    FROM call_history h
    JOIN users u ON h.caller_id = u.id
    JOIN users r ON h.receiver_id = r.id
    WHERE h.caller_id = $1 OR h.receiver_id = $2
    ORDER BY h.started_at DESC
    LIMIT $3
  `, [userId, userId, limit]);
};

// ═══════════════════════════════════════════════════════════════════
// Group Call History (Phase 5B)
// ═══════════════════════════════════════════════════════════════════

export const createGroupCallHistoryTable = async () => {
  if (!(await tableExists('group_call_history'))) {
    await exec(`
      CREATE TABLE IF NOT EXISTS group_call_history (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL,
        initiator_id INTEGER NOT NULL REFERENCES users(id),
        call_type TEXT NOT NULL,
        duration INTEGER DEFAULT 0,
        participant_count INTEGER DEFAULT 0,
        participant_ids TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created group_call_history table');
  }
};

export const addGroupCallHistory = async ({ groupId, initiatorId, callType, duration, participants }) => {
  try {
    await run(
      `INSERT INTO group_call_history (group_id, initiator_id, call_type, duration, participant_count, participant_ids)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [groupId, initiatorId, callType || 'audio', duration || 0, participants?.length || 0, participants ? JSON.stringify(participants) : null]
    );
  } catch (err) {
    console.error('[CALL_HISTORY] Error saving group call history:', err.message);
  }
};

export const getGroupCallHistory = async (groupId, limit = 50) => {
  try {
    return await all(`
      SELECT gch.*, u.username as initiator_username
      FROM group_call_history gch
      JOIN users u ON gch.initiator_id = u.id
      WHERE gch.group_id = $1
      ORDER BY gch.started_at DESC
      LIMIT $2
    `, [groupId, limit]);
  } catch (err) {
    console.error('[CALL_HISTORY] Error fetching group call history:', err.message);
    return [];
  }
};

// Get current call for a specific caller (used by callSocket handlers)
export const getCurrentCall = (callerId) => {
  if (callerId) {
    return activeCalls.get(String(callerId)) || null;
  }
  // Fallback: return most recent call (backward compatibility)
  if (activeCalls.size === 0) return null;
  const entries = Array.from(activeCalls.values());
  return entries[entries.length - 1];
};