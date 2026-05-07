import { get, run } from '../db/postgres.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { isBlocked } from './blockRoutes.js';
import { logAudit } from '../services/auditService.js';
import { getApp } from '../../index.js';

// Soft delete a message (only sender can)
export const softDeleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID required' });
    }

    const message = await get('SELECT * FROM messages WHERE id = $1', [messageId]);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ error: 'Cannot delete another user\'s message' });
    }

    const now = new Date().toISOString();
    await run('UPDATE messages SET deleted_at = $1, deleted_by = $2 WHERE id = $3', [now, userId, messageId]);

    await logAudit(userId, 'message_deleted', messageId, 'User deleted own message');

    // Broadcast deletion to chat
    const app = getApp();
    const io = app.get('io');
    if (io) {
      io.to(message.receiver_id).emit('message-deleted', { messageId, deletedBy: userId, deletedAt: now });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Hard delete (admin only) - actually removes row
export const deleteMessage = async (req, res) => {
  try {
    const adminId = req.adminUser.id;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID required' });
    }

    const message = await get('SELECT * FROM messages WHERE id = $1', [messageId]);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Delete permanently
    await run('DELETE FROM messages WHERE id = $1', [messageId]);

    await logAudit(adminId, 'message_hard_deleted', messageId, 'Admin permanently deleted message');

    // Notify both parties
    const app = getApp();
    const io = app.get('io');
    if (io) {
      io.to(message.sender_id).emit('message-deleted', { messageId, deletedBy: adminId, hardDelete: true });
      if (message.sender_id !== message.receiver_id) {
        io.to(message.receiver_id).emit('message-deleted', { messageId, deletedBy: adminId, hardDelete: true });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Hide message (admin only) - sets is_hidden
export const hideMessage = async (req, res) => {
  try {
    const adminId = req.adminUser.id;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID required' });
    }

    await run('UPDATE messages SET is_hidden = 1 WHERE id = $1', [messageId]);

    await logAudit(adminId, 'message_hidden', messageId, 'Admin hid message');

    const app = getApp();
    const io = app.get('io');
    if (io) {
      const msg = await get('SELECT sender_id, receiver_id FROM messages WHERE id = $1', [messageId]);
      if (msg) {
        io.to(msg.sender_id).emit('message-hidden', { messageId });
        if (msg.sender_id !== msg.receiver_id) {
          io.to(msg.receiver_id).emit('message-hidden', { messageId });
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
