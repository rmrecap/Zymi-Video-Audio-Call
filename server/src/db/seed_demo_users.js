import bcrypt from 'bcryptjs';
import { db } from './db_provider.js';

/**
 * Seed 5 demo users into the database following the Master DDL (ddl.sql)
 */
export const seedDemoUsers = async () => {
  const demoUsers = [
    { username: 'cyber_ninja', email: 'ninja@zymi.com', lat: 23.8103, lng: 90.4125 },
    { username: 'neon_rider', email: 'rider@zymi.com', lat: 23.8203, lng: 90.4225 },
    { username: 'data_ghost', email: 'ghost@zymi.com', lat: 23.8003, lng: 90.4025 },
    { username: 'pixel_punx', email: 'punx@zymi.com', lat: 23.8153, lng: 90.4155 },
    { username: 'code_runner', email: 'runner@zymi.com', lat: 23.8053, lng: 90.4085 }
  ];

  console.log('[SEED] Checking for demo users in Master Database...');

  for (const user of demoUsers) {
    try {
      const existing = await db.get('SELECT id FROM users WHERE email = ?', user.email);
      if (!existing) {
        const hash = bcrypt.hashSync('demo123', 12);
        
        // Using PostGIS syntax for PostgreSQL and simple lat/lng for SQLite fallback
        if (process.env.DATABASE_URL) {
          await db.run(
            `INSERT INTO users (username, email, password_hash, role, location) 
             VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))`,
            user.username, user.email, hash, 'user', user.lng, user.lat
          );
        } else {
          // SQLite fallback (no PostGIS)
          await db.run(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            user.username, user.email, hash, 'user'
          );
        }
        console.log(`[SEED] Created demo user: ${user.username}`);
      }
    } catch (err) {
      console.error(`[SEED] Error creating user ${user.username}:`, err.message);
    }
  }
};
