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

export const createReportsTable = async () => {
  if (!(await tableExists('message_reports'))) {
    await exec(`
      CREATE TABLE IF NOT EXISTS message_reports (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL,
        reporter_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        admin_id INTEGER,
        admin_action TEXT,
        action_details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id),
        FOREIGN KEY (reporter_id) REFERENCES users(id),
        FOREIGN KEY (admin_id) REFERENCES users(id)
      )
    `);
    console.log('[MIGRATION] Created message_reports table');
  }
};

export const createReport = async (messageId, reporterId, reason) => {
  const existing = await get(
    'SELECT id FROM message_reports WHERE message_id = $1 AND reporter_id = $2',
    [messageId, reporterId]
  );
  if (existing) {
    return { success: false, error: 'Already reported' };
  }
  
  try {
    const result = await run(
      'INSERT INTO message_reports (message_id, reporter_id, reason) VALUES ($1, $2, $3) RETURNING id',
      [messageId, reporterId, reason]
    );
    return { success: true, id: result.lastID };
  } catch (err) {
    console.error('[REPORT_SERVICE] createReport error:', err);
    return { success: false, error: 'Failed to report' };
  }
};

export const getReports = async (status = 'pending') => {
  return await all(`
    SELECT 
      r.id,
      r.message_id,
      r.reporter_id,
      r.reason,
      r.status,
      r.created_at,
      m.content,
      m.sender_id,
      u.username as reporter_username,
      s.username as sender_username
    FROM message_reports r
    JOIN messages m ON r.message_id = m.id
    JOIN users u ON r.reporter_id = u.id
    JOIN users s ON m.sender_id = s.id
    WHERE r.status = $1
    ORDER BY r.created_at DESC
  `, [status]);
};

export const resolveReport = async (reportId, adminId, action, extraData = {}) => {
  const allowedActions = ['dismissed', 'reviewed', 'hide_message', 'warn_user', 'ban_user'];
  if (!allowedActions.includes(action)) {
    throw new Error('Invalid action');
  }

  const details = JSON.stringify(extraData || {});

  await run(
    `UPDATE message_reports
     SET status = 'resolved', admin_id = $1, admin_action = $2, action_details = $3, resolved_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [adminId, action, details, reportId]
  );

  // Perform side effects based on action
  if (action === 'hide_message' && extraData.messageId) {
    await run('UPDATE messages SET is_hidden = TRUE WHERE id = $1', [extraData.messageId]);
  }

  if (action === 'ban_user' && extraData.userId) {
    await run('UPDATE users SET is_banned = TRUE, banned_at = CURRENT_TIMESTAMP WHERE id = $1', [extraData.userId]);
  }

  return true;
};