import { get, all, run } from '../db/postgres.js';

export const checkCostGuardLimits = async (userId, countryIso) => {
  const rules = await getRuleForCountry(countryIso);
  if (!rules || !rules.is_active) return { allowed: true };

  const todayUsage = await get(`
    SELECT 
      SUM(duration_seconds) / 60 as minutes,
      SUM(bytes_estimated) / (1024 * 1024) as mb
    FROM relay_usage_stats
    WHERE user_id = $1 AND created_at::date = CURRENT_DATE
  `, [userId]);

  const alerts = [];
  const limits = {
    minutesReached: (todayUsage.minutes || 0) >= rules.max_relay_minutes_per_user_daily,
    mbReached: (todayUsage.mb || 0) >= rules.max_media_mb_per_user_daily
  };

  const thresholdRatio = rules.alert_threshold_percent / 100;
  
  if ((todayUsage.minutes || 0) >= rules.max_relay_minutes_per_user_daily * thresholdRatio) {
    alerts.push(`User ${userId} reached ${rules.alert_threshold_percent}% of relay minute limit.`);
  }

  if ((todayUsage.mb || 0) >= rules.max_media_mb_per_user_daily * thresholdRatio) {
    alerts.push(`User ${userId} reached ${rules.alert_threshold_percent}% of relay media bandwidth limit.`);
  }

  return {
    allowed: !limits.minutesReached && !limits.mbReached,
    limits,
    alerts,
    rules
  };
};

export const getRuleForCountry = async (countryIso) => {
  if (countryIso) {
    const rule = await get('SELECT * FROM relay_cost_guard_rules WHERE country_iso = $1 AND is_active = 1', [countryIso]);
    if (rule) return rule;
  }
  return await get('SELECT * FROM relay_cost_guard_rules WHERE country_iso IS NULL AND is_active = 1');
};

export const getAllRules = async () => {
  return await all('SELECT * FROM relay_cost_guard_rules ORDER BY country_iso NULLS FIRST');
};

export const createOrUpdateRule = async (data) => {
  const { rule_name, country_iso, max_relay_minutes_per_user_daily, max_media_mb_per_user_daily, force_turn_allowed, alert_threshold_percent, is_active } = data;
  
  const existing = await get('SELECT id FROM relay_cost_guard_rules WHERE country_iso IS NOT DISTINCT FROM $1', [country_iso]);
  
  if (existing) {
    const sql = `
      UPDATE relay_cost_guard_rules SET 
        rule_name = $1, max_relay_minutes_per_user_daily = $2, max_media_mb_per_user_daily = $3,
        force_turn_allowed = $4, alert_threshold_percent = $5, is_active = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `;
    return await run(sql, [rule_name, max_relay_minutes_per_user_daily, max_media_mb_per_user_daily, force_turn_allowed, alert_threshold_percent, is_active, existing.id]);
  } else {
    const sql = `
      INSERT INTO relay_cost_guard_rules (
        rule_name, country_iso, max_relay_minutes_per_user_daily, max_media_mb_per_user_daily,
        force_turn_allowed, alert_threshold_percent, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    return await run(sql, [rule_name, country_iso, max_relay_minutes_per_user_daily, max_media_mb_per_user_daily, force_turn_allowed, alert_threshold_percent, is_active]);
  }
};

export const getRelayAnomalies = async () => {
  // Detect users exceeding rules or high country usage
  return await all(`
    SELECT user_id, country_iso, SUM(duration_seconds) / 60 as minutes, SUM(bytes_estimated) / (1024*1024) as mb
    FROM relay_usage_stats
    WHERE created_at::date = CURRENT_DATE
    GROUP BY user_id, country_iso
    HAVING (SUM(duration_seconds) / 60) > 30 OR (SUM(bytes_estimated) / (1024*1024)) > 100
    ORDER BY minutes DESC
  `);
};
