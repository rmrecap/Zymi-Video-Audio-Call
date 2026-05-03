import { run, get, all } from '../db/database.js';

/**
 * Updates the last read message ID for a user in a conversation.
 */
export const updateLastRead = (userId, conversationId, messageId) => {
  const existing = get('SELECT id FROM conversation_states WHERE user_id = ? AND conversation_id = ?', userId, conversationId);
  
  if (existing) {
    run('UPDATE conversation_states SET last_read_message_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', messageId, existing.id);
  } else {
    run(`
      INSERT INTO conversation_states (user_id, conversation_id, last_read_message_id, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, userId, conversationId, messageId);
  }
};

/**
 * Gets the conversation state for a user.
 */
export const getConversationState = (userId, conversationId) => {
  return get('SELECT * FROM conversation_states WHERE user_id = ? AND conversation_id = ?', userId, conversationId);
};

/**
 * Toggles muted status for a conversation.
 */
export const setMuted = (userId, conversationId, muted) => {
  run('UPDATE conversation_states SET muted = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND conversation_id = ?', muted ? 1 : 0, userId, conversationId);
};

/**
 * Sets archived status for a conversation.
 */
export const setArchived = (userId, conversationId, archived) => {
  run('UPDATE conversation_states SET archived = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND conversation_id = ?', archived ? 1 : 0, userId, conversationId);
};

/**
 * Gets all active (not archived) conversations for a user.
 */
export const getActiveConversations = (userId) => {
  return all(`
    SELECT cs.*, u.username, u.avatar 
    FROM conversation_states cs
    JOIN users u ON u.id = cs.user_id
    WHERE cs.user_id = ? AND cs.archived = 0
    ORDER BY cs.updated_at DESC
  `, userId);
};
