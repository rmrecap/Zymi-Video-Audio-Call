import pg from 'pg';
import os from 'os';
import { config, isProduction } from '../config/env.js';

let sqlite = null;
try {
  sqlite = (await import('./sqlite_provider.js')).db;
} catch (e) {
  console.warn('[POSTGRES] SQLite fallback not available:', e.message);
}

const { Pool } = pg;

let pool = null;

/**
 * Safely parse a PostgreSQL connection string by manually deconstructing
 * the URI segments. This avoids Node's URL parser and pg-connection-string,
 * both of which choke on unencoded special characters in the password
 * (e.g. }, @, !, #, $, %, ?, &, =).
 *
 * Expected format:
 *   postgresql://user:password@host:port/database?sslmode=require
 *
 * Returns a config object suitable for `new pg.Pool(config)`.
 */
const buildPoolConfig = (connectionString, maxPoolSize) => {
  // Strip query parameters (everything after ?) — we handle SSL separately
  const [cleanUri] = connectionString.split('?');

  const protocolSep = '://';
  const protocolIdx = cleanUri.indexOf(protocolSep);
  if (protocolIdx === -1) throw new Error('Missing protocol separator ://');

  const remainder = cleanUri.substring(protocolIdx + protocolSep.length);

  // Split on the LAST '@' to separate credentials from host+db
  const atIdx = remainder.lastIndexOf('@');
  if (atIdx === -1) throw new Error('Missing @ separator between credentials and host');

  const credentials = remainder.substring(0, atIdx);
  const hostDbPart = remainder.substring(atIdx + 1);

  // Credentials: user:password
  const colonIdx = credentials.indexOf(':');
  if (colonIdx === -1) throw new Error('Missing : separator between user and password');

  const user = decodeURIComponent(credentials.substring(0, colonIdx));
  // Password: everything after the first colon (passwords can contain colons)
  const password = credentials.substring(colonIdx + 1);

  // Host+DB: host:port/database
  const slashIdx = hostDbPart.indexOf('/');
  if (slashIdx === -1) throw new Error('Missing / separator between host:port and database');

  const hostPort = hostDbPart.substring(0, slashIdx);
  const database = hostDbPart.substring(slashIdx + 1);

  // Host may be IPv6 when wrapped in brackets: [::1]:port
  let host = hostPort;
  let port = 5432;
  if (hostPort.startsWith('[')) {
    const closeBracket = hostPort.indexOf(']');
    host = hostPort.substring(1, closeBracket);
    const afterBracket = hostPort.substring(closeBracket + 1);
    if (afterBracket.startsWith(':')) {
      port = parseInt(afterBracket.substring(1), 10) || 5432;
    }
  } else {
    const portIdx = hostPort.lastIndexOf(':');
    if (portIdx !== -1) {
      host = hostPort.substring(0, portIdx);
      port = parseInt(hostPort.substring(portIdx + 1), 10) || 5432;
    }
  }

  // Check for sslmode=require in the original query string
  const queryIdx = connectionString.indexOf('?');
  const params = queryIdx !== -1 ? connectionString.substring(queryIdx + 1) : '';
  const hasSsl = params.includes('sslmode=require') || params.includes('sslmode=prefer') || params.includes('sslmode=verify-full');

  console.log(`[POSTGRES] Connection config built via safe manual parsing — host=${host} port=${port} database=${database} user=${user} ssl=${hasSsl}`);

  return {
    user,
    password,
    host,
    port,
    database,
    max: maxPoolSize,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: hasSsl ? { rejectUnauthorized: false } : false,
  };
};

