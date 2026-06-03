# ZYMI Privacy Policy

**DRAFT — NOT LEGAL ADVICE. Must be reviewed by a qualified attorney before publication.**

**Last Updated: June 1, 2026**

---

## 1. Introduction

ZYMI ("we," "us," "our") operates a self-hosted, socket-first, privacy-focused chat and calling application. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use ZYMI.

ZYMI is designed for privacy. We do not sell your personal data. We do not use third-party analytics. Messages are stored on our servers and are not end-to-end encrypted (see E2EE architecture document for future plans). Our infrastructure is entirely self-hosted — no Firebase, no FCM, no third-party communication services.

By using ZYMI, you agree to the data practices described in this policy.

---

## 2. Data We Collect

### 2.1 Account Data
- **Email address** — Required for account creation, verification, and password recovery.
- **Username** — Required for account identification and display.
- **Profile photo** — Optional, uploaded by the user for display in chats.

### 2.2 Communications Data
- **Messages** — Text content of private and group messages, including timestamps and read receipts.
- **Call metadata** — Duration, participants, timestamps, and call type (voice/video) of calls. We do not record call audio or video content.
- **File shares** — Files, images, and media uploaded through the app, including metadata (file name, size, type).

### 2.3 Location Data
- **Nearby discovery location** — If you enable the Nearby feature, we collect approximate geolocation to discover other ZYMI users nearby. This is opt-in only and can be disabled at any time via in-app settings. Location data is fuzzed to prevent precise tracking.

### 2.4 Device and Technical Data
- **Device information** — Device model, OS version, app version.
- **IP address** — Collected for network connectivity and basic abuse prevention. IPs are not correlated with message content for profiling.
- **Connection logs** — Connection and disconnection timestamps for socket session management (stored temporarily).

### 2.5 Usage Statistics
- Aggregate, anonymized usage statistics (active users, message volume, call volume) are collected for operational monitoring. These cannot be traced back to individual users.

---

## 3. How We Collect Data

Data is collected through:
- **Registration form** — Email and username.
- **In-app actions** — Messages, calls, file uploads, profile edits.
- **Socket connections** — Connection metadata for session management.
- **Admin panel (ZRCS)** — System administrators may access user data only for legitimate operational purposes (abuse investigation, technical support).

---

## 4. How We Store Data

### 4.1 Infrastructure
All data is stored on servers we control. We do not use third-party cloud providers for user data storage.

### 4.2 Databases
- **PostgreSQL** — Primary data store for user accounts, messages, group memberships, and file metadata.
- **Redis** — In-memory cache for socket session state, typing indicators, online presence, and rate-limiting counters. Redis data is ephemeral and is not persisted.

### 4.3 File Storage
- Uploaded files are stored on the server filesystem or attached block storage, keyed by content hash. File access is gated through authenticated API endpoints.

### 4.4 Backups
- Database backups are taken periodically and stored in a secure, access-controlled location. Backups are encrypted at rest.

---

## 5. How We Share Data

### 5.1 Third-Party Sharing
We do not share your personal data with third parties. Specifically:
- We do not sell your personal data.
- We do not use third-party analytics services.
- We do not use Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNs) — all notifications are delivered via our own WebSocket infrastructure.
- We do not integrate third-party advertising networks, unless optional ads are explicitly enabled by the server administrator (see Section 11).

### 5.2 Law Enforcement Requests
If compelled by a valid legal order (subpoena, court order), we will disclose the minimum data required by law. We will notify you of such requests unless prohibited by law.

### 5.3 Service Providers
We may engage third-party service providers for infrastructure hosting (e.g., bare-metal server rental). These providers do not have logical access to user data.

---

## 6. Data Retention Periods

| Data Category | Retention Period | Rationale |
|---------------|-----------------|-----------|
| Messages | Until account deletion or 12 months of inactivity | Service functionality |
| Call metadata | Until account deletion or 12 months of inactivity | Service functionality |
| Uploaded files | Until account deletion or 12 months of inactivity | Service functionality |
| Account data (email, username) | Until account deletion | Account identification |
| Profile photo | Until account deletion or user removal | User preference |
| Location data (Nearby) | Not stored — ephemeral in-memory only | Privacy by design |
| IP address logs | 30 days | Abuse prevention |
| Anonymized audit logs | 90 days | Security auditing |
| Connection logs (socket) | 24 hours | Session management |
| Backups | 30 days (rotated) | Disaster recovery |

