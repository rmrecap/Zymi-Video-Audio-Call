/**
 * dbAdapter.js — DEPRECATED
 *
 * Previously a hybrid SQLite/PostgreSQL switcher.
 * Now re-exports directly from postgresAdapter.js (pure PostgreSQL).
 */
export * from './postgresAdapter.js';

// Legacy shim: isPostgresMode always returns true
export const setPostgresMode = () => {};
export const isPostgresMode = () => true;
export const shouldUsePostgres = () => true;