import { getRedisClient } from '../socket/redisAdapter.js';

export const sessionGuard = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { jti, sub: userId } = req.user; // sub is userId in standard JWT
    const redisClient = getRedisClient();

    if (redisClient) {
        // Root: Check if this specific session instance is blacklisted
        if (jti) {
            try {
                const isRevoked = await redisClient.sIsMember('zymi:revoked_sessions', String(jti));
                if (isRevoked) {
                    return res.status(401).json({ error: 'Session Revoked. Please login again.' });
                }
            } catch (err) {
                console.error('[SESSION_GUARD] Redis sIsMember error:', err);
            }
        }

        // Check if user is globally banned
        if (userId) {
            try {
                const userStatus = await redisClient.get(`zymi:ban_status:${userId}`);
                if (userStatus === 'BANNED') {
                    return res.status(403).json({ error: 'Account Globally Suspended.' });
                }
            } catch (err) {
                console.error('[SESSION_GUARD] Redis get error:', err);
            }
        }
    }

    next();
};
