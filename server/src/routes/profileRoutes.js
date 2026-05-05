import { get, run } from '../db/database.js';
import bcrypt from 'bcryptjs';
import { incrementTokenVersion } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { getApp } from '../../index.js';
import * as profileService from '../services/profileService.js';

const mapUserToSettings = (user) => ({
  userId: user.id,
  notificationSound: !!user.notification_sound,
  callRingtone: !!user.call_ringtone,
  theme: user.theme || 'dark',
  onlineVisibility: !!user.online_visibility,
  readReceipt: !!user.read_receipt
});

export const getProfile = (req, res) => {
  const userId = req.user.id;
  const profile = profileService.getProfile(userId);

  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(profile);
};

export const getMyProfile = (req, res) => {
  const profile = profileService.getProfile(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
};

export const updateProfile = (req, res) => {
  const userId = req.user.id;
  const result = profileService.updateProfile(userId, req.body);

  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json({ error: result.error });
  }
};

export const updateMyProfile = (req, res) => {
  const result = profileService.updateProfile(req.user.id, req.body);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json({ error: result.error });
  }
};

export const getUserSettings = (req, res) => {
  const userId = req.user.id;
  const user = get('SELECT * FROM users WHERE id = ?', userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const settings = mapUserToSettings(user);
  res.json(settings);
};

export const updateUserSettings = (req, res) => {
  const userId = req.user.id;
  const { notificationSound, callRingtone, theme, onlineVisibility, readReceipt } = req.body;

  // Build update dynamically
  const updates = [];
  const params = [];

  if (notificationSound !== undefined) {
    updates.push('notification_sound = ?');
    params.push(notificationSound ? 1 : 0);
  }
  if (callRingtone !== undefined) {
    updates.push('call_ringtone = ?');
    params.push(callRingtone ? 1 : 0);
  }
  if (theme !== undefined) {
    updates.push('theme = ?');
    params.push(theme);
  }
  if (onlineVisibility !== undefined) {
    updates.push('online_visibility = ?');
    params.push(onlineVisibility ? 1 : 0);
  }
  if (readReceipt !== undefined) {
    updates.push('read_receipt = ?');
    params.push(readReceipt ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No settings provided' });
  }

  params.push(userId);
  run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, ...params);

  // Fetch updated user
  const updatedUser = get('SELECT * FROM users WHERE id = ?', userId);
  const settings = mapUserToSettings(updatedUser);

  res.json(settings);
};

export const changePassword = (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const user = get('SELECT * FROM users WHERE id = ?', userId);
  if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 12);
  run('UPDATE users SET password = ? WHERE id = ?', hash, userId);

  // Invalidate all sessions
  incrementTokenVersion(userId);
  logAudit(userId, 'password_change', userId, 'User changed password');

  // Disconnect all sockets for this user
  const app = getApp();
  const userSockets = app.get('userSockets');
  const io = app.get('io');
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    io.to(socketId).emit('force-logout', { reason: 'Password changed. Please log in again.' });
    userSockets.delete(userId);
  }

  res.json({ success: true, message: 'Password changed successfully' });
};

