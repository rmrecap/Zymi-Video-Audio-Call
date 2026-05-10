import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgres://admin:admin123@127.0.0.1:5432/postgres'
});

client.connect()
  .then(() => {
    console.log('Connected to database');
    return client.query('SELECT 1');
  })
  .then(() => {
    console.log('Query successful');
    client.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    client.end();
  });