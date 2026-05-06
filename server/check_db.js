
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: 'd:/QiBo/server/.env' });

async function checkSchema() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Columns in "users" table:');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });

    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log('Total users:', userCount.rows[0].count);

    const users = await pool.query('SELECT id, username, email FROM users');
    console.log('User list:', users.rows);

  } catch (err) {
    console.error('Error checking schema:', err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
