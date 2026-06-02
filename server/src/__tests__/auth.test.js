import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Auth API', () => {
  let testToken = null;
  let testUserId = null;

  it('POST /api/register - should register a new user', async () => {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@test.com`,
        password: 'TestPass123!'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.token);
    assert.ok(data.id);
    testToken = data.token;
    testUserId = data.id;
  });

  it('POST /api/login - should login with valid credentials', async () => {
    const username = `testuser_${Date.now()}`;
    const password = 'TestPass123!';

    await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email: `${username}@test.com`, password })
    });

    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.token);
  });

  it('POST /api/login - should reject invalid credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent', password: 'wrong' })
    });
    assert.strictEqual(res.status, 401);
  });

  it('GET /api/auth/me - should return user profile with valid token', async () => {
    if (!testToken) return;
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
    assert.ok(data.username);
  });
});
