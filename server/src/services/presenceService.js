import { get } from '../db/postgres.js';

const PRESENCE_BATCH_INTERVAL = 5000;
const pendingBroadcasts = new Map();

export const shouldBroadcastOnline = async (userId) => {
  try {
    const user = await get('SELECT online_visibility FROM users WHERE id = $1', [userId]);
    return user?.online_visibility !== false;
  } catch {
    return true;
  }
};

export const getUserStatus = async (userId) => {
  try {
    const user = await get(
      `SELECT online_visibility, custom_status, custom_status_emoji, status_expires_at FROM users WHERE id = $1`,
      [userId]
    );
    if (!user) return { visibility: true };
    const now = new Date();
    if (user.status_expires_at && new Date(user.status_expires_at) < now) {
      return { visibility: user.online_visibility !== false, custom_status: null, custom_status_emoji: null };
    }
    return {
      visibility: user.online_visibility !== false,
      custom_status: user.custom_status,
      custom_status_emoji: user.custom_status_emoji
    };
  } catch {
    return { visibility: true };
  }
};

export const updateUserStatus = async (userId, status, emoji, expiresAt) => {
  const sets = ['custom_status = $1', 'custom_status_emoji = $2'];
  const params = [status || null, emoji || null];
  if (expiresAt) {
    sets.push('status_expires_at = $3');
    params.push(expiresAt);
  }
  params.push(userId);
  await get(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length}`,
    params
  );
};

export const batchPresenceBroadcast = (io) => {
  setInterval(() => {
    if (pendingBroadcasts.size === 0) return;
    const batch = Array.from(pendingBroadcasts.entries());
    pendingBroadcasts.clear();
    io.emit('presence-batch', { updates: batch.map(([userId, data]) => ({ userId, ...data })) });
  }, PRESENCE_BATCH_INTERVAL);
};

export const queuePresenceBroadcast = (userId, data) => {
  pendingBroadcasts.set(userId, data);
};
