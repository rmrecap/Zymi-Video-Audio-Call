/**
 * db_provider.js — Pure PostgreSQL wrapper
 * SQLite fallback has been completely removed.
 */
import { query as pgQuery, get, all, run } from './postgres.js';

export const db = {
  get: async (sql, ...params) => {
    return await get(sql, params.flat());
  },

  all: async (sql, ...params) => {
    return await all(sql, params.flat());
  },

  run: async (sql, ...params) => {
    const res = await run(sql, params.flat());
    return {
      lastID: res.lastID,
      changes: res.changes
    };
  }
};
