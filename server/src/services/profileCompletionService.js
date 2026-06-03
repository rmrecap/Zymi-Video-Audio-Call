import { get, run } from '../db/postgres.js';

export const calculateProfileCompletion = (user) => {
  let score = 0;

  // Base registration (username + password set) = 5%
  if (user.username) score += 5;

  // Email verification = 15%
  if (user.email_verified) score += 15;

  // Phone verification = 15%
  if (user.phone_verified) score += 15;

  // Avatar / profile picture = 10%
  if (user.avatar) score += 10;

  // Display name = 5%
  if (user.first_name && user.last_name) score += 5;

  // Age = 5%
  if (user.age != null) score += 5;

  // Profession = 5%
  if (user.profession) score += 5;

  // Education = 5%
  if (user.education) score += 5;

  // Hobbies = 5%
  if (user.hobbies && Array.isArray(user.hobbies) && user.hobbies.length > 0) score += 5;

  // Interests = 5%
  if (user.interests && Array.isArray(user.interests) && user.interests.length > 0) score += 5;

  // Location (country + city) = 5%
  if (user.country_code && user.city_name) score += 5;

  // Address = 5%
  if (user.address) score += 5;

  // Status text (bio) = 5%
  if (user.status_text) score += 5;

  // Profile customizations (theme, notification settings) = 5%
  if (user.theme) score += 5;

  return Math.min(score, 100);
};

export const updateProfileCompletion = async (userId) => {
  const user = await get('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) return;

  const newScore = calculateProfileCompletion(user);
  await run('UPDATE users SET profile_completion = $1 WHERE id = $2', [newScore, userId]);
  return newScore;
};
