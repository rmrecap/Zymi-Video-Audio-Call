# ZYMI Support Workflow

**Document Type:** Operations Guide

**Last Updated:** June 1, 2026

---

## 1. Support Channels

| Channel | Best For | Availability |
|---------|----------|--------------|
| **In-App Report** | Abuse reports, content violations | 24/7 (async review) |
| **Email** | Account issues, data requests, general inquiries | Business hours + SLA tracking |
| **Admin Panel (ZRCS)** | User lookup, ban management, message removal | Admin-only |

### Support Email
[admin email — to be inserted]

---

## 2. Response SLAs

Tickets are prioritized by severity:

| Priority | Label | Definition | Target Response Time |
|----------|-------|------------|----------------------|
| **P0 — Critical** | 🔴 System down, security breach, illegal content, data loss | Service is unavailable or actively harmful. | 4 hours |
| **P1 — High** | 🟠 Account compromised, can't log in, major feature broken | Core functionality impacted. Workaround may or may not exist. | 24 hours |
| **P2 — Medium** | 🟡 Feature not working correctly, minor data issue | Non-critical feature affected. Workaround generally exists. | 72 hours |
| **P3 — Low** | 🔵 Feature request, cosmetic bug, documentation question | No immediate impact. | 1 week |

### SLA Exceptions
- Tickets submitted outside business hours (defined as 09:00–18:00 local time) will be queued and processed the next business day, unless marked P0.
- P0 tickets are monitored 24/7.

---

## 3. Escalation Path

```
User Ticket (Email / In-App Report)
       │
       ▼
   [First-Line Support] ─── Handles P2, P3
       │                         │
       │                    Resolved? → Close ticket
       │                         │
       │                    No → Escalate
       ▼                              │
   [Admin Team] ─────────────── Handles P1
       │                              │
       │                         Resolved? → Close ticket
       │                              │
       │                    No → Escalate
       ▼                                   │
   [Developer / Engineering] ─── Handles P0
                                          │
                                     Resolved? → Deploy fix → Close ticket
```

### Escalation Rules
- **First-line → Admin**: If a ticket is not resolved within the SLA timeframe, or if the issue requires user data access or moderation actions.
- **Admin → Developer**: If the issue is a confirmed software bug, requires a code change, or involves server infrastructure.
- **Direct to Developer**: All P0 tickets go directly to the developer/on-call engineer.

---

## 4. Common Issues and Solutions

### 4.1 Can't Log In

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| "Invalid credentials" | Wrong username/password | Use "Forgot Password" to reset. |
| "Account suspended" | Account banned | User received ban notification. Check ban status in ZRCS. |
| "Server unreachable" | Server down or network issue | Check server health. Verify domain DNS. |
| "Session expired" | Token expired | Cleat app data and log in again. |

### 4.2 Message Not Sending

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Red exclamation mark on message | Socket disconnected | Check internet connection. Reconnect (app auto-retries). |
| "Message too long" | Exceeds 10,000 character limit | Split message into multiple messages. |
| "Rate limited" | Sending too many messages | Wait 30 seconds and try again. |
| "User blocked you" | Recipient has blocked sender | Inform user. No workaround. |
| Message shows as sent but recipient doesn't see it | Recipient's WebSocket disconnected | Check their online status. Server will deliver on reconnection. |

### 4.3 Call Not Connecting

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| "Call failed" | WebRTC ICE connection failure | Ensure both users are on stable internet. Try switching WiFi/mobile data. |
| No audio | Microphone permission denied | Check device permissions for ZYMI. |
| No video | Camera permission denied | Check device permissions. Restart app. |
| "User is busy" | User is already in a call | Try again later. |
| Call connects but drops after 30 seconds | NAT/firewall blocking TURN relay | Contact admin to verify TURN server configuration. |

### 4.4 Forgot Password

1. On login screen, tap **Forgot Password**.
2. Enter your registered email address.
3. Check your email for a password reset link (valid for 15 minutes).
4. Click the link and enter your new password.

If you don't receive the email:
- Check spam folder.
- Verify the email address is correct.
- Contact support for manual password reset.

---

## 5. Bug Report Format

When reporting a bug, please use the following format. This matches our BETA_BUG_TRACKER_TEMPLATE.md (see `docs/BETA_BUG_TRACKER_TEMPLATE.md`).

```
**Device**: [e.g., Samsung Galaxy S22, iPhone 14, Web - Chrome]
**OS Version**: [e.g., Android 14, iOS 17.4, Windows 11]
**App Version**: [e.g., ZYMI Mobile v1.0.0, ZYMI Web v1.0.0]
**Feature**: [e.g., Private Chat, 1:1 Video Call, Registration]
**Steps to Reproduce**:
1. ...
2. ...
**Expected**: ...
**Actual**: ...
**Screenshots/Logs**: [attach if applicable]
```

File bugs in `docs/bugs/BUG-<NUMBER>.md` following the template.

---

## 6. How to Get Help

### Self-Service
- **In-app FAQ**: Settings → Help → FAQ.
- **Documentation**: See files in the `docs/` directory:
  - `TERMS_OF_SERVICE_DRAFT.md`
  - `PRIVACY_POLICY_DRAFT.md`
  - `COMMUNITY_GUIDELINES.md`

### Contact Support
- **Email**: [admin email — to be inserted]
- **Include**: Your username, a description of the issue, steps to reproduce, and any screenshots/logs.
- **Priority**: Set the subject line prefix to indicate urgency:
  - `[P0]` — Critical (system down, security issue).
  - `[P1]` — High (can't log in, major feature broken).
  - `[P2]` — Medium (feature issue).
  - `[P3]` — Low (question, suggestion).

Example subject: `[P1] Cannot log in after password reset - username: johndoe`

### Our Commitment
- We will acknowledge your ticket within 4 hours (P0), 24 hours (P1), or 72 hours (P2/P3).
- We will keep you updated on progress.
- We will not share your ticket details with third parties.

---

## 7. Ticket Lifecycle

```
  SUBMITTED ─── User submits ticket
       │
       ▼
  ACKNOWLEDGED ─── Support confirms receipt (auto or manual)
       │
       ▼
  INVESTIGATING ─── Support/admin/developer is working on it
       │
       ▼
  RESOLVED ─── Fix applied, user notified
       │
       ▼
  CLOSED ─── User confirms resolution, or 7 days without response
```

---

## 8. Support Team Guidelines

- **Be respectful**: Always polite, even with frustrated users.
- **Be transparent**: If you don't know the answer, say so and escalate.
- **Protect privacy**: Never share another user's information. Never share server credentials.
- **Document**: Log every ticket interaction.
- **Follow up**: If a user doesn't respond within 7 days, close the ticket with a note.

---

*This is an operations guide, not a legal document. No legal review required.*
