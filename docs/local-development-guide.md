# ZYMI Local Development Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (with PostGIS extension)
- Redis 7+
- Flutter SDK 3+ (for mobile)
- npm or yarn

## Server Setup

```bash
# 1. Navigate to server
cd server

# 2. Install dependencies
npm install

# 3. Configure environment
copy .env.example .env
# Edit .env:
# - Set DATABASE_URL to your PostgreSQL connection
# - Set REDIS_URL if using Redis
# - Set JWT_SECRET to a random string
# - Set CLIENT_ORIGIN to http://localhost:5175

# 4. Start the server
npm run dev
```

The server starts on `http://localhost:5000` and auto-reloads on changes.

## Client Setup

```bash
# 1. Navigate to client
cd client

# 2. Install dependencies
npm install

# 3. Configure environment
copy .env.example .env
# Edit .env:
# - VITE_API_URL=http://localhost:5000
# - VITE_SOCKET_URL=http://localhost:5000

# 4. Start dev server
npm run dev
```

The client starts on `http://localhost:5175`.

## Mobile Setup

```bash
# 1. Navigate to mobile app
cd mobile/zymi_mobile_app

# 2. Get Flutter dependencies
flutter pub get

# 3. Run on device/emulator
flutter run
```

## Database Setup

### Option 1: Local PostgreSQL
```bash
# Create the database
createdb zymi_db

# Enable PostGIS
psql -d zymi_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### Option 2: Docker PostgreSQL
```bash
docker run -d \
  --name zymi-postgres \
  -e POSTGRES_USER=zymi_user \
  -e POSTGRES_PASSWORD=zymi_password \
  -e POSTGRES_DB=zymi_db \
  -p 5432:5432 \
  postgis/postgis:15-3.3-alpine
```

## Redis Setup

### Option 1: Local Redis
```bash
redis-server
```

### Option 2: Docker Redis
```bash
docker run -d --name zymi-redis -p 6379:6379 redis:7-alpine
```

## Testing

```bash
# Server tests (need server running)
cd server
node --test src/__tests__/*.test.js

# Client build verification
cd client
npm run build
```

## Verification Checklist

- [ ] Server starts without errors (`node index.js`)
- [ ] Client builds successfully (`npm run build`)
- [ ] Login/register flow works
- [ ] Real-time messaging works between two browsers
- [ ] Typing indicators work
- [ ] Voice/video calls connect
- [ ] Nearby discovery returns results
- [ ] Admin panel loads at /exclusivesecure
- [ ] File uploads work
- [ ] OTP verification works
