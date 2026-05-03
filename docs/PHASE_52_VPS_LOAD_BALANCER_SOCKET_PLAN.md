# PHASE 52 — VPS + LOAD BALANCER SOCKET PLAN

## 1. Architecture Overview
ZYMI uses a single Node.js server with Socket.io for all real-time communication. This document outlines the deployment strategy for a VPS with Nginx reverse proxy.

## 2. Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name zymi.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Critical:** The `Upgrade` and `Connection "upgrade"` headers are mandatory for WebSocket connections. Without them, Socket.io will fall back to long-polling, which severely degrades call quality.

## 3. Sticky Sessions (Multi-Instance)
If scaling beyond a single Node.js process using PM2 cluster mode:
```nginx
upstream zymi_backend {
    ip_hash;  # Required for Socket.io sticky sessions
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
}
```
Socket.io requires that all packets from a given client reach the same server instance. Without `ip_hash`, handshake and event delivery will fail randomly.

## 4. Redis Adapter (Future)
For true horizontal scaling across multiple VPS instances, attach `@socket.io/redis-adapter`. The ZYMI server already has Redis adapter initialization code in `redisAdapter.js` — it just needs a `REDIS_URL` environment variable.

## 5. PM2 Process Management
```bash
pm2 start server/index.js --name zymi-server -i 1
pm2 save
pm2 startup
```
Start with `-i 1` (single instance). Only scale to `-i max` after Redis adapter is confirmed working.

## 6. Health Check Route
The server exposes `GET /health/realtime` which returns:
- `status`: ok
- `uptime`: seconds
- `activeSockets`: count of connected users
- `engine`: socket.io

Use this endpoint for Nginx health checks or external monitoring (UptimeRobot, etc.).
