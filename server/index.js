import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';

dotenv.config();

import { config, isProduction } from './src/config/env.js';

import { initDatabase } from './src/db/database.js';
initDatabase();

import { runMigrations } from './src/db/migrations.js';
runMigrations();

import { initAdminSeed } from './src/config/adminSeed.js';
initAdminSeed();

import { createBlockTable } from './src/services/blockService.js';
createBlockTable();

import { createReportsTable } from './src/services/reportService.js';
createReportsTable();

import { createCallHistoryTable } from './src/services/callHistoryService.js';
createCallHistoryTable();

import { initCallState } from './src/services/callStateService.js';
initCallState();

import { initMetrics } from './src/services/metricsService.js';
initMetrics();
import { logAudit } from './src/services/auditService.js';

import healthRoutes from './src/routes/healthRoutes.js';
import clientErrorRoutes from './src/routes/clientErrorRoutes.js';
import { attachAuthMiddleware } from './src/socket/socketAuthGuard.js';
import { initRedis, getRedisAdapter } from './src/socket/redisAdapter.js';
import { initPostgres, isPostgresReady } from './src/db/postgres.js';
import { authRateLimit, exportRateLimit } from './src/middleware/rateLimit.js';

import { setupCallSocket } from './src/socket/callSocket.js';
import { setupChatSocket } from './src/socket/chatSocket.js';
import { get, run } from './src/db/database.js';
import { isBlocked } from './src/routes/blockRoutes.js';

import { register, login, adminLogin } from './src/routes/authRoutes.js';
import { getUsers, getMessages, searchMessages, getUnread, markAsRead } from './src/routes/messageRoutes.js';
import { editMessage, getMessageEdits } from './src/routes/messageEditRoutes.js';
import { getProfile, updateProfile, getMyProfile, updateMyProfile, getUserSettings, updateUserSettings, changePassword as changeUserPassword } from './src/routes/profileRoutes.js';
import {
  getStats, getUsers as getAdminUsers, banUser, unbanUser,
  getAudit, getRisks, getPermissions, updateUserRole, changePassword as changeAdminPassword, exportData,
  getMigrationStatus, getMessageHealth, getCallHealth, getSocketRegistryHealth, getAiAnalysis
} from './src/routes/adminRoutes.js';
import { requireAuth, requireAdmin } from './src/middleware/authMiddleware.js';
import { block, unblock, checkBlock, listBlocked } from './src/routes/blockRoutes.js';
import { reportMessage, reportUser, getAllReports, resolveMessageReport } from './src/routes/reportRoutes.js';
import { getUserCallHistory } from './src/routes/callHistoryRoutes.js';
import { uploadAvatar, getAvatar, deleteUserAvatar, uploadMessageFile, getMessageFile } from './src/routes/uploadRoutes.js';
import adminFeatureRoutes from './src/routes/adminFeatureRoutes.js';
import nearbyRoutes from './src/routes/nearbyRoutes.js';
import adControlRoutes from './src/routes/adControlRoutes.js';
import userLookupRoutes from './src/routes/userLookupRoutes.js';
import authRouter from './src/routes/authRoutes.js';
import otpRoutes from './src/routes/otpRoutes.js';
import emailSettingsRoutes from './src/routes/emailSettingsRoutes.js';
import projectBrainRoutes from './src/routes/projectBrainRoutes.js';

// Global error handlers for server stability
process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[SERVER] Uncaught Exception:', error);
  // Do NOT exit — allow the server to continue running
  // Only critical unrecoverable errors should trigger a restart via PM2/Docker
});

const app = express();
const httpServer = createServer(app);

const corsOrigin = config.clientOrigin;

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  cookie: true, // Enable cookies for sticky sessions with load balancers
  pingTimeout: 60000,
  pingInterval: 25000
});

io.on('error', (error) => {
  console.error('[SOCKET.IO] Server error:', error);
});

io.engine.on('connection-error', (err) => {
  console.error('[SOCKET.IO] Connection error:', err);
});

const allowedOrigins = [corsOrigin, 'http://127.0.0.1:5175'];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  if (req.method === 'POST' && req.originalUrl === '/api/register') {
    console.log('[DEBUG] Body:', JSON.stringify(req.body));
  }
  next();
});
app.use(express.urlencoded({ extended: true, strict: false }));

