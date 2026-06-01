import { io } from 'socket.io-client';

const TEST_USERS = 1000;
const TARGET_URL = 'http://localhost:5000';

async function runStress() {
  console.log(`🚀 Starting Stress Test: ${TEST_USERS} users...`);
  for (let i = 0; i < TEST_USERS; i++) {
    const client = io(TARGET_URL, {
      auth: { token: `fake_jwt_${i}`, type: i % 2 === 0 ? 'UI' : 'BACKGROUND' }
    });

    client.on('connect', () => {
      if (i % 100 === 0) console.log(`Connected user ${i}`);
      // Simulate heartbeat
      setInterval(() => client.emit('heartbeat_ping', { ts: Date.now() }), 25000);
    });
  }
}

runStress();
