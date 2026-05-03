# PHASE 55: DEPENDENCY EXCEPTION REPORT - NODEMAILER

## 1. Package Identification
- **Name:** `nodemailer`
- **Version:** `^8.0.7`
- **Type:** Open-source Node.js library (MIT License)

## 2. Hard Lock Context
The ZYMI Project has a "hard lock" against:
- Third-party authentication services (Firebase, etc.)
- Paid SMS gateways
- External communication redirects

## 3. Exception Rationale
- **Self-Hosted Nature:** `nodemailer` is a library, not a service. It allows the ZYMI server to act as its own email client, connecting to any standard SMTP server (internal or external) without being tied to a specific provider.
- **Protocol Support:** It implements standard protocols (SMTP, LMTP, POP3) which are essential for the self-hosted requirement.
- **Security:** It supports modern security standards like STARTTLS and OAuth2, ensuring that credentials managed by the `SmtpConfigService` are transmitted securely.
- **No Redirects:** It sends emails directly from the server backend, avoiding external browser or app redirects.

## 4. Risks & Mitigations
- **Risk:** New dependency could increase attack surface.
- **Mitigation:** Used only in a isolated `emailService.js`. All SMTP credentials are encrypted at rest using AES-256-CBC.
- **Risk:** Version conflicts with existing packages.
- **Mitigation:** Verified compatibility with Node.js 18+ and existing ESM configuration.

## 5. Decision
**APPROVED FOR CONTINUED USE.** The inclusion of `nodemailer` is strictly additive and supports the goal of a fully self-hosted, independent verification system without violating the core intent of the communication hard locks.

---
*Date: 2026-05-02*
*System Agent: Antigravity*
