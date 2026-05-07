import { run, get } from '../db/postgres.js';
import crypto from 'crypto';

export const createSession = async (data) => {
  const { message_id, sender_id, receiver_id, total_chunks, chunk_size } = data;
  const session_id = crypto.randomUUID();

  const sql = `
    INSERT INTO media_transfer_sessions (
      session_id, message_id, sender_id, receiver_id, total_chunks, chunk_size
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `;

  await run(sql, [session_id, message_id, sender_id, receiver_id, total_chunks, chunk_size]);
  return session_id;
};

export const getSession = async (session_id) => {
  return await get('SELECT * FROM media_transfer_sessions WHERE session_id = $1', [session_id]);
};

export const updateProgress = async (session_id, transferred_chunks) => {
  return await run(
    'UPDATE media_transfer_sessions SET transferred_chunks = $1, updated_at = CURRENT_TIMESTAMP WHERE session_id = $2',
    [transferred_chunks, session_id]
  );
};

export const updateSessionStatus = async (session_id, status) => {
  return await run(
    'UPDATE media_transfer_sessions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE session_id = $2',
    [status, session_id]
  );
};

export const cleanupStaleSessions = async () => {
  // Sessions older than 1 hour that are not completed
  return await run(
    "UPDATE media_transfer_sessions SET status = 'failed' WHERE status NOT IN ('completed', 'failed') AND updated_at < NOW() - interval '1 hour'"
  );
};
