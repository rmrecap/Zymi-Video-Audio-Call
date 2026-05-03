# PHASE 60: Real Coturn VPS Validation Guide

This guide provides a checklist and procedures for validating a production-ready self-hosted Coturn installation.

## 1. Service Integrity
Check if `coturn` is running correctly:
```bash
sudo systemctl status coturn
# Ensure 'active (running)'
```

## 2. Port Reachability Checklist
Ensure the following ports are open and responding on the public IP:
- **3478 (UDP)**: Primary STUN/TURN UDP
- **3478 (TCP)**: Primary TURN TCP
- **5349 (TCP)**: TURN TLS (Turns)
- **49160-49200 (UDP)**: Relay dynamic port range

Validate from a remote machine:
```bash
nc -zv YOUR_VPS_IP 3478
nc -zv YOUR_VPS_IP 5349
```

## 3. WebRTC Reachability Test
Use the **Project Brain / Connectivity** dashboard to trigger a real test.
- Verify status shows `ok` for UDP/TCP/TLS.
- Verify latency is within acceptable limits (< 250ms recommended).

## 4. Mobile Application Validation
1. **Force TURN Test**:
   - Enable "Force TURN" for your current country in Admin Panel.
   - Start a call or media transfer.
   - Verify the "Relay Mode" indicator appears on the mobile UI.
   - Verify usage appears in the **Relay Traffic Analysis** table.
2. **Auto-Fix Test**:
   - Use a network that blocks direct P2P.
   - Start a call.
   - Verify call transitions to relay mode after the configured timeout (e.g., 10s).
3. **Data Usage Check**:
   - Transfer a 10MB media file over relay.
   - Verify the **Bandwidth** reported in Admin Panel increases by ~10MB.

## 5. Cost Guard Verification
- Set a low daily limit (e.g., 5 mins / 10MB) for a test user.
- Exceed the limit.
- Verify the **Cost Guard Warning** appears in the Admin Panel and Project Brain.
- Verify `relay_usage_stats` anomalies are detected.

## 6. Troubleshooting
- **No UDP response**: Check UFW/Firewall rules or VPS provider security groups.
- **TLS Handshake Error**: Verify SSL certificates in `/etc/turnserver.conf`.
- **Relay Port Mismatch**: Ensure `min-port` and `max-port` in `turnserver.conf` match the VPS firewall settings.
