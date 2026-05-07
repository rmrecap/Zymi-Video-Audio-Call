import pg from 'pg';
import { config, isProduction } from '../config/env.js';

const { Pool } = pg;

let pool = null;

export const initPostgres = () => {
  if (!config.databaseUrl) {
    if (isProduction()) {
      throw new Error('DATABASE_URL is required in production');
    }
    console.warn('[POSTGRES] DATABASE_URL not set, PostgreSQL not available');
    return null;
  }

  pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('[POSTGRES] Unexpected error on idle client', err);
  });

  console.log('[POSTGRES] Connection pool initialized');
  return pool;
};

export const getPostgresPool = () => {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized. Call initPostgres() first.');
  }
  return pool;
};

export const isPostgresReady = () => pool !== null;

export const query = async (text, params) => {
  if (!pool) {
    throw new Error('PostgreSQL not initialized');
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[POSTGRES] Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('[POSTGRES] Query error:', err.message, { text });
    throw err;
  }
};

export const get = async (text, params) => {
  const res = await query(text, params);
  return res.rows[0] || null;
};

export const all = async (text, params) => {
  const res = await query(text, params);
  return res.rows;
};

export const run = async (text, params) => {
  const res = await query(text, params);
  return {
    lastID: res.rows[0]?.id || null,
    changes: res.rowCount
  };
};

export const exec = async (text) => {
  return query(text);
};

/**
 * Runs a set of operations within a transaction.
 */
export const withTransaction = async (callback) => {
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