import bcrypt from 'bcryptjs';
import { getPostgresPool } from './src/db/postgres.js';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const pool = getPostgresPool();
  if (!pool) {
    console.error("Postgres pool not initialized.");
    return;
  }

  console.log("Seeding demo users and features...");
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const users = [
    { username: 'ahmed_dxb', email: 'ahmed@zymi.ae', phone: '+971501234567', role: 'user', lat: 25.2754, lng: 55.3216, city: 'Dubai', countryCode: 'AE', countryName: 'United Arab Emirates' },
    { username: 'sarah_marina', email: 'sarah@zymi.ae', phone: '+971502345678', role: 'user', lat: 25.0805, lng: 55.1403, city: 'Dubai Marina', countryCode: 'AE', countryName: 'United Arab Emirates' },
    { username: 'omar_downtown', email: 'omar@zymi.ae', phone: '+971503456789', role: 'user', lat: 25.1972, lng: 55.2744, city: 'Downtown Dubai', countryCode: 'AE', countryName: 'United Arab Emirates' },
    { username: 'fatima_palm', email: 'fatima@zymi.ae', phone: '+971504567890', role: 'user', lat: 25.1124, lng: 55.1390, city: 'Palm Jumeirah', countryCode: 'AE', countryName: 'United Arab Emirates' },
    { username: 'admin_khalid', email: 'khalid_admin@zymi.ae', phone: '+971505678901', role: 'admin', lat: 25.2676, lng: 55.3180, city: 'Deira', countryCode: 'AE', countryName: 'United Arab Emirates' },
  ];

  for (const u of users) {
    try {
      // 1. Insert User
      const userRes = await pool.query(
        `INSERT INTO users (username, email, password_hash, phone_normalized, email_verified, phone_verified, role) 
         VALUES ($1, $2, $3, $4, true, true, $5) 
         ON CONFLICT (username) DO UPDATE SET role = EXCLUDED.role 
         RETURNING id`,
        [u.username, u.email, passwordHash, u.phone, u.role]
      );
      const userId = userRes.rows[0].id;

      // 2. Insert Nearby Visibility (Optional redundancy)
      await pool.query(
        `INSERT INTO nearby_visibility (user_id, lat, lng, country_code, city_name, is_active)
         VALUES ($1, $2, $3, 'AE', $4, true)
         ON CONFLICT (user_id) DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng`,
        [userId, u.lat, u.lng, u.city]
      );

      // 3. Update main users table location and geo info
      await pool.query(
        `UPDATE users 
         SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
             country_code = $4,
             country_name = $5,
             city_name = $6,
             last_location_update = NOW()
         WHERE id = $3`,
        [u.lng, u.lat, userId, u.countryCode, u.countryName, u.city]
      );

      // 4. Insert Location Preferences
      await pool.query(
        `INSERT INTO user_location_preferences (user_id, discovery_enabled, radius_km, approximate_only)
         VALUES ($1, true, 50, false)
         ON CONFLICT (user_id) DO UPDATE SET discovery_enabled = true`,
        [userId]
      );

      console.log(`Synced user: ${u.username} (ID: ${userId}) at [${u.lat}, ${u.lng}]`);
    } catch (e) {
      console.error(`Error syncing ${u.username}:`, e.message);
    }
  }
  
  // 4. Create demo messages and conversation states
  try {
     const res1 = await pool.query(`SELECT id FROM users WHERE username = 'ahmed_dxb'`);
     const res2 = await pool.query(`SELECT id FROM users WHERE username = 'sarah_marina'`);
     
     if (res1.rows.length > 0 && res2.rows.length > 0) {
         const id1 = res1.rows[0].id;
         const id2 = res2.rows[0].id;
         const conversationId = [id1, id2].sort((a, b) => a - b).join('_');

         // Insert messages
         await pool.query(
             `INSERT INTO messages (sender_id, receiver_id, conversation_id, content) 
              VALUES ($1, $2, $3, $4)`, 
             [id1, id2, conversationId, 'Hello Sarah! How is the Marina today?']
         );
         const msgRes = await pool.query(
             `INSERT INTO messages (sender_id, receiver_id, conversation_id, content) 
              VALUES ($2, $1, $3, $4) RETURNING id`, 
             [id1, id2, conversationId, 'Hi Ahmed, it is beautiful! Going for a run soon.']
         );
         const lastMsgId = msgRes.rows[0].id;

         // Insert conversation states for both users
         await pool.query(
             `INSERT INTO conversation_states (conversation_id, user_id, last_read_message_id, unread_count)
              VALUES ($1, $2, $3, 0) ON CONFLICT (conversation_id, user_id) DO NOTHING`,
             [conversationId, id1, lastMsgId]
         );
         await pool.query(
             `INSERT INTO conversation_states (conversation_id, user_id, last_read_message_id, unread_count)
              VALUES ($1, $2, $3, 0) ON CONFLICT (conversation_id, user_id) DO NOTHING`,
             [conversationId, id2, lastMsgId]
         );

         console.log('Created demo messages and conversation states.');
     }
  } catch (e) {
     console.error('Error creating messages/states:', e.message);
  }

  process.exit(0);
}

import { initPostgres } from './src/db/postgres.js';
initPostgres();
setTimeout(seed, 1000);
