import { get, run } from '../db/postgres.js';

export const calculateProfileCompletion = (user) => {
  let score = 40; // Base registration score

  if (user.avatar) score += 10;
  if (user.email_verified) score += 15;
  if (user.phone_verified) score += 15;
  if (user.country && user.city) score += 5;
  if (user.first_name && user.last_name) score += 5;
  if (user.address) score += 3;
  if (user.work) score += 3;
  if (user.hobby) score += 2;
  if (user.family_members && user.family_members.length > 0) score += 2;

  return Math.min(score, 100);
};

export const updateProfileCompletion = async (userId) => {
  const user = await get('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) return;

  const newScore = calculateProfileCompletion(user);
  await run('UPDATE users SET profile_completion = $1 WHERE id = $2', [newScore, userId]);
  return newScore;
};
