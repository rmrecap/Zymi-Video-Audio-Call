import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { all, get, run } from '../db/database.js';
import * as messageQueueService from '../services/messageQueueService.js';
import * as unreadCounterService from '../services/unreadCounterService.js';
import * as conversationStateService from '../services/conversationStateService.js';

const router = Router();

/**
 * GET /api/messages/conversations
 * Returns all conversations with latest message and unread count.
 */
router.get('/conversations', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    // This query gets all unique conversation partners and their latest message
    const conversations = all(`
      SELECT 
        u.id as peer_id, 
        u.username, 
        u.avatar, 
        m.message_text as last_message, 
        m.created_at as last_message_time,
        m.delivery_status as last_message_status,
        (SELECT unread_count FROM conversation_states WHERE user_id = ? AND conversation_id = 
          CASE WHEN u.id < ? THEN u.id || '_' || ? ELSE ? || '_' || u.id END
        ) as unread_count
      FROM users u
      JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id)
      WHERE u.id != ?
      AND m.id = (
        SELECT MAX(id) FROM messages 
        WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
      )
      ORDER BY m.created_at DESC
    `, userId, userId, userId, userId, userId, userId, userId, userId, userId);

    res.json(conversations);
  } catch (err) {
    console.error('[API] Get conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/messages/conversations/:peerId
 * Returns messages for a specific conversation.
 */
router.get('/conversations/:peerId', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const peerId = req.params.peerId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = all(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, userId, peerId, peerId, userId, limit, offset);

    res.json(messages.reverse());
  } catch (err) {
    console.error('[API] Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/messages/:messageId/read
 * Marks a single message as read.
 */
router.post('/:messageId/read', requireAuth, (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.id;

    const message = get('SELECT * FROM messages WHERE id = ? AND receiver_id = ?', messageId, userId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    messageQueueService.updateMessageStatus(messageId, 'read');
    
    // Update unread count if it was unread
    if (message.delivery_status !== 'read') {
      // Note: In a real app we'd decrement, but here we usually reset when opening.
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

/**
 * POST /api/messages/conversations/:conversationId/read-all
 * Marks all messages in a conversation as read.
 */
router.post('/conversations/:conversationId/read-all', requireAuth, (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    run("UPDATE messages SET delivery_status = 'read', read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND receiver_id = ? AND delivery_status != 'read'", conversationId, userId);
    unreadCounterService.resetUnread(userId, conversationId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

/**
 * GET /api/health/messages
 * Message delivery health monitoring.
 */
router.get('/health/messages', requireAuth, (req, res) => {
  try {
    const stats = get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN delivery_status = 'queued' THEN 1 ELSE 0 END) as queued,
        SUM(CASE WHEN delivery_status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN delivery_status = 'read' THEN 1 ELSE 0 END) as read
      FROM messages
    `);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch health stats' });
  }
});

// Backward compatibility or legacy support for the main index.js imports
export const getUsers = (req, res) => {
  try {
    const users = all('SELECT id, username, avatar, role, is_banned FROM users WHERE id != ?', req.user.id);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getMessages = (req, res) => {
  const { userId, otherId } = req.params;
  const messages = all(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `, userId, otherId, otherId, userId);
  res.json(messages);
};

export const searchMessages = (req, res) => {
  const { userId } = req.params;
  const { q } = req.query;
  const messages = all(`
    SELECT * FROM messages 
    WHERE (sender_id = ? OR receiver_id = ?) AND message_text LIKE ?
    ORDER BY created_at DESC
  `, userId, userId, `%${q}%`);
  res.json(messages);
};

export const getUnread = (req, res) => {
  const { userId } = req.params;
  const count = unreadCounterService.getTotalUnread(userId);
  res.json({ count });
};

/**
 * GET /api/messages/conversations/:conversationId/media
 */
router.get('/conversations/:conversationId/media', requireAuth, (req, res) => {
  try {
    const { conversationId } = req.params;
    const media = all("SELECT * FROM media_messages WHERE conversation_id = ? AND media_type IN ('image', 'video') ORDER BY created_at DESC", conversationId);
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation media' });
  }
});

/**
 * GET /api/messages/conversations/:conversationId/files
 */
router.get('/conversations/:conversationId/files', requireAuth, (req, res) => {
  try {
    const { conversationId } = req.params;
    const files = all("SELECT * FROM media_messages WHERE conversation_id = ? AND media_type = 'file' ORDER BY created_at DESC", conversationId);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation files' });
  }
});

/**
 * GET /api/messages/conversations/:conversationId/links
 */
router.get('/conversations/:conversationId/links', requireAuth, (req, res) => {
  try {
    const { conversationId } = req.params;
    // Basic regex for URLs in message text
    const messagesWithLinks = all("SELECT * FROM messages WHERE conversation_id = ? AND (message_text LIKE '%http://%' OR message_text LIKE '%https://%') ORDER BY created_at DESC", conversationId);
    res.json(messagesWithLinks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation links' });
  }
});

/**
 * POST /api/messages/contact-card
 */
router.post('/contact-card', requireAuth, (req, res) => {
  try {
    const { to, contactUserId } = req.body;
    const from = req.user.id;
    
    const contactUser = get("SELECT id, username, avatar, phone FROM users WHERE id = ?", contactUserId);
    if (!contactUser) return res.status(404).json({ error: 'Contact user not found' });

    // In a real implementation, we'd emit a socket event here too.
    // For now, we return the contact card metadata for the client to send via socket.
    res.json({
      success: true,
      contact: {
        id: contactUser.id,
        username: contactUser.username,
        avatar: contactUser.avatar,
        phone: contactUser.phone
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate contact card' });
  }
});

export const markAsRead = (req, res) => {
  const { messageId } = req.body;
  messageQueueService.updateMessageStatus(messageId, 'read');
  res.json({ success: true });
};

export default router;