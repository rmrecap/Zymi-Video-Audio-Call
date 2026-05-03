import { run, all, get } from '../db/database.js';

export const logRelayUsage = (data) => {
  const { user_id, country_iso, connection_type, relay_mode, bytes_estimated, duration_seconds, session_id } = data;
  
  const sql = `
    INSERT INTO relay_usage_stats (
      user_id, country_iso, connection_type, relay_mode, bytes_estimated, duration_seconds, session_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  return run(sql, user_id, country_iso, connection_type, relay_mode, bytes_estimated || 0, duration_seconds || 0, session_id);
};

export const getRelayUsageSummary = () => {
  const total = get(`
    SELECT 
      SUM(bytes_estimated) as total_bytes,
      SUM(duration_seconds) as total_seconds,
      COUNT(DISTINCT session_id) as total_sessions
    FROM relay_usage_stats
  `);

  const byCountry = all(`
    SELECT country_iso, 
           SUM(bytes_estimated) as bytes, 
           SUM(duration_seconds) as seconds,
           COUNT(*) as events
    FROM relay_usage_stats 
    GROUP BY country_iso 
    ORDER BY bytes DESC
  `);

  const byType = all(`
    SELECT connection_type, 
           SUM(bytes_estimated) as bytes, 
           SUM(duration_seconds) as seconds
    FROM relay_usage_stats 
    GROUP BY connection_type
  `);

  return { total, byCountry, byType };
};

export const getRecentRelaySessions = (limit = 100) => {
  return all(`
    SELECT r.*, u.username 
    FROM relay_usage_stats r
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC 
    LIMIT ?
  `, limit);
};
