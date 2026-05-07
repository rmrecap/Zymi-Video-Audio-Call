import { run, get, all } from '../db/postgres.js';

/**
 * Increments unread count for a user in a specific conversation.
 */
export const incrementUnread = async (userId, conversationId) => {
  const existing = await get('SELECT id FROM conversation_states WHERE user_id = $1 AND conversation_id = $2', [userId, conversationId]);
  
  if (existing) {
    await run('UPDATE conversation_states SET unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [existing.id]);
  } else {
    await run(`
      INSERT INTO conversation_states (user_id, conversation_id, unread_count, updated_at)
      VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
    `, [userId, conversationId]);
  }
};

/**
 * Resets unread count for a user in a specific conversation.
 */
export const resetUnread = async (userId, conversationId) => {
  await run('UPDATE conversation_states SET unread_count = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND conversation_id = $2', [userId, conversationId]);
};

/**
 * Gets total unread count for a user across all conversations.
 */
export const getTotalUnread = async (userId) => {
  const result = await get('SELECT SUM(unread_count) as total FROM conversation_states WHERE user_id = $1', [userId]);
  return parseInt(result?.total || 0, 10);
};

/**
 * Gets unread status for all conversations of a user.
 */
export const getUnreadSummary = async (userId) => {
  return await all('SELECT conversation_id, unread_count FROM conversation_states WHERE user_id = $1 AND unread_count > 0', [userId]);
};
