import { run, all, get } from '../db/database.js';

/**
 * Creates an in-app notification.
 */
export const createNotification = (data) => {
  const { user_id, type, title, body, related_user_id, related_conversation_id } = data;
  
  const result = run(`
    INSERT INTO in_app_notifications (
      user_id, type, title, body, related_user_id, related_conversation_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, user_id, type, title, body, related_user_id, related_conversation_id);
  
  return result.lastInsertRowid;
};

/**
 * Gets active notifications for a user.
 */
export const getNotifications = (userId, limit = 50) => {
  return all(`
    SELECT * FROM in_app_notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `, userId, limit);
};

/**
 * Marks a single notification as read.
 */
export const markAsRead = (notificationId, userId) => {
  run('UPDATE in_app_notifications SET is_read = 1 WHERE id = ? AND user_id = ?', notificationId, userId);
};

/**
 * Marks all notifications as read for a user.
 */
export const markAllAsRead = (userId) => {
  run('UPDATE in_app_notifications SET is_read = 1 WHERE user_id = ?', userId);
};

/**
 * Deletes old notifications (housekeeping).
 */
export const deleteOldNotifications = (days = 30) => {
  run("DELETE FROM in_app_notifications WHERE created_at < datetime('now', '-' || ? || ' days')", days);
};
