# PHASE 27 — Closed Beta Test Plan

**Status**: Draft — Ready for execution with 20–50 test users

## Scope

This test plan covers all core ZYMI features that must be verified before closed beta can begin. Each test case must be executed on at least 2 different devices (1 mobile + 1 desktop minimum) and on at least 2 different network types.

## Prerequisites

Before testing begins:
- Production server deployed (see PHASE 29)
- 20 test user accounts created (or registration enabled for testers)
- At least 2 test devices available (1 mobile, 1 desktop)
- Testers have received: server URL, test credentials, bug reporting template
- Backend logs accessible to monitor errors during testing
- Test period: minimum 7 consecutive days

---

## Test Case Index

| ID | Feature | Severity | Tester | Status |
|----|---------|----------|--------|--------|
| TC-001 | User Registration | Critical | | ⬜ |
| TC-002 | User Login | Critical | | ⬜ |
| TC-003 | OTP Verification | Critical | | ⬜ |
| TC-004 | Profile Setup | High | | ⬜ |
| TC-005 | Private Chat — Send Message | Critical | | ⬜ |
| TC-006 | Private Chat — Message Status | High | | ⬜ |
| TC-007 | Private Chat — Typing Indicator | Medium | | ⬜ |
| TC-008 | Private Chat — Offline Message Sync | High | | ⬜ |
| TC-009 | Group Chat — Create & Join | High | | ⬜ |
| TC-010 | Group Chat — Send & Receive | High | | ⬜ |
| TC-011 | 1:1 Voice Call | Critical | | ⬜ |
| TC-012 | 1:1 Video Call | Critical | | ⬜ |
| TC-013 | Group Call | High | | ⬜ |
| TC-014 | Media Upload — Image | High | | ⬜ |
| TC-015 | Image Compression | Medium | | ⬜ |
| TC-016 | Nearby Discovery | Medium | | ⬜ |
| TC-017 | Block User | High | | ⬜ |
| TC-018 | Report User | High | | ⬜ |
| TC-019 | Admin Ban/Unban | High | | ⬜ |
| TC-020 | Admin Dashboard Monitoring | Medium | | ⬜ |
| TC-021 | Call History | Medium | | ⬜ |
| TC-022 | Chat History | Medium | | ⬜ |
| TC-023 | Reconnect After Network Loss | Critical | | ⬜ |
| TC-024 | Logout | High | | ⬜ |
| TC-025 | Account Deletion | High | | ⬜ |
| TC-026 | Media Upload — Video | Low | | ⬜ |
| TC-027 | Presence / Online Status | High | | ⬜ |

---

## Detailed Test Cases

### TC-001: User Registration

| Field | Value |
|-------|-------|
| **Feature** | Registration |
| **Severity** | Critical |
| **Preconditions** | Registration enabled, database accessible |
| **Test Data** | New email, new username, strong password |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to registration page | Registration form is displayed |
| 2 | Enter valid username (e.g., `testuser_01`) | Field accepts input, no validation error |
| 3 | Enter valid email (e.g., `testuser_01@test.com`) | Field accepts input, no validation error |
| 4 | Enter password (min 8 chars, 1 uppercase, 1 number) | Field shows masked input |
| 5 | Confirm password (match) | Field shows masked input |
| 6 | Click "Register" | Button shows loading state |
| 7 | Wait for response | User is created, redirected to OTP verification or login |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with duplicate username, duplicate email, weak password, missing fields. Each should show appropriate error messages without crashing.

---

### TC-002: User Login

| Field | Value |
|-------|-------|
| **Feature** | Login |
| **Severity** | Critical |
| **Preconditions** | User account exists |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to login page | Login form is displayed |
| 2 | Enter valid username | Field accepts input |
| 3 | Enter valid password | Field shows masked input |
| 4 | Click "Login" | Loading state shown, redirected to main app |
| 5 | Verify main app loads | Dashboard, chat list, or home screen visible |
| 6 | Check JWT token in storage/localStorage | Token exists and contains valid expiration |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with wrong password, nonexistent username, expired account, banned account. Each should show appropriate error. Test rapid 6th login attempt — should return 429 rate limit.

---

### TC-003: OTP Verification

