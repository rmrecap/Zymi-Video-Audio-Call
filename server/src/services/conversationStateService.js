import { run, get, all } from '../db/postgres.js';

/**
 * Updates the last read message ID for a user in a conversation.
 */
export const updateLastRead = async (userId, conversationId, messageId) => {
  const existing = await get('SELECT id FROM conversation_states WHERE user_id = $1 AND conversation_id = $2', [userId, conversationId]);
  
  if (existing) {
    await run('UPDATE conversation_states SET last_read_message_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [messageId, existing.id]);
  } else {
    await run(`
      INSERT INTO conversation_states (user_id, conversation_id, last_read_message_id, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [userId, conversationId, messageId]);
  }
};

/**
 * Gets the conversation state for a user.
 */
export const getConversationState = async (userId, conversationId) => {
  return await get('SELECT * FROM conversation_states WHERE user_id = $1 AND conversation_id = $2', [userId, conversationId]);
};

/**
 * Toggles muted status for a conversation.
 */
export const setMuted = async (userId, conversationId, muted) => {
  await run('UPDATE conversation_states SET muted = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND conversation_id = $3', [muted ? 1 : 0, userId, conversationId]);
};

/**
 * Sets archived status for a conversation.
 */
export const setArchived = async (userId, conversationId, archived) => {
  await run('UPDATE conversation_states SET archived = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND conversation_id = $3', [archived ? 1 : 0, userId, conversationId]);
};

/**
 * Gets all active (not archived) conversations for a user.
 */
export const getActiveConversations = async (userId) => {
  return await all(`
    SELECT cs.*, u.username, u.avatar 
    FROM conversation_states cs
    JOIN users u ON u.id = cs.user_id
    WHERE cs.user_id = $1 AND cs.archived = 0
    ORDER BY cs.updated_at DESC
  `, [userId]);
};
