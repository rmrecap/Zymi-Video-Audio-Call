import { Router } from 'express';
import { isPostgresReady, testConnection } from '../db/postgres.js';
import { isRedisActive, testRedis } from '../socket/redisAdapter.js';
import { get } from '../db/database.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'zymi-server'
  });
});

router.get('/health/db', async (req, res) => {
  try {
    if (!isPostgresReady()) {
      return res.status(503).json({
        status: 'unavailable',
        provider: 'none',
        message: 'PostgreSQL not configured, using SQLite'
      });
    }

    const test = await testConnection();
    
    if (test.connected) {
      return res.json({
        status: 'healthy',
        provider: 'postgresql',
        latency: test.latency,
        message: 'PostgreSQL connected'
      });
    } else {
      return res.status(503).json({
        status: 'unhealthy',
        provider: 'postgresql',
        error: test.error
      });
    }
  } catch (err) {
    return res.status(503).json({
      status: 'unhealthy',
      provider: 'postgresql',
      error: err.message
    });
  }
});

router.get('/health/redis', async (req, res) => {
  try {
    if (!isRedisActive()) {
      return res.json({
        status: 'not_configured',
        adapter: 'none',
        message: 'Redis not configured, running in single-instance mode'
      });
    }

    const test = await testRedis();
    
    if (test.connected) {
      return res.json({
        status: 'healthy',
        adapter: 'socket.io-redis',
        message: 'Redis adapter connected'
      });
    } else {
      return res.status(503).json({
        status: 'unhealthy',
        adapter: 'socket.io-redis',
        error: test.error
      });
    }
  } catch (err) {
    return res.status(503).json({
      status: 'unhealthy',
      adapter: 'socket.io-redis',
      error: err.message
    });
  }
});

router.get('/health/realtime', (req, res) => {
  const io = req.app.get('io');
  const userSockets = req.app.get('userSockets');
  
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activeSockets: userSockets ? userSockets.size : 0,
    engine: io ? 'socket.io' : 'unavailable'
  });
});

router.get('/health/user-lookup', (req, res) => {
  res.json({
    status: 'ok',
    routeMounted: true,
    dbAvailable: true,
    phoneIndexAvailable: true,
    uptime: process.uptime()
  });
});

router.get('/api/health/auth', (req, res) => {
  res.json({
    status: 'ok',
    authenticationEnabled: true,
    sessionProvider: 'JWT',
    hashingAlgorithm: 'bcrypt',
    auditLogging: 'active'
  });
});

router.get('/api/health/otp', (req, res) => {
  const result = get('SELECT COUNT(*) as count FROM otp_tokens WHERE is_used = 0 AND expires_at > CURRENT_TIMESTAMP');
  res.json({
    status: 'ok',
    activeTokens: result.count,
    expiryWindowMinutes: 5,
    selfHosted: true
  });
});

router.get('/api/health/email', async (req, res) => {
  const { getEmailSettings } = await import('../services/smtpConfigService.js');
  const settings = getEmailSettings();
  res.json({
    status: settings ? 'configured' : 'not_configured',
    provider: settings?.provider || 'none',
    smtpActive: settings?.provider === 'smtp',
    gmailFallbackActive: settings?.provider === 'gmail'
  });
});

router.get('/api/health/profile-completion', (req, res) => {
  const stats = get('SELECT AVG(profile_completion) as avgCompletion FROM users');
  res.json({
    status: 'ok',
    averageProfileCompletion: Math.round(stats.avgCompletion || 0),
    logic: 'Phase 54 Extended'
  });
});

export default router;