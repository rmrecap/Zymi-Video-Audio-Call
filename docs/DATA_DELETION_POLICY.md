# ZYMI Data Deletion Policy

**DRAFT — NOT LEGAL ADVICE. Must be reviewed by a qualified attorney before publication.**

**Last Updated: June 1, 2026**

---

## 1. Purpose

This policy describes how ZYMI handles data deletion when a user deletes their account or requests data removal. We are committed to deleting your data promptly and completely, subject to legal retention requirements.

---

## 2. How to Delete Your Account

### 2.1 In-App Account Deletion (Recommended)
1. Open ZYMI.
2. Go to **Settings → Account → Delete Account**.
3. Confirm your choice by entering your password.
4. Your account and data will be deleted immediately.

### 2.2 Alternative Deletion Methods
If the in-app option is unavailable (e.g., you are locked out of your account), you can request account deletion by email:

- **Email**: [admin email — to be inserted]
- **Subject line**: "Account Deletion Request — [your username or email]"
- **Required information**:
  - Username (if known).
  - Email address associated with the account.
  - Reason for not using in-app deletion (optional).

We will verify your identity and process the deletion within 30 days of receiving your request.

---

## 3. What Data Is Deleted

Upon account deletion, the following data is permanently deleted:

| Data Type | Deletion Action | Timeline |
|-----------|----------------|----------|
| Username | Deleted from database | Immediate |
| Email address | Deleted from database | Immediate |
| Password hash | Deleted from database | Immediate |
| Profile photo | Deleted from file storage | Immediate |
| Messages (sent) | Deleted from database | Immediate |
| Messages (received) | Deleted from database | Immediate |
| Group memberships | Removed from groups; transferred for group ownership | Immediate |
| Call metadata | Deleted from database | Immediate |
| Uploaded files | Deleted from file storage | Immediate |
| Session tokens | Invalidated | Immediate |
| Connection logs | Deleted (if within 24-hour retention) | Immediate |
| IP address logs | Deleted (if within 30-day retention) | Immediate |

---

## 4. What Data Is Retained (and Why)

Some data may be retained for legitimate operational or legal purposes:

| Retained Data | Retention Period | Reason |
|---------------|-----------------|--------|
| Anonymized audit logs | 90 days | Security auditing and abuse investigation. These logs are anonymized (username replaced with a hash, no email or IP stored). |
| Content moderation flags | 90 days | Records of reported content and moderation actions are kept for consistency (e.g., to detect ban evasion). |
| Financial records (if applicable) | 7 years (or as required by tax law) | If any payments were processed (e.g., donations, subscriptions). |
| Backup data | Until next backup cycle | Deleted backups are overwritten on the next scheduled backup rotation (maximum 30 days). |

Retained data is no longer associated with your identity. Where possible, it is anonymized.

---

## 5. Deletion Timeline Summary

| Action | Timeline |
|--------|----------|
| Account deletion (in-app) | Immediate upon confirmation |
| Account deletion (email request) | Within 30 days of verified request |
| Anonymized audit log deletion | 90 days after account deletion |
| Content moderation flag deletion | 90 days after account deletion |
| Backup overwrite | Next scheduled backup cycle (max 30 days) |

---

## 6. Backup Deletion

Database backups are taken periodically and stored for disaster recovery purposes. When an account is deleted:
1. The deletion is written to the active database immediately.
2. Existing backup files may still contain the deleted data until they are rotated out.
3. The data will be purged from backups on the next backup cycle (when the old backup is overwritten by a new one).

If you need your data removed from backups urgently, contact the admin team.

---

## 7. Data Export Before Deletion

You can export your data before deleting your account:

### 7.1 In-App Export
Go to **Settings → Account → Export Data**. You will receive a ZIP file containing:
- Messages (JSON format — one file per chat).
- Call metadata (JSON).
- Account information (JSON).
- Uploaded media files (organized by chat).

### 7.2 Email Request Export
If the in-app export is unavailable:
1. Email [admin email — to be inserted] with subject: "Data Export Request — [your username]"
2. We will respond within 30 days with a download link.

---

## 8. GDPR / CCPA Deletion Requests

### 8.1 Right to Erasure (GDPR Article 17)
Users in the European Economic Area have the right to request deletion of their personal data without undue delay. We will process such requests within 30 days unless a legal exception applies.

### 8.2 CCPA Deletion Requests
California residents may request deletion of their personal information. We will verify the request and process it within 45 days (extendable by 45 additional days with notice).

### 8.3 How to Submit a Legal Rights Request
- **Email**: [admin email — to be inserted]
- **Subject line**: "GDPR/CCPA Deletion Request — [your full name]"
- **Required**: Your username and email address associated with the account.
- **Verification**: We may request additional information to verify your identity.

---

## 9. Account Deactivation vs. Deletion

| Feature | Deactivation | Deletion |
|---------|-------------|----------|
| Account accessible? | No (hidden/suspended) | No |
| Data preserved? | Yes | No |
| Reversible? | Yes (contact admin) | No |
| Messages visible to others? | Yes (as "deactivated user") | No |
| How to request | In-app settings → Deactivate | In-app settings → Delete |

We recommend deactivation if you are unsure about permanent deletion.

---

## 10. Children's Data

If we become aware that a user under 16 has created an account, we will delete the account and all associated data immediately. If you are a parent or guardian and believe your child under 16 has created an account, please contact us at [admin email — to be inserted].

---

## 11. Questions

For questions about data deletion, contact: [admin email — to be inserted]

---

*This document is a draft and must be reviewed by a qualified attorney before publication. It does not constitute legal advice.*
