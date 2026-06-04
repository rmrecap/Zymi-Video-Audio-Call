import dotenv from 'dotenv';
import { seedSuperAdmin, checkSuperAdminExists, forceSeedMasterAdmin } from '../db/seedAdmin.js';

dotenv.config();

export const initAdminSeed = async () => {
  await forceSeedMasterAdmin();

  const existing = await checkSuperAdminExists();
  if (!existing) {
    console.log('[ADMIN_SEED] No super_admin found, attempting env seed...');
    await seedSuperAdmin();
  } else {
    console.log('[ADMIN_SEED] Super admin already exists');
  }
};

export { seedSuperAdmin, checkSuperAdminExists, forceSeedMasterAdmin };