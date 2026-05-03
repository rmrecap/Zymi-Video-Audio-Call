import { run, get } from '../db/database.js';
import crypto from 'crypto';

export const createSession = (data) => {
  const { message_id, sender_id, receiver_id, total_chunks, chunk_size } = data;
  const session_id = crypto.randomUUID();

  const sql = `
    INSERT INTO media_transfer_sessions (
      session_id, message_id, sender_id, receiver_id, total_chunks, chunk_size
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  run(sql, session_id, message_id, sender_id, receiver_id, total_chunks, chunk_size);
  return session_id;
};

export const getSession = (session_id) => {
  return get('SELECT * FROM media_transfer_sessions WHERE session_id = ?', session_id);
};

export const updateProgress = (session_id, transferred_chunks) => {
  return run(
    'UPDATE media_transfer_sessions SET transferred_chunks = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?',
    transferred_chunks, session_id
  );
};

export const updateSessionStatus = (session_id, status) => {
  return run(
    'UPDATE media_transfer_sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?',
    status, session_id
  );
};

export const cleanupStaleSessions = () => {
  // Sessions older than 1 hour that are not completed
  return run(
    "UPDATE media_transfer_sessions SET status = 'failed' WHERE status NOT IN ('completed', 'failed') AND updated_at < DATETIME('now', '-1 hour')"
  );
};
