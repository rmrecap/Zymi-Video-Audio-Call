import crypto from 'crypto';
import { run } from '../db/postgres.js';
import { getRedisClient } from './redisAdapter.js';

export const setupAdminSocket = (io) => {
  io.on('connection', async (socket) => {
    // Auto-send current policy state on connection
    try {
      const redisClient = getRedisClient();
      if (redisClient) {
        const features = await redisClient.hGetAll('zymi:features');
        const nearbyConfig = await redisClient.hGetAll('zymi:config:nearby');
        socket.emit('policy-sync', {
          features,
          nearbyConfig
        });
      }
    } catch (err) {
      console.error('[ADMIN_SOCKET] Error sync policy on connect:', err.message);
    }

    // Server side: Track policy updates
    socket.on('admin-policy-update', async (policy) => {
      const updateId = crypto.randomUUID();
      io.emit('policy-update', { ...policy, updateId });
    });

    // Handle manual policy-fetch from client
    socket.on('policy-fetch', async () => {
      try {
        const redisClient = getRedisClient();
        if (redisClient) {
          const features = await redisClient.hGetAll('zymi:features');
          const nearbyConfig = await redisClient.hGetAll('zymi:config:nearby');
          socket.emit('policy-sync', {
            features,
            nearbyConfig
          });
        }
      } catch (err) {
        console.error('[ADMIN_SOCKET] Error processing policy-fetch:', err.message);
      }
    });

    socket.on('policy-ack', async (ack) => {
      // Audit the acknowledgment for the ZRCS dashboard
      try {
        await run(
          'INSERT INTO audit_logs (log_type, data) VALUES ($1, $2)',
          ['POLICY_ACK', JSON.stringify(ack)]
        );
        console.log(`[ADMIN_SOCKET] Audited policy-ack for update ${ack.updateId} from device ${ack.deviceId}`);
      } catch (err) {
        console.error('[ADMIN_SOCKET] Error auditing policy-ack:', err.message);
      }
    });
  });
};
