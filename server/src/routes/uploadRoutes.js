import { get, run } from '../db/database.js';
import { saveAvatar, deleteAvatar, validateAvatar, validateMessageFile, saveMessageFile, deleteMessageFile } from '../services/fileStorageService.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadAvatar = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const validation = validateAvatar(req.file.buffer, req.file.mimetype, req.file.originalname);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Fetch current user to get old avatar
  const user = get('SELECT avatar FROM users WHERE id = ?', userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Save new avatar
  const avatarUrl = saveAvatar(userId, req.file.buffer, req.file.originalname);

  // Update user record
  run('UPDATE users SET avatar = ? WHERE id = ?', avatarUrl, userId);

  // Delete old avatar if exists
  if (user.avatar) {
    deleteAvatar(user.avatar);
  }

  res.json({ success: true, avatar: avatarUrl });
};

export const getAvatar = async (req, res) => {
  const { userId } = req.params;

  const user = get('SELECT avatar FROM users WHERE id = ?', userId);
  if (!user || !user.avatar) {
    return res.status(404).json({ error: 'Avatar not found' });
  }

  // Security: Prevent path traversal by using path.basename
  const safeAvatarName = path.basename(user.avatar);
  const avatarPath = path.join(__dirname, '../../../../uploads/avatars', safeAvatarName);
  
  if (!fs.existsSync(avatarPath)) {
    return res.status(404).json({ error: 'Avatar file missing' });
  }

  // Determine content type from extension
  const ext = path.extname(avatarPath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  const contentType = contentTypes[ext] || 'image/jpeg';

  res.setHeader('Content-Type', contentType);
  const stream = fs.createReadStream(avatarPath);
  stream.pipe(res);
};

export const deleteUserAvatar = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = req.user.id;
  const user = get('SELECT avatar FROM users WHERE id = ?', userId);

  if (user?.avatar) {
    deleteAvatar(user.avatar);
    run('UPDATE users SET avatar = NULL WHERE id = ?', userId);
  }

  res.json({ success: true });
};

export const uploadMessageFile = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const validation = validateMessageFile(req.file.buffer, req.file.mimetype, req.file.originalname);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const fileUrl = saveMessageFile(req.file.buffer, req.file.originalname, req.user.id);
  const ext = path.extname(req.file.originalname).toLowerCase();
  
  let mediaType = 'document';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) mediaType = 'image';
  else if (['.mp4', '.webm'].includes(ext)) mediaType = 'video';

  res.json({
    url: fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    mediaType
  });
};

export const getMessageFile = async (req, res) => {
  const { filename } = req.params;

  // Security: Prevent path traversal by using path.basename
  const safeFilename = path.basename(filename);
  const filePath = path.join(__dirname, '../../../../uploads/messages', safeFilename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.zip': 'application/zip'
  };
  const contentType = contentTypes[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
};
