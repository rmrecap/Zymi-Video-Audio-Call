import { run, all, get } from '../db/postgres.js';

export const logRelayUsage = async (data) => {
  const { user_id, country_iso, connection_type, relay_mode, bytes_estimated, duration_seconds, session_id } = data;
  
  const sql = `
    INSERT INTO relay_usage_stats (
      user_id, country_iso, connection_type, relay_mode, bytes_estimated, duration_seconds, session_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;
  
  return await run(sql, [user_id, country_iso, connection_type, relay_mode, bytes_estimated || 0, duration_seconds || 0, session_id]);
};

export const getRelayUsageSummary = async () => {
  const total = await get(`
    SELECT 
      SUM(bytes_estimated) as total_bytes,
      SUM(duration_seconds) as total_seconds,
      COUNT(DISTINCT session_id) as total_sessions
    FROM relay_usage_stats
  `);

  const byCountry = await all(`
    SELECT country_iso, 
           SUM(bytes_estimated) as bytes, 
           SUM(duration_seconds) as seconds,
           COUNT(*) as events
    FROM relay_usage_stats 
    GROUP BY country_iso 
    ORDER BY bytes DESC
  `);

  const byType = await all(`
    SELECT connection_type, 
           SUM(bytes_estimated) as bytes, 
           SUM(duration_seconds) as seconds
    FROM relay_usage_stats 
    GROUP BY connection_type
  `);

  return { total, byCountry, byType };
};

export const getRecentRelaySessions = async (limit = 100) => {
  return await all(`
    SELECT r.*, u.username 
    FROM relay_usage_stats r
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC 
    LIMIT $1
  `, [limit]);
};
