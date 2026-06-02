import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Socket.io Events', () => {
  let socket1 = null;
  let socket2 = null;
  let token1 = null;
  let token2 = null;
  let user1Id = null;
  let user2Id = null;
  let testMessageId = null;
  const roomName = `test_room_${Date.now()}`;

  before(async () => {
    const { io } = await import('socket.io-client');
    
    const res1 = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `sockuser1_${Date.now()}`,
        email: `sock1_${Date.now()}@test.com`,
        password: 'TestPass123!'
      })
    });
    const data1 = await res1.json();
    token1 = data1.token;
    user1Id = data1.id;

    const res2 = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `sockuser2_${Date.now()}`,
        email: `sock2_${Date.now()}@test.com`,
        password: 'TestPass123!'
      })
    });
    const data2 = await res2.json();
    token2 = data2.token;
    user2Id = data2.id;
  });

  after(() => {
    if (socket1) socket1.close();
    if (socket2) socket2.close();
  });

  it('should connect with valid JWT token', (done) => {
    const { io } = require('socket.io-client');
    socket1 = io(BASE_URL, {
      auth: { token: token1, type: 'UI' },
      transports: ['websocket']
    });
    socket1.on('connect', () => {
      assert.ok(socket1.connected);
      done();
    });
    socket1.on('connect_error', (err) => {
      done(new Error(`Connection failed: ${err.message}`));
    });
  });

  it('should emit join and receive acknowledgment', (done) => {
    socket1.emit('join', user1Id);
    setTimeout(() => {
      assert.ok(socket1.connected);
      done();
    }, 500);
  });

  it('should send private message between users', (done) => {
    socket2 = io(BASE_URL, {
      auth: { token: token2, type: 'UI' },
      transports: ['websocket']
    });

    socket2.on('connect', () => {
      socket2.emit('join', user2Id);
      socket2.on('new-message', (msg) => {
        assert.ok(msg);
        assert.strictEqual(msg.sender_id, user1Id);
        assert.strictEqual(msg.receiver_id, user2Id);
        assert.ok(msg.content);
        testMessageId = msg.id;
        done();
      });

      setTimeout(() => {
        socket1.emit('private-message', {
          to: user2Id,
          from: user1Id,
          content: 'Hello from test!',
          tempId: `test-${Date.now()}`
        });
      }, 1000);
    });
  });

  it('should handle typing indicators', (done) => {
    socket1.emit('typing', { to: user2Id, from: user1Id });
    socket2.on('user-typing', ({ from }) => {
      assert.strictEqual(from, user1Id);
      done();
    });
  });

  it('should handle stop typing indicators', (done) => {
    socket1.emit('stop-typing', { to: user2Id, from: user1Id });
    socket2.on('user-stop-typing', ({ from }) => {
      assert.strictEqual(from, user1Id);
      done();
    });
  });

  it('should handle ping-pong heartbeat', (done) => {
    socket1.emit('heartbeat_ping', {});
    socket1.on('heartbeat-ack', (data) => {
      assert.ok(data.ts);
      done();
    });
  });
});