export const initPostgres = () => {
  if (!config.databaseUrl) {
    if (isProduction()) {
      throw new Error('DATABASE_URL is required in production');
    }
    console.warn('[POSTGRES] DATABASE_URL not set, falling back to SQLite');
    return null;
  }

  // Calculate pool size based on available CPU cores and PM2 cluster size,
  // capped to avoid exhausting Supabase free tier (max 15 connections).
  const cpuCount = os.cpus().length;
  const globalMaxConnections = 250;
  const instances = parseInt(process.env.NODE_APP_INSTANCE_COUNT || cpuCount.toString(), 10);
  const safePoolSize = Math.floor(globalMaxConnections / instances) - 5;
  const calculatedSize = safePoolSize > 10 ? safePoolSize : 20;
  const maxPoolSize = Math.min(calculatedSize, parseInt(process.env.DATABASE_POOL_MAX || '10', 10));

  console.log(`[POSTGRES] Calculating pool size. CPUs: ${cpuCount}, Instances: ${instances}, Safe Pool Size: ${safePoolSize}, Using max pool size: ${maxPoolSize}`);

  // Build pool config manually to handle special characters in the password
  // that would break Node's URL parser or pg-connection-string (ERR_INVALID_URL).
  let poolConfig;
  try {
    poolConfig = buildPoolConfig(config.databaseUrl, maxPoolSize);
  } catch (parseError) {
    console.error('[POSTGRES] Manual parsing failed, falling back to connectionString:', parseError.message);
    poolConfig = {
      connectionString: config.databaseUrl,
      max: maxPoolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    };
  }

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('[POSTGRES] Unexpected error on idle client', err);
  });

  console.log('[POSTGRES] Connection pool initialized');
  return pool;
};

export const getPostgresPool = () => {
  return pool;
};

export const isPostgresReady = () => pool !== null;

export const query = async (text, params) => {
  if (!pool) {
    // Fallback to SQLite
    const start = Date.now();
    const isGet = text.trim().toUpperCase().startsWith('SELECT');
    let rows = [];
    if (isGet) {
        rows = sqlite.all(text, params || []);
    } else {
        const res = sqlite.run(text, params || []);
        rows = res.lastID ? [{ id: res.lastID }] : [];
    }
    const duration = Date.now() - start;
    console.log('[SQLITE] Executed query', { text: text.substring(0, 50), duration, rows: rows.length });
    return { rows, rowCount: rows.length };
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params || []);
    const duration = Date.now() - start;
    console.log('[POSTGRES] Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('[POSTGRES] Query error:', err.message, { text });
    throw err;
  }
};

const noopResult = () => ({ rows: [], rowCount: 0, lastID: null, changes: 0 });

export const get = async (text, ...params) => {
  const flattenedParams = params.flat();
  if (!pool) {
    if (!sqlite) return null;
    return sqlite.get(text, flattenedParams);
  }
  const res = await query(text, flattenedParams);
  return res.rows[0] || null;
};

export const all = async (text, ...params) => {
  const flattenedParams = params.flat();
  if (!pool) {
    if (!sqlite) return [];
    return sqlite.all(text, flattenedParams);
  }
  const res = await query(text, flattenedParams);
  return res.rows;
};

export const run = async (text, ...params) => {
  const flattenedParams = params.flat();
  if (!pool) {
    if (!sqlite) return noopResult();
    return sqlite.run(text, flattenedParams);
  }
  const res = await query(text, flattenedParams);
  return {
    lastID: res.rows[0]?.id || null,
    changes: res.rowCount
  };
};

export const exec = async (text) => {
  if (!pool) {
    if (!sqlite) return noopResult();
    return sqlite.run(text);
  }
  return query(text);
};

/**
 * Runs a set of operations within a transaction.
 */
export const withTransaction = async (callback) => {
  if (!pool) {
    throw new Error('PostgreSQL not initialized. Transactions require PostgreSQL.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const helpers = {
      run: async (sql, params = []) => {
        const res = await client.query(sql, params);
        return { lastID: res.rows[0]?.id || null, changes: res.rowCount };
      },
      get: async (sql, params = []) => {
        const res = await client.query(sql, params);
        return res.rows[0];
      },
      all: async (sql, params = []) => {
        const res = await client.query(sql, params);
        return res.rows;
      },
      exec: async (sql) => {
        await client.query(sql);
      }
    };
    
    const result = await callback(helpers);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getClient = async () => {
  if (!pool) {
    throw new Error('PostgreSQL not initialized');
  }
  return pool.connect();
};

export const closePostgres = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[POSTGRES] Connection pool closed');
  }
};

export const testConnection = async () => {
  if (!pool) {
    return { connected: false, error: 'Pool not initialized' };
  }
  try {
    const result = await pool.query('SELECT 1 as test');
    return { connected: true, latency: result.duration || 0 };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};