import { get, all, run } from '../db/database.js';

export const checkCostGuardLimits = (userId, countryIso) => {
  const rules = getRuleForCountry(countryIso);
  if (!rules || !rules.is_active) return { allowed: true };

  const todayUsage = get(`
    SELECT 
      SUM(duration_seconds) / 60 as minutes,
      SUM(bytes_estimated) / (1024 * 1024) as mb
    FROM relay_usage_stats
    WHERE user_id = ? AND date(created_at) = date('now')
  `, userId);

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

export const getRuleForCountry = (countryIso) => {
  if (countryIso) {
    const rule = get('SELECT * FROM relay_cost_guard_rules WHERE country_iso = ? AND is_active = 1', countryIso);
    if (rule) return rule;
  }
  return get('SELECT * FROM relay_cost_guard_rules WHERE country_iso IS NULL AND is_active = 1');
};

export const getAllRules = () => {
  return all('SELECT * FROM relay_cost_guard_rules ORDER BY country_iso NULLS FIRST');
};

export const createOrUpdateRule = (data) => {
  const { rule_name, country_iso, max_relay_minutes_per_user_daily, max_media_mb_per_user_daily, force_turn_allowed, alert_threshold_percent, is_active } = data;
  
  const existing = get('SELECT id FROM relay_cost_guard_rules WHERE country_iso IS ?', country_iso);
  
  if (existing) {
    const sql = `
      UPDATE relay_cost_guard_rules SET 
        rule_name = ?, max_relay_minutes_per_user_daily = ?, max_media_mb_per_user_daily = ?,
        force_turn_allowed = ?, alert_threshold_percent = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    return run(sql, rule_name, max_relay_minutes_per_user_daily, max_media_mb_per_user_daily, force_turn_allowed, alert_threshold_percent, is_active, existing.id);
  } else {
    const sql = `
      INSERT INTO relay_cost_guard_rules (
        rule_name, country_iso, max_relay_minutes_per_user_daily, max_media_mb_per_user_daily,
        force_turn_allowed, alert_threshold_percent, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    return run(sql, rule_name, country_iso, max_relay_minutes_per_user_daily, max_media_mb_per_user_daily, force_turn_allowed, alert_threshold_percent, is_active);
  }
};

export const getRelayAnomalies = () => {
  // Detect users exceeding rules or high country usage
  return all(`
    SELECT user_id, country_iso, SUM(duration_seconds) / 60 as minutes, SUM(bytes_estimated) / (1024*1024) as mb
    FROM relay_usage_stats
    WHERE date(created_at) = date('now')
    GROUP BY user_id
    HAVING minutes > 30 OR mb > 100
    ORDER BY minutes DESC
  `);
};
