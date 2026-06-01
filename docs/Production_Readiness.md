# ZYMI Production Readiness & Security Hardening Guide

This document details the configuration thresholds, operations procedures, and security policies governing the production-ready ZYMI communications platform.

---

## 1. Edge Layer: Protocol Hardening & SSL/WSS Lockdown

### 1.1 SSL & WSS Configuration
The Nginx edge layer is strictly locked down to prevent protocol downgrades (MitM attacks) and insecure connections.

*   **Protocols**: Only TLSv1.3 is active in production, disabling insecure ciphers and older handshakes.
*   **HSTS Enforced**: Strict-Transport-Security header is broadcast to all clients:
    ```nginx
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    ```
*   **Websocket Protection**: Any upgrade requests are strictly routed over WSS (encrypted under SSL). General HTTP (port 80) redirects permanently to HTTPS (port 443).

### 1.2 Nginx Cache-Purge Procedures
Micro-caches are held in memory for 2-second windows to optimize high-traffic bursts of configs.
*   **Bypassing Cache (for developers)**: Requests containing the header `Cache-Control: no-cache` bypass Nginx cache:
    ```nginx
    proxy_cache_bypass $http_cache_control;
    ```
*   **Manual Cache Purging**: To hard-purge all cache files from the Nginx host:
    ```bash
    rm -rf /var/cache/nginx/*
    nginx -s reload
    ```

---

## 2. Ingress Traffic Governance: Redis Distributed Rate Limiting

To prevent brute-force attacks and DDoS simulations, rate limiting is handled at the app tier via Redis:

*   **Rate Limits**: 1000 requests per 15 minutes per IP (`server/src/middleware/rateLimiter.js`).
*   **Redis Eviction Policy**: Redis is configured to reject new keys or evict keys based on the Least Recently Used strategy once memory is full:
    ```ini
    maxmemory 256mb
    maxmemory-policy allkeys-lru
    ```
*   **Fail-Safe In-Memory Fallback**: If Redis crashes, the rate limiter dynamically switches to a local in-memory store, preventing service interruption.

---

## 3. Application Tier: PM2 Cluster Ops & Auto-Healing

PM2 scales Node.js workers across all virtual CPU cores in cluster mode.

### 3.1 PM2 Configuration Schema (`ecosystem.config.cjs`)
```json
{
  "apps": [{
    "name": "zymi-server",
    "script": "index.js",
    "instances": "max",
    "exec_mode": "cluster",
    "max_memory_restart": "512M",
    "env": {
      "NODE_ENV": "production",
      "NODE_APP_INSTANCE_COUNT": "max"
    }
  }]
}
```

### 3.2 Auto-Healing & Hot Reloads
*   **Memory Ceiling**: PM2 monitors RSS memory. If a worker exceeds `512MB`, PM2 automatically terminates it and spawns a fresh worker.
*   **Staggered Reload (Zero-Downtime)**: Staggered restarts guarantee active websocket sessions remain connected to alternative workers:
    ```bash
    pm2 reload all --min-uptime 10s
    ```

---

## 4. Mobile Tier: R8 Obfuscation & ProGuard Rules

Android builds run ProGuard/R8 to obfuscate critical signaling and policy enforcement packages.

### 4.1 ProGuard Rules (`android/app/proguard-rules.pro`)
```pro
-keep class io.socket.** { *; }
-keep class com.google.gson.** { *; }
-keepnames class * extends java.lang.Exception

# Protect ZYMI Signaling & Governance logic
-keep class lib.services.realtime.** { *; }
-keep class lib.services.governance.** { *; }
```

### 4.2 Release Build Execution
To build the hardened production package:
```bash
flutter build apk --obfuscate --split-debug-info=build/app/outputs/symbols
```
*   **Obfuscation**: Obfuscates Dart code, stripping symbol names.
*   **Shrinking**: Removes dead code and unused assets via R8.
