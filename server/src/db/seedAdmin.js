import bcrypt from 'bcryptjs';
import { get, run } from '../db/postgres.js';
import { config } from '../config/env.js';

export const seedSuperAdmin = async () => {
  const existingSuperAdmin = await get("SELECT id, username, role, password_hash FROM users WHERE role = $1", ['super_admin']);
  
  const adminUsername = config.superAdminUsername || 'admin';
  const adminPassword = config.superAdminPassword || 'admin123';
  const hash = await bcrypt.hash(adminPassword, 12);

  if (existingSuperAdmin) {
    if (existingSuperAdmin.password_hash) {
      console.log('[SEED] Super admin already exists and is configured:', existingSuperAdmin.username);
      return null;
    } else {
      console.log('[SEED] Super admin exists but missing password hash, updating...');
      await run('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, existingSuperAdmin.id]);
      return { id: existingSuperAdmin.id, username: existingSuperAdmin.username };
    }
  }

  if (!adminPassword || adminPassword === 'change_this_password') {
    console.warn('[SEED] SUPER_ADMIN_PASSWORD not set or using default - skipping seed.');
    return null;
  }

  const result = await run(
    'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
    adminUsername,
    'admin@zymi.com',
    hash,
    'super_admin'
  );

  console.log('[SEED] Created super_admin user:', adminUsername);
  return { id: result.lastID, username: adminUsername };
};

export const checkSuperAdminExists = async () => {
  const admin = await get("SELECT id, username, password_hash FROM users WHERE role = $1", ['super_admin']);
  return admin && admin.password_hash ? admin : null;
};