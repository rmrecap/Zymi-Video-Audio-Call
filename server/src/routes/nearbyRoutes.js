import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { sessionGuard } from '../middleware/sessionGuard.js';
import { get, all, run } from '../db/postgres.js';
import * as featureFlagService from '../services/featureFlagService.js';
import { getRedisClient } from '../socket/redisAdapter.js';

const router = express.Router();

const checkNearbyEnabled = async (userId) => {
  const redisClient = getRedisClient();
  if (redisClient) {
    try {
      const val = await redisClient.hGet('zymi:features', 'nearby_enabled');
      if (val === 'false') return false;
      if (val === 'true') return true;
    } catch (e) {
      console.error('[NEARBY] Redis error checking feature flag:', e);
    }
  }
  return await featureFlagService.checkFeatureAccess({
    featureKey: 'nearby_enabled',
    userId
  });
};

// GET /api/nearby/users
router.get('/users', requireAuth, sessionGuard, async (req, res) => {
  try {
    const isEnabled = await checkNearbyEnabled(req.user.id);
    if (!isEnabled) {
      return res.status(403).json({ error: 'Nearby discovery feature is currently disabled.' });
    }

    const { lat, lng } = req.query;
    
    // Fetch dynamic config from Redis cache (mirrored from database settings)
    const redisClient = getRedisClient();
    let radiusMeters = 10000; // default 10km
    let fuzzingFactor = 0.001;
    let privacyMode = 'NORMAL';

    if (redisClient) {
      try {
        const config = await redisClient.hGetAll('zymi:config:nearby');
        if (config && config.radius) radiusMeters = parseInt(config.radius, 10);
        if (config && config.fuzzing) fuzzingFactor = parseFloat(config.fuzzing);
        if (config && config.privacy_mode) privacyMode = config.privacy_mode;
      } catch (err) {
        console.error('[NEARBY] Redis settings load error:', err);
      }
    }

    // Health-Aware PostGIS Query: Sanity check: If fuzzer is disabled, return no data to protect privacy
    if (privacyMode === 'STRICT') {
      return res.json([]);
    }

    // Using PostGIS for high-performance proximity search as defined in ddl.sql (idx_users_location)
    // We filter out the current user, banned users, invisible users, and blocked pairs
    const nearbyUsers = await all(`
      SELECT 
        u.id, u.username, u.avatar, 
        ST_X(u.location::geometry) as lng, 
        ST_Y(u.location::geometry) as lat,
        ST_Distance(u.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance_meters
      FROM users u
      LEFT JOIN nearby_visibility nv ON nv.user_id = u.id
      LEFT JOIN user_location_preferences ulp ON ulp.user_id = u.id
      WHERE u.id != $3
      AND u.is_banned = FALSE
      AND (nv.is_active IS NULL OR nv.is_active = TRUE)
      AND (ulp.discovery_enabled IS NULL OR ulp.discovery_enabled = TRUE)
      AND u.location IS NOT NULL
      AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint($1, $2), 4326), $4)
      AND u.id NOT IN (
        SELECT blocked_id FROM blocked_users WHERE blocker_id = $3
        UNION
        SELECT blocker_id FROM blocked_users WHERE blocked_id = $3
      )
      ORDER BY distance_meters ASC
    `, lng || 0, lat || 0, req.user.id, radiusMeters);

    // Seeded pseudo-random offset using target user ID to prevent triangulation/drift
    const seedOffset = (userId, factor) => {
      const valX = Math.sin(userId * 12345.6789) * 10000;
      const valY = Math.cos(userId * 98765.4321) * 10000;
      const dx = (valX - Math.floor(valX) - 0.5) * factor;
      const dy = (valY - Math.floor(valY) - 0.5) * factor;
      return { dx, dy };
    };

    // Apply Admin-controlled location fuzzing & format
    const fuzzedPeers = nearbyUsers.map(u => {
      const offset = seedOffset(u.id, fuzzingFactor);
      const fuzzedLat = parseFloat(u.lat) + offset.dy;
      const fuzzedLng = parseFloat(u.lng) + offset.dx;
      const distanceKm = u.distance_meters / 1000;
      return {
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        lat: fuzzedLat,
        lng: fuzzedLng,
        distance: distanceKm,
        distanceLabel: distanceKm < 1 ? 'Nearby' : `${distanceKm.toFixed(1)} km away`
      };
    });

    res.json(fuzzedPeers);
  } catch (error) {
    console.error('[NEARBY] Error fetching users:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nearby - alias to support /api/nearby direct endpoint if needed
router.get('/', requireAuth, sessionGuard, async (req, res) => {
  req.url = '/users';
  router.handle(req, res);
});

// POST /api/nearby/update-location
router.post('/update-location', requireAuth, sessionGuard, async (req, res) => {
  try {
    const isEnabled = await checkNearbyEnabled(req.user.id);
    if (!isEnabled) {
      return res.status(403).json({ error: 'Nearby discovery feature is currently disabled.' });
    }

    const { lat, lng } = req.body;
    
    // Update user's location using PostGIS Point geometry
    await run(`
      UPDATE users 
      SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
          last_location_update = NOW()
      WHERE id = $3
    `, lng, lat, req.user.id);

    // Ensure nearby_visibility row exists
    await run(`
      INSERT INTO nearby_visibility (user_id, lat, lng, is_active, last_seen)
      VALUES ($1, $2, $3, TRUE, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        lat = $2, lng = $3, is_active = TRUE, last_seen = NOW()
    `, req.user.id, lat, lng);

    // Ensure user_location_preferences row exists
    await run(`
      INSERT INTO user_location_preferences (user_id, discovery_enabled, radius_km)
      VALUES ($1, TRUE, 10)
      ON CONFLICT (user_id) DO NOTHING
    `, req.user.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
