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

export const createBlockTable = async () => {
  if (!(await tableExists('blocked_users'))) {
    await exec(`
      CREATE TABLE IF NOT EXISTS blocked_users (
        id SERIAL PRIMARY KEY,
        blocker_id INTEGER NOT NULL,
        blocked_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blocker_id, blocked_id)
      )
    `);
    console.log('[MIGRATION] Created blocked_users table');
  }
};

export const checkBlocked = async (blockerId, blockedId) => {
  const result = await get(
    'SELECT id FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2',
    [blockerId, blockedId]
  );
  return !!result;
};

export const blockUser = async (blockerId, blockedId) => {
  try {
    await run(
      'INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT (blocker_id, blocked_id) DO NOTHING',
      [blockerId, blockedId]
    );
    return true;
  } catch (err) {
    console.error('[BLOCK_SERVICE] blockUser error:', err);
    return false;
  }
};

export const unblockUser = async (blockerId, blockedId) => {
  await run(
    'DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2',
    [blockerId, blockedId]
  );
  return true;
};

export const getBlockedUsers = async (userId) => {
  return await all(`
    SELECT u.id, u.username, b.created_at as blocked_at
    FROM blocked_users b
    JOIN users u ON b.blocked_id = u.id
    WHERE b.blocker_id = $1
    ORDER BY b.created_at DESC
  `, [userId]);
};