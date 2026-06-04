import bcrypt from 'bcryptjs';
import { get, run } from '../db/postgres.js';
import { config } from '../config/env.js';

export const seedSuperAdmin = async () => {
  const existingSuperAdmin = await get("SELECT id, username, role, password_hash FROM users WHERE role = $1", ['super_admin']);
  
  const adminUsername = config.superAdminUsername || 'admin';
  const adminPassword = config.superAdminPassword || 'admin123';
  const hash = await bcrypt.hash(adminPassword, 12);

  if (existingSuperAdmin) {
    const match = existingSuperAdmin.password_hash
      ? bcrypt.compareSync(adminPassword, existingSuperAdmin.password_hash)
      : false;

    if (match) {
      console.log('[SEED] Super admin already exists and password verified:', existingSuperAdmin.username);
      return null;
    }

    console.log('[SEED] Super admin exists but password hash is invalid or placeholder. Updating...');
    await run(
      'UPDATE users SET password_hash = $1, username = $2 WHERE id = $3',
      [hash, adminUsername, existingSuperAdmin.id]
    );
    return { id: existingSuperAdmin.id, username: adminUsername };
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
  if (!admin || !admin.password_hash) return null;
  const adminPassword = config.superAdminPassword || 'admin123';
  const valid = bcrypt.compareSync(adminPassword, admin.password_hash);
  return valid ? admin : null;
};

export const forceSeedMasterAdmin = async () => {
  const plainPassword = 'demo123';
  const secureHash = await bcrypt.hash(plainPassword, 10);

  await run(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role`,
    ['admin_super', 'admin@zymi.com', secureHash, 'super_admin']
  );

  const record = await get(
    "SELECT id, username, role, password_hash FROM users WHERE username = $1",
    ['admin_super']
  );

  const storedHash = record?.password_hash;
  const verify = storedHash ? bcrypt.compareSync(plainPassword, storedHash) : false;

  if (record && verify) {
    console.log('[ROOT_FIX] Node-compatible master admin synced successfully!');
  } else {
    console.error('[ROOT_FIX] FAILURE — stored hash:', storedHash, 'record:', record ? 'found' : 'null');
  }

  return record;
};