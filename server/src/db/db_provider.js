import { query as pgQuery } from './postgres.js';
import * as sqlite from './database.js';
import { config } from '../config/env.js';

export const db = {
  get: async (sql, ...params) => {
    if (config.databaseUrl) {
      const convertedSql = sql.split('?').reduce((acc, part, i, arr) => 
        i < arr.length - 1 ? `${acc}${part}$${i + 1}` : `${acc}${part}`, "");
      const res = await pgQuery(convertedSql, params);
      return res.rows[0];
    } else {
      return sqlite.get(sql, ...params);
    }
  },

  all: async (sql, ...params) => {
    if (config.databaseUrl) {
      const convertedSql = sql.split('?').reduce((acc, part, i, arr) => 
        i < arr.length - 1 ? `${acc}${part}$${i + 1}` : `${acc}${part}`, "");
      const res = await pgQuery(convertedSql, params);
      return res.rows;
    } else {
      return sqlite.all(sql, ...params);
    }
  },

  run: async (sql, ...params) => {
    if (config.databaseUrl) {
      const convertedSql = sql.split('?').reduce((acc, part, i, arr) => 
        i < arr.length - 1 ? `${acc}${part}$${i + 1}` : `${acc}${part}`, "");
      const res = await pgQuery(convertedSql, params);
      // For Postgres, we return the first row if available (for RETURNING id)
      return { lastInsertRowid: res.rows[0]?.id, changes: res.rowCount };
    } else {
      return sqlite.run(sql, ...params);
    }
  }
};
