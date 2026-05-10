import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { get, all, run } from '../db/postgres.js';
import * as featureFlagService from '../services/featureFlagService.js';

const router = express.Router();

// GET /api/nearby/users
router.get('/users', requireAuth, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    // Using PostGIS for high-performance proximity search as defined in ddl.sql (idx_users_location)
    // We filter out the current user and banned users
    const nearbyUsers = await all(`
      SELECT 
        id, username, avatar_url as avatar, 
        ST_X(location::geometry) as lng, 
        ST_Y(location::geometry) as lat,
        ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) / 1000 as distance
      FROM users
      WHERE id != $3
      AND is_banned = FALSE
      AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326), $4 * 1000)
      ORDER BY distance ASC
    `, lng || 0, lat || 0, req.user.id, radius);

    res.json(nearbyUsers.map(u => ({
      ...u,
      distanceLabel: u.distance < 1 ? 'Nearby' : `${u.distance.toFixed(1)} km away`
    })));
  } catch (error) {
    console.error('[NEARBY] Error fetching users:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nearby/update-location
router.post('/update-location', requireAuth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    // Update user's location using PostGIS Point geometry
    await db.run(`
      UPDATE users 
      SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
          last_location_update = NOW()
      WHERE id = $3
    `, lng, lat, req.user.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
