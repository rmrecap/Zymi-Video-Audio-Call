import bcrypt from 'bcryptjs';
import { get, all, run } from '../db/database.js';
import { logAudit, getAuditLogs, getAuditStats } from '../services/auditService.js';
import { getMetricsSummary } from '../services/metricsService.js';
import { incrementTokenVersion } from '../services/sessionService.js';
import { requireAdmin, checkPermission, getUserPermissions, USER_ROLES } from '../middleware/authMiddleware.js';
import { getApp } from '../../index.js';
import { getUserSocketRegistry } from '../socket/userSocketRegistry.js';
import { analyzeAdminInsights } from '../services/aiService.js';

let callActivity = { activeCalls: 0, totalCalls: 0, failedCalls: 0 };
let serverStartTime = Date.now();

export const getStats = (req, res) => {
  const userCount = get('SELECT COUNT(*) as count FROM users');
  const messageCount = get('SELECT COUNT(*) as count FROM messages');
  const today = new Date().toISOString().split('T')[0];
  const messagesToday = get("SELECT COUNT(*) as count FROM messages WHERE date(timestamp) = ?", today);
  const callsToday = get("SELECT COUNT(*) as count FROM admin_audit_logs WHERE action = 'call_started' AND date(timestamp) = ?", today);
  const activeConnections = req.app.get('userSockets')?.size || 0;
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
  const dbStatus = get("SELECT name FROM sqlite_master WHERE type='table'") ? 'healthy' : 'error';
  
  const metrics = getMetricsSummary();
  
  res.json({
    totalUsers: userCount.count,
    totalMessages: messageCount.count,
    messagesToday: messagesToday.count,
    callsToday: callsToday.count,
    failedCallsToday: metrics.failedCallsToday,
    activeConnections,
    activeCalls: callActivity.activeCalls,
    totalCalls: callActivity.totalCalls,
    serverUptime: uptime,
    dbStatus,
    metrics
  });
};

export const getUsers = (req, res) => {
  const { search, includeBanned } = req.query;
  
  let query = `
    SELECT 
      id, username, role, is_banned, banned_at,
      (SELECT COUNT(*) FROM messages WHERE sender_id = users.id) as message_count
    FROM users
  `;
  
  const params = [];
  
  if (!includeBanned) {
    query += ' WHERE is_banned = 0';
  }
  
  if (search) {
    query += params.length === 0 ? ' WHERE ' : ' AND ';
    query += 'username LIKE ?';
    params.push(`%${search}%`);
  }
  
  query += ' ORDER BY id DESC';
  
  const users = all(query, ...params);
  res.json(users);
};

