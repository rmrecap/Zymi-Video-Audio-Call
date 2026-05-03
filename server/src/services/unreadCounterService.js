import { run, get, all } from '../db/database.js';

/**
 * Increments unread count for a user in a specific conversation.
 */
export const incrementUnread = (userId, conversationId) => {
  const existing = get('SELECT id FROM conversation_states WHERE user_id = ? AND conversation_id = ?', userId, conversationId);
  
  if (existing) {
    run('UPDATE conversation_states SET unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', existing.id);
  } else {
    run(`
      INSERT INTO conversation_states (user_id, conversation_id, unread_count, updated_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    `, userId, conversationId);
  }
};

/**
 * Resets unread count for a user in a specific conversation.
 */
export const resetUnread = (userId, conversationId) => {
  run('UPDATE conversation_states SET unread_count = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND conversation_id = ?', userId, conversationId);
};

/**
 * Gets total unread count for a user across all conversations.
 */
export const getTotalUnread = (userId) => {
  const result = get('SELECT SUM(unread_count) as total FROM conversation_states WHERE user_id = ?', userId);
  return result?.total || 0;
};

/**
 * Gets unread status for all conversations of a user.
 */
export const getUnreadSummary = (userId) => {
  return all('SELECT conversation_id, unread_count FROM conversation_states WHERE user_id = ? AND unread_count > 0', userId);
};
