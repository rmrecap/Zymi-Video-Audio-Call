import { run, all, get } from '../db/postgres.js';

/**
 * Stores a message in the database for later delivery.
 * Sets status to 'queued' if the receiver is offline.
 */
export const enqueueMessage = async (messageData) => {
  const { sender_id, receiver_id, content, message_type, client_message_id, conversation_id, delivery_status = 'sent', metadata } = messageData;
  
  // Prevent duplicates by client_message_id
  if (client_message_id) {
    const existing = await get('SELECT id FROM messages WHERE client_message_id = $1', [client_message_id]);
    if (existing) return existing.id;
  }

  const metadataStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;

  const result = await run(`
    INSERT INTO messages (
      sender_id, receiver_id, message_text, content, message_type, 
      client_message_id, conversation_id, delivery_status, metadata, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
    RETURNING id
  `, 
  [sender_id, receiver_id, content, content, message_type || 'text', 
  client_message_id, conversation_id, delivery_status, metadataStr]
  );

  return result.lastID;
};

/**
 * Retrieves all pending (queued or sent but not delivered) messages for a user.
 */
export const getPendingMessages = async (userId) => {
  return await all(`
    SELECT * FROM messages 
    WHERE receiver_id = $1 AND (delivery_status = 'queued' OR delivery_status = 'sent')
    ORDER BY created_at ASC
  `, [userId]);
};

/**
 * Updates message status.
 */
export const updateMessageStatus = async (messageId, status, timestamp = null) => {
  const timeColumn = status === 'delivered' ? 'delivered_at' : (status === 'read' ? 'read_at' : null);
  
  if (timeColumn) {
    await run(`UPDATE messages SET delivery_status = $1, ${timeColumn} = CURRENT_TIMESTAMP WHERE id = $2`, [status, messageId]);
  } else {
    await run('UPDATE messages SET delivery_status = $1 WHERE id = $2', [status, messageId]);
  }
};

/**
 * Marks messages as delivered for a specific receiver.
 */
export const markMessagesAsDelivered = async (userId) => {
  await run("UPDATE messages SET delivery_status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE receiver_id = $1 AND delivery_status IN ('queued', 'sent')", [userId]);
};
