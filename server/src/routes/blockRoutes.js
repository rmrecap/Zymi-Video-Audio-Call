import { checkBlocked, blockUser, unblockUser, getBlockedUsers } from '../services/blockService.js';

export const block = async (req, res) => {
  const blockerId = req.user.id;
  const targetUserId = req.body.targetUserId || req.params.userId;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID required' });
  }

  const tid = parseInt(targetUserId);

  if (blockerId === tid) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }

  await blockUser(blockerId, tid);
  res.json({ success: true, message: 'User blocked' });
};

export const unblock = async (req, res) => {
  const blockerId = req.user.id;
  const targetUserId = req.body.targetUserId || req.params.userId;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID required' });
  }

  await unblockUser(blockerId, parseInt(targetUserId));
  res.json({ success: true, message: 'User unblocked' });
};

export const checkBlock = async (req, res) => {
  const blockerId = req.user.id;
  const targetUserId = parseInt(req.params.targetId);

  const blocked = await checkBlocked(blockerId, targetUserId);
  res.json({ blocked });
};

export const listBlocked = async (req, res) => {
  const userId = req.user.id;
  const blocked = await getBlockedUsers(userId);
  res.json(blocked);
};

export const isBlocked = async (blockerId, targetId) => {
  return await checkBlocked(blockerId, targetId);
};
