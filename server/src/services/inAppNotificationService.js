import { run, all, get } from '../db/postgres.js';

/**
 * Creates an in-app notification.
 */
export const createNotification = async (data) => {
  const { user_id, type, title, body, related_user_id, related_conversation_id } = data;
  
  const result = await run(`
    INSERT INTO in_app_notifications (
      user_id, type, title, body, related_user_id, related_conversation_id, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    RETURNING id
  `, [user_id, type, title, body, related_user_id, related_conversation_id]);
  
  return result.lastID;
};

/**
 * Gets active notifications for a user.
 */
export const getNotifications = async (userId, limit = 50) => {
  return await all(`
    SELECT * FROM in_app_notifications 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2
  `, [userId, limit]);
};

/**
 * Marks a single notification as read.
 */
export const markAsRead = async (notificationId, userId) => {
  await run('UPDATE in_app_notifications SET is_read = 1 WHERE id = $1 AND user_id = $2', [notificationId, userId]);
};

/**
 * Marks all notifications as read for a user.
 */
export const markAllAsRead = async (userId) => {
  await run('UPDATE in_app_notifications SET is_read = 1 WHERE user_id = $1', [userId]);
};

/**
 * Deletes old notifications (housekeeping).
 */
export const deleteOldNotifications = async (days = 30) => {
  await run("DELETE FROM in_app_notifications WHERE created_at < NOW() - ($1 || ' days')::interval", [days]);
};
