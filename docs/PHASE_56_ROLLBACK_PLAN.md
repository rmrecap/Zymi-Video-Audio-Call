# PHASE 56: ROLLBACK PLAN

## 1. Trigger Conditions
Rollback to Phase 55 state should be initiated if:
- Critical regression in WebRTC signaling discovered on real devices.
- Socket.io connection failures under load balancer (sticky session break).
- Database migration corruption or performance degradation.
- Production-blocking crash on Android or iOS.
- Unauthorized data access or secret leakage detected by Project Brain.

## 2. Infrastructure Rollback (Docker)
- **Image Rollback:** Revert to the last stable Docker image tagged `phase-55-final`.
- **Port Reversion:** Ensure no ports were changed (Phase 56 maintains 5000).
- **Environment:** If `.env` keys were modified, revert to `phase-55` backup.

## 3. Database Rollback (SQLite)
- **Backup Restoration:** Restore `zymi.db` from the backup taken immediately before Phase 56 deployment.
- **Migration Reversal:** If backup is unavailable, manually drop Phase 56 specific tables (if any were added additively, though Phase 56 is QA-only, Phase 55 added the Brain tables).
  - *Note:* Phase 56 did not add tables, but ensures Phase 55 tables are stable.

## 4. Mobile App Rollback
- **APK/IPA:** Re-distribute the `phase-55-final` debug build to testers.
- **Version Pinning:** If using a private registry, revert the version tag.

## 5. Communication Rollback
- **Socket.io:** If new events were added (none should be), revert `server/index.js` to Phase 55 logic.
- **WebRTC:** Revert `ice_server_config` if any experimental changes were made.

## 6. Verification Steps
After rollback, verify:
1. `/api/health` returns OK.
2. Login works.
3. Chat still functions.
4. Admin Dashboard (Brain) still loads Phase 55 data.

---
*Prepared by: Antigravity*
