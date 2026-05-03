# PHASE 52 — NO FIREBASE POLICY

## Permanent Rule
ZYMI does NOT use Firebase, FCM (Firebase Cloud Messaging), or any third-party push notification service.

This decision is final and must not be reversed unless the project owner explicitly re-approves it in writing.

## Rationale
- **Data Sovereignty:** All user metadata (IDs, call timestamps, connection states) remains strictly on the ZYMI VPS. No data flows to Google/Firebase servers.
- **Architecture Simplicity:** The Socket.io signaling layer handles all real-time delivery. Adding FCM would create a dual-path delivery system that increases complexity without proportional benefit for the current use case.
- **Cost Control:** Firebase services are free at low scale but introduce unpredictable costs at scale. The self-hosted Socket.io architecture scales linearly with VPS resources.

## Background Call Limitation
Without FCM, if the app is fully killed or in deep OS sleep, incoming calls will NOT ring. This is an accepted trade-off. The app clearly communicates this limitation to users in the Settings screen.

## Deprecated References
The following Phase 51 documents contained Firebase/FCM references and have been superseded:
- `PHASE_51_FCM_CALL_DELIVERY_PLAN.md` — DELETED
- `PHASE_51_BACKGROUND_CALL_QA_MATRIX.md` — DELETED
- `PHASE_51_PLAY_STORE_PRIVACY_CHECKLIST.md` — UPDATED (FCM references removed)
