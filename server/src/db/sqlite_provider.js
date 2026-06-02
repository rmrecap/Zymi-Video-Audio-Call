/**
 * sqlite_provider.js — Lazy SQLite fallback (only used when PostgreSQL is unavailable)
 * Uses lazy initialization to avoid native module crashes on Node.js version mismatch.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _require = createRequire(import.meta.url);

let sqliteDb = null;

function getDb() {
  if (sqliteDb) return sqliteDb;
  try {
    const Database = _require('better-sqlite3');
    const dbPath = path.join(__dirname, '../../zymi.db');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'user',
        is_banned INTEGER DEFAULT 0,
        profile_completion INTEGER DEFAULT 40,
        token_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN password_hash TEXT"); } catch (e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN email TEXT"); } catch (e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN profile_completion INTEGER DEFAULT 40"); } catch (e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1"); } catch (e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP"); } catch (e) {}

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        action TEXT NOT NULL,
        target_user_id INTEGER,
        details TEXT,
        ip_address TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[SQLITE] SQLite fallback initialized');
    return sqliteDb;
  } catch (err) {
    console.error('[SQLITE] better-sqlite3 not available:', err.message);
    console.warn('[SQLITE] SQLite fallback disabled. PostgreSQL required for database operations.');
    return null;
  }
}

const convertSql = (sql) => {
  return sql.replace(/\$(\d+)/g, (match, num) => '?');
};

export const db = {
  get: (sql, ...params) => {
    const d = getDb();
    if (!d) throw new Error('SQLite not available');
    const convertedSql = convertSql(sql);
    const stmt = d.prepare(convertedSql);
    return stmt.get(...params.flat());
  },

  all: (sql, ...params) => {
    const d = getDb();
    if (!d) throw new Error('SQLite not available');
    const convertedSql = convertSql(sql);
    const stmt = d.prepare(convertedSql);
    return stmt.all(...params.flat());
  },

  run: (sql, ...params) => {
    const d = getDb();
    if (!d) throw new Error('SQLite not available');
    const convertedSql = convertSql(sql);
    const stmt = d.prepare(convertedSql);
    const res = stmt.run(...params.flat());
    return {
      lastID: res.lastInsertRowid,
      changes: res.changes
    };
  }
};
