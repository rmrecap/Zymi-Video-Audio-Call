import { get, run } from '../db/postgres.js';
import { calculateProfileCompletion } from './profileCompletionService.js';

export const getProfile = async (userId) => {
  const user = await get(`
    SELECT 
      id, username, display_name, status_text, avatar, 
      phone, phone_verified, email, email_verified, 
      profile_completion, verification_status, created_at 
    FROM users WHERE id = $1
  `, [userId]);

  if (!user) return null;

  return {
    ...user,
    displayName: user.display_name || user.username,
    statusText: user.status_text || '',
    phoneVerified: !!user.phone_verified,
    emailVerified: !!user.email_verified,
    profileCompletion: user.profile_completion || 40
  };
};

export const updateProfile = async (userId, data) => {
  const updates = [];
  const params = [];
  let idx = 1;

  if (data.displayName !== undefined) {
    updates.push(`display_name = $${idx++}`);
    params.push(data.displayName);
  }
  if (data.statusText !== undefined) {
    updates.push(`status_text = $${idx++}`);
    params.push(data.statusText);
  }

  if (updates.length === 0) return { success: false, error: 'No updates provided' };

  params.push(userId);
  await run(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, params);

  // Re-calculate completion
  const user = await get('SELECT * FROM users WHERE id = $1', [userId]);
  const newScore = calculateProfileCompletion(user);
  await run('UPDATE users SET profile_completion = $1 WHERE id = $2', [newScore, userId]);

  return { success: true, profileCompletion: newScore };
};
