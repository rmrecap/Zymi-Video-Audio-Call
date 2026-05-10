/**
 * db_provider.js — Bridge to postgres.js (handles PostgreSQL with SQLite fallback)
 */
import * as postgres from './postgres.js';

export const db = {
  get: (sql, ...params) => postgres.get(sql, ...params),
  all: (sql, ...params) => postgres.all(sql, ...params),
  run: (sql, ...params) => postgres.run(sql, ...params),
  exec: (sql) => postgres.exec(sql)
};