app.use(fileUpload({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Public routes with rate limiting
app.post('/api/register', register);
app.post('/api/login', authRateLimit(), login);
app.post('/api/admin/login', authRateLimit(), (req, res) => {
  adminLogin(req, res);
  logAudit(null, 'admin_login_attempt', null, `Login attempt: ${req.body.username}`);
});

// Protected user routes
app.get('/api/users', requireAuth, getUsers);
app.get('/api/messages/:userId/:otherId', requireAuth, getMessages);
app.get('/api/messages/search/:userId', requireAuth, searchMessages);
app.get('/api/unread/:userId', requireAuth, getUnread);
app.post('/api/messages/read', requireAuth, markAsRead);
app.put('/api/messages/:messageId/edit', requireAuth, editMessage);
app.get('/api/messages/:messageId/edits', requireAuth, getMessageEdits);

app.get('/api/profile/me', requireAuth, getMyProfile);
app.patch('/api/profile/me', requireAuth, updateMyProfile);
app.get('/api/profile/:userId', requireAuth, getProfile);
app.put('/api/profile/:userId', requireAuth, updateProfile);
app.get('/api/settings/me', requireAuth, (req, res) => {
  req.params.userId = req.user.id;
  getUserSettings(req, res);
});
app.get('/api/settings/:userId', requireAuth, getUserSettings);
app.put('/api/settings/:userId', requireAuth, updateUserSettings);
app.post('/api/profile/:userId/password', requireAuth, changeUserPassword);

app.post('/api/block/:userId', requireAuth, block);
app.delete('/api/block/:userId', requireAuth, unblock);
app.get('/api/block/:userId', requireAuth, listBlocked);
app.get('/api/block/:userId/:targetId', requireAuth, checkBlock);

app.post('/api/report', requireAuth, reportMessage);
app.post('/api/report/:userId', requireAuth, reportUser);
app.get('/api/calls/:userId', requireAuth, getUserCallHistory);

app.post('/api/upload/avatar', requireAuth, uploadAvatar);
app.get('/api/avatar/:userId', getAvatar);
app.delete('/api/upload/avatar', requireAuth, deleteUserAvatar);

app.post('/api/messages/upload', requireAuth, uploadMessageFile);
app.get('/uploads/messages/:filename', getMessageFile);

// Nearby Discovery Routes
app.use('/api/nearby', nearbyRoutes);

// User Lookup Routes
app.use('/api/users', userLookupRoutes);

// Phase 57: Messaging & Notifications
import messageRoutes from './src/routes/messageRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import mediaRoutes from './src/routes/mediaRoutes.js';
import turnRoutes from './src/routes/turnRoutes.js';
import connectivityRoutes from './src/routes/connectivityRoutes.js';
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/turn', turnRoutes);
app.use('/api/connectivity', connectivityRoutes);

// Phase 54: Advanced Auth & OTP Routes
app.use('/api/auth', authRouter);
app.use('/api/otp', otpRoutes);
app.get('/verify/phone/:token', (req, res) => {
  // Redirect to the API handler or just import it
  res.redirect(`/api/otp/phone/verify/${req.params.token}`);
});
app.use('/api/admin', emailSettingsRoutes);
app.use('/api/admin/project-brain', projectBrainRoutes);

// Health check routes
app.use(healthRoutes);

// Client error logging routes
app.use(clientErrorRoutes);

// ZRCS Ad Control & Settings
app.use('/api', adControlRoutes); 
console.log('[ZRCS] Routes mounted at /api (v1/ad-settings & admin/ad-control)');

app.use('/api/admin', adminFeatureRoutes);
app.use('/api', adminFeatureRoutes);

app.get('/api/admin/stats', requireAdmin, getStats);
app.get('/api/admin/users', requireAdmin, getAdminUsers);
app.post('/api/admin/ban', requireAdmin, banUser);
app.post('/api/admin/unban', requireAdmin, unbanUser);
app.get('/api/admin/audit', requireAdmin, getAudit);
app.get('/api/admin/risks', requireAdmin, getRisks);
app.get('/api/admin/reports', requireAdmin, getAllReports);
app.post('/api/admin/reports/resolve', requireAdmin, resolveMessageReport);
app.get('/api/admin/permissions', requireAdmin, getPermissions);
app.post('/api/admin/role', requireAdmin, updateUserRole);
app.post('/api/admin/password', requireAdmin, changeAdminPassword);
app.get('/api/admin/export', requireAdmin, exportData);
app.get('/api/admin/migrations', requireAdmin, getMigrationStatus);
app.get('/api/admin/message-health', requireAdmin, getMessageHealth);
app.get('/api/admin/call-health', requireAdmin, getCallHealth);
app.get('/api/admin/socket-registry-health', requireAdmin, getSocketRegistryHealth);
app.get('/api/admin/ai-analysis', requireAdmin, getAiAnalysis);

const userSockets = new Map();
const callActivity = { activeCalls: 0, totalCalls: 0, failedCalls: 0 };
const serverStartTime = Date.now();

app.set('userSockets', userSockets);
app.set('callActivity', callActivity);
app.set('io', io);
app.set('serverStartTime', serverStartTime);

// Initialize PostgreSQL if configured
if (config.databaseUrl) {
  try {
    initPostgres();
    console.log('[DB] PostgreSQL connection pool initialized');
  } catch (err) {
    console.error('[DB] PostgreSQL initialization failed:', err.message);
  }
}

// Initialize Redis adapter for Socket.io scaling
const redisResult = await initRedis(io);
if (redisResult.adapter) {
  io.adapter(redisResult.adapter);
  console.log('[REDIS] Socket.io Redis adapter attached');
} else if (config.redisUrl) {
  console.warn('[REDIS] Running without Redis adapter (single-instance mode)');
} else {
  console.log('[REDIS] REDIS_URL not configured, running in single-instance mode');
}

// Attach Socket.io JWT authentication
if (isProduction()) {
  attachAuthMiddleware(io);
  console.log('[SOCKET_AUTH] JWT authentication enabled');
}

// Socket setup with modular handlers
setupCallSocket(io, userSockets, callActivity);
setupChatSocket(io, userSockets);

const PORT = config.port || 5000;

const startServer = (port) => {
  httpServer.listen(port, () => {
    console.log(`ZYMI server running on http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer(PORT);

export const getApp = () => app;