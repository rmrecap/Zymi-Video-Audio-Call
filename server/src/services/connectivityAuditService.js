import { run, all, get } from '../db/database.js';

export const logConnectivityEvent = (data) => {
  const { user_id, country_iso, event_type, connection_mode, ice_state, reason, metadata } = data;
  
  const sql = `
    INSERT INTO connectivity_events (
      user_id, country_iso, event_type, connection_mode, ice_state, reason, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  return run(sql, user_id, country_iso, event_type, connection_mode, ice_state, reason, JSON.stringify(metadata || {}));
};

export const getConnectivityStats = () => {
  return {
    iceFailures: get("SELECT COUNT(*) as count FROM connectivity_events WHERE event_type = 'ice_failure'").count,
    turnFallbacks: get("SELECT COUNT(*) as count FROM connectivity_events WHERE event_type = 'turn_fallback'").count,
    forceTurnActive: get("SELECT COUNT(*) as count FROM connectivity_events WHERE event_type = 'force_turn_active'").count,
    recentEvents: all("SELECT * FROM connectivity_events ORDER BY created_at DESC LIMIT 100")
  };
};

export const getRegionStats = () => {
  return all(`
    SELECT country_iso, 
           COUNT(*) as total_events,
           SUM(CASE WHEN event_type = 'ice_failure' THEN 1 ELSE 0 END) as failures,
           SUM(CASE WHEN event_type = 'turn_fallback' THEN 1 ELSE 0 END) as fallbacks
    FROM connectivity_events 
    GROUP BY country_iso
  `);
};