export const banUser = (req, res) => {
  const { userId, reason } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  const user = get('SELECT * FROM users WHERE id = ?', userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (user.role === 'admin' || user.role === 'super_admin') {
    return res.status(403).json({ error: 'Cannot ban admin' });
  }
  
  run('UPDATE users SET is_banned = 1, banned_at = ? WHERE id = ?', new Date().toISOString(), userId);
  
  logAudit(req.adminUser.id, 'ban_user', userId, reason || 'No reason provided');
  
  const userSockets = req.app.get('userSockets');
  const targetSocketId = userSockets?.get(userId);
  
  if (targetSocketId) {
    const io = req.app.get('io');
    io.to(targetSocketId).emit('banned', { reason: reason || 'Your account has been suspended' });
    userSockets.delete(userId);
  }
  
  res.json({ success: true, message: 'User banned successfully' });
};

export const unbanUser = (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  run('UPDATE users SET is_banned = 0, banned_at = NULL WHERE id = ?', userId);
  
  logAudit(req.adminUser.id, 'unban_user', userId, 'User unbanned');
  
  res.json({ success: true, message: 'User unbanned successfully' });
};

export const getAudit = (req, res) => {
  const { limit = 50, adminId, action, startDate, endDate } = req.query;

  let query = `
    SELECT
      a.id,
      a.admin_id,
      a.action,
      a.target_user_id,
      a.details,
      a.ip_address,
      a.timestamp,
      u.username as admin_username,
      t.username as target_username
    FROM admin_audit_logs a
    LEFT JOIN users u ON a.admin_id = u.id
    LEFT JOIN users t ON a.target_user_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (adminId) {
    query += ' AND a.admin_id = ?';
    params.push(adminId);
  }

  if (action) {
    query += ' AND a.action = ?';
    params.push(action);
  }

  if (startDate) {
    query += ' AND a.timestamp >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND a.timestamp <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY a.timestamp DESC LIMIT ?';
  params.push(parseInt(limit));

  const logs = all(query, ...params);
  res.json(logs);
};

export const getRisks = (req, res) => {
  const risks = [];
  const recommendations = [];

  const bannedUsers = get('SELECT COUNT(*) as count FROM users WHERE is_banned = 1');
  if (bannedUsers.count > 0) {
    risks.push({ level: 'info', message: `${bannedUsers.count} banned user(s) in system` });
    recommendations.push({ action: 'review_banned_users', description: 'Review banned accounts for potential unbanning or data cleanup' });
  }

  const activeConnections = req.app.get('userSockets')?.size || 0;
  if (activeConnections === 0) {
    risks.push({ level: 'warning', message: 'No active connections' });
    recommendations.push({ action: 'check_server_status', description: 'Verify server is running and accessible' });
  }

  const inactiveUsers = get(`
    SELECT COUNT(*) as count FROM users
    WHERE id NOT IN (SELECT DISTINCT sender_id FROM messages WHERE timestamp > datetime('now', '-24 hours'))
    AND id NOT IN (SELECT DISTINCT receiver_id FROM messages WHERE timestamp > datetime('now', '-24 hours'))
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

  // Table migrations status
  const tables = all("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames = tables.map(t => t.name);
  const requiredTables = ['users', 'messages', 'admin_audit_logs', 'call_history', 'blocked_users', 'message_reports'];
  const missingTables = requiredTables.filter(t => !tableNames.includes(t));
  if (missingTables.length > 0) {
    risks.push({ level: 'critical', message: `Missing database tables: ${missingTables.join(', ')}` });
    recommendations.push({ action: 'run_migrations', description: 'Execute database migrations to create missing tables' });
  }

  res.json({
    risks,
    recommendations
  });
};

export const getPermissions = (req, res) => {
  const role = req.adminUser.role;
  const permissions = getUserPermissions(role);
  res.json({ role, permissions, allRoles: Object.values(USER_ROLES) });
};

export const updateUserRole = (req, res) => {
  const { userId, newRole } = req.body;
  
  if (!userId || !newRole) {
    return res.status(400).json({ error: 'User ID and role required' });
  }
  
  const user = get('SELECT * FROM users WHERE id = ?', userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (user.role === 'super_admin') {
    return res.status(403).json({ error: 'Cannot modify super_admin role' });
  }
  
  if (req.adminUser.role !== 'super_admin' && newRole === 'super_admin') {
    return res.status(403).json({ error: 'Only super_admin can assign super_admin role' });
  }
  
  run('UPDATE users SET role = ? WHERE id = ?', newRole, userId);
  
  logAudit(req.adminUser.id, 'role_change', userId, `Changed role from ${user.role} to ${newRole}`);
  
  res.json({ success: true, message: 'Role updated successfully' });
};

export const changePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const admin = get('SELECT * FROM users WHERE id = ?', req.adminUser.id);

  if (!admin || !bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 12);
  run('UPDATE users SET password = ? WHERE id = ?', hash, req.adminUser.id);

  // Invalidate all sessions for this admin
  incrementTokenVersion(req.adminUser.id);
  logAudit(req.adminUser.id, 'password_change', req.adminUser.id, 'Admin changed password');

  // Disconnect all sockets for this admin
  const app = getApp();
  const userSockets = app.get('userSockets');
  const io = app.get('io');
  const socketId = userSockets.get(req.adminUser.id);
  if (socketId && io) {
    io.to(socketId).emit('force-logout', { reason: 'Password changed. Please log in again.' });
    userSockets.delete(req.adminUser.id);
  }

  res.json({ success: true, message: 'Password changed successfully' });
};

export const getMigrationStatus = (req, res) => {
  const migrations = [];
  
  const tables = all("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames = tables.map(t => t.name);
  
  migrations.push({ name: 'users table', exists: tableNames.includes('users') });
  migrations.push({ name: 'messages table', exists: tableNames.includes('messages') });
  migrations.push({ name: 'admin_audit_logs table', exists: tableNames.includes('admin_audit_logs') });
  
  if (tableNames.includes('users')) {
    const userCols = all('PRAGMA table_info(users)');
    migrations.push({ name: 'users.role column', exists: userCols.some(c => c.name === 'role') });
    migrations.push({ name: 'users.is_banned column', exists: userCols.some(c => c.name === 'is_banned') });
  }
  
  if (tableNames.includes('messages')) {
    const msgCols = all('PRAGMA table_info(messages)');
    migrations.push({ name: 'messages.is_read column', exists: msgCols.some(c => c.name === 'is_read') });
  }
  
  res.json(migrations);
};

export const exportData = (req, res) => {
  const format = req.query.format || 'json'; // json or csv
  const tables = all("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames = tables.map(t => t.name);

  const data = {};

  // Export sanitized data from each table
  tableNames.forEach(table => {
    const allowedTables = ['users', 'messages', 'call_history', 'admin_audit_logs', 'message_reports', 'blocked_users'];
    if (allowedTables.includes(table)) {
      try {
        // Strict mapping to prevent any potential interpolation risk
        const targetTable = allowedTables.find(t => t === table);
        const rows = all(`SELECT * FROM ${targetTable}`);
        // Sanitize: remove sensitive fields
        const sanitized = rows.map(row => {
          const sanitizedRow = { ...row };
          if (table === 'users') {
            delete sanitizedRow.password;
            delete sanitizedRow.token_version;
          }
          return sanitizedRow;
        });
        data[table] = sanitized;
      } catch (err) {
        data[table] = [{ error: 'Could not read table' }];
      }
    }
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const filename = `zymi_backup_${timestamp}`;

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    // Simple CSV: each table as separate section with headers
    let csv = '';
    Object.keys(data).forEach(table => {
      csv += `\n# TABLE: ${table}\n`;
      const rows = data[table];
      if (Array.isArray(rows) && rows.length > 0) {
        const headers = Object.keys(rows[0]);
        csv += headers.join(',') + '\n';
        rows.forEach(row => {
          const values = headers.map(h => JSON.stringify(row[h] || ''));
          csv += values.join(',') + '\n';
        });
      }
    });
    res.send(csv);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json({
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data
    });
  }

  logAudit(req.adminUser.id, 'data_export', null, `Exported data in ${format} format`);
};

export const getMessageHealth = (req, res) => {
  try {
    const totalMessages = get('SELECT COUNT(*) as count FROM messages').count;
    const messagesToday = get("SELECT COUNT(*) as count FROM messages WHERE DATE(timestamp) = DATE('now')").count;
    const messagesLast7Days = get("SELECT COUNT(*) as count FROM messages WHERE timestamp > DATETIME('now', '-7 days')").count;
    const reportedMessages = get('SELECT COUNT(*) as count FROM message_reports').count;

    // Blocked message risk: messages involving banned users
    const blockedMessageRisk = get(`
      SELECT COUNT(*) as count FROM messages
      WHERE sender_id IN (SELECT id FROM users WHERE is_banned = 1)
      OR receiver_id IN (SELECT id FROM users WHERE is_banned = 1)
    `).count;

    const persistenceStatus = 'healthy'; // Since we're querying successfully
    const latestMessage = get('SELECT MAX(timestamp) as latest FROM messages');
    const latestMessageAt = latestMessage.latest;

    // Health score: lower reported messages ratio is better
    const healthScore = totalMessages > 0 ? Math.max(0, 100 - Math.round((reportedMessages / totalMessages) * 100)) : 100;

    const warnings = [];
    if (blockedMessageRisk > 0) {
      warnings.push(`${blockedMessageRisk} messages involve banned users`);
    }

    res.json({
      totalMessages,
      messagesToday,
      messagesLast7Days,
      reportedMessages,
      blockedMessageRisk,
      persistenceStatus,
      latestMessageAt,
      healthScore,
      warnings
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch message health', details: err.message });
  }
};

export const getCallHealth = (req, res) => {
  try {
    const totalCalls = get('SELECT COUNT(*) as count FROM call_history')?.count || 0;
    const callsToday = get("SELECT COUNT(*) as count FROM call_history WHERE DATE(started_at) = DATE('now')")?.count || 0;
    const callsLast7Days = get("SELECT COUNT(*) as count FROM call_history WHERE started_at > DATETIME('now', '-7 days')")?.count || 0;

    // Failed calls from audit logs
    const failedCallsToday = get("SELECT COUNT(*) as count FROM admin_audit_logs WHERE action = 'call_failed' AND DATE(timestamp) = DATE('now')")?.count || 0;

    // Active calls from app state
    const callActivity = req.app.get('callActivity') || { activeCalls: 0 };
    const activeCalls = callActivity.activeCalls || 0;

    // Average duration
    let averageCallDuration = 0;
    const avgResult = get('SELECT AVG(duration) as avg FROM call_history WHERE duration IS NOT NULL AND duration > 0');
    if (avgResult && avgResult.avg !== null) {
      averageCallDuration = Math.round(avgResult.avg);
    }

    const healthScore = totalCalls > 0 ? Math.max(0, 100 - Math.round((failedCallsToday / totalCalls) * 100)) : 100;

    const warnings = [];
    if (averageCallDuration === 0 && totalCalls > 0) {
      warnings.push('Call duration tracking is empty');
    }
    if (failedCallsToday > totalCalls * 0.1 && totalCalls > 0) {
      warnings.push('High failed call rate detected today');
    }

    res.json({
      ok: true,
      totalCalls,
      callsToday,
      callsLast7Days,
      failedCallsToday,
      activeCalls,
      averageCallDuration,
      healthScore,
      health: healthScore > 80 ? 'stable' : (healthScore > 50 ? 'warning' : 'critical'),
      lastCallAt: get('SELECT started_at FROM call_history ORDER BY started_at DESC LIMIT 1')?.started_at || null,
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
    const registry = getUserSocketRegistry();
    const health = registry.getRegistryHealth();

    // Add computed safety fields
    const response = {
      ...health,
      productionDisabled: process.env.NODE_ENV === 'production',
      routingMode: 'local-map-primary',
      warnings: []
    };

    // Add safety warnings
    if (response.productionDisabled && response.shadowMode) {
      response.warnings.push('Shadow mode should be disabled in production');
    }

    if (!response.productionDisabled && !response.shadowMode) {
      response.warnings.push('Shadow mode available for development testing');
    }

    response.warnings.push('All socket routing uses local Map (single-node safe)');

    res.json(response);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch socket registry health',
      details: err.message,
      localMapSize: 0,
      shadowMode: false,
      redisAvailable: false,
      productionDisabled: process.env.NODE_ENV === 'production',
      routingMode: 'local-map-primary',
      warnings: ['Registry health check failed']
    });
  }
};

export const getAiAnalysis = async (req, res) => {
  try {
    const userCount = get('SELECT COUNT(*) as count FROM users');
    const messageCount = get('SELECT COUNT(*) as count FROM messages');
    const today = new Date().toISOString().split('T')[0];
    const messagesToday = get("SELECT COUNT(*) as count FROM messages WHERE date(timestamp) = ?", today);
    const metrics = getMetricsSummary();
    const activeConnections = req.app.get('userSockets')?.size || 0;
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);

    const stats = {
      totalUsers: userCount.count,
      totalMessages: messageCount.count,
      messagesToday: messagesToday.count,
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