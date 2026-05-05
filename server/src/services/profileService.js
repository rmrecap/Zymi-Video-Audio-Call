import { get, run } from '../db/database.js';
import { calculateProfileCompletion } from './profileCompletionService.js';

export const getProfile = (userId) => {
  const user = get(`
    SELECT 
      id, username, display_name, status_text, avatar, 
      phone, phone_verified, email, email_verified, 
      profile_completion, verification_status, created_at 
    FROM users WHERE id = ?
  `, userId);

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

export const updateProfile = (userId, data) => {
  const updates = [];
  const params = [];

  if (data.displayName !== undefined) {
    updates.push('display_name = ?');
    params.push(data.displayName);
  }
  if (data.statusText !== undefined) {
    updates.push('status_text = ?');
    params.push(data.statusText);
  }

  if (updates.length === 0) return { success: false, error: 'No updates provided' };

  params.push(userId);
  run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, ...params);

  // Re-calculate completion
  const user = get('SELECT * FROM users WHERE id = ?', userId);
  const newScore = calculateProfileCompletion(user);
  run('UPDATE users SET profile_completion = ? WHERE id = ?', newScore, userId);

  return { success: true, profileCompletion: newScore };
};
