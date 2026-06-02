import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Health API', () => {
  it('GET /health - should return server status', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.status);
    assert.ok(data.timestamp);
  });

  it('GET /api/health/db - should return DB status', async () => {
    const res = await fetch(`${BASE_URL}/api/health/db`);
    const data = await res.json();
    assert.ok(res.status === 200 || res.status === 503);
  });
});
