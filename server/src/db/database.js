import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

const getDataDir = () => {
  return process.env.DB_DATA_DIR || path.join(__dirname, '..');
};

const ensureDataDir = () => {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
};

export const initDatabase = (dbName = 'zymi.db') => {
  if (db) return db;
  
  const dataDir = ensureDataDir();
  // Security: Prevent path traversal by using path.basename
  const safeDbName = path.basename(dbName);
  const dbPath = path.join(dataDir, safeDbName);
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  console.log('[DB] Database path:', dbPath);
  console.log('[DB] Data directory:', dataDir);
  
  return db;
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
  }
};

export const prepare = (sql) => getDatabase().prepare(sql);
export const exec = (sql) => getDatabase().exec(sql);
export const get = (sql, ...params) => prepare(sql).get(...params);
export const all = (sql, ...params) => prepare(sql).all(...params);
export const run = (sql, ...params) => prepare(sql).run(...params);