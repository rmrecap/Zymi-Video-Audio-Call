import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { all, get, run } from '../db/postgres.js';
import * as messageQueueService from '../services/messageQueueService.js';
import * as unreadCounterService from '../services/unreadCounterService.js';
import * as conversationStateService from '../services/conversationStateService.js';

const router = Router();

/**
 * GET /api/messages/conversations
 * Returns all conversations with latest message and unread count.
 */
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    // This query gets all unique conversation partners and their latest message
    const conversations = await all(`
      SELECT 
        u.id as peer_id, 
        u.username, 
        u.avatar, 
        m.message_text as last_message, 
        m.created_at as last_message_time,
        m.delivery_status as last_message_status,
        (SELECT unread_count FROM conversation_states WHERE user_id = $1 AND conversation_id = 
          CASE WHEN u.id < $2 THEN u.id::TEXT || '_' || $3::TEXT ELSE $4::TEXT || '_' || u.id::TEXT END
        ) as unread_count
      FROM users u
      JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = $5) OR (m.sender_id = $6 AND m.receiver_id = u.id)
      WHERE u.id != $7
      AND m.id = (
        SELECT MAX(id) FROM messages 
        WHERE (sender_id = u.id AND receiver_id = $8) OR (sender_id = $9 AND receiver_id = u.id)
      )
      ORDER BY m.created_at DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId, userId]);

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
router.get('/conversations/:peerId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const peerId = req.params.peerId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await all(`
      SELECT * FROM messages 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $3 AND receiver_id = $4)
      ORDER BY created_at DESC
      LIMIT $5 OFFSET $6
    `, [userId, peerId, peerId, userId, limit, offset]);

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
router.post('/:messageId/read', requireAuth, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.id;

    const message = await get('SELECT * FROM messages WHERE id = $1 AND receiver_id = $2', [messageId, userId]);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    await messageQueueService.updateMessageStatus(messageId, 'read');
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

/**
 * POST /api/messages/conversations/:conversationId/read-all
 * Marks all messages in a conversation as read.
 */
router.post('/conversations/:conversationId/read-all', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await run("UPDATE messages SET delivery_status = 'read', read_at = CURRENT_TIMESTAMP WHERE conversation_id = $1 AND receiver_id = $2 AND delivery_status != 'read'", [conversationId, userId]);
    await unreadCounterService.resetUnread(userId, conversationId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

/**
 * GET /api/health/messages
 * Message delivery health monitoring.
 */
router.get('/health/messages', requireAuth, async (req, res) => {
  try {
    const stats = await get(`
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
export const getUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    // Order by latest message time, then username. Users with messages come first.
    const users = await all(`
      SELECT 
        u.id, u.username, u.avatar, u.role, u.is_banned,
        (SELECT MAX(created_at) FROM messages 
         WHERE (sender_id = u.id AND receiver_id = $1) OR (sender_id = $2 AND receiver_id = u.id)
        ) as last_message_time,
        (SELECT unread_count FROM conversation_states 
         WHERE user_id = $3 AND conversation_id = 
           CASE WHEN u.id < $4 THEN u.id::TEXT || '_' || $5::TEXT ELSE $6::TEXT || '_' || u.id::TEXT END
        ) as unread_count
      FROM users u 
      WHERE u.id != $7
      ORDER BY last_message_time DESC NULLS LAST, u.username ASC
    `, [userId, userId, userId, userId, userId, userId, userId]);
    
    res.json(users);
  } catch (err) {
    console.error('[API] getUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId, otherId } = req.params;
    const messages = await all(`
      SELECT * FROM messages 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $3 AND receiver_id = $4)
      ORDER BY created_at ASC
    `, [userId, otherId, otherId, userId]);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { q } = req.query;
    const messages = await all(`
      SELECT * FROM messages 
      WHERE (sender_id = $1 OR receiver_id = $2) AND message_text LIKE $3
      ORDER BY created_at DESC
    `, [userId, userId, `%${q}%`]);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search messages' });
  }
};

export const getUnread = async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await unreadCounterService.getTotalUnread(userId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

/**
 * GET /api/messages/conversations/:conversationId/media
 */
router.get('/conversations/:conversationId/media', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const media = await all("SELECT * FROM media_messages WHERE conversation_id = $1 AND media_type IN ('image', 'video') ORDER BY created_at DESC", [conversationId]);
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation media' });
  }
});

/**
 * GET /api/messages/conversations/:conversationId/files
 */
router.get('/conversations/:conversationId/files', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const files = await all("SELECT * FROM media_messages WHERE conversation_id = $1 AND media_type = 'file' ORDER BY created_at DESC", [conversationId]);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation files' });
  }
});

/**
 * GET /api/messages/conversations/:conversationId/links
 */
router.get('/conversations/:conversationId/links', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    // Basic regex for URLs in message text
    const messagesWithLinks = await all("SELECT * FROM messages WHERE conversation_id = $1 AND (message_text LIKE '%http://%' OR message_text LIKE '%https://%') ORDER BY created_at DESC", [conversationId]);
    res.json(messagesWithLinks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation links' });
  }
});

/**
 * POST /api/messages/contact-card
 */
router.post('/contact-card', requireAuth, async (req, res) => {
  try {
    const { to, contactUserId } = req.body;
    const from = req.user.id;
    
    const contactUser = await get("SELECT id, username, avatar, phone FROM users WHERE id = $1", [contactUserId]);
    if (!contactUser) return res.status(404).json({ error: 'Contact user not found' });

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

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.body;
    await messageQueueService.updateMessageStatus(messageId, 'read');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

export default router;