---

## 7. User Rights

You have the following rights regarding your personal data:

### 7.1 Access
You can access your account data at any time through in-app settings. For a full data export, see Section 10.

### 7.2 Correction
You can update your username and profile photo in-app. Email changes must be verified and can be requested through support.

### 7.3 Deletion
You can delete your account at any time via in-app settings (Settings → Account → Delete Account). See our Data Deletion Policy for details on what is deleted and retained.

### 7.4 Portability
You can request a data export of your messages, files, and account data in machine-readable format (JSON).

### 7.5 Withdraw Consent
You can disable Nearby location sharing at any time via in-app settings. Withdrawing consent does not affect the lawfulness of prior processing.

### 7.6 Object to Processing
You may object to any processing of your data for legitimate interests by contacting our admin team.

### 7.7 How to Exercise Rights
To exercise any of these rights, use the in-app settings or email the admin team at the address in Section 12. We will respond within 30 days as required by applicable law.

---

## 8. Cookies and Local Storage

ZYMI uses:
- **Local Storage** — JWT access token and refresh token are stored in the browser's localStorage (web app) or secure keychain (mobile app) for session persistence.
- **No tracking cookies** — We do not use cookies for advertising, analytics, or cross-site tracking.
- **SessionStorage** — Ephemeral session state (current chat, UI preferences) that is cleared when you close the app.

---

## 9. Age Requirement

ZYMI is not intended for users under the age of 16. By creating an account, you represent that you are at least 16 years of age. If we become aware that a user under 16 has created an account, we will delete the account and all associated data.

---

## 10. Data Security

We implement the following security measures to protect your data:

| Measure | Implementation |
|---------|---------------|
| Encryption in transit | TLS 1.3 for all HTTP/REST API traffic; WSS (WebSocket Secure) for all real-time communication. No plaintext communication. |
| Password hashing | Passwords are hashed using bcrypt with a cost factor of 12. |
| Parameterized queries | All database queries use parameterized statements to prevent SQL injection. |
| Input validation | Server-side input validation and sanitization on all user-supplied data. |
| Rate limiting | Per-IP and per-account rate limiting on authentication endpoints and message sending. |
| Session management | JWT tokens with short expiry (15 minutes for access, 7 days for refresh). Tokens are stored securely and never logged. |
| File upload restrictions | Allowed file types are whitelisted; file size limits are enforced; uploaded files are scanned (if virus scanner available). |
| Access controls | Admin panel (ZRCS) access is restricted to authorized administrators with unique credentials. All admin actions are logged. |

---

## 11. Optional Ads

If the server administrator enables advertising, ads are served from our own ad server — no third-party ad networks, trackers, or cookies. Ad impressions are anonymized. You cannot be personally identified through ad delivery. If ads are enabled, this will be clearly disclosed in the app.

---

## 12. Contact Information

For privacy-related inquiries, data requests, or concerns:

- **Email**: [admin email — to be inserted]
- **Response time**: We aim to respond within 48 hours for privacy inquiries.
- **Data Protection Officer**: [Name/Title — to be inserted]

---

## 13. Policy Updates

We may update this Privacy Policy from time to time. Material changes will be notified via:
- In-app notification on next login.
- Email notification (if you have provided a valid email).
- A notice on the ZYMI website.

The "Last Updated" date at the top of this policy will reflect the most recent revision. Continued use of ZYMI after changes constitutes acceptance of the updated policy.

---

## 14. Governing Law

This Privacy Policy is governed by the laws of [Jurisdiction — to be inserted]. If you are located in the European Economic Area (EEA) or the United Kingdom, you have the right to lodge a complaint with your local data protection authority.

---

## 15. Contact for GDPR/CCPA Compliance

- **GDPR Representative**: [Name/Entity — to be inserted]
- **CCPA Contact**: [Name/Entity — to be inserted]

**California Residents**: Under the California Consumer Privacy Act (CCPA), you have the right to know what personal information is collected, whether it is sold or disclosed, and to request deletion. ZYMI does not sell personal information.

---

*This document is a draft and must be reviewed by a qualified attorney before publication. It does not constitute legal advice.*
