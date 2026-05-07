import { run, all, get } from '../db/postgres.js';

export const logConnectivityEvent = async (data) => {
  const { user_id, country_iso, event_type, connection_mode, ice_state, reason, metadata } = data;
  
  const sql = `
    INSERT INTO connectivity_events (
      user_id, country_iso, event_type, connection_mode, ice_state, reason, metadata_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;
  
  return await run(sql, [user_id, country_iso, event_type, connection_mode, ice_state, reason, JSON.stringify(metadata || {})]);
};

export const getConnectivityStats = async () => {
  const iceFailures = await get("SELECT COUNT(*) as count FROM connectivity_events WHERE event_type = 'ice_failure'");
  const turnFallbacks = await get("SELECT COUNT(*) as count FROM connectivity_events WHERE event_type = 'turn_fallback'");
  const forceTurnActive = await get("SELECT COUNT(*) as count FROM connectivity_events WHERE event_type = 'force_turn_active'");
  const recentEvents = await all("SELECT * FROM connectivity_events ORDER BY created_at DESC LIMIT 100");

  return {
    iceFailures: parseInt(iceFailures?.count || 0),
    turnFallbacks: parseInt(turnFallbacks?.count || 0),
    forceTurnActive: parseInt(forceTurnActive?.count || 0),
    recentEvents
  };
};

export const getRegionStats = async () => {
  return await all(`
    SELECT country_iso, 
           COUNT(*) as total_events,
           SUM(CASE WHEN event_type = 'ice_failure' THEN 1 ELSE 0 END) as failures,
           SUM(CASE WHEN event_type = 'turn_fallback' THEN 1 ELSE 0 END) as fallbacks
    FROM connectivity_events 
    GROUP BY country_iso
  `);
};
