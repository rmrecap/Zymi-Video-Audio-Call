import { get, run, all } from '../db/postgres.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';
import { getApp } from '../../index.js';
import { SOCKET_EVENTS } from '../../shared/socketEvents.js';

export const editMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId, content } = req.body;

    if (!messageId || !content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message ID and content required' });
    }

    const message = await get('SELECT * FROM messages WHERE id = $1', [messageId]);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ error: 'Cannot edit another user\'s message' });
    }

    const now = new Date().toISOString();
    await run('UPDATE messages SET content = $1, edited_at = $2 WHERE id = $3', [content.trim(), now, messageId]);

    const updatedMessage = {
      ...message,
      content: content.trim(),
      edited_at: now
    };

    await logAudit(userId, 'message_edited', messageId, 'User edited message');

    // Broadcast edit to both participants
    const app = getApp();
    const io = app.get('io');
    if (io) {
      const editEvent = {
        ...updatedMessage,
        edited: true,
        editedAt: now
      };
      io.to(message.sender_id).emit('message-edited', editEvent);
      if (message.sender_id !== message.receiver_id) {
        io.to(message.receiver_id).emit('message-edited', editEvent);
      }
    }

    res.json({ success: true, message: updatedMessage });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessageEdits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await get('SELECT * FROM messages WHERE id = $1 AND (sender_id = $2 OR receiver_id = $3)', [messageId, userId, userId]);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Return edit history (currently only one edit tracked)
    const history = message.edited_at ? [{
      edited_at: message.edited_at,
      previous_content: message.previous_content || null
    }] : [];

    res.json({ edits: history });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
