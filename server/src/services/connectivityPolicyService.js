import { get, all, run } from '../db/postgres.js';

export const getPolicyForCountry = async (countryIso) => {
  // 1. Try specific country policy
  if (countryIso) {
    const policy = await get('SELECT * FROM connectivity_policies WHERE country_iso = $1 AND is_active = 1', [countryIso]);
    if (policy) return policy;
  }

  // 2. Fallback to global default (country_iso IS NULL)
  return await get('SELECT * FROM connectivity_policies WHERE country_iso IS NULL AND is_active = 1');
};

export const createOrUpdatePolicy = async (data) => {
  const { policy_name, country_iso, force_turn, auto_fix_enabled_default, max_direct_connect_seconds, apply_to_calls, apply_to_media } = data;
  
  const existing = await get('SELECT id FROM connectivity_policies WHERE country_iso IS NOT DISTINCT FROM $1', [country_iso]);
  
  if (existing) {
    const sql = `
      UPDATE connectivity_policies SET 
        policy_name = $1, force_turn = $2, auto_fix_enabled_default = $3, 
        max_direct_connect_seconds = $4, apply_to_calls = $5, apply_to_media = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `;
    return await run(sql, [policy_name, force_turn, auto_fix_enabled_default, max_direct_connect_seconds, apply_to_calls, apply_to_media, existing.id]);
  } else {
    const sql = `
      INSERT INTO connectivity_policies (
        policy_name, country_iso, force_turn, auto_fix_enabled_default, 
        max_direct_connect_seconds, apply_to_calls, apply_to_media
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    return await run(sql, [policy_name, country_iso, force_turn, auto_fix_enabled_default, max_direct_connect_seconds, apply_to_calls, apply_to_media]);
  }
};

export const getPolicies = async () => {
  return await all('SELECT * FROM connectivity_policies ORDER BY country_iso NULLS FIRST');
};

export const deletePolicy = async (id) => {
  return await run('DELETE FROM connectivity_policies WHERE id = $1', [id]);
};