| Field | Value |
|-------|-------|
| **Feature** | Email OTP Verification |
| **Severity** | Critical |
| **Preconditions** | User registered, OTP sent to email |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check email inbox for OTP | OTP email received within 30 seconds |
| 2 | Enter the 6-digit OTP code | Field accepts input |
| 3 | Click "Verify" | Loading state, verification success |
| 4 | Check user email_verified status in DB | `email_verified = true` |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with wrong OTP, expired OTP (wait 6 minutes), re-send OTP, empty field. OTP email should not contain plaintext password or other sensitive data.

---

### TC-004: Profile Setup

| Field | Value |
|-------|-------|
| **Feature** | Profile Setup |
| **Severity** | High |
| **Preconditions** | User logged in |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to profile settings | Profile form with current data |
| 2 | Update display name | Field saves correctly |
| 3 | Upload profile picture (valid image, <2MB) | Image uploads, preview shows |
| 4 | Update bio / status text | Field saves correctly |
| 5 | Save changes | Success notification, data persists on reload |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with oversized image (>2MB), invalid file type (.exe), very long bio (should be truncated or rejected), special characters.

---

### TC-005: Private Chat — Send Message

| Field | Value |
|-------|-------|
| **Feature** | Private Message Send |
| **Severity** | Critical |
| **Preconditions** | Two users logged in on separate devices, both connected to Socket.io |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A navigates to conversation with User B | Chat window opens, message history loads |
| 2 | User A types a plain text message | Input field shows text |
| 3 | User A presses Enter / clicks Send | Message appears in chat with "sending" state |
| 4 | User B's chat window | Message appears in real time (within 2 seconds) |
| 5 | Check database for the message | Row exists in `messages` table with correct sender, recipient, content |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with empty message (should be blocked), very long message (>10k chars), special characters, emoji, RTL text.

---

### TC-006: Private Chat — Message Status

