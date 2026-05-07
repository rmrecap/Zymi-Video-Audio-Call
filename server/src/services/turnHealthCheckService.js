import net from 'net';
import dgram from 'dgram';
import tls from 'tls';
import crypto from 'crypto';
import { all, run, get } from '../db/postgres.js';

export const performHealthCheck = async () => {
  const servers = await all('SELECT * FROM turn_servers WHERE is_active = 1');
  const results = [];

  for (const server of servers) {
    const health = {
      server_id: server.id,
      label: server.label,
      udp: false,
      tcp: false,
      tls: false,
      latency: 0,
      status: 'failed',
      error: null
    };

    const startTime = Date.now();

    try {
      // 1. Check STUN/TURN UDP (Basic reachability via socket)
      health.udp = await checkUdpReachability(server.stun_url);
      
      // 2. Check TCP if configured
      if (server.turn_url_tcp) {
        health.tcp = await checkTcpReachability(server.turn_url_tcp);
      }

      // 3. Check TLS if configured
      if (server.turn_url_tls) {
        health.tls = await checkTlsReachability(server.turn_url_tls);
      }

      health.latency = Date.now() - startTime;
      
      if (health.udp || health.tcp || health.tls) {
        health.status = (health.udp && (server.turn_url_tls ? health.tls : true)) ? 'ok' : 'warning';
      }

    } catch (err) {
      health.error = err.message;
    }

    // Save check results
    await run(`
      INSERT INTO turn_health_checks (
        turn_server_id, status, udp_reachable, tcp_reachable, tls_reachable, latency_ms, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [server.id, health.status, health.udp ? 1 : 0, health.tcp ? 1 : 0, health.tls ? 1 : 0, health.latency, health.error]);

    results.push(health);
  }

  return results;
};

const checkUdpReachability = (url) => {
  return new Promise((resolve) => {
    const [host, port] = url.replace('stun:', '').replace('turn:', '').split(':');
    const client = dgram.createSocket('udp4');
    
    // STUN Binding Request (Simplest valid STUN packet)
    const message = Buffer.from([
      0x00, 0x01, 0x00, 0x00, // Binding Request
      0x21, 0x12, 0xa4, 0x42, // Magic Cookie
      ...crypto.randomBytes(12) // Transaction ID
    ]);

    client.send(message, port || 3478, host, (err) => {
      if (err) {
        client.close();
        resolve(false);
      }
    });

    client.on('message', () => {
      client.close();
      resolve(true);
    });

    setTimeout(() => {
      client.close();
      resolve(false);
    }, 2000);
  });
};

const checkTcpReachability = (url) => {
  return new Promise((resolve) => {
    const [host, port] = url.replace('turn:', '').split(':');
    const socket = new net.Socket();
    socket.setTimeout(2000);

    socket.connect(port || 3478, host, () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
};

const checkTlsReachability = (url) => {
  return new Promise((resolve) => {
    const [host, port] = url.replace('turns:', '').split(':');
    const socket = tls.connect(port || 5349, host, { timeout: 2000, rejectUnauthorized: false }, () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 2500);
    
    socket.on('close', () => clearTimeout(timeout));
  });
};

export const getLatestHealth = async () => {
  const servers = await all('SELECT id, label FROM turn_servers WHERE is_active = 1');
  const healths = [];

  for (const server of servers) {
    const latest = await get(`
      SELECT * FROM turn_health_checks 
      WHERE turn_server_id = $1 
      ORDER BY checked_at DESC LIMIT 1
    `, [server.id]);
    
    healths.push({
      server_id: server.id,
      label: server.label,
      ...latest
    });
  }

  return healths;
};

export const getHealthHistory = async (serverId, limit = 50) => {
  return await all(`
    SELECT * FROM turn_health_checks 
    WHERE turn_server_id = $1 
    ORDER BY checked_at DESC LIMIT $2
  `, [serverId, limit]);
};
