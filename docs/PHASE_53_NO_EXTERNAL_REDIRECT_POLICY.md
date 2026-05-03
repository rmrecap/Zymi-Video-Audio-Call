# PHASE 53 — NO EXTERNAL REDIRECT POLICY

## 1. Permanent System Rule
Any phone number displayed or interacted with within the ZYMI ecosystem (Mobile or Web) must **NEVER** trigger an external redirect to:
- WhatsApp
- SMS / Messengers
- System Dialer (tel:)
- Web Browser

## 2. Rationale
- **User Retention:** Keeping users within ZYMI increases ecosystem engagement and session time.
- **Privacy:** External redirects expose the user's phone number to third-party platforms (Meta/WhatsApp, ISPs).
- **Security:** Internal routing allows ZYMI to apply block/ban policies and safety guards before communication starts.

## 3. The "Found" Workflow
1. **Normalization:** The phone number is converted to a canonical format (+880...).
2. **Internal Lookup:** The app queries the ZYMI database for a registered user matching that number.
3. **Internal Routing:**
   - If Found → Open the ZYMI private chat screen.
   - If Not Found → Inform the user that the number is not registered on ZYMI.

## 4. Enforcement
- **No `url_launcher`:** Use of `url_launcher` for `tel:` or `whatsapp://` schemes is strictly prohibited in the mobile app.
- **Audit Logs:** Every lookup attempt is logged (with masked phone numbers) for administrative oversight.
