import { getRedisClient } from './redisAdapter.js';
import Redlock from 'redlock';
import { get, all, run } from '../db/postgres.js';

class UserSocketRegistry {
  constructor() {
    this.keyPrefix = 'user_sockets:';
    this.localMap = new Map(); // Fallback when Redis is not available
    this._redlock = null;
  }

  get redlock() {
    if (!this._redlock && this.redis) {
      this._redlock = new Redlock([this.redis], {
        driftFactor: 0.01,
        retryCount: 3,
        retryDelay: 200,
        retryJitter: 50
      });
    }
    return this._redlock;
  }

  get redis() {
    return getRedisClient();
  }

  async register(userId, socketId, type = 'UI') {
    const normalizedUserId = String(userId);
    const client = this.redis;
    const value = JSON.stringify({ sid: socketId, ts: Date.now() });

    if (client) {
      const lockKey = `locks:registry:${normalizedUserId}`;
      let lock = null;
      const t0 = Date.now();
      try {
        if (this.redlock) lock = await this.redlock.acquire([lockKey], 1000);
        const waitTime = Date.now() - t0;
        if (waitTime > 10) console.log(`[REGISTRY] Telemetry: lock_wait_time=${waitTime}ms for user ${normalizedUserId}`);
        const key = `${this.keyPrefix}${normalizedUserId}`;
        await client.hSet(key, type, value);
        await client.expire(key, 86400); // 24h persistence
      } finally {
        if (lock) await lock.release().catch(() => {});
      }
    } else {
      if (!this.localMap.has(normalizedUserId)) {
        this.localMap.set(normalizedUserId, {});
      }
      this.localMap.get(normalizedUserId)[type] = value;
      this._pgSave(normalizedUserId, type, value);
    }
  }

  async getSocket(userId, preferredType = 'UI') {
    const normalizedUserId = String(userId);
    const client = this.redis;
    let sockets = {};

    if (client) {
      const key = `${this.keyPrefix}${normalizedUserId}`;
      sockets = await client.hGetAll(key);
    } else {
      sockets = this.localMap.get(normalizedUserId) || {};
    }

    const dataStr = sockets[preferredType] || sockets['BACKGROUND'];
    if (!dataStr) return null;
    try {
      const { sid } = JSON.parse(dataStr);
      return sid;
    } catch {
      return dataStr; // Fallback for legacy format
    }
  }

  async remove(userId, type) {
    const normalizedUserId = String(userId);
    const client = this.redis;
    if (client) {
      const key = `${this.keyPrefix}${normalizedUserId}`;
      await client.hDel(key, type);
      // Auto-clean key if no sockets remain
      const remaining = await client.hLen(key);
      if (remaining === 0) await client.del(key);
    } else {
      const sockets = this.localMap.get(normalizedUserId);
      if (sockets) {
        delete sockets[type];
        if (Object.keys(sockets).length === 0) {
          this.localMap.delete(normalizedUserId);
        }
      }
      this._pgDelete(normalizedUserId, type);
    }
  }

  /**
   * Atomic logout purge — deletes ALL socket entries for a user (UI + BACKGROUND).
   * Must be called during the logout flow to prevent ghost registry entries.
   */
  async purgeUser(userId) {
    const normalizedUserId = String(userId);
    const client = this.redis;
    if (client) {
      await client.del(`${this.keyPrefix}${normalizedUserId}`);
    } else {
      this.localMap.delete(normalizedUserId);
      await run('DELETE FROM user_socket_registry WHERE user_id = $1', [normalizedUserId]);
    }
    console.log(`[REGISTRY] Purged all sockets for user ${normalizedUserId}`);
  }

  async registerBatch(entries) {
    const client = this.redis;
    if (client) {
      // Group by userId to acquire locks correctly, or bypass locks for batching for speed
      // But to be fail-safe, we just use the pipeline without locks if it's a true burst,
      // or we can lock each user. For mass burst, pipeline is best.
      const pipeline = client.multi();
      for (const { userId, socketId, type } of entries) {
        pipeline.hSet(`${this.keyPrefix}${userId}`, type, JSON.stringify({ sid: socketId, ts: Date.now() }));
      }
      await pipeline.exec();
    } else {
      for (const { userId, socketId, type } of entries) {
        await this.register(userId, socketId, type);
      }
    }
  }

  async reapZombieSockets(io) {
    const client = this.redis;
    if (client) {
      // Trunk Resilience: Cross-reference Redis with actual Socket.io instance
      const allUsers = await client.keys(`${this.keyPrefix}*`);
      const now = Date.now();
      for (const userKey of allUsers) {
        const sockets = await client.hGetAll(userKey);
        for (const [type, dataStr] of Object.entries(sockets)) {
          let sid = dataStr;
          let ts = 0;
          try {
            const parsed = JSON.parse(dataStr);
            sid = parsed.sid;
            ts = parsed.ts || 0;
          } catch (e) {
            // legacy format
          }

          // Trunk Collision: 5-second grace period for fresh connections
          if (now - ts > 5000 && !io.sockets.sockets.has(sid)) {
            await client.hDel(userKey, type); // Clean stale entry
            cleanupCount++;
          }
        }
      }
      if (cleanupCount > 0) {
        console.log(`[REAPER] Telemetry: reaper_cleanup_count=${cleanupCount}`);
      }
    }
  }

  /**
   * Persist a socket entry to PostgreSQL when Redis is unavailable.
   */
  async _pgSave(userId, type, value) {
    try {
      await run(
        `INSERT INTO user_socket_registry (user_id, socket_type, data, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, socket_type)
         DO UPDATE SET data = $3, updated_at = CURRENT_TIMESTAMP`,
        [userId, type, value]
      );
    } catch (err) {
      console.warn('[REGISTRY] PG save failed:', err.message);
    }
  }

  /**
   * Remove a socket entry from PostgreSQL when Redis is unavailable.
   */
  async _pgDelete(userId, type) {
    try {
      await run(
        'DELETE FROM user_socket_registry WHERE user_id = $1 AND socket_type = $2',
        [userId, type]
      );
    } catch (err) {
      console.warn('[REGISTRY] PG delete failed:', err.message);
    }
  }

  /**
   * Load all socket entries from PostgreSQL on startup (Redis fallback).
   * Called once during server boot to restore session state.
   */
  async pgRestoreAll() {
    try {
      const rows = await all('SELECT * FROM user_socket_registry');
      for (const row of rows) {
        const uid = String(row.user_id);
        if (!this.localMap.has(uid)) {
          this.localMap.set(uid, {});
        }
        this.localMap.get(uid)[row.socket_type] = row.data;
      }
      console.log(`[REGISTRY] Restored ${rows.length} socket entries from PostgreSQL fallback`);
      return rows.length;
    } catch (err) {
      console.warn('[REGISTRY] PG restore failed:', err.message);
      return 0;
    }
  }
}

export const registry = new UserSocketRegistry();

// Keep backward compatibility for other modules if needed
export function getUserSocketRegistry() {
  return registry;
}
export { UserSocketRegistry };