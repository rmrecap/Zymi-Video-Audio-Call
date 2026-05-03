import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as inAppNotificationService from '../services/inAppNotificationService.js';

const router = Router();

/**
 * GET /api/notifications
 * Returns recent notifications for the user.
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const notifications = inAppNotificationService.getNotifications(req.user.id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * POST /api/notifications/:id/read
 * Marks a notification as read.
 */
router.post('/:id/read', requireAuth, (req, res) => {
  try {
    inAppNotificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * POST /api/notifications/read-all
 * Marks all notifications as read.
 */
router.post('/read-all', requireAuth, (req, res) => {
  try {
    inAppNotificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export default router;
