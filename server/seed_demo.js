import bcrypt from 'bcryptjs';
import { getPostgresPool } from './src/db/postgres.js';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const pool = getPostgresPool();
  if (!pool) {
    console.error("Postgres pool not initialized. Run this from within the running server or initialize DB first.");
    return;
  }

  console.log("Seeding demo users...");
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const users = [
    { username: 'ahmed_dxb', email: 'ahmed@zymi.ae', phone: '+971501234567', role: 'user' },
    { username: 'sarah_marina', email: 'sarah@zymi.ae', phone: '+971502345678', role: 'user' },
    { username: 'omar_downtown', email: 'omar@zymi.ae', phone: '+971503456789', role: 'user' },
    { username: 'fatima_palm', email: 'fatima@zymi.ae', phone: '+971504567890', role: 'user' },
    { username: 'admin_khalid', email: 'khalid_admin@zymi.ae', phone: '+971505678901', role: 'admin' },
  ];

  for (const u of users) {
    try {
      await pool.query(
        `INSERT INTO users (username, email, password_hash, phone_normalized, email_verified, phone_verified, role) 
         VALUES ($1, $2, $3, $4, true, true, $5) ON CONFLICT (username) DO NOTHING`,
        [u.username, u.email, passwordHash, u.phone, u.role]
      );
      console.log(`Created user: ${u.username} (password: password123)`);
    } catch (e) {
      console.error(`Error creating ${u.username}:`, e.message);
    }
  }
  
  // Create some demo messages
  try {
     const res1 = await pool.query(`SELECT id FROM users WHERE username = 'ahmed_dxb'`);
     const res2 = await pool.query(`SELECT id FROM users WHERE username = 'sarah_marina'`);
     
     if (res1.rows.length > 0 && res2.rows.length > 0) {
         const id1 = res1.rows[0].id;
         const id2 = res2.rows[0].id;
         const conversationId = [id1, id2].sort((a, b) => a - b).join('_');

         await pool.query(
             `INSERT INTO messages (sender_id, receiver_id, conversation_id, content) 
              VALUES ($1, $2, $3, $4)`, 
             [id1, id2, conversationId, 'Hello Sarah! How is the Marina today?']
         );
         await pool.query(
             `INSERT INTO messages (sender_id, receiver_id, conversation_id, content) 
              VALUES ($1, $2, $3, $4)`, 
             [id2, id1, conversationId, 'Hi Ahmed, it is beautiful! Going for a run soon.']
         );
         console.log('Created demo messages between ahmed_dxb and sarah_marina.');
     }
  } catch (e) {
     console.error('Error creating messages:', e.message);
  }

  process.exit(0);
}

// We need to initialize the db before running
import { initPostgres } from './src/db/postgres.js';
initPostgres();
setTimeout(seed, 1000);
