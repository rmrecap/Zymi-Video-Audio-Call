import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as gamificationService from '../services/gamificationService.js';

const router = Router();

router.get('/points', requireAuth, async (req, res) => {
  try {
    const points = await gamificationService.getPoints(req.user.id);
    res.json(points);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/badges', requireAuth, async (req, res) => {
  try {
    const badges = await gamificationService.getBadges();
    const userBadges = await gamificationService.getUserBadges(req.user.id);
    res.json({ all: badges, earned: userBadges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const achievements = await gamificationService.getAchievements(req.user.id);
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const leaderboard = await gamificationService.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
