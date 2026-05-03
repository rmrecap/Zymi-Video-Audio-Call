import { get, all, run } from '../db/database.js';

export const getPolicyForCountry = (countryIso) => {
  // 1. Try specific country policy
  if (countryIso) {
    const policy = get('SELECT * FROM connectivity_policies WHERE country_iso = ? AND is_active = 1', countryIso);
    if (policy) return policy;
  }

  // 2. Fallback to global default (country_iso IS NULL)
  return get('SELECT * FROM connectivity_policies WHERE country_iso IS NULL AND is_active = 1');
};

export const createOrUpdatePolicy = (data) => {
  const { policy_name, country_iso, force_turn, auto_fix_enabled_default, max_direct_connect_seconds, apply_to_calls, apply_to_media } = data;
  
  const existing = get('SELECT id FROM connectivity_policies WHERE country_iso IS ?', country_iso);
  
  if (existing) {
    const sql = `
      UPDATE connectivity_policies SET 
        policy_name = ?, force_turn = ?, auto_fix_enabled_default = ?, 
        max_direct_connect_seconds = ?, apply_to_calls = ?, apply_to_media = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    return run(sql, policy_name, force_turn, auto_fix_enabled_default, max_direct_connect_seconds, apply_to_calls, apply_to_media, existing.id);
  } else {
    const sql = `
      INSERT INTO connectivity_policies (
        policy_name, country_iso, force_turn, auto_fix_enabled_default, 
        max_direct_connect_seconds, apply_to_calls, apply_to_media
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    return run(sql, policy_name, country_iso, force_turn, auto_fix_enabled_default, max_direct_connect_seconds, apply_to_calls, apply_to_media);
  }
};

export const getPolicies = () => {
  return all('SELECT * FROM connectivity_policies ORDER BY country_iso NULLS FIRST');
};

export const deletePolicy = (id) => {
  return run('DELETE FROM connectivity_policies WHERE id = ?', id);
};
