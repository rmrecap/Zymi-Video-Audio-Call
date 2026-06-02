import { get, run } from '../db/postgres.js';
import { saveAvatar, deleteAvatar, validateAvatar, validateMessageFile, saveMessageFile, deleteMessageFile } from '../services/fileStorageService.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateAndCompress, compressBuffer } from '../services/imageCompressionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadAvatar = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = req.user.id;
  const file = req.files?.file || req.files?.avatar;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const validation = validateAvatar(file.data, file.mimetype, file.name);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const user = await get('SELECT avatar FROM users WHERE id = $1', [userId]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const avatarUrl = saveAvatar(userId, file.data, file.name);

  await run('UPDATE users SET avatar = $1 WHERE id = $2', [avatarUrl, userId]);

  if (user.avatar) {
    deleteAvatar(user.avatar);
  }

  res.json({ success: true, avatar: avatarUrl });
};

export const getAvatar = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await get('SELECT avatar FROM users WHERE id = $1', [userId]);
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
  } catch (err) {
    console.error('[API] getAvatar error:', err);
    res.status(500).json({ error: 'Failed to fetch avatar' });
  }
};

export const deleteUserAvatar = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = req.user.id;
  const user = await get('SELECT avatar FROM users WHERE id = $1', [userId]);

  if (user?.avatar) {
    deleteAvatar(user.avatar);
    await run('UPDATE users SET avatar = NULL WHERE id = $1', [userId]);
  }

  res.json({ success: true });
};

export const uploadMessageFile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const file = req.files?.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const validation = validateMessageFile(file.data, file.mimetype, file.name);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  let fileData = file.data;
  let compressionResult = null;

  const ext = path.extname(file.name).toLowerCase();
  let mediaType = 'document';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) mediaType = 'image';
  else if (['.mp4', '.webm'].includes(ext)) mediaType = 'video';

  if (mediaType === 'image') {
    try {
      const result = await compressBuffer(fileData, file.mimetype);
      fileData = result.buffer;
      compressionResult = {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        savingsPercent: result.savingsPercent
      };
    } catch (compressErr) {
      console.warn('[UPLOAD] Image compression failed, using original:', compressErr.message);
    }
  }

  const fileUrl = saveMessageFile(fileData, file.name, req.user.id);

  res.json({
    url: fileUrl,
    fileName: file.name,
    fileSize: fileData.length,
    mimeType: file.mimetype,
    mediaType,
    compression: compressionResult
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
