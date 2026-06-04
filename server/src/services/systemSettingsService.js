import { get, run } from '../db/postgres.js';

let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5000;

async function loadSettings() {
  const row = await get('SELECT settings_json, updated_at FROM system_settings WHERE id = 1');
  if (row) {
    cachedSettings = typeof row.settings_json === 'string' ? JSON.parse(row.settings_json) : row.settings_json;
    cacheTimestamp = Date.now();
  } else {
    cachedSettings = {};
    cacheTimestamp = Date.now();
  }
  return cachedSettings;
}

export const systemSettingsService = {
  async getAll(forceRefresh = false) {
    if (!cachedSettings || forceRefresh || (Date.now() - cacheTimestamp > CACHE_TTL_MS)) {
      await loadSettings();
    }
    return { ...cachedSettings };
  },

  async get(key, forceRefresh = false) {
    const all = await this.getAll(forceRefresh);
    return all[key];
  },

  async set(key, value, adminId = null) {
    const current = await this.getAll(true);
    current[key] = value;
    await run(
      'UPDATE system_settings SET settings_json = $1::jsonb, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = 1',
      [JSON.stringify(current), adminId]
    );
    cachedSettings = { ...current };
    cacheTimestamp = Date.now();
    return { success: true };
  },

  async updateBulk(updates, adminId = null) {
    const current = await this.getAll(true);
    Object.assign(current, updates);
    await run(
      'UPDATE system_settings SET settings_json = $1::jsonb, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = 1',
      [JSON.stringify(current), adminId]
    );
    cachedSettings = { ...current };
    cacheTimestamp = Date.now();
    return { success: true };
  },

  async delete(key, adminId = null) {
    const current = await this.getAll(true);
    delete current[key];
    await run(
      'UPDATE system_settings SET settings_json = $1::jsonb, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = 1',
      [JSON.stringify(current), adminId]
    );
    cachedSettings = { ...current };
    cacheTimestamp = Date.now();
    return { success: true };
  },

  invalidateCache() {
    cacheTimestamp = 0;
  }
};
