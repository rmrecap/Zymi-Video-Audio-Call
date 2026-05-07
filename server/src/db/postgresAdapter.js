import { query, getPostgresPool } from '../db/postgres.js';

let lastInsertRowid = null;

const updateLastInsertRowid = (result) => {
  lastInsertRowid = result?.rows?.[0]?.id || null;
  return lastInsertRowid;
};

export const getLastInsertRowid = () => lastInsertRowid;

const parseRow = (row) => row;
const parseRows = (rows) => rows;

export const get = async (...args) => {
  const text = args[0];
  const params = args.slice(1);
  const result = await query(text, params);
  return result.rows[0] || null;
};

export const all = async (...args) => {
  const text = args[0];
  const params = args.slice(1);
  const result = await query(text, params);
  return result.rows;
};

export const run = async (...args) => {
  const text = args[0];
  const params = args.slice(1);
  const result = await query(text, params);
  return updateLastInsertRowid(result);
};

export const exec = async (...args) => {
  const text = args[0];
  const result = await query(text);
  return result;
};

export const prepare = (sql) => ({
  get: (...params) => get(sql, ...params),
  all: (...params) => all(sql, ...params),
  run: (...params) => run(sql, ...params)
});

export const userExists = async (userId) => {
  const result = await query('SELECT id FROM users WHERE id = $1', [userId]);
  return result.rows.length > 0;
};

export const getUserById = async (userId) => {
  const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0] || null;
};

export const getUserByUsername = async (username) => {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

export const createUser = async (username, passwordHash, role = 'user') => {
  const result = await query(
    'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
    [username, passwordHash, role]
  );
  return result.rows[0]?.id;
};

export const updateUserTokenVersion = async (userId) => {
  return query(
    'UPDATE users SET token_version = token_version + 1 WHERE id = $1',
    [userId]
  );
};

export const createMessage = async (senderId, receiverId, content) => {
  const result = await query(
    'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING id',
    [senderId, receiverId, content]
  );
  return result.rows[0]?.id;
};

export const getMessagesBetweenUsers = async (userId, otherId) => {
  return query(`
    SELECT * FROM messages 
    WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $3 AND receiver_id = $4))
    AND deleted_at IS NULL
    ORDER BY created_at ASC
  `, [userId, otherId, otherId, userId]);
};

export const markMessageAsRead = async (messageId, userId) => {
  return query(
    'UPDATE messages SET is_read = true WHERE id = $1 AND receiver_id = $2',
    [messageId, userId]
  );
};

export const hideMessage = async (messageId, userId) => {
  return query(
    'UPDATE messages SET is_hidden = true WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)',
    [messageId, userId]
  );
};

export const deleteMessage = async (messageId, userId) => {
  return query(
    'UPDATE messages SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE id = $2',
    [userId, messageId]
  );
};

export const editMessageContent = async (messageId, newContent, userId) => {
  const oldResult = await query('SELECT content FROM messages WHERE id = $1', [messageId]);
  if (!oldResult.rows[0]) return null;
  
  await query(
    'UPDATE messages SET previous_content = $1, content = $2, edited_at = CURRENT_TIMESTAMP WHERE id = $3',
    [oldResult.rows[0].content, newContent, messageId]
  );
  
  await query(
    'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)',
    [userId, userId, `Edit: ${messageId}`]
  );
  
  return messageId;
};

export const getMessageEdits = async (messageId) => {
  return query(
    'SELECT * FROM messages WHERE sender_id = $1 AND receiver_id = $1 AND previous_content IS NOT NULL ORDER BY created_at DESC',
    [messageId]
  );
};

export const searchMessages = async (userId, searchQuery) => {
  return query(`
    SELECT * FROM messages 
    WHERE (sender_id = $1 OR receiver_id = $1) 
    AND content LIKE $2 
    AND deleted_at IS NULL
    ORDER BY created_at DESC
  `, [userId, `%${searchQuery}%`]);
};

export const getUnreadCount = async (userId) => {
  const result = await query(
    'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = false',
    [userId]
  );
  return parseInt(result.rows[0]?.count || 0);
};

export const createBlock = async (blockerId, blockedUserId) => {
  const result = await query(
    'INSERT INTO blocked_users (blocker_id, blocked_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
    [blockerId, blockedUserId]
  );
  return result.rows[0]?.id;
};

export const removeBlock = async (blockerId, blockedUserId) => {
  return query(
    'DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_user_id = $2',
    [blockerId, blockedUserId]
  );
};

export const isUserBlocked = async (blockerId, targetId) => {
  const result = await query(
    'SELECT id FROM blocked_users WHERE blocker_id = $1 AND blocked_user_id = $2',
    [blockerId, targetId]
  );
  return result.rows.length > 0;
};

export const getBlockedUsers = async (userId) => {
  return query(`
    SELECT u.* FROM users u
    JOIN blocked_users bu ON u.id = bu.blocked_user_id
    WHERE bu.blocker_id = $1
  `, [userId]);
};

export const createCallHistory = async (callerId, receiverId, callType) => {
  const result = await query(
    'INSERT INTO call_history (caller_id, receiver_id, call_type, status, started_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id',
    [callerId, receiverId, callType, 'pending']
  );
  return result.rows[0]?.id;
};

export const updateCallHistory = async (callId, status) => {
  const updates = {
    'answered': 'answered_at = CURRENT_TIMESTAMP',
    'ended': 'ended_at = CURRENT_TIMESTAMP',
    'rejected': 'ended_at = CURRENT_TIMESTAMP',
    'failed': 'ended_at = CURRENT_TIMESTAMP'
  };
  
  if (updates[status]) {
    return query(`UPDATE call_history SET status = $1, ${updates[status]} WHERE id = $2`, [status, callId]);
  }
  return query('UPDATE call_history SET status = $1 WHERE id = $2', [status, callId]);
};

export const getCallHistory = async (userId) => {
  return query(`
    SELECT * FROM call_history 
    WHERE caller_id = $1 OR receiver_id = $1
    ORDER BY started_at DESC
    LIMIT 100
  `, [userId]);
};

export const createReport = async (reporterId, messageId, reason) => {
  const result = await query(
    'INSERT INTO message_reports (reporter_id, message_id, reason) VALUES ($1, $2, $3) RETURNING id',
    [reporterId, messageId, reason]
  );
  return result.rows[0]?.id;
};

export const getReports = async () => {
  return query('SELECT * FROM message_reports WHERE status = $1 ORDER BY created_at DESC', ['pending']);
};

export const resolveReport = async (reportId, status) => {
  return query(
    'UPDATE message_reports SET status = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, reportId]
  );
};

export const createAuditLog = async (adminId, action, targetUserId, details) => {
  const result = await query(
    'INSERT INTO admin_audit_logs (admin_id, action, target_user_id, details) VALUES ($1, $2, $3, $4) RETURNING id',
    [adminId, action, targetUserId, details]
  );
  return result.rows[0]?.id;
};

export const getAuditLogs = async (limit = 100) => {
  return query('SELECT * FROM admin_audit_logs ORDER BY timestamp DESC LIMIT $1', [limit]);
};

export const getMetrics = async () => {
  const result = await query('SELECT * FROM metrics');
  const metrics = {};
  result.rows.forEach(row => {
    metrics[row.key] = row.value;
  });
  return metrics;
};

export const updateMetric = async (key, value) => {
  return query(
    'INSERT INTO metrics (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [key, value]
  );
};

export const incrementMetric = async (key) => {
  return query(
    'INSERT INTO metrics (key, value) VALUES ($1, 1) ON CONFLICT(key) DO UPDATE SET value = value + 1',
    [key]
  );
};