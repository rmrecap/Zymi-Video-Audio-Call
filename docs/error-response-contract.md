# ZYMI Error Response Contract

## Standard Error Shape

All API errors follow a consistent JSON shape:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {},
  "requestId": "uuid"
}
```

## Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `BAD_REQUEST` | Malformed request body or params |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Authenticated but not allowed |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate or state conflict |
| 422 | `VALIDATION_ERROR` | Input validation failure |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 503 | `SERVICE_UNAVAILABLE` | DB/Redis down or maintenance |

## Validation Error Details

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "username": "Username is required",
    "email": "Invalid email format"
  }
}
```

## Socket Error Shape

Socket events that fail emit:

```json
{
  "event": "event-name",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

## Error Logging

All 500 errors are logged server-side with:
- Request path and method
- User ID (if authenticated)
- Request ID
- Stack trace (development only)
