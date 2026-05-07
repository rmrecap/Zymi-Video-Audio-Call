/**
 * database.js — DEPRECATED (SQLite removed)
 *
 * This file previously provided SQLite access via better-sqlite3.
 * The application now exclusively uses PostgreSQL via postgres.js.
 *
 * This stub is kept to prevent import errors from any legacy code that
 * may still reference it. All exports throw a clear error at runtime.
 */

const deprecated = (name) => {
  throw new Error(
    `[database.js] '${name}' is a deprecated SQLite function. ` +
    `Use postgres.js or db_provider.js instead.`
  );
};

export const initDatabase = () => deprecated('initDatabase');
export const getDatabase = () => deprecated('getDatabase');
export const closeDatabase = () => deprecated('closeDatabase');
export const prepare = () => deprecated('prepare');
export const exec = () => deprecated('exec');
export const get = () => deprecated('get');
export const all = () => deprecated('all');
export const run = () => deprecated('run');