import { run } from '../db/database.js';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/m4a', 'audio/webm',
  'application/pdf', 'text/plain'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const validateMediaPolicy = (data) => {
  const { mime_type, file_size } = data;

  if (!ALLOWED_MIME_TYPES.includes(mime_type)) {
    throw new Error('Unsupported MIME type');
  }

  if (file_size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 50MB limit');
  }

  return true;
};

export const enforceNoServerStorage = (req) => {
  // This is a logic check - if a request attempts to actually upload a file to the server, we block it.
  if (req.files && Object.keys(req.files).length > 0) {
    // Audit log this violation attempt
    console.error(`[SECURITY] Server-side media upload attempt blocked for user ${req.user?.id}`);
    throw new Error('Server-side media storage is strictly prohibited. Use P2P DataChannel instead.');
  }
};

export const cleanupExpiredMedia = () => {
  // Pending transfers older than 24 hours are expired
  return run(
    "UPDATE media_messages SET transfer_status = 'expired' WHERE transfer_status = 'pending' AND created_at < DATETIME('now', '-24 hours')"
  );
};
