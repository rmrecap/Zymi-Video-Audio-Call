import dotenv from 'dotenv';
dotenv.config();

import { initPostgres } from './server/src/db/postgres.js';

(async () => {
  initPostgres();
  const { testConnection } = await import('./server/src/db/postgres.js');
  const result = await testConnection();
  console.log('DB Test:', result);
})();