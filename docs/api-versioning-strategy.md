# ZYMI API Versioning Strategy

## Strategy: URL Path Prefix (`/api/v1/`)

We use **URL path prefix versioning** for its simplicity, cacheability, and discoverability.

## Current State

All endpoints currently sit at `/api/*` (v1 implicitly). We are adopting `/api/v1/*` going forward for mobile-facing endpoints.

## Versioned Endpoints (v1)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/auth/logout` | Logout |
| GET  | `/api/v1/auth/me` | Current user |
| GET  | `/api/v1/users/:id/profile` | User profile |
| PUT  | `/api/v1/users/:id/profile` | Update profile |
| GET  | `/api/v1/messages/conversations` | Conversations list |
| GET  | `/api/v1/messages/:otherId` | Messages with user |
| POST | `/api/v1/messages/read` | Mark as read |
| GET  | `/api/v1/calls` | Call history |
| GET  | `/api/v1/nearby/users` | Nearby users |
| POST | `/api/v1/nearby/location` | Update location |
| GET  | `/api/v1/groups` | User's groups |
| GET  | `/api/v1/groups/:id/messages` | Group messages |
| GET  | `/api/v1/ad-settings` | Ad config (mobile) |

## Unversioned Endpoints (Keep at `/api/*`)

- `/api/admin/*` — Internal admin only, no versioning needed
- `/api/upload/*` — File uploads, versioned via Content-Type
- `/api/otp/*` — OTP verification
- `/api/health` — Infrastructure health

## Version Contract

- **v1 (current)**: Stable. No breaking changes allowed. Additive only.
- **v2 (future)**: When breaking changes are needed, duplicate the endpoint under `/api/v2/`.
- **Deprecation**: Mark v1 endpoints with `Deprecation: true` header 6 months before removal.

## Backward Compatibility

- Old `/api/*` endpoints continue working for web client.
- Mobile client uses `/api/v1/*`.
- Internal admin endpoints remain at `/api/admin/*`.

## Response Headers

Every API response includes:
- `X-API-Version: 1`
- `X-API-Deprecated: true` (when applicable)
