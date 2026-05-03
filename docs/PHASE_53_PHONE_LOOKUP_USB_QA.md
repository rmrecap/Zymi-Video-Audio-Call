# PHASE 53 — PHONE LOOKUP USB QA

## 1. Setup
- Connect Android device via USB.
- Ensure ZYMI Server is running on your PC.
- Find your PC LAN IP (`ipconfig` → `192.168.x.x`).

## 2. API Test
Ping the new health endpoint from your phone's browser or a tool:
`http://<PC_LAN_IP>:5000/api/health/user-lookup`
Expected: `{ "status": "ok", ... }`

## 3. Lookup Found Test
1. Register a user in the DB with a phone number (e.g., `+8801712345678`).
2. Inside the Flutter app, trigger a phone click for `01712345678`.
3. Expected: "ZYMI User Found" dialog appears with the correct username/avatar.
4. Click "Open Chat" → Navigation to private chat screen.

## 4. Lookup Not Found Test
1. Trigger a phone click for a number not in the DB.
2. Expected: "User Not Found" dialog with message: "এই নম্বরটি ZYMI-তে নিবন্ধিত নেই".
3. Verify NO redirect to the system dialer or WhatsApp happens.

## 5. Rate Limit Test
1. Rapidly click a phone number 11 times.
2. Expected: "খুব বেশি চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।" error appears.

## 6. Logs Check
Check server logs for masked entries:
`[AUDIT] Action: phone_lookup_found | Details: Looked up masked phone: +88017*****78`
Confirm NO raw phone numbers are visible in logs.
