import { get, run } from '../db/postgres.js';
import { calculateProfileCompletion } from './profileCompletionService.js';

export const getProfile = async (userId) => {
  const user = await get(`
    SELECT 
      id, username, display_name, status_text, avatar, 
      phone, phone_verified, email, email_verified, 
      profile_completion, verification_status, created_at,
      first_name, last_name, address, work, hobby, family_members,
      premium_status, selected_server
    FROM users WHERE id = $1
  `, [userId]);

  if (!user) return null;

  return {
    ...user,
    displayName: user.display_name || user.username,
    statusText: user.status_text || '',
    phoneVerified: !!user.phone_verified,
    emailVerified: !!user.email_verified,
    profileCompletion: user.profile_completion || 40,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    address: user.address || '',
    work: user.work || '',
    hobby: user.hobby || '',
    familyMembers: user.family_members || [],
    premiumStatus: user.premium_status || 'free',
    selectedServer: user.selected_server || 'Default'
  };
};

export const updateProfile = async (userId, data) => {
  const updates = [];
  const params = [];
  let idx = 1;

  const fieldMap = {
    displayName: 'display_name',
    statusText: 'status_text',
    firstName: 'first_name',
    lastName: 'last_name',
    address: 'address',
    work: 'work',
    hobby: 'hobby',
    familyMembers: 'family_members',
    premiumStatus: 'premium_status',
    selectedServer: 'selected_server'
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      updates.push(`${col} = $${idx++}`);
      params.push(key === 'familyMembers' ? JSON.stringify(data[key]) : data[key]);
    }
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
