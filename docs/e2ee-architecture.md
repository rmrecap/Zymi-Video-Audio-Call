# ZYMI End-to-End Encryption Architecture

## Current Status

Messages are **encrypted in transit** (HTTPS/WSS) and **at rest** (database-level encryption recommended) but **not end-to-end encrypted**. Server can read plaintext messages.

## Encryption-Ready Architecture

The following abstraction layer is ready for future E2EE implementation without breaking current messaging.

### Key Exchange (Future)

| Component | Library | Purpose |
|-----------|---------|---------|
| X25519 key agreement | `@noble/curves` or `tweetnacl` | Generate shared secret per conversation |
| X3DH pre-key bundle | Custom protocol | Asynchronous key exchange for offline users |
| Double Ratchet | `@matrix-org/olm` | Continuous key rotation per message |

### Message Encryption (Future)

- **Algorithm**: AES-256-GCM per message
- **Key derivation**: HKDF-SHA256 from shared secret + message counter
- **Nonce**: Random 12 bytes, prepended to ciphertext
- **Authenticated**: GCM tag ensures integrity

### Data Format

```json
{
  "sender_id": 1,
  "receiver_id": 2,
  "encrypted_content": "base64-ciphertext",
  "nonce": "base64-nonce",
  "key_id": 1,
  "conversation_id": "1_2"
}
```

### Key Storage

- Private keys stored in IndexedDB (web) / Keychain (mobile) — never on server
- Public key bundles uploaded to server during registration
- Pre-key bundles (X3DH) uploaded for async messaging

### Migration Path

1. Add `encryption_key_id` column to `messages` table (nullable)
2. Add `is_encrypted` boolean column to `groups` table (already exists)
3. Client checks if peer has E2EE keys before marking conversation as encrypted
4. Fall back to plaintext if peer hasn't set up keys
5. Once both parties have keys, all new messages are E2EE

### Non-Breaking Guarantee

- Existing messages remain readable
- No existing events are modified
- New encrypted messages are still delivered via `private-message` event but with `encrypted: true` flag
- Server stores ciphertext but cannot decrypt
- Metadata (sender, receiver, timestamp) remains unencrypted for routing

### Libraries (Not Yet Installed)

These will be added when E2EE is activated:
- `@noble/curves` — X25519 key agreement
- `@noble/ciphers` — AES-256-GCM
- `@matrix-org/olm` — Double Ratchet (optional, for advanced protocol)

### Recommendation

- **Phase 1**: Add encryption columns and client-side key generation (non-breaking)
- **Phase 2**: Enable E2EE for new conversations with opt-in
- **Phase 3**: Make E2EE default for all 1-on-1 chats
