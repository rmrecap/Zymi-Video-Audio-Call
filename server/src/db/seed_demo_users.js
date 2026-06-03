import bcrypt from 'bcryptjs';
import { get, run, all } from './postgres.js';

const demoUsers = [
  // Dubai / UAE cluster (14 users)
  { username: 'ahmed_dxb', email: 'ahmed@zymi.ae', lat: 25.2754, lng: 55.3216, city: 'Dubai', countryCode: 'AE', countryName: 'United Arab Emirates' },
  { username: 'sarah_marina', email: 'sarah@zymi.ae', lat: 25.0805, lng: 55.1403, city: 'Dubai Marina', countryCode: 'AE', countryName: 'United Arab Emirates' },
  { username: 'omar_downtown', email: 'omar@zymi.ae', lat: 25.1972, lng: 55.2744, city: 'Downtown Dubai', countryCode: 'AE', countryName: 'United Arab Emirates' },
  { username: 'fatima_palm', email: 'fatima@zymi.ae', lat: 25.1124, lng: 55.1390, city: 'Palm Jumeirah', countryCode: 'AE', countryName: 'United Arab Emirates' },
  { username: 'khalid_admin', email: 'khalid@zymi.ae', lat: 25.2676, lng: 55.3180, city: 'Deira', countryCode: 'AE', countryName: 'United Arab Emirates' },
  { username: 'layla_springs', email: 'layla@zymi.ae', lat: 25.1350, lng: 55.1850, city: 'Dubai Springs', countryCode: 'AE', countryName: 'United Arab Emirates' },
  { username: 'nadia_hills', email: 'nadia@zymi.ae', lat: 25.2350, lng: 55.3000, city: 'Dubai Hills', countryCode: 'AE', countryName: 'United Arab Emirates' },
  { username: 'rashid_jlt', email: 'rashid@zymi.ae', lat: 25.0660, lng: 55.1410, city: 'JLT', countryCode: 'AE', countryName: 'United Arab Emirates' },
  { username: 'noor_barsha', email: 'noor@zymi.ae', lat: 25.1100, lng: 55.2000, city: 'Barsha', countryCode: 'AE', countryName: 'United Arab Emirates' },
  { username: 'hassan_abu', email: 'hassan@zymi.ae', lat: 24.4539, lng: 54.3773, city: 'Abu Dhabi', countryCode: 'AE', countryName: 'United Arab Emirates' },
  // Dhaka / Bangladesh cluster (10 users)
  { username: 'cyber_ninja', email: 'ninja@zymi.com', lat: 23.8103, lng: 90.4125, city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { username: 'neon_rider', email: 'rider@zymi.com', lat: 23.8203, lng: 90.4225, city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { username: 'data_ghost', email: 'ghost@zymi.com', lat: 23.8003, lng: 90.4025, city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { username: 'pixel_punx', email: 'punx@zymi.com', lat: 23.8153, lng: 90.4155, city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { username: 'code_runner', email: 'runner@zymi.com', lat: 23.8053, lng: 90.4085, city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { username: 'echo_dev', email: 'echo@zymi.com', lat: 23.7800, lng: 90.4300, city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { username: 'storm_call', email: 'storm@zymi.com', lat: 23.7900, lng: 90.3900, city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { username: 'frost_byte', email: 'frost@zymi.com', lat: 23.8250, lng: 90.4050, city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { username: 'ember_talk', email: 'ember@zymi.com', lat: 23.8080, lng: 90.4180, city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { username: 'nova_chat', email: 'nova@zymi.com', lat: 23.8120, lng: 90.3950, city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { username: 'admin_super', email: 'admin@zymi.com', lat: 25.2000, lng: 55.2700, city: 'Dubai', countryCode: 'AE', countryName: 'United Arab Emirates', role: 'admin' },
];

export const seedDemoUsers = async () => {
  console.log('[SEED] Checking for demo users in Master Database...');
  const passwordHash = bcrypt.hashSync('demo123', 12);
  let seeded = 0;

  for (const user of demoUsers) {
    try {
      const existing = await get('SELECT id FROM users WHERE email = $1', user.email);
      if (existing) continue;

      const role = user.role || 'user';
      const res = await run(
        `INSERT INTO users (username, email, password_hash, role, country_code, country_name, city_name,
           email_verified, phone_verified, profile_completion, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, 40, 'verified')
         RETURNING id`,
        user.username, user.email, passwordHash, role,
        user.countryCode, user.countryName, user.city
      );
      const userId = res.lastID;

      await run(
        `UPDATE users SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326), last_location_update = NOW()
         WHERE id = $3`,
        user.lng, user.lat, userId
      );

      await run(
        `INSERT INTO nearby_visibility (user_id, lat, lng, country_code, city_name, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (user_id) DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng`,
        userId, user.lat, user.lng, user.countryCode, user.city
      );

      await run(
        `INSERT INTO user_location_preferences (user_id, discovery_enabled, radius_km, approximate_only)
         VALUES ($1, true, 50, false)
         ON CONFLICT (user_id) DO UPDATE SET discovery_enabled = true`,
        userId
      );

      seeded++;
      console.log(`[SEED] Created demo user: ${user.username} (ID: ${userId}) at [${user.lat}, ${user.lng}]`);
    } catch (err) {
      console.error(`[SEED] Error creating user ${user.username}:`, err.message);
    }
  }

  if (seeded === 0) {
    console.log('[SEED] All demo users already exist');
  } else {
    console.log(`[SEED] Seeded ${seeded} new demo users`);
  }
};
