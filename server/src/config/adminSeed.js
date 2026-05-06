import dotenv from 'dotenv';
import { seedSuperAdmin, checkSuperAdminExists } from '../db/seedAdmin.js';

dotenv.config();

export const initAdminSeed = async () => {
  const existing = await checkSuperAdminExists();
  
  if (!existing) {
    console.log('[ADMIN_SEED] No super_admin found, attempting to seed...');
    await seedSuperAdmin();
  } else {
    console.log('[ADMIN_SEED] Super admin already exists');
  }
};

export { seedSuperAdmin, checkSuperAdminExists };