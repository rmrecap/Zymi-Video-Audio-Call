import { run, all, get } from '../db/database.js';

/**
 * Stores a message in the database for later delivery.
 * Sets status to 'queued' if the receiver is offline.
 */
export const enqueueMessage = (messageData) => {
  const { sender_id, receiver_id, content, message_type, client_message_id, conversation_id, delivery_status = 'sent' } = messageData;
  
  // Prevent duplicates by client_message_id
  if (client_message_id) {
    const existing = get('SELECT id FROM messages WHERE client_message_id = ?', client_message_id);
    if (existing) return existing.id;
  }

  const result = run(`
    INSERT INTO messages (
      sender_id, receiver_id, message_text, content, message_type, 
      client_message_id, conversation_id, delivery_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, 
  sender_id, receiver_id, content, content, message_type || 'text', 
  client_message_id, conversation_id, delivery_status
  );

  return result.lastInsertRowid;
};

/**
 * Retrieves all pending (queued or sent but not delivered) messages for a user.
 */
export const getPendingMessages = (userId) => {
  return all(`
    SELECT * FROM messages 
    WHERE receiver_id = ? AND (delivery_status = 'queued' OR delivery_status = 'sent')
    ORDER BY created_at ASC
  `, userId);
};

/**
 * Updates message status.
 */
export const updateMessageStatus = (messageId, status, timestamp = null) => {
  const timeColumn = status === 'delivered' ? 'delivered_at' : (status === 'read' ? 'read_at' : null);
  
  if (timeColumn) {
    run(`UPDATE messages SET delivery_status = ?, ${timeColumn} = CURRENT_TIMESTAMP WHERE id = ?`, status, messageId);
  } else {
    run('UPDATE messages SET delivery_status = ? WHERE id = ?', status, messageId);
  }
};

/**
 * Marks messages as delivered for a specific receiver.
 */
export const markMessagesAsDelivered = (userId) => {
  run("UPDATE messages SET delivery_status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE receiver_id = ? AND delivery_status IN ('queued', 'sent')", userId);
};
