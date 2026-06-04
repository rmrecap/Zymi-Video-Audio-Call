import { get, run, all } from '../db/postgres.js';

export const logAudit = async (adminId, action, targetUserId, details, ipAddress = null) => {
  try {
    await run(
      'INSERT INTO admin_audit_logs (admin_id, action, target_user_id, details, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
      [adminId, action, targetUserId, details, ipAddress]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err.message);
  }
};

export const getAuditLogs = async (limit = 50, offset = 0) => {
  try {
    return await all(
      `SELECT l.*, u.username as admin_username 
       FROM admin_audit_logs l 
       LEFT JOIN users u ON l.admin_id = u.id 
       ORDER BY l.timestamp DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
  } catch (err) {
    console.error('[GET AUDIT LOGS ERROR]', err.message);
    return [];
  }
};

export const getAuditLogsByAction = async (action, limit = 50) => {
  try {
    return await all(
      `SELECT l.*, u.username as admin_username 
       FROM admin_audit_logs l 
       LEFT JOIN users u ON l.admin_id = u.id 
       WHERE l.action = $1
       ORDER BY l.timestamp DESC 
       LIMIT $2`,
      [action, limit]
    );
  } catch (err) {
    return [];
  }
};

export const getAuditLogsByUser = async (userId, limit = 50) => {
  try {
    return await all(
      `SELECT l.*, u.username as admin_username 
       FROM admin_audit_logs l 
       LEFT JOIN users u ON l.admin_id = u.id 
       WHERE l.target_user_id = $1
       ORDER BY l.timestamp DESC 
       LIMIT $2`,
      [userId, limit]
    );
  } catch (err) {
    return [];
  }
};

export const getAuditLogsByAdmin = async (adminId, limit = 50) => {
  try {
    return await all(
      `SELECT l.*, u.username as admin_username 
       FROM admin_audit_logs l 
       LEFT JOIN users ux ON l.admin_id = ux.id 
       WHERE l.admin_id = $1
       ORDER BY l.timestamp DESC 
       LIMIT $2`,
      [adminId, limit]
    );
  } catch (err) {
    return [];
  }
};

export const getAuditStats = async () => {
  try {
    const totalResult = await get('SELECT COUNT(*) as count FROM admin_audit_logs');
    const byAction = await all(`
      SELECT action, COUNT(*) as count 
      FROM admin_audit_logs 
      GROUP BY action 
      ORDER BY count DESC
    `);
    const recent = await getAuditLogs(10);
    
    return { total: parseInt(totalResult?.count || 0), byAction, recent };
  } catch (err) {
    return { total: 0, byAction: [], recent: [] };
  }
};