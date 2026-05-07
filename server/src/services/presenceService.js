import { get } from '../db/postgres.js';

export const canSeeUserOnline = async (viewerId, targetId) => {
  const targetUser = await get('SELECT online_visibility FROM users WHERE id = $1', [targetId]);
  if (!targetUser) return false;

  // If target user has online_visibility disabled, they won't appear online
  if (targetUser.online_visibility === false || targetUser.online_visibility === 0) return false;

  // Future: implement per-blocker or friend-list exceptions
  return true;
};

export const shouldBroadcastOnline = async (userId) => {
  const user = await get('SELECT online_visibility FROM users WHERE id = $1', [userId]);
  return user?.online_visibility !== false && user?.online_visibility !== 0; // default true
};

// Helper to filter users list based on online visibility
export const filterUsersByVisibility = async (users, viewerId) => {
  const visibilityResults = await Promise.all(
    users.map(async (user) => ({
      user,
      visible: await canSeeUserOnline(viewerId, user.id)
    }))
  );
  return visibilityResults
    .filter(result => result.visible)
    .map(result => result.user);
};
