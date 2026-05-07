import bcrypt from 'bcryptjs';
import { db } from '../db/db_provider.js';
import { config } from '../config/env.js';

export const seedSuperAdmin = async () => {
  const existingSuperAdmin = await db.get("SELECT id, username, role FROM users WHERE role = $1", 'super_admin');
  
  if (existingSuperAdmin) {
    console.log('[SEED] Super admin already exists:', existingSuperAdmin.username);
    return null;
  }

  const adminUsername = config.superAdminUsername;
  const adminPassword = config.superAdminPassword;

  if (!adminPassword || adminPassword === 'change_this_password') {
    console.warn('[SEED] SUPER_ADMIN_PASSWORD not set or using default - skipping seed. Set a strong password in .env or docker-compose environment');
    console.warn('[SEED] Admin login will fail until SUPER_ADMIN_PASSWORD is configured');
    return null;
  }

  const hash = await bcrypt.hash(adminPassword, 12);
  const result = await db.run(
    'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
    adminUsername,
    'admin@zymi.com',
    hash,
    'super_admin'
  );

  console.log('[SEED] Created super_admin user:', adminUsername);
  console.log('[SEED] ADMIN CREDENTIALS: username=' + adminUsername + ', password=' + adminPassword.substring(0, 4) + '***');
  return { id: result.lastID, username: adminUsername };
};

export const checkSuperAdminExists = async () => {
  return await db.get("SELECT id, username FROM users WHERE role = $1", 'super_admin');
};