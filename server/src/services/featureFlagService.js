import { get, all, run } from '../db/postgres.js';

export const getAllFeatureFlags = async () => {
  return await all("SELECT * FROM feature_flags");
};

export const updateFeatureFlag = async (featureKey, enabled, adminId) => {
  const oldFlag = await get("SELECT enabled FROM feature_flags WHERE feature_key = $1", [featureKey]);
  const enabledValue = enabled ? 1 : 0;
  
  await run("UPDATE feature_flags SET enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE feature_key = $2", [enabledValue, featureKey]);
  
  await run(`
    INSERT INTO admin_audit_logs (admin_id, action, target_user_id, details, timestamp)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
  `, [adminId, 'UPDATE_FEATURE_FLAG', null, JSON.stringify({
    feature_key: featureKey,
    old_value: oldFlag?.enabled,
    new_value: enabledValue
  })]);
};

export const getGeoRules = async (featureKey) => {
  if (featureKey) {
    return await all("SELECT * FROM feature_geo_rules WHERE feature_key = $1", [featureKey]);
  }
  return await all("SELECT * FROM feature_geo_rules");
};

export const setGeoRule = async (featureKey, countryCode, cityName, enabled, reason, adminId) => {
  const enabledValue = enabled ? 1 : 0;
  await run(`
    INSERT INTO feature_geo_rules (feature_key, country_code, city_name, enabled, reason)
    VALUES ($1, $2, $3, $4, $5)
  `, [featureKey, countryCode, cityName, enabledValue, reason]);
  
  await run(`
    INSERT INTO admin_audit_logs (admin_id, action, target_user_id, details, timestamp)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
  `, [adminId, 'SET_GEO_RULE', null, JSON.stringify({
    feature_key: featureKey,
    country_code: countryCode,
    city_name: cityName,
    enabled: enabledValue,
    reason
  })]);
};

export const getUserRules = async (userId) => {
  if (userId) {
    return await all("SELECT * FROM feature_user_rules WHERE user_id = $1", [userId]);
  }
  return await all("SELECT * FROM feature_user_rules");
};

export const setUserRule = async (featureKey, userId, enabled, reason, expiresAt, adminId) => {
  const enabledValue = enabled ? 1 : 0;
  await run(`
    INSERT INTO feature_user_rules (feature_key, user_id, enabled, reason, expires_at)
    VALUES ($1, $2, $3, $4, $5)
  `, [featureKey, userId, enabledValue, reason, expiresAt]);
  
  await run(`
    INSERT INTO admin_audit_logs (admin_id, action, target_user_id, details, timestamp)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
  `, [adminId, 'SET_USER_RULE', userId, JSON.stringify({
    feature_key: featureKey,
    enabled: enabledValue,
    reason,
    expires_at: expiresAt
  })]);
};

export const evaluateFeatureAccess = async ({ featureKey, userId, countryCode, cityName }) => {
  // 1. Check User Rule (Highest priority)
  if (userId) {
    const userRule = await get(`
      SELECT enabled, reason FROM feature_user_rules 
      WHERE feature_key = $1 AND user_id = $2 
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC LIMIT 1
    `, [featureKey, userId]);
    
    if (userRule !== undefined && userRule !== null) {
      return { 
        allowed: !!userRule.enabled, 
        level: 'user', 
        reason: userRule.reason || (userRule.enabled ? 'User explicitly allowed' : 'User explicitly restricted')
      };
    }
  }
  
  // 2. Check City Rule
  if (featureKey && cityName) {
    const cityRule = await get(`
      SELECT enabled, reason FROM feature_geo_rules 
      WHERE feature_key = $1 AND city_name = $2
      ORDER BY created_at DESC LIMIT 1
    `, [featureKey, cityName]);
    
    if (cityRule !== undefined && cityRule !== null) {
      return { 
        allowed: !!cityRule.enabled, 
        level: 'city', 
        reason: cityRule.reason || (cityRule.enabled ? `Enabled for city: ${cityName}` : `Restricted for city: ${cityName}`)
      };
    }
  }
  
  // 3. Check Country Rule
  if (featureKey && countryCode) {
    const countryRule = await get(`
      SELECT enabled, reason FROM feature_geo_rules 
      WHERE feature_key = $1 AND country_code = $2 AND (city_name IS NULL OR city_name = '')
      ORDER BY created_at DESC LIMIT 1
    `, [featureKey, countryCode]);
    
    if (countryRule !== undefined && countryRule !== null) {
      return { 
        allowed: !!countryRule.enabled, 
        level: 'country', 
        reason: countryRule.reason || (countryRule.enabled ? `Enabled for country: ${countryCode}` : `Restricted for country: ${countryCode}`)
      };
    }
  }
  
  // 4. Check Global Flag
  const globalFlag = await get("SELECT enabled, description FROM feature_flags WHERE feature_key = $1", [featureKey]);
  if (globalFlag) {
    return { 
      allowed: !!globalFlag.enabled, 
      level: 'global', 
      reason: globalFlag.description || (globalFlag.enabled ? 'Feature enabled globally' : 'Feature disabled globally')
    };
  }

  return { 
    allowed: false, 
    level: 'default', 
    reason: 'Feature not found or disabled by default' 
  };
};

export const checkFeatureAccess = async (params) => {
  const result = await evaluateFeatureAccess(params);
  return result.allowed;
};

export const getGovernanceAuditLogs = async () => {
  return await all(`
    SELECT l.*, u.username as admin_username 
    FROM admin_audit_logs l
    LEFT JOIN users u ON l.admin_id = u.id
    WHERE l.action IN ('UPDATE_FEATURE_FLAG', 'SET_GEO_RULE', 'SET_USER_RULE')
    ORDER BY l.timestamp DESC
  `);
};