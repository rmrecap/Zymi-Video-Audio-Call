import { checkBlocked, blockUser, unblockUser, getBlockedUsers } from '../services/blockService.js';

export const block = (req, res) => {
  const blockerId = req.user.id;
  const targetUserId = req.body.targetUserId || req.params.userId;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID required' });
  }

  const tid = parseInt(targetUserId);

  if (blockerId === tid) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }

  blockUser(blockerId, tid);
  res.json({ success: true, message: 'User blocked' });
};

export const unblock = (req, res) => {
  const blockerId = req.user.id;
  const targetUserId = req.body.targetUserId || req.params.userId;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID required' });
  }

  unblockUser(blockerId, parseInt(targetUserId));
  res.json({ success: true, message: 'User unblocked' });
};

export const checkBlock = (req, res) => {
  const blockerId = req.user.id;
  const targetUserId = parseInt(req.params.targetId);

  const blocked = checkBlocked(blockerId, targetUserId);
  res.json({ blocked });
};

export const listBlocked = (req, res) => {
  const userId = req.user.id;
  const blocked = getBlockedUsers(userId);
  res.json(blocked);
};

export const isBlocked = (blockerId, targetId) => {
  return checkBlocked(blockerId, targetId);
};
