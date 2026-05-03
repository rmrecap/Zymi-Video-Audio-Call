# PHASE 59: Coturn VPS Setup Guide (Self-Hosted TURN/STUN)

This guide provides instructions for setting up a self-hosted Coturn server on a dedicated VPS (Ubuntu 22.04+) to act as a fallback relay for WebRTC communication.

## 1. Prerequisites
- A dedicated VPS with a public IP.
- Ubuntu 22.04 LTS (recommended).
- Open ports: 3478 (UDP/TCP), 5349 (TCP - for TLS), 49160-49200 (UDP - for Relay).

## 2. Installation
```bash
sudo apt update
sudo apt install coturn -y
```

## 3. Configuration
Edit `/etc/turnserver.conf`:
```conf
# Basic Setup
listening-port=3478
tls-listening-port=5349

# IPs
listening-ip=0.0.0.0
# Replace with your VPS public IP
external-ip=YOUR_PUBLIC_IP

# Auth
fingerprint
lt-cred-mech
user=zymi_relay:secure_password_here
realm=zymi-relay.yourdomain.com

# Relay Ports
min-port=49160
max-port=49200

# Logging
log-file=/var/log/turn.log
simple-log

# Security
no-stdout-log
no-loopback-peers
no-multicast-peers
```

## 4. Enable Service
Edit `/etc/default/coturn`:
```bash
TURNSERVER_ENABLED=1
```

Restart Coturn:
```bash
sudo systemctl restart coturn
sudo systemctl enable coturn
```

## 5. Firewall Rules (UFW)
```bash
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp
sudo ufw allow 5349/tcp
sudo ufw allow 49160:49200/udp
sudo ufw allow 49160:49200/tcp
```

## 6. Testing
Use the [Trickle ICE Tool](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) to verify connectivity:
- STUN: `stun:YOUR_PUBLIC_IP:3478`
- TURN: `turn:YOUR_PUBLIC_IP:3478` (with username/password)

---
**Security Note:** Always use TLS (port 5349) with a valid SSL certificate (e.g., Let's Encrypt) in production to ensure credentials are not intercepted.
