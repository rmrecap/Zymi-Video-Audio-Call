import { get, run } from '../db/postgres.js';
import bcrypt from 'bcryptjs';
import { incrementTokenVersion } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import * as profileService from '../services/profileService.js';

const mapUserToSettings = (user) => ({
  userId: user.id,
  notificationSound: !!user.notification_sound,
  callRingtone: !!user.call_ringtone,
  theme: user.theme || 'dark',
  onlineVisibility: !!user.online_visibility,
  readReceipt: !!user.read_receipt
});

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await profileService.getProfile(userId);

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const profile = await profileService.getProfile(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await profileService.updateProfile(userId, req.body);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const result = await profileService.updateProfile(req.user.id, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await get('SELECT * FROM users WHERE id = $1', [userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const settings = mapUserToSettings(user);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationSound, callRingtone, theme, onlineVisibility, readReceipt } = req.body;

    // Build update dynamically
    const updates = [];
    const params = [];
    let idx = 1;

    if (notificationSound !== undefined) {
      updates.push(`notification_sound = $${idx++}`);
      params.push(notificationSound ? 1 : 0);
    }
    if (callRingtone !== undefined) {
      updates.push(`call_ringtone = $${idx++}`);
      params.push(callRingtone ? 1 : 0);
    }
    if (theme !== undefined) {
      updates.push(`theme = $${idx++}`);
      params.push(theme);
    }
    if (onlineVisibility !== undefined) {
      updates.push(`online_visibility = $${idx++}`);
      params.push(onlineVisibility ? 1 : 0);
    }
    if (readReceipt !== undefined) {
      updates.push(`read_receipt = $${idx++}`);
      params.push(readReceipt ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No settings provided' });
    }

    params.push(userId);
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, params);

    // Fetch updated user
    const updatedUser = await get('SELECT * FROM users WHERE id = $1', [userId]);
    const settings = mapUserToSettings(updatedUser);

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await get('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash || user.password)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = bcrypt.hashSync(newPassword, 12);
    await run('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);

    // Invalidate all sessions
    await incrementTokenVersion(userId);
    await logAudit(userId, 'password_change', userId, 'User changed password');

    // Disconnect all sockets for this user
    const userSockets = req.app.get('userSockets');
    const io = req.app.get('io');
    const socketId = userSockets?.get(String(userId));
    if (socketId && io) {
      io.to(socketId).emit('force-logout', { reason: 'Password changed. Please log in again.' });
      userSockets.delete(userId);
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[PROFILE] changePassword error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

