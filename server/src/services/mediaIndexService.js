import { run, get, all } from '../db/postgres.js';

export const indexMedia = async (data) => {
  const {
    message_id,
    conversation_id,
    sender_id,
    receiver_id,
    media_type,
    file_id,
    file_name,
    file_size,
    mime_type,
    checksum,
    thumbnail_metadata_json,
    local_sender_path_hash
  } = data;

  const sql = `
    INSERT INTO media_messages (
      message_id, conversation_id, sender_id, receiver_id, media_type, 
      file_id, file_name, file_size, mime_type, checksum, 
      thumbnail_metadata_json, local_sender_path_hash
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `;

  return await run(sql, [
    message_id, conversation_id, sender_id, receiver_id, media_type, 
    file_id, file_name, file_size, mime_type, checksum, 
    thumbnail_metadata_json, local_sender_path_hash
  ]);
};

export const getMediaByIndex = async (file_id) => {
  return await get('SELECT * FROM media_messages WHERE file_id = $1', [file_id]);
};

export const getConversationMedia = async (conversation_id) => {
  return await all('SELECT * FROM media_messages WHERE conversation_id = $1 ORDER BY created_at DESC', [conversation_id]);
};

export const updateMediaStatus = async (file_id, status, receiver_path_hash = null) => {
  if (receiver_path_hash) {
    return await run(
      'UPDATE media_messages SET transfer_status = $1, receiver_local_path_hash = $2, completed_at = CURRENT_TIMESTAMP WHERE file_id = $3',
      [status, receiver_path_hash, file_id]
    );
  }
  return await run('UPDATE media_messages SET transfer_status = $1 WHERE file_id = $2', [status, file_id]);
};

export const getMediaHealth = async () => {
  const stats = await get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN transfer_status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN transfer_status = 'transferring' THEN 1 ELSE 0 END) as transferring,
      SUM(CASE WHEN transfer_status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN transfer_status = 'failed' THEN 1 ELSE 0 END) as failed,
      AVG(file_size) as avg_size
    FROM media_messages
  `);
  return stats;
};
