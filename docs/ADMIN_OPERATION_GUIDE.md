# ZYMI Admin Operation Guide — ZRCS Dashboard

**Document Type:** Technical Operations Guide

**Last Updated:** June 1, 2026

---

## 1. Accessing the Admin Panel (ZRCS)

### URL
```
https://<your-server-domain>/zrcs/admin
```

### Login
- Use your administrator credentials (username and password).
- Two-factor authentication (TOTP) is required for all admin accounts. Configure in ZRCS → Settings → Security.

### First-Time Setup
1. Obtain the initial admin credentials from the server `.env` file (`ZRCS_ADMIN_USERNAME` and `ZRCS_ADMIN_PASSWORD`).
2. Log in and change your password immediately.
3. Set up TOTP two-factor authentication.
4. Create additional admin accounts for the team if needed (ZRCS → Settings → Admin Users).

---

## 2. Dashboard Overview

The ZRCS dashboard displays key metrics:

| Metric | Description | Location |
|--------|-------------|----------|
| **Active Users** | Users currently connected via WebSocket (real-time) | Top-left widget |
| **Total Users** | Registered user count | Top-left widget |
| **Messages Today** | Messages sent in the last 24 hours | Center widget |
| **Active Calls** | Current voice/video calls in progress | Center widget |
| **Pending Reports** | Open abuse reports requiring review | Top-right widget (with badge count) |
| **Server Uptime** | Time since last server restart | Bottom status bar |
| **System Load** | CPU, memory, disk usage | Bottom status bar |

---

## 3. User Management

### 3.1 Search Users
1. Navigate to **Users → Search**.
2. Enter username, email, or user ID.
3. Results show: username, email, registration date, last active, account status.

### 3.2 View User Details
Click a user to view:
- Account information (username, email, registration date, last IP).
- Message count, call count, file upload count.
- Ban history and moderation flags.
- Current session status (online/offline, connected device).

### 3.3 Ban a User
1. Navigate to the user's detail page.
2. Click **Ban User**.
3. Select ban duration:
   - **Temporary**: 7 days, 30 days, or custom duration.
   - **Permanent**: Indefinite.
4. Enter the reason (visible to the user on next login attempt).
5. Click **Confirm**.

The user will be disconnected from all active sockets immediately and prevented from reconnecting.

### 3.4 Unban a User
1. Navigate to **Users → Banned Users**.
2. Find the user in the list.
3. Click **Unban**.
4. Confirm.

The user will be able to log in again.

### 3.5 Delete a User Account
1. Navigate to the user's detail page.
2. Click **Delete Account**.
3. Enter confirmation text.
4. Click **Permanently Delete**.

This triggers the same deletion process as in-app account deletion. See Data Deletion Policy for details.

---

## 4. Content Moderation

### 4.1 Review Reported Messages
1. Navigate to **Moderation → Reports**.
2. Reports are listed by severity (Critical → High → Standard → Low).
3. Click a report to expand:
   - Shows the reported message content, sender, timestamp, and chat context.
   - Shows the reporter (anonymous to the reported user).
   - Shows the report reason and any additional notes.

### 4.2 Moderation Actions
For each report, you can:

| Action | Description |
|--------|-------------|
| **Approve Report** | Confirm the violation. Applies the recommended action (see below). |
| **Dismiss Report** | No violation found. Report is closed. No action taken. |
| **Dismiss with Warning** | Borderline case — sends a warning to the user without banning. |
| **Ban Author** | Opens the ban dialog for the message author. |
| **Delete Message** | Removes the specific message from all participants' views. |

### 4.3 Escalation
If a report involves illegal content (CSAM, threats, etc.):
1. Click **Escalate to Authorities**.
2. The system will preserve all evidence (message content, logs, user info).
3. Contact law enforcement directly (see Emergency Contacts, Section 9).

---

## 5. Audit Logs

### 5.1 Review Admin Actions
1. Navigate to **System → Audit Logs**.
2. Filter by:
   - Admin user.
   - Action type (ban, unban, delete message, delete account, login, settings change).
   - Date range.
