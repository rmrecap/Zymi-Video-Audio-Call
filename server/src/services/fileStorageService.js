import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AVATAR_UPLOAD_DIR = path.join(__dirname, '../../../../uploads/avatars');
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Ensure upload directory exists
const ensureDir = () => {
  if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
    fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
  }
};

export const sanitizeFilename = (filename) => {
  // Remove path traversal attempts and keep only safe characters
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9.-]/g, '_');
};

export const validateAvatar = (buffer, mimetype) => {
  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large (max 2MB)' };
  }

  const ext = path.extname(mimetype?.toLowerCase() || '');
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Invalid file type. Allowed: jpg, png, webp' };
  }

  return { valid: true };
};

export const saveAvatar = (userId, buffer, originalFilename) => {
  ensureDir();

  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized);
  const filename = `avatar_${userId}_${Date.now()}${ext}`;
  const filepath = path.join(AVATAR_UPLOAD_DIR, filename);

  fs.writeFileSync(filepath, buffer);

  // Return relative URL path
  return `/avatars/${filename}`;
};

export const deleteAvatar = (relativePath) => {
  if (relativePath && !relativePath.includes('..')) {
    const filepath = path.join(AVATAR_UPLOAD_DIR, path.basename(relativePath));
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
};

// Message upload constants
const MESSAGE_UPLOAD_DIR = path.join(__dirname, '../../../../uploads/messages');
const MESSAGE_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.pdf', '.doc', '.docx', '.txt', '.zip'];
const MESSAGE_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for videos

// Ensure message upload directory exists
const ensureMessageDir = () => {
  if (!fs.existsSync(MESSAGE_UPLOAD_DIR)) {
    fs.mkdirSync(MESSAGE_UPLOAD_DIR, { recursive: true });
  }
};

export const validateMessageFile = (buffer, mimetype, originalFilename) => {
  const ext = path.extname(originalFilename?.toLowerCase() || '').toLowerCase();
  
  if (buffer.length > MESSAGE_MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large (max 50MB)' };
  }

  if (!MESSAGE_ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Invalid file type' };
  }

  return { valid: true };
};

export const saveMessageFile = (buffer, originalFilename, senderId) => {
  ensureMessageDir();

  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized);
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const filename = `msg_${senderId}_${uniqueId}${ext}`;
  const filepath = path.join(MESSAGE_UPLOAD_DIR, filename);

  fs.writeFileSync(filepath, buffer);

  return `/uploads/messages/${filename}`;
};

export const deleteMessageFile = (relativePath) => {
  if (relativePath && !relativePath.includes('..')) {
    const filename = path.basename(relativePath);
    const filepath = path.join(MESSAGE_UPLOAD_DIR, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
};

export const getAvatarPath = (relativePath) => {
  if (!relativePath) return null;
  const filename = path.basename(relativePath);
  return path.join(AVATAR_UPLOAD_DIR, filename);
};
