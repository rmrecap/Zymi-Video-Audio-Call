import { get, all, run } from '../db/database.js';
import { decrypt, encrypt } from '../utils/encryption.js';

export const getActiveIceServers = (countryIso = null) => {
  const servers = all('SELECT * FROM turn_servers WHERE is_active = 1 ORDER BY priority ASC');
  
  const iceServers = [];
  
  for (const server of servers) {
    // Basic STUN
    iceServers.push({ urls: server.stun_url });
    
    // TURN Fallbacks
    const credential = decrypt(server.credential_encrypted);
    
    if (server.turn_url_udp) {
      iceServers.push({
        urls: server.turn_url_udp,
        username: server.username,
        credential: credential
      });
    }
    
    if (server.turn_url_tcp) {
      iceServers.push({
        urls: server.turn_url_tcp,
        username: server.username,
        credential: credential
      });
    }

    if (server.turn_url_tls) {
      iceServers.push({
        urls: server.turn_url_tls,
        username: server.username,
        credential: credential
      });
    }
  }

  // If no servers configured, fallback to Google STUN
  if (iceServers.length === 0) {
    iceServers.push({ urls: 'stun:stun.l.google.com:19302' });
  }

  return iceServers;
};

export const addTurnServer = (data) => {
  const { label, stun_url, turn_url_udp, turn_url_tcp, turn_url_tls, username, credential, realm, region, country_scope_json, priority } = data;
  
  const credential_encrypted = encrypt(credential);
  
  const sql = `
    INSERT INTO turn_servers (
      label, stun_url, turn_url_udp, turn_url_tcp, turn_url_tls, 
      username, credential_encrypted, realm, region, country_scope_json, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  return run(sql, label, stun_url, turn_url_udp, turn_url_tcp, turn_url_tls, username, credential_encrypted, realm, region, country_scope_json || '[]', priority || 1);
};

export const updateTurnServer = (id, data) => {
  const current = get('SELECT * FROM turn_servers WHERE id = ?', id);
  if (!current) throw new Error('Server not found');

  const updates = [];
  const params = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'credential') {
      updates.push('credential_encrypted = ?');
      params.push(encrypt(value));
    } else if (key !== 'id') {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  });

  if (updates.length === 0) return;

  params.push(id);
  return run(`UPDATE turn_servers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, ...params);
};

export const getTurnServers = () => {
  return all('SELECT id, label, stun_url, turn_url_udp, turn_url_tcp, turn_url_tls, username, realm, region, country_scope_json, is_active, priority, created_at, updated_at FROM turn_servers');
};

export const testTurnServer = async (id) => {
  // Logic for server-side testing if possible, otherwise return config for client test
  const server = get('SELECT * FROM turn_servers WHERE id = ?', id);
  if (!server) throw new Error('Server not found');
  
  return {
    stun_url: server.stun_url,
    turn_url: server.turn_url_udp || server.turn_url_tcp || server.turn_url_tls,
    username: server.username,
    credential: decrypt(server.credential_encrypted)
  };
};