3. Each log entry shows:
   - Timestamp.
   - Admin who performed the action.
   - Action type.
   - Target user/message.
   - Details/reason.

### 5.2 Export Audit Logs
1. Click **Export**.
2. Choose format: JSON or CSV.
3. Select date range.
4. The file will be downloaded.

---

## 6. System Health Check

### Health Endpoints (HTTP)
These endpoints are available for monitoring tools (e.g., UptimeRobot, Prometheus):

| Endpoint | Description | Expected Response |
|----------|-------------|-------------------|
| `GET /health` | General server health | `{ "status": "ok", "uptime": 12345 }` |
| `GET /health/db` | PostgreSQL connection check | `{ "status": "ok", "poolSize": 10, "activeConnections": 3 }` |
| `GET /health/redis` | Redis connection check | `{ "status": "ok", "pingMs": 2 }` |
| `GET /health/socket` | Socket.io server status | `{ "status": "ok", "connectedClients": 42 }` |
| `GET /health/storage` | File storage status | `{ "status": "ok", "diskUsagePercent": 65 }` |

### Dashboard Health Indicators
In the ZRCS dashboard, each service has a status indicator:
- **Green**: Healthy.
- **Yellow**: Degraded (high latency, high memory usage).
- **Red**: Critical (service down or unresponsive).

---

## 7. Backup Triggers

### Manual Database Backup (pg_dump)
1. Navigate to **System → Backups**.
2. Click **Trigger Manual Backup**.
3. The system will run `pg_dump` with the configured parameters.
4. A progress indicator shows backup status.
5. On completion, the backup file path is displayed.

### Manual Command (SSH)
```bash
# Navigate to the server directory
cd /opt/zimi

# Run the backup script
./scripts/backup.sh

# Or run pg_dump directly
pg_dump -U zimi_user -d zimi_db -F c -f /var/backups/zimi_$(date +%Y%m%d_%H%M%S).dump
```

### Automated Backup Schedule
| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full database | Daily at 03:00 UTC | 30 days |
| WAL archiving | Continuous | 7 days |
| File storage snapshot | Weekly | 30 days |

---

## 8. Server Restart Procedure

### Graceful Restart (Recommended)
1. Navigate to **System → Server**.
2. Click **Graceful Restart**.
3. The system will:
   a. Send a `server-restart` notification to all connected clients.
   b. Wait for active calls to finish (or force-disconnect after 5-minute timeout).
   c. Flush pending writes to PostgreSQL.
   d. Restart the Node.js process.
4. The dashboard will reconnect automatically when the server is back up.

### Hard Restart (SSH)
```bash
# Restart the service
sudo systemctl restart zimi

# Check status
sudo systemctl status zimi
```

### Emergency Restart
If the server is unresponsive:
```bash
ssh admin@<server-ip>
sudo systemctl restart zimi
```

---

## 9. Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| **System Administrator** | [Name/email/phone] | 24/7 for critical issues |
| **Developer On-Call** | [Name/email/phone] | Business hours + pager for P0 |
| **Hosting Provider** | [Provider support contact] | 24/7 |
| **Law Enforcement** | [Local authority contact] | As needed for illegal content |
| **Legal Counsel** | [Attorney name/email] | Business hours |

*These contacts should be filled in during deployment setup.*

---

## 10. Useful Commands (SSH)

```bash
# View real-time logs
journalctl -u zimi -f

# Check disk usage
df -h

# Check memory usage
free -h

# Check PostgreSQL status
sudo systemctl status postgresql

# Check Redis status
sudo systemctl status redis

# Manual backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh /var/backups/zimi_20260601_030000.dump

# Check SSL certificate expiry
openssl x509 -enddate -noout -in /etc/letsencrypt/live/<domain>/fullchain.pem
```

---

## 11. Security Notes

- Never share admin credentials.
- Always log out of ZRCS when done.
- Review audit logs weekly for suspicious admin activity.
- Rotate admin passwords every 90 days.
- Keep the server OS and all dependencies updated.
- Monitor failed login attempts to ZRCS (reported in audit logs).

---

*This is a technical operations guide, not a legal document. No legal review required.*
