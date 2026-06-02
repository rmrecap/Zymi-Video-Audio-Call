# ZYMI API Documentation

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5000` |
| Production | `https://your-domain.com` |

## Authentication

All protected endpoints require `Authorization: Bearer <token>` header.

### POST /api/register
Create a new user account.
```json
{ "username": "string", "email": "string", "password": "string" }
```

### POST /api/login
Authenticate and get JWT token.
```json
{ "username": "string", "password": "string" }
```

### POST /api/auth/logout
Invalidate current session (requires auth).

### GET /api/auth/me
Get current user profile.

### POST /api/auth/forgot-password
Request password reset OTP.
```json
{ "email": "string" }
```

### POST /api/auth/reset-password
Reset password with OTP.
```json
{ "email": "string", "otp": "string", "newPassword": "string" }
```

## Messaging

### GET /api/messages/conversations
Get all conversations with latest message and unread count.

### GET /api/messages/conversations/:peerId
Get messages with a specific user.
Query: `limit (50)`, `offset (0)`

### POST /api/messages/read
Mark messages as read.
```json
{ "senderId": "number" }
```

### GET /api/messages/search/:userId?q=query
Search messages by content.

## Calling

### GET /api/calls/:userId
Get call history for a user.

### GET /api/turn/ice-servers
Get STUN/TURN server configuration.

## Profile

### GET /api/profile/me
Get my profile.

### PATCH /api/profile/me
Update my profile.
```json
{ "displayName": "string", "statusText": "string" }
```

### GET /api/settings/me
Get user settings.

### PUT /api/settings/:userId
Update user settings.

## Nearby Discovery

### GET /api/nearby/users?lat=&lng=
Find nearby users with PostGIS proximity search.

### POST /api/nearby/update-location
Update user location.
```json
{ "lat": "number", "lng": "number" }
```

## OTP Verification

### POST /api/otp/email/request
Request email OTP.
```json
{ "email": "string" }
```

### POST /api/otp/email/verify
Verify email OTP.
```json
{ "otp": "string" }
```

### POST /api/otp/phone/request-link
Request phone verification link.

### POST /api/otp/phone/verify-inline
Verify phone OTP inline.

## Admin

### GET /api/admin/stats
System statistics (requires admin).

### GET /api/admin/users?search=&includeBanned=
List users with search/filter.

### POST /api/admin/ban
Ban a user.
```json
{ "userId": "number", "reason": "string" }
```

### POST /api/admin/unban
Unban a user.
```json
{ "userId": "number" }
```

### GET /api/admin/audit?limit=&adminId=&action=
Get audit logs.

### GET /api/admin/risks
Get system risk assessment.

### GET /api/admin/reports
Get pending message reports.

### GET /api/admin/export?format=json|csv
Export system data.

## Upload

### POST /api/upload/avatar
Upload avatar image (multipart/form-data).

### GET /api/avatar/:userId
Get user avatar.

### DELETE /api/upload/avatar
Delete avatar.

### POST /api/messages/upload
Upload message file attachment.

## Health

### GET /health
Server health check.

### GET /api/health/db
Database health check.

## Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `userId` | Join socket room |
| `private-message` | `{ to, from, content, tempId }` | Send message |
| `typing` | `{ to, from }` | Typing indicator |
| `stop-typing` | `{ to, from }` | Stop typing |
| `message-read` | `{ messageId, senderId, receiverId }` | Read receipt |
| `message-delivered` | `{ messageId, senderId, receiverId }` | Delivery receipt |
| `call-user` | `{ to, from, offer, type }` | Initiate call |
| `make-answer` | `{ to, answer }` | Answer call |
| `ice-candidate` | `{ to, candidate }` | ICE candidate |
| `end-call` | `{ to, from }` | End call |
| `reject-call` | `{ to, from }` | Reject call |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new-message` | `message object` | New message received |
| `message-sent` | `{ tempId, id }` | Message sent confirmation |
| `message-status-update` | `{ messageId, status, receiverId }` | Status update |
| `user-online` | `{ userId }` | User came online |
| `user-offline` | `{ userId, lastSeen }` | User went offline |
| `user-typing` | `{ from }` | User typing |
| `user-stop-typing` | `{ from }` | User stopped typing |
| `incoming-call` | `{ from, offer, type, callerName }` | Incoming call |
| `call-answer` | `{ answer }` | Call answered |
| `call-ended` | `{ from, reason }` | Call ended |
| `call-rejected` | `{ from, reason }` | Call rejected |
| `call-timeout` | `{ to, callId }` | Call timed out |
| `banned` | `{ reason }` | Account banned |
| `heartbeat-ack` | `{ ts }` | Heartbeat acknowledgment |
