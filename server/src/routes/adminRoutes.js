import bcrypt from 'bcryptjs';
import { get, all, run } from '../db/postgres.js';
import { logAudit, getAuditLogs, getAuditStats } from '../services/auditService.js';
import { getMetricsSummary } from '../services/metricsService.js';
import { incrementTokenVersion } from '../services/sessionService.js';
import { requireAdmin, checkPermission, getUserPermissions, USER_ROLES } from '../middleware/authMiddleware.js';
import { getUserSocketRegistry } from '../socket/userSocketRegistry.js';
import { analyzeAdminInsights } from '../services/aiService.js';

let callActivity = { activeCalls: 0, totalCalls: 0, failedCalls: 0 };
let serverStartTime = Date.now();

export const getStats = async (req, res) => {
  try {
    const userCount = await get('SELECT COUNT(*) as count FROM users');
    const messageCount = await get('SELECT COUNT(*) as count FROM messages');
    const today = new Date().toISOString().split('T')[0];
    const messagesToday = await get("SELECT COUNT(*) as count FROM messages WHERE created_at::date = $1", today);
    const callsToday = await get("SELECT COUNT(*) as count FROM call_history WHERE started_at::date = $1", today);
    const activeConnections = req.app.get('userSockets')?.size || 0;
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
    const dbStatus = 'healthy';

    const metrics = getMetricsSummary();

    res.json({
      totalUsers: userCount?.count || 0,
      totalMessages: messageCount?.count || 0,
      messagesToday: messagesToday?.count || 0,
      callsToday: callsToday?.count || 0,
      failedCallsToday: metrics.failedCallsToday,
      activeConnections,
      activeCalls: callActivity.activeCalls,
      totalCalls: callActivity.totalCalls,
      serverUptime: uptime,
      dbStatus,
      metrics
    });
  } catch (err) {
    console.error('[ADMIN] Stats error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
  }
};

export const getUsers = async (req, res) => {
  const { search, includeBanned } = req.query;
  
  let query = `
    SELECT 
      id, username, role, is_banned, banned_at,
      (SELECT COUNT(*) FROM messages WHERE sender_id = users.id) as message_count
    FROM users
  `;
  
  const params = [];
  
  if (!includeBanned) {
    query += ' WHERE is_banned = FALSE';
  }
  
  if (search) {
    query += params.length === 0 ? ' WHERE ' : ' AND ';
    query += 'username ILIKE $1';
    params.push(`%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  
  try {
    const users = await all(query, ...params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const banUser = async (req, res) => {
  const { userId, reason } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  try {
    const user = await get('SELECT * FROM users WHERE id = $1', userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role === 'admin' || user.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot ban admin' });
    }
    
    await run('UPDATE users SET is_banned = TRUE, banned_at = NOW() WHERE id = $1', userId);
    
    logAudit(req.adminUser.id, 'ban_user', userId, reason || 'No reason provided');
    
    const userSockets = req.app.get('userSockets');
    const targetSocketId = userSockets?.get(userId);
    
    if (targetSocketId) {
      const io = req.app.get('io');
      io.to(targetSocketId).emit('banned', { reason: reason || 'Your account has been suspended' });
      userSockets.delete(userId);
    }
    
    res.json({ success: true, message: 'User banned successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

export const unbanUser = async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  try {
    await run('UPDATE users SET is_banned = FALSE, banned_at = NULL WHERE id = $1', userId);
    logAudit(req.adminUser.id, 'unban_user', userId, 'User unbanned');
    res.json({ success: true, message: 'User unbanned successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
};

export const getAudit = async (req, res) => {
  const { limit = 50, adminId, action, startDate, endDate } = req.query;

  let query = `
    SELECT
      a.id,
      a.admin_id,
      a.action,
      a.target_user_id,
      a.details,
      a.ip_address,
      a.created_at as timestamp,
      u.username as admin_username,
      t.username as target_username
    FROM admin_audit_logs a
    LEFT JOIN users u ON a.admin_id = u.id
    LEFT JOIN users t ON a.target_user_id = t.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (adminId) {
    query += ` AND a.admin_id = $${paramIndex++}`;
    params.push(adminId);
  }

  if (action) {
    query += ` AND a.action = $${paramIndex++}`;
    params.push(action);
  }

  if (startDate) {
    query += ` AND a.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND a.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }

  query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex++}`;
  params.push(parseInt(limit));

  try {
    const logs = await all(query, ...params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

export const getRisks = async (req, res) => {
  try {
    const risks = [];
    const recommendations = [];

    const bannedUsers = await get('SELECT COUNT(*) as count FROM users WHERE is_banned = TRUE');
    if (bannedUsers.count > 0) {
      risks.push({ level: 'info', message: `${bannedUsers.count} banned user(s) in system` });
      recommendations.push({ action: 'review_banned_users', description: 'Review banned accounts for potential unbanning or data cleanup' });
    }

    const activeConnections = req.app.get('userSockets')?.size || 0;
    if (activeConnections === 0) {
      risks.push({ level: 'warning', message: 'No active connections' });
      recommendations.push({ action: 'check_server_status', description: 'Verify server is running and accessible' });
    }

    const inactiveUsers = await get(`
      SELECT COUNT(*) as count FROM users
      WHERE id NOT IN (SELECT DISTINCT sender_id FROM messages WHERE created_at > NOW() - INTERVAL '1 day')
      AND id NOT IN (SELECT DISTINCT receiver_id FROM messages WHERE created_at > NOW() - INTERVAL '1 day')
    `);

    if (inactiveUsers.count > 5) {
      risks.push({ level: 'warning', message: `${inactiveUsers.count} users inactive for 24h` });
      recommendations.push({ action: 'engage_inactive_users', description: 'Consider sending notification or checking user retention' });
    }

    const metrics = getMetricsSummary();
    if (metrics.failedCallsToday > 10) {
      risks.push({ level: 'warning', message: `High failed call count: ${metrics.failedCallsToday}` });
      recommendations.push({ action: 'investigate_call_failures', description: 'Check network connectivity, STUN servers, and WebRTC configuration' });
    }

    if (metrics.bannedAttempts > 5) {
      risks.push({ level: 'warning', message: `High banned user connection attempts: ${metrics.bannedAttempts}` });
      recommendations.push({ action: 'review_security', description: 'Consider implementing rate limiting or IP blocking' });
    }

    // Table status check for PostgreSQL
    const tableCheck = await all("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tableNames = tableCheck.map(t => t.table_name);
    const requiredTables = ['users', 'messages', 'admin_audit_logs', 'call_history', 'blocked_users', 'message_reports'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    if (missingTables.length > 0) {
      risks.push({ level: 'critical', message: `Missing database tables: ${missingTables.join(', ')}` });
      recommendations.push({ action: 'run_migrations', description: 'Execute database migrations to create missing tables' });
    }

    res.json({ risks, recommendations });
  } catch (err) {
    console.error('[ADMIN] Risks error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch risks', details: err.message });
  }
};

export const getPermissions = (req, res) => {
  const role = req.adminUser.role;
  const permissions = getUserPermissions(role);
  res.json({ role, permissions, allRoles: Object.values(USER_ROLES) });
};

export const updateUserRole = async (req, res) => {
  const { userId, newRole } = req.body;
  
  if (!userId || !newRole) {
    return res.status(400).json({ error: 'User ID and role required' });
  }
  
  try {
    const user = await get('SELECT * FROM users WHERE id = $1', userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot modify super_admin role' });
    }
    
    if (req.adminUser.role !== 'super_admin' && newRole === 'super_admin') {
      return res.status(403).json({ error: 'Only super_admin can assign super_admin role' });
    }
    
    await run('UPDATE users SET role = $1 WHERE id = $2', newRole, userId);
    logAudit(req.adminUser.id, 'role_change', userId, `Changed role from ${user.role} to ${newRole}`);
    res.json({ success: true, message: 'Role updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    const admin = await get('SELECT * FROM users WHERE id = $1', req.adminUser.id);

    const adminStoredHash = admin.password_hash || admin.password;
    if (!admin || !adminStoredHash || !bcrypt.compareSync(currentPassword, adminStoredHash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = bcrypt.hashSync(newPassword, 12);
    await run('UPDATE users SET password_hash = $1 WHERE id = $2', hash, req.adminUser.id);

    incrementTokenVersion(req.adminUser.id);
    logAudit(req.adminUser.id, 'password_change', req.adminUser.id, 'Admin changed password');

    const userSockets = req.app.get('userSockets');
    const io = req.app.get('io');
    const socketId = userSockets?.get(String(req.adminUser.id));
    if (socketId && io) {
      io.to(socketId).emit('force-logout', { reason: 'Password changed. Please log in again.' });
      userSockets.delete(req.adminUser.id);
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const getMigrationStatus = async (req, res) => {
  try {
    const migrations = [];
    const tableCheck = await all("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tableNames = tableCheck.map(t => t.table_name);
    
    migrations.push({ name: 'users table', exists: tableNames.includes('users') });
    migrations.push({ name: 'messages table', exists: tableNames.includes('messages') });
    migrations.push({ name: 'admin_audit_logs table', exists: tableNames.includes('admin_audit_logs') });
    
    if (tableNames.includes('users')) {
      const userCols = await all("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
      const colNames = userCols.map(c => c.column_name);
      migrations.push({ name: 'users.role column', exists: colNames.includes('role') });
      migrations.push({ name: 'users.is_banned column', exists: colNames.includes('is_banned') });
    }
    
    res.json(migrations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch migration status' });
  }
};

export const exportData = async (req, res) => {
  const format = req.query.format || 'json';
  const allowedTables = ['users', 'messages', 'call_history', 'admin_audit_logs', 'message_reports', 'blocked_users'];
  const data = {};

  for (const table of allowedTables) {
    try {
      const rows = await all(`SELECT * FROM ${table}`);
      data[table] = rows.map(row => {
        const sanitized = { ...row };
        if (table === 'users') {
          delete sanitized.password_hash;
          delete sanitized.token_version;
        }
        return sanitized;
      });
    } catch (err) {
      data[table] = [{ error: 'Could not read table' }];
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const filename = `zymi_backup_${timestamp}`;

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    let csv = '';
    for (const table of Object.keys(data)) {
      csv += `\n# TABLE: ${table}\n`;
      const rows = data[table];
      if (Array.isArray(rows) && rows.length > 0) {
        const headers = Object.keys(rows[0]);
        csv += headers.join(',') + '\n';
        rows.forEach(row => {
          csv += headers.map(h => JSON.stringify(row[h] ?? '')).join(',') + '\n';
        });
      }
    }
    res.send(csv);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json({ exportedAt: new Date().toISOString(), version: '1.0', data });
  }

  logAudit(req.adminUser.id, 'data_export', null, `Exported data in ${format} format`);
};

export const getMessageHealth = async (req, res) => {
  try {
    const totalMessages = (await get('SELECT COUNT(*) as count FROM messages')).count;
    const messagesToday = (await get("SELECT COUNT(*) as count FROM messages WHERE created_at::date = CURRENT_DATE")).count;
    const messagesLast7Days = (await get("SELECT COUNT(*) as count FROM messages WHERE created_at > NOW() - INTERVAL '7 days'")).count;
    const reportedMessages = (await get('SELECT COUNT(*) as count FROM message_reports')).count;

    const blockedMessageRisk = (await get(`
      SELECT COUNT(*) as count FROM messages
      WHERE sender_id IN (SELECT id FROM users WHERE is_banned = TRUE)
      OR receiver_id IN (SELECT id FROM users WHERE is_banned = TRUE)
    `)).count;

    const persistenceStatus = 'healthy';
    const latestMessage = await get('SELECT MAX(created_at) as latest FROM messages');
    const latestMessageAt = latestMessage.latest;

    const healthScore = totalMessages > 0 ? Math.max(0, 100 - Math.round((parseInt(reportedMessages) / parseInt(totalMessages)) * 100)) : 100;

    const warnings = [];
    if (parseInt(blockedMessageRisk) > 0) {
      warnings.push(`${blockedMessageRisk} messages involve banned users`);
    }

    res.json({
      totalMessages: parseInt(totalMessages),
      messagesToday: parseInt(messagesToday),
      messagesLast7Days: parseInt(messagesLast7Days),
      reportedMessages: parseInt(reportedMessages),
      blockedMessageRisk: parseInt(blockedMessageRisk),
      persistenceStatus,
      latestMessageAt,
      healthScore,
      warnings
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch message health', details: err.message });
  }
};

export const getCallHealth = async (req, res) => {
  try {
    const totalCallsResult = await get('SELECT COUNT(*) as count FROM call_history');
    const totalCalls = totalCallsResult?.count || 0;
    
    const callsTodayResult = await get("SELECT COUNT(*) as count FROM call_history WHERE started_at::date = CURRENT_DATE");
    const callsToday = callsTodayResult?.count || 0;

    const callsLast7DaysResult = await get("SELECT COUNT(*) as count FROM call_history WHERE started_at > NOW() - INTERVAL '7 days'");
    const callsLast7Days = callsLast7DaysResult?.count || 0;

    const failedCallsTodayResult = await get("SELECT COUNT(*) as count FROM admin_audit_logs WHERE action = 'call_failed' AND created_at::date = CURRENT_DATE");
    const failedCallsToday = failedCallsTodayResult?.count || 0;

    const callActivity = req.app.get('callActivity') || { activeCalls: 0 };
    const activeCalls = callActivity.activeCalls || 0;

    let averageCallDuration = 0;
    const avgResult = await get('SELECT AVG(duration) as avg FROM call_history WHERE duration IS NOT NULL AND duration > 0');
    if (avgResult && avgResult.avg !== null) {
      averageCallDuration = Math.round(avgResult.avg);
    }

    const healthScore = totalCalls > 0 ? Math.max(0, 100 - Math.round((parseInt(failedCallsToday) / parseInt(totalCalls)) * 100)) : 100;

    const warnings = [];
    if (parseInt(averageCallDuration) === 0 && parseInt(totalCalls) > 0) {
      warnings.push('Call duration tracking is empty');
    }

    const lastCall = await get('SELECT started_at FROM call_history ORDER BY started_at DESC LIMIT 1');

    res.json({
      ok: true,
      totalCalls: parseInt(totalCalls),
      callsToday: parseInt(callsToday),
      callsLast7Days: parseInt(callsLast7Days),
      failedCallsToday: parseInt(failedCallsToday),
      activeCalls,
      averageCallDuration,
      healthScore,
      health: healthScore > 80 ? 'stable' : (healthScore > 50 ? 'warning' : 'critical'),
      lastCallAt: lastCall?.started_at || null,
      warnings
    });
  } catch (err) {
    console.error('[ADMIN] Call health error:', err);
    res.status(500).json({ 
      ok: false,
      error: 'Failed to fetch call health', 
      details: err.message,
      activeCalls: 0,
      failedCallsToday: 0,
      totalCalls: 0,
      avgDuration: 0,
      health: 'unavailable'
    });
  }
};

export const getSocketRegistryHealth = (req, res) => {
  try {
    const health = {
      localMapSize: req.app.get('userSockets')?.size || 0,
      redisAvailable: false,
      routingMode: 'local-map-primary',
      warnings: []
    };

    res.json(health);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch socket registry health',
      details: err.message,
      localMapSize: 0,
      routingMode: 'local-map-primary',
      warnings: ['Registry health check failed']
    });
  }
};

export const getAiAnalysis = async (req, res) => {
  try {
    const userCount = await get('SELECT COUNT(*) as count FROM users');
    const messageCount = await get('SELECT COUNT(*) as count FROM messages');
    const today = new Date().toISOString().split('T')[0];
    const messagesToday = await get(
      'SELECT COUNT(*) as count FROM messages WHERE created_at::date = $1', today
    );
    const metrics = getMetricsSummary();
    const activeConnections = req.app.get('userSockets')?.size || 0;
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);

    const stats = {
      totalUsers: parseInt(userCount?.count || 0),
      totalMessages: parseInt(messageCount?.count || 0),
      messagesToday: parseInt(messagesToday?.count || 0),
      failedCallsToday: metrics.failedCallsToday,
      activeConnections,
      activeCalls: callActivity.activeCalls,
      serverUptime: uptime
    };

    const analysis = await analyzeAdminInsights(stats);
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI Analysis failed', details: err.message });
  }
};

// requireAdmin is imported from authMiddleware.js