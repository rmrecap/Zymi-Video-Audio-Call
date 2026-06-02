import { get, all, run } from '../db/postgres.js';

const POINTS_PER_MESSAGE = 1;
const POINTS_PER_CALL = 5;
const POINTS_PER_CALL_MINUTE = 2;
const POINTS_PER_ACTIVE_DAY = 3;

export const getPoints = async (userId) => {
  let record = await get('SELECT * FROM user_points WHERE user_id = $1', [userId]);
  if (!record) {
    await run(
      'INSERT INTO user_points (user_id, points, level) VALUES ($1, 0, 1) ON CONFLICT (user_id) DO NOTHING',
      [userId]
    );
    record = await get('SELECT * FROM user_points WHERE user_id = $1', [userId]);
  }
  return record;
};

export const addPoints = async (userId, points, reason) => {
  const record = await getPoints(userId);
  const newPoints = (record?.points || 0) + points;
  const newLevel = Math.floor(newPoints / 100) + 1;
  await run(
    'UPDATE user_points SET points = $1, level = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
    [newPoints, newLevel, userId]
  );
  await checkAndAwardBadges(userId, newPoints);
  return { points: newPoints, level: newLevel, pointsEarned: points, reason };
};

export const incrementMessagesSent = async (userId) => {
  await run(
    `INSERT INTO user_points (user_id, points, messages_sent)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id) DO UPDATE SET
       messages_sent = user_points.messages_sent + 1,
       points = user_points.points + $2,
       level = FLOOR((user_points.points + $2) / 100) + 1,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, POINTS_PER_MESSAGE]
  );
  await checkDailyActivity(userId);
};

export const incrementCallsMade = async (userId, durationSeconds) => {
  await run(
    `INSERT INTO user_points (user_id, points, calls_made, call_duration_seconds)
     VALUES ($1, $2, 1, $3)
     ON CONFLICT (user_id) DO UPDATE SET
       calls_made = user_points.calls_made + 1,
       call_duration_seconds = user_points.call_duration_seconds + $3,
       points = user_points.points + $2 + ($3 / 60) * $4,
       level = FLOOR((user_points.points + $2 + ($3 / 60) * $4) / 100) + 1,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, POINTS_PER_CALL, durationSeconds || 0, POINTS_PER_CALL_MINUTE]
  );
  await checkDailyActivity(userId);
};

export const checkDailyActivity = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const record = await get('SELECT last_active_date FROM user_points WHERE user_id = $1', [userId]);
  if (record && record.last_active_date !== today) {
    await run(
      'UPDATE user_points SET days_active = days_active + 1, last_active_date = $1, points = points + $2 WHERE user_id = $3',
      [today, POINTS_PER_ACTIVE_DAY, userId]
    );
    const updated = await get('SELECT days_active FROM user_points WHERE user_id = $1', [userId]);
    if (updated && updated.days_active % 7 === 0) {
      await awardAchievement(userId, `streak_${updated.days_active}_days`, `${updated.days_active}-Day Streak`, `Active for ${updated.days_active} consecutive days`, 50);
    }
  } else if (!record) {
    await run(
      `INSERT INTO user_points (user_id, points, days_active, last_active_date)
       VALUES ($1, 0, 1, $2) ON CONFLICT (user_id) DO NOTHING`,
      [userId, today]
    );
  }
};

export const getBadges = async () => {
  return all('SELECT * FROM badges ORDER BY category, points_required ASC');
};

export const getUserBadges = async (userId) => {
  return all(
    `SELECT b.*, ub.earned_at
     FROM badges b
     JOIN user_badges ub ON ub.badge_id = b.id
     WHERE ub.user_id = $1
     ORDER BY ub.earned_at DESC`,
    [userId]
  );
};

export const checkAndAwardBadges = async (userId, currentPoints) => {
  const allBadges = await getBadges();
  const owned = await getUserBadges(userId);
  const ownedKeys = new Set(owned.map(b => b.badge_key));
  const userData = await get(
    'SELECT messages_sent, calls_made, days_active FROM user_points WHERE user_id = $1',
    [userId]
  );

  for (const badge of allBadges) {
    if (ownedKeys.has(badge.badge_key)) continue;

    let earned = false;
    if (badge.badge_key === 'first_message' && (userData?.messages_sent || 0) >= 1) earned = true;
    if (badge.badge_key === 'chatty' && (userData?.messages_sent || 0) >= 100) earned = true;
    if (badge.badge_key === 'talkative' && (userData?.messages_sent || 0) >= 500) earned = true;
    if (badge.badge_key === 'first_call' && (userData?.calls_made || 0) >= 1) earned = true;
    if (badge.badge_key === 'socializer' && (userData?.calls_made || 0) >= 50) earned = true;
    if (badge.badge_key === 'streak_7' && (userData?.days_active || 0) >= 7) earned = true;
    if (badge.points_required > 0 && currentPoints >= badge.points_required) earned = true;

    if (earned) {
      await run(
        'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, badge.id]
      );
    }
  }
};

export const awardAchievement = async (userId, key, title, description, xp) => {
  const existing = await get(
    'SELECT id FROM achievements WHERE user_id = $1 AND achievement_key = $2',
    [userId, key]
  );
  if (existing) return existing;
  await run(
    'INSERT INTO achievements (user_id, achievement_key, title, description, xp_rewarded) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
    [userId, key, title, description, xp || 0]
  );
  if (xp > 0) {
    await addPoints(userId, xp, `Achievement: ${title}`);
  }
};

export const getAchievements = async (userId) => {
  return all(
    'SELECT * FROM achievements WHERE user_id = $1 ORDER BY earned_at DESC',
    [userId]
  );
};

export const getLeaderboard = async (limit = 50) => {
  return all(
    `SELECT u.id, u.username, u.display_name, u.avatar, up.points, up.level,
            up.messages_sent, up.calls_made, up.days_active
     FROM user_points up
     JOIN users u ON u.id = up.user_id
     ORDER BY up.points DESC
     LIMIT $1`,
    [limit]
  );
};
