/**
 * db_provider.js — SQLite wrapper (PostgreSQL removed for compatibility)
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../zymi.db');
const sqliteDb = new Database(dbPath);
sqliteDb.pragma('journal_mode = WAL');

// Ensure schema exists (simplified)
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

// Add missing columns if they don't exist (better-sqlite3 doesn't have IF NOT EXISTS for ALTER TABLE)
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN password_hash TEXT"); } catch (e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN email TEXT"); } catch (e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN profile_completion INTEGER DEFAULT 40"); } catch (e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1"); } catch (e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP"); } catch (e) {}

// Ensure other tables exist for audit logging etc
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

// Convert PostgreSQL $1, $2 to SQLite ?
const convertSql = (sql) => {
  return sql.replace(/\$(\d+)/g, (match, num) => '?');
};

export const db = {
  get: (sql, ...params) => {
    const convertedSql = convertSql(sql);
    const stmt = sqliteDb.prepare(convertedSql);
    return stmt.get(...params.flat());
  },

  all: (sql, ...params) => {
    const convertedSql = convertSql(sql);
    const stmt = sqliteDb.prepare(convertedSql);
    return stmt.all(...params.flat());
  },

  run: (sql, ...params) => {
    const convertedSql = convertSql(sql);
    const stmt = sqliteDb.prepare(convertedSql);
    const res = stmt.run(...params.flat());
    return {
      lastID: res.lastInsertRowid,
      changes: res.changes
    };
  }
};
