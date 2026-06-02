import { get, all, run } from '../db/postgres.js';
import { decrypt, encrypt } from '../utils/encryption.js';

export const getActiveIceServers = async (countryIso = null) => {
  const servers = await all('SELECT * FROM turn_servers WHERE is_active = TRUE ORDER BY priority ASC');
  
  const iceServers = [];
  
  for (const server of servers) {
    const stunUrl = `stun:${server.host}:${server.port}`;
    iceServers.push({ urls: stunUrl });
    
    if (server.username && server.credential) {
      const turnUrlUdp = server.protocol === 'udp' ? `turn:${server.host}:${server.port}` : null;
      const turnUrlTcp = `turn:${server.host}:${server.port}?transport=tcp`;
      const turnUrlTls = `turns:${server.host}:${server.port}`;
      
      if (turnUrlUdp) {
        iceServers.push({
          urls: turnUrlUdp,
          username: server.username,
          credential: server.credential
        });
      }
      
      iceServers.push({
        urls: [turnUrlTcp, turnUrlTls].filter(Boolean),
        username: server.username,
        credential: server.credential
      });
    }
  }

  if (iceServers.length === 0) {
    iceServers.push({ urls: 'stun:stun.l.google.com:19302' });
  }

  return iceServers;
};

export const addTurnServer = async (data) => {
  const { label, host, port, protocol, username, credential, region, priority } = data;
  
  const sql = `
    INSERT INTO turn_servers (label, host, port, protocol, username, credential, region, priority)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
  
  return await run(sql, [label, host, port || 3478, protocol || 'udp', username, credential, region, priority || 100]);
};

export const updateTurnServer = async (id, data) => {
  const current = await get('SELECT * FROM turn_servers WHERE id = $1', [id]);
  if (!current) throw new Error('Server not found');

  const updates = [];
  const params = [];
  let idx = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id') {
      updates.push(`${key} = $${idx++}`);
      params.push(value);
    }
  });

  if (updates.length === 0) return;

  params.push(id);
  return await run(`UPDATE turn_servers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx}`, params);
};

export const getTurnServers = async () => {
  return await all('SELECT id, label, host, port, protocol, username, region, is_active, priority, created_at, updated_at FROM turn_servers ORDER BY priority ASC');
};

export const testTurnServer = async (id) => {
  const server = await get('SELECT * FROM turn_servers WHERE id = $1', [id]);
  if (!server) throw new Error('Server not found');
  
  return {
    stun_url: `stun:${server.host}:${server.port}`,
    turn_url: `turn:${server.host}:${server.port}`,
    username: server.username,
    credential: server.credential
  };
};
