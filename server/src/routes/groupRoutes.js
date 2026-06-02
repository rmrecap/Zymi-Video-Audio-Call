import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as groupChatService from '../services/groupChatService.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const groups = await groupChatService.getUserGroups(req.user.id);
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:groupId', requireAuth, async (req, res) => {
  try {
    const group = await groupChatService.getGroup(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const members = await groupChatService.getMembers(group.id);
    res.json({ group, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:groupId/messages', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const messages = await groupChatService.getGroupMessages(req.params.groupId, req.user.id, limit, offset);
    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(err.message.includes('not a member') ? 403 : 500).json({ error: err.message });
  }
});

router.get('/:groupId/unread', requireAuth, async (req, res) => {
  try {
    const count = await groupChatService.getGroupUnreadCount(req.params.groupId, req.user.id);
    res.json({ unread: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:groupId/read', requireAuth, async (req, res) => {
  try {
    const { messageId } = req.body;
    if (messageId) {
      await groupChatService.markGroupMessageRead(messageId, req.user.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:groupId', requireAuth, async (req, res) => {
  try {
    await groupChatService.deleteGroup(req.params.groupId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.message.includes('admin') ? 403 : 500).json({ error: err.message });
  }
});

export default router;
