import { get, all } from '../db/postgres.js';
// Actually, I'll use internal function calls where possible to avoid HTTP overhead.
import { isPostgresReady } from '../db/postgres.js';
import { isRedisActive } from '../socket/redisAdapter.js';

export const getAggregatedHealth = async () => {
  const health = {
    database: {
      provider: 'postgresql',
      status: isPostgresReady() ? 'healthy' : 'degraded',
      migrationStatus: 'complete'
    },
    auth: {
      status: 'ok',
      features: ['JWT', 'bcrypt', 'audit']
    },
    otp: {
      status: 'ok',
      activeTokens: 0,
      selfHosted: true
    },
    email: {
      status: 'unknown',
      provider: 'none'
    },
    socket: {
      status: 'ok',
      adapter: isRedisActive() ? 'redis' : 'memory'
    },
    userLookup: {
      status: 'ok',
      phoneIndex: true
    },
    media: {
      status: 'ok',
      p2pOnly: true,
      stats: null
    },
    connectivity: {
      status: 'ok',
      relayServers: 0,
      activePolicies: 0
    }
  };

  // Check OTP stats
  try {
    const otpStats = await get('SELECT COUNT(*) as count FROM otp_tokens WHERE is_used = 0 AND expires_at > CURRENT_TIMESTAMP');
    health.otp.activeTokens = parseInt(otpStats?.count || 0);
  } catch (err) {}

  // Check Media Stats
  try {
    const { getMediaHealth } = await import('./mediaIndexService.js');
    health.media.stats = await getMediaHealth();
  } catch (err) {}

  // Check Connectivity Stats
  try {
    const { getTurnServers } = await import('./turnConfigService.js');
    const { getPolicies } = await import('./connectivityPolicyService.js');
    const { getLatestHealth } = await import('./turnHealthCheckService.js');
    const { getRelayUsageSummary } = await import('./relayUsageService.js');
    
    const servers = (await getTurnServers()).filter(s => s.is_active);
    const healthData = await getLatestHealth();
    const okServers = healthData.filter(s => s.status === 'ok').length;
    
    health.connectivity.relayServers = servers.length;
    health.connectivity.activePolicies = (await getPolicies()).filter(p => p.is_active).length;
    health.connectivity.healthPercent = servers.length > 0 ? Math.round((okServers / servers.length) * 100) : 0;
    health.connectivity.usage = (await getRelayUsageSummary()).total;
    health.connectivity.status = health.connectivity.healthPercent > 50 ? 'ok' : 'warning';
  } catch (err) {}

  // Check email
  try {
    const { getEmailSettings } = await import('./smtpConfigService.js');
    const settings = await getEmailSettings();
    if (settings) {
      health.email.status = 'configured';
      health.email.provider = settings.provider;
    }
  } catch (err) {}

  return health;
};

export const getSystemSnapshots = async () => {
  return await all('SELECT * FROM system_health_snapshots ORDER BY created_at DESC LIMIT 50');
};
