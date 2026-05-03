import { run, get, all } from '../db/database.js';

export const indexMedia = (data) => {
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  return run(sql, 
    message_id, conversation_id, sender_id, receiver_id, media_type, 
    file_id, file_name, file_size, mime_type, checksum, 
    thumbnail_metadata_json, local_sender_path_hash
  );
};

export const getMediaByIndex = (file_id) => {
  return get('SELECT * FROM media_messages WHERE file_id = ?', file_id);
};

export const getConversationMedia = (conversation_id) => {
  return all('SELECT * FROM media_messages WHERE conversation_id = ? ORDER BY created_at DESC', conversation_id);
};

export const updateMediaStatus = (file_id, status, receiver_path_hash = null) => {
  if (receiver_path_hash) {
    return run(
      'UPDATE media_messages SET transfer_status = ?, receiver_local_path_hash = ?, completed_at = CURRENT_TIMESTAMP WHERE file_id = ?',
      status, receiver_path_hash, file_id
    );
  }
  return run('UPDATE media_messages SET transfer_status = ? WHERE file_id = ?', status, file_id);
};

export const getMediaHealth = () => {
  const stats = get(`
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
