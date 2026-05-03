import { get, run } from '../db/database.js';

export const calculateProfileCompletion = (user) => {
  let score = 40; // Base registration score

  if (user.avatar) score += 10;
  if (user.email_verified) score += 20;
  if (user.phone_verified) score += 20;
  if (user.country && user.city) score += 10;

  return Math.min(score, 100);
};

export const updateProfileCompletion = (userId) => {
  const user = get('SELECT * FROM users WHERE id = ?', userId);
  if (!user) return;

  const newScore = calculateProfileCompletion(user);
  run('UPDATE users SET profile_completion = ? WHERE id = ?', newScore, userId);
  return newScore;
};
