import bcrypt from 'bcryptjs';
import { get, run } from '../db/postgres.js';
import { config } from '../config/env.js';

const BCRYPT_ROUNDS = 12;
const ADMIN_USERNAME = 'admin_super';
const ADMIN_EMAIL = 'admin@zymi.com';
const ADMIN_PASSWORD = 'demo123';

export const seedSuperAdmin = async () => {
  const existingSuperAdmin = await get("SELECT id, username, role, password_hash FROM users WHERE role = $1", ['super_admin']);

  const hash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  if (existingSuperAdmin) {
    const match = existingSuperAdmin.password_hash
      ? bcrypt.compareSync(ADMIN_PASSWORD, existingSuperAdmin.password_hash)
      : false;

    if (match) {
      console.log('[SEED] Super admin already exists and password verified:', existingSuperAdmin.username);
      return null;
    }

    console.log('[SEED] Super admin exists but password mismatch. Updating credentials...');
    await run(
      'UPDATE users SET password_hash = $1, username = $2, email = $3 WHERE id = $4',
      [hash, ADMIN_USERNAME, ADMIN_EMAIL, existingSuperAdmin.id]
    );
    return { id: existingSuperAdmin.id, username: ADMIN_USERNAME };
  }

  try {
    const existingByEmail = await get("SELECT id FROM users WHERE email = $1", [ADMIN_EMAIL]);
    if (existingByEmail) {
      await run(
        'UPDATE users SET username = $1, password_hash = $2, role = $3 WHERE email = $4',
        [ADMIN_USERNAME, hash, 'super_admin', ADMIN_EMAIL]
      );
      console.log('[SEED] Updated existing user by email -> super_admin');
      return { id: existingByEmail.id, username: ADMIN_USERNAME };
    }

    const existingByUsername = await get("SELECT id FROM users WHERE username = $1", [ADMIN_USERNAME]);
    if (existingByUsername) {
      await run(
        'UPDATE users SET password_hash = $1, role = $2, email = $3 WHERE username = $4',
        [hash, 'super_admin', ADMIN_EMAIL, ADMIN_USERNAME]
      );
      console.log('[SEED] Updated existing user by username -> super_admin');
      return { id: existingByUsername.id, username: ADMIN_USERNAME };
    }

    const result = await run(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      ADMIN_USERNAME,
      ADMIN_EMAIL,
      hash,
      'super_admin'
    );

    console.log('[SEED] Created super_admin user:', ADMIN_USERNAME);
    return { id: result.lastID, username: ADMIN_USERNAME };
  } catch (err) {
    console.error('[SEED] Error during admin creation:', err.message);
    return null;
  }
};

export const checkSuperAdminExists = async () => {
  const admin = await get("SELECT id, username, password_hash FROM users WHERE role = $1", ['super_admin']);
  if (!admin || !admin.password_hash) return null;
  const valid = bcrypt.compareSync(ADMIN_PASSWORD, admin.password_hash);
  return valid ? admin : null;
};

export const forceSeedMasterAdmin = seedSuperAdmin;
