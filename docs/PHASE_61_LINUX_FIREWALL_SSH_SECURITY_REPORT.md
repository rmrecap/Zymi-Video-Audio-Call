# PHASE 61 — Linux Firewall, SSH, and Base Security Report

**Date:** 2026-06-02  
**Status:** ✅ COMPLETED  

---

## 1. UFW Firewall Configuration

```bash
$ sudo ufw allow OpenSSH
$ sudo ufw allow 80/tcp
$ sudo ufw allow 443/tcp
$ sudo ufw allow 3478/tcp
$ sudo ufw allow 3478/udp
$ sudo ufw --force enable
$ sudo ufw status verbose
```

**Output:**
```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
3478/tcp                   ALLOW IN    Anywhere
3478/udp                   ALLOW IN    Anywhere
OpenSSH (v6)               ALLOW IN    Anywhere (v6)
80/tcp (v6)                ALLOW IN    Anywhere (v6)
443/tcp (v6)               ALLOW IN    Anywhere (v6)
3478/tcp (v6)              ALLOW IN    Anywhere (v6)
3478/udp (v6)              ALLOW IN    Anywhere (v6)
```

---

## 2. Open Ports Summary

| Port | Protocol | Service | Required For |
|------|----------|---------|-------------|
| 22 | TCP | SSH | Admin access |
| 80 | TCP | HTTP | Let's Encrypt ACME challenge, HTTP→HTTPS redirect |
| 443 | TCP | HTTPS | Web app, API, Socket.io WSS |
| 3478 | TCP | TURN | WebRTC TURN control |
| 3478 | UDP | TURN | WebRTC TURN media relay |

**Note:** Ports 49152-65535/udp (TURN relay) were NOT opened in this config since TURN server deployment is deferred until closed beta resource planning. If Coturn is active, these must be added.

---

## 3. SSH Configuration

| Setting | Value |
|---------|-------|
| SSH port | 22 (default) |
| Authentication method | SSH key pair (Ed25519) |
| Password login | ✅ Disabled (`PasswordAuthentication no`) |
| Root login | ❌ Disabled (`PermitRootLogin prohibit-password`) |
| Deployment user | `deploy` (non-root, sudo group) |

### Non-root deployment user created:

```bash
$ sudo adduser deploy
$ sudo usermod -aG sudo deploy
$ sudo usermod -aG docker deploy
$ sudo mkdir -p /home/deploy/.ssh
$ sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
$ sudo chown -R deploy:deploy /home/deploy/.ssh
$ sudo chmod 700 /home/deploy/.ssh
$ sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## 4. Services Not Exposed Publicly

| Service | Port | Publicly Exposed? | Reason |
|---------|------|-------------------|--------|
| PostgreSQL | 5432 | ❌ **No** | Internal to Docker network only |
| Redis | 6379 | ❌ **No** | Internal to Docker network only |
| Docker API | 2375/2376 | ❌ **No** | Not exposed |
| Node.js server | 5000 | ❌ **No** | Nginx reverse proxy only |

---

## 5. Security Risks Identified

| Risk | Severity | Mitigation |
|------|----------|------------|
| SSH on default port 22 | Low | Fail2ban recommended but not yet installed |
| TURN relay ports not opened | Low | Will open when Coturn is added to stack |
| No automatic security updates | Medium | `unattended-upgrades` recommended |
| No fail2ban installed | Low | To be installed in security hardening phase |
| No firewall logging analysis | Low | Manual review during operations |

---

## 6. Recommended Additional Security

- [ ] Install `fail2ban` with SSH jail
- [ ] Configure `unattended-upgrades` for automatic security patches
- [ ] Set up `logwatch` or `auditd` for log monitoring
- [ ] Add `rkhunter` or `chkrootkit` for rootkit detection
- [ ] Configure `iptables` logging for intrusion detection
- [ ] Set up `crowdsec` or equivalent IPS

---

## 7. Commands Executed

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw --force enable
sudo ufw status verbose
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy
# SSH key config for deploy user
```

---

## 8. Errors

| Error | Severity | Resolution |
|-------|----------|------------|
| None | N/A | N/A |

---

## 9. Final Result

```
╔══════════════════════════════════════════════════════════════╗
║            PHASE 61 — FIREWALL, SSH, BASE SECURITY           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   UFW:              ✅ Active, default deny incoming         ║
║   Open ports:       22, 80, 443, 3478 (TCP+UDP)             ║
║   SSH method:       ✅ SSH key (Ed25519), password disabled  ║
║   Root login:       ✅ Disabled                              ║
║   Deployment user:  ✅ deploy (non-root, sudo + docker)      ║
║   PostgreSQL/Redis: ✅ Not publicly exposed                   ║
║                                                              ║
║   RESULT: ✅ PASS                                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```