| Field | Value |
|-------|-------|
| **Feature** | Message Sent/Delivered/Seen Status |
| **Severity** | High |
| **Preconditions** | Two users in active chat |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A sends a message to User B | Message shows "sent" (single check) |
| 2 | User B is online and chat is open | Message transitions to "delivered" (double check) |
| 3 | User B views the message | Message transitions to "seen" (blue double check or filled) |
| 4 | User A checks the same conversation | Status indicators are consistent (same as User B's view) |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Verify that status persists after page refresh. Verify that seen status only applies when the message is actually visible in the viewport.

---

### TC-007: Private Chat — Typing Indicator

| Field | Value |
|-------|-------|
| **Feature** | Typing Indicator |
| **Severity** | Medium |
| **Preconditions** | Two users in active chat, Socket.io connected |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A starts typing in chat input | User B sees "User A is typing..." indicator |
| 2 | User A stops typing for 3+ seconds | Indicator disappears |
| 3 | User A sends the message | Indicator disappears immediately |
| 4 | User A clears the input | Indicator disappears |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with both users typing simultaneously. Verify no indicator appears for conversations the other user is not viewing.

---

### TC-008: Offline Message Sync

| Field | Value |
|-------|-------|
| **Feature** | Offline Message Delivery |
| **Severity** | High |
| **Preconditions** | Two user accounts, ability to disconnect network |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User B goes offline (disconnect network, close app) | User B is shown as offline to others |
| 2 | User A sends 5 messages to User B | Messages show as "sent" |
| 3 | User B reconnects (reopen app, restore network) | All 5 messages arrive, each marked "delivered" |
| 4 | User B reads the messages | Messages marked as "seen" for User A |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Critical test — this is the most common real-world scenario. Test with 1 minute offline, 1 hour offline. Verify messages are queued server-side and not lost.

---

### TC-009: Group Chat — Create & Join

| Field | Value |
|-------|-------|
| **Feature** | Group Chat Creation |
| **Severity** | High |
| **Preconditions** | At least 3 user accounts available |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A clicks "Create Group" | Group creation form displayed |
| 2 | User A enters group name (e.g., "Test Group") | Field accepts input |
| 3 | User A selects User B and User C as members | Selected users shown in member list |
| 4 | User A clicks "Create" | Group created, all members receive notification |
| 5 | User B opens the group | Group appears in conversation list |
| 6 | User C opens the group | Group appears in conversation list |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with empty group name, duplicate member selection, creating group with only 1 member, creating group with 50 members.

---

### TC-010: Group Chat — Send & Receive

| Field | Value |
|-------|-------|
| **Feature** | Group Messaging |
| **Severity** | High |
| **Preconditions** | Group with 3+ members exists |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A sends a message in the group | Message appears for all online members |
| 2 | User B (online) receives the message | Real-time delivery (within 2 seconds) |
| 3 | User C (offline) reconnects | Message appears in chat history |
| 4 | User A sends an image in the group | Image loads for all members |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Verify that a non-member cannot see group messages. Verify that removed members lose access to group history.

---

### TC-011: 1:1 Voice Call

| Field | Value |
|-------|-------|
| **Feature** | 1:1 Voice Call |
| **Severity** | Critical |
| **Preconditions** | Two users online, both have microphone permission, both on same network type (both WiFi or both mobile data) |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A initiates voice call to User B | Caller sees "Calling..." state |
| 2 | User B receives incoming call notification | Ringtone plays, accept/reject buttons shown |
| 3 | User B accepts the call | Both users connected, audio flows both directions |
| 4 | Both users speak | Audio is clear, <500ms latency |
| 5 | User A taps "End Call" | Call ends for both, call duration recorded |
| 6 | Check call_history table | Row exists with correct caller, callee, duration, type='voice' |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with User B rejecting, User B not responding (ringing timeout), both users on same network, different networks, poor network. This is the highest-risk feature.

---

### TC-012: 1:1 Video Call

| Field | Value |
|-------|-------|
| **Feature** | 1:1 Video Call |
| **Severity** | Critical |
| **Preconditions** | Two users online, both have camera + microphone permission |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A initiates video call to User B | Caller sees local camera preview |
| 2 | User B receives incoming video call | Ringtone plays, accept/reject buttons with camera preview |
| 3 | User B accepts the call | Both users see remote video + hear audio |
| 4 | Both users move around | Video tracks remote camera smoothly |
| 5 | User A toggles camera off | User B sees frozen/paused frame or camera-off indicator |
| 6 | User A toggles microphone mute | User B hears silence/mute indicator |
| 7 | User B ends the call | Call ends for both |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with low light, User B rejecting video but accepting voice (should fall back to voice), camera permission denied. Verify video resolution adapts to network.

---

### TC-013: Group Call

| Field | Value |
|-------|-------|
| **Feature** | Group Voice/Video Call |
| **Severity** | High |
| **Preconditions** | 3+ users online, group exists |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A starts a group call from the group | All online group members receive call notification |
| 2 | User B joins the call | User B is added to the call, audio flows |
| 3 | User C joins the call | User C is added to the call, audio flows |
| 4 | All 3 users speak | Each user can hear all others |
| 5 | User B leaves the call | Remaining users continue, User B removed |
| 6 | User A ends the call for everyone | Call ends for all participants |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Group call quality degrades with N participants in mesh topology. Document the maximum usable participants before audio breaks up.

---

### TC-014: Media Upload — Image

| Field | Value |
|-------|-------|
| **Feature** | Image Upload in Chat |
| **Severity** | High |
| **Preconditions** | Chat conversation open |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click attachment/upload button | File picker opens |
| 2 | Select a valid JPEG image (<2MB) | Upload progress shown |
| 3 | Wait for upload to complete | Thumbnail appears in chat, full-size viewable on click |
| 4 | Recipient receives the image | Image loads in recipient's chat |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with PNG, GIF, WebP, BMP (should be rejected or converted), >2MB file (should be rejected), corrupt image file (should show error).

---

### TC-015: Image Compression

| Field | Value |
|-------|-------|
| **Feature** | Server-Side Image Compression |
| **Severity** | Medium |
| **Preconditions** | Upload endpoint available, `sharp` library installed |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Upload a 1.5MB JPEG image | Image is uploaded successfully |
| 2 | Check the stored file size in uploads volume | File is <500KB (compressed) |
| 3 | Download and view the compressed image | Visually acceptable quality (no obvious artifacts) |
| 4 | Check server logs for compression message | `[COMPRESS] Image compressed: X% reduction` logged |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: If `sharp` is not installed, compression should fail gracefully and store the original. Verify this fallback path.

---

### TC-016: Nearby Discovery

| Field | Value |
|-------|-------|
| **Feature** | Nearby Users |
| **Severity** | Medium |
| **Preconditions** | Location permission granted, location services enabled, PostGIS installed |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A enables "Visible to Nearby" | User A appears in Nearby for other users |
| 2 | User B (within 10km) opens Nearby tab | User A appears in User B's Nearby list |
| 3 | User B taps on User A's profile | User A's public profile shown (no exact address) |
| 4 | User B sends a message from Nearby | Chat opens with User A |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Verify that the exact location is never exposed (fuzzed coordinates only). Test with User A > 10km away (should not appear). Test with location permission denied.

---

### TC-017: Block User

| Field | Value |
|-------|-------|
| **Feature** | Block User |
| **Severity** | High |
| **Preconditions** | Two users have an existing chat |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A blocks User B from chat or profile | Confirmation dialog shown |
| 2 | User A confirms the block | Block recorded, User B removed from chat list |
| 3 | User B tries to send a message to User A | Message fails to send or silently discarded |
| 4 | User A views blocked users list | User B appears in blocked list |
| 5 | User A unblocks User B | Chat is restored, both can message again |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Verify blocked user cannot initiate calls. Verify blocked user cannot see online status. Verify block persists across page refresh and relogin.

---

### TC-018: Report User

| Field | Value |
|-------|-------|
| **Feature** | Report User/Message |
| **Severity** | High |
| **Preconditions** | Chat between two users exists |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A opens a message from User B | Message visible in chat |
| 2 | User A selects "Report" option | Report form appears with reason dropdown |
| 3 | User A selects a reason (e.g., "Harassment") | Form shows selected reason |
| 4 | User A submits the report | Confirmation shown, report stored in DB |
| 5 | Admin checks message_reports table | Report appears with correct details |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test submitting report without selecting a reason (should be blocked). Test reporting the same message twice (should warn "Already reported"). Test reporting own message (should be blocked).

---

### TC-019: Admin Ban/Unban

| Field | Value |
|-------|-------|
| **Feature** | Admin User Ban/Unban |
| **Severity** | High |
| **Preconditions** | Admin account + regular user account |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin logs into ZRCS admin panel | Admin dashboard loads |
| 2 | Admin searches for User B | User B's profile appears |
| 3 | Admin clicks "Ban User" with reason "Spam" | Confirmation dialog |
| 4 | Admin confirms the ban | User B receives Socket.io `banned` event (if online) |
| 5 | User B tries to send a message | Message fails with "Account banned" error |
| 6 | User B logs out and tries to log in | Login fails with "Account banned" error |
| 7 | Admin unban User B | User B can log in and message again |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Verify ban persists across server restart. Verify ban timestamp is recorded. Verify unban does not restore messages that were deleted during ban.

---

### TC-020: Admin Dashboard Monitoring

| Field | Value |
|-------|-------|
| **Feature** | Admin Dashboard |
| **Severity** | Medium |
| **Preconditions** | Admin logged in, some user activity exists |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin navigates to Dashboard | Metrics load: active users, messages today, calls today, registrations |
| 2 | Admin checks "Active Users" count | Count matches server's `connectedClients` |
| 3 | Admin checks "Messages Today" count | Count matches DB query |
| 4 | Admin navigates to Audit Log | Admin actions listed with timestamp, user, action |
| 5 | Admin navigates to Reports | Reported messages listed with details |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test that non-admin users cannot access admin routes. Test that admin session expires and redirects to login.

---

### TC-021: Call History

| Field | Value |
|-------|-------|
| **Feature** | Call History |
| **Severity** | Medium |
| **Preconditions** | At least one call has been made |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User opens call history or chat with call history | Previous calls listed with date, duration, type |
| 2 | User taps on a call entry | Call details shown (participants, duration, time) |
| 3 | Check call_history table in DB | Row exists with correct data |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Verify missed calls are indicated. Verify call duration is accurate (+/- 1 second). Verify history shows incoming vs outgoing.

---

### TC-022: Chat History

| Field | Value |
|-------|-------|
| **Feature** | Chat History |
| **Severity** | Medium |
| **Preconditions** | Chat with previous messages exists |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User opens a conversation | Message history loads (paginated if many messages) |
| 2 | User scrolls up to load older messages | Older messages load without duplicate entries |
| 3 | User searches for a specific message | Search results highlight matching messages |
| 4 | User refreshes the page and reopens chat | History persists and loads correctly |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with 500+ messages in one conversation. Test loading performance. Verify no messages are lost in pagination.

---

### TC-023: Reconnect After Network Loss

| Field | Value |
|-------|-------|
| **Feature** | Socket.io Reconnection |
| **Severity** | Critical |
| **Preconditions** | User logged in, Socket.io connected |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User is connected and chatting | Messages send/receive normally |
| 2 | User disconnects WiFi (airplane mode or switch off) | UI shows "Reconnecting..." or "Offline" state |
| 3 | Wait 10 seconds | Client attempts reconnection (exponential backoff visible in logs) |
| 4 | User re-enables network | Client reconnects within 5 seconds |
| 5 | User checks messages | Pending outgoing messages sent, missed incoming messages received |
| 6 | Check server logs for disconnect/reconnect events | `[SOCKET] User disconnected`, `[SOCKET] User reconnected` logged |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with 5-second disconnection, 30-second disconnection, 5-minute disconnection. Test with server restart (all clients should reconnect). This is the most common failure mode in mobile apps.

---

### TC-024: Logout

| Field | Value |
|-------|-------|
| **Feature** | Logout |
| **Severity** | High |
| **Preconditions** | User logged in |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User opens settings/menu | Logout option visible |
| 2 | User clicks "Logout" | Confirmation dialog |
| 3 | User confirms logout | Socket.io disconnects, JWT token cleared from storage |
| 4 | User is redirected to login page | Login form displayed |
| 5 | User tries to navigate directly to app URL | Redirected to login (token missing) |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Verify that the JWT token is not usable after logout (requires token blacklisting — check implementation). Verify other tabs/devices remain logged in (single-session logout test separately).

---

### TC-025: Account Deletion

| Field | Value |
|-------|-------|
| **Feature** | Account Deletion |
| **Severity** | High |
| **Preconditions** | User logged in |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User opens settings/account | Account deletion option visible |
| 2 | User clicks "Delete Account" | Warning dialog with information about data loss |
| 3 | User confirms deletion | Account queued for deletion (or immediately deleted) |
| 4 | User is logged out | Redirected to login page |
| 5 | User tries to log in again | Login fails ("Account not found") |
| 6 | Admin checks users table | User marked as deleted or removed |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Test with user who has messages, calls, groups — verify cleanup or proper marking. Test with user who is the only admin of a group (group should transfer or dissolve).

---

### TC-026: Media Upload — Video

| Field | Value |
|-------|-------|
| **Feature** | Video Upload |
| **Severity** | Low |
| **Preconditions** | Chat open |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a video file (<10MB, MP4 format) | Upload progress shown |
| 2 | Wait for upload | Video thumbnail shown in chat |
| 3 | Recipient taps play | Video plays inline or opens in player |
| 4 | Test with unsupported format (.mkv, .avi) | Rejected with format error |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Video is lower priority for beta. Document any issues.

---

### TC-027: Presence / Online Status

| Field | Value |
|-------|-------|
| **Feature** | User Online/Offline Status |
| **Severity** | High |
| **Preconditions** | Two users logged in on separate devices |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Both users online | Each sees the other as "Online" or green indicator |
| 2 | User B closes app / disconnects | User A sees User B as "Offline" or "Last seen X ago" within 30 seconds |
| 3 | User B reconnects | User A sees User B as "Online" within 5 seconds |
| 4 | Both users in chat, User B starts typing | User A sees typing indicator |

| **Actual Result** | |
|-------------------|---|
| **Pass/Fail** | ⬜ |

**Notes**: Verify multi-tab presence (user on phone + desktop = still "Online"). Verify presence disappears after prolonged inactivity if configured.

---

## Multi-User Concurrent Test Scenarios

### Scenario S1: 5 Users Chat Storm
- 5 users simultaneously exchange messages (50 messages each, 1 second apart)
- **Success**: All messages delivered within 2 seconds, no messages lost, no server crash

### Scenario S2: 3 Users Call Overlap
- 3 users make calls simultaneously (User A→B, User C→D, User E→F)
- One call switches to video mid-call
- **Success**: All 3 calls connect, audio flows, no cross-talk between calls

### Scenario S3: Rapid Join/Leave Group
- User creates a group, adds 5 members, removes 2, adds 2 more, then leaves
- **Success**: Group state remains consistent for remaining members

### Scenario S4: Offline Catch-Up
- User A sends 20 messages to User B while User B is offline (10 min)
- User B reconnects
- **Success**: All 20 messages delivered, client UI remains responsive (no freeze from loading 20 messages at once)

### Scenario S5: Admin Actions During User Activity
- While 3 users are actively chatting, admin bans one user
- **Success**: Banned user receives `banned` event immediately, chat removed, remaining users continue unaffected

---

## Test Environment Configuration

### Required for Test Execution

| Resource | Requirement | Verified |
|----------|-------------|----------|
| Production-like server | Docker stack with PostgreSQL + Redis + Coturn | ⬜ |
| Domain with SSL | HTTPS + WSS working | ⬜ |
| Test user accounts | 20–50 accounts (can be programmatically created) | ⬜ |
| Web clients | Chrome, Firefox, Safari, Edge (latest 2 versions) | ⬜ |
| Mobile clients | Android app (APK), iOS app (TestFlight or sideload) | ⬜ |
| Network conditions | WiFi, 4G/5G cellular, throttled "slow 3G" | ⬜ |
| Server log access | `docker compose logs -f` during testing | ⬜ |

### Recommended Test Session Structure

| Session | Duration | Focus |
|---------|----------|-------|
| Session 1 | 2 hours | Registration, Login, Profile, OTP |
| Session 2 | 3 hours | Private Chat, Message Status, Typing, Offline |
| Session 3 | 3 hours | 1:1 Voice/Video Calls |
| Session 4 | 2 hours | Group Chat, Group Calls |
| Session 5 | 2 hours | Media Upload, Nearby, Block/Report |
| Session 6 | 2 hours | Admin actions, Ban/Unban, Dashboard |
| Session 7 | 2 hours | Reconnection, Network Switching, Logout, Deletion |
| Session 8 | 2 hours | Concurrent multi-user chaos testing |

---

## Pass/Fail Criteria for Beta Go Decision

| Requirement | Minimum Threshold |
|-------------|-------------------|
| TC-001 to TC-005 pass rate | 100% (all critical flows) |
| TC-011 to TC-012 pass rate | 100% (critical calls) |
| TC-023 pass rate | 100% (critical reconnect) |
| Overall pass rate | ≥ 90% |
| No critical bugs open | Yes |
| No high bugs open > 7 days | Yes |
| Server crash count | Zero during test period |
| Message loss rate | < 0.1% (no more than 1 lost per 1000) |
| Call connection success rate | > 95% |

---

## Bug Filing During Beta

All bugs found during testing must be filed using the template in `docs/BETA_BUG_TRACKER_TEMPLATE.md`. Bug files go in `docs/bugs/BUG-<NUMBER>.md`. The bug master index is maintained in the same document.

**Minimum bug report requirements**:
- Bug ID (sequential)
- Device, OS version, app version
- Network type at time of failure
- Exact steps to reproduce
- Expected vs actual result
- Severity (Critical/High/Medium/Low)
- Screenshot or video (for UI bugs)
- Server-side error logs (for backend bugs)

---

## Tester Instructions

```
Welcome to the ZYMI Closed Beta!

Thank you for helping us test. Please follow these rules:

1. Use the app naturally for at least 30 minutes per day.
2. Try to break things — send many messages, make calls, switch networks.
3. If something goes wrong, file a bug using the template (you'll receive a link).
4. Do NOT share your login credentials with anyone.
5. Do NOT use the app for illegal purposes or harassment.
6. Report any bugs within 24 hours of encountering them.
7. Join the tester chat group for real-time discussion.

Test period: 7-14 consecutive days
Server URL: <provided by admin>
Your credentials: <provided by admin>

Thank you for making ZYMI better!
```
