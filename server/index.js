import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';

// Load env vars first
dotenv.config();

import { config, isProduction } from './src/config/env.js';
import { initAdminSeed } from './src/config/adminSeed.js';
import { seedDemoUsers } from './src/db/seed_demo_users.js';
import { initPostgres, isPostgresReady, testConnection } from './src/db/postgres.js';
import { runMigrations } from './src/db/migrations.js';

// Initialize PostgreSQL if DATABASE_URL is provided
const pgResult = initPostgres();
if (pgResult) {
  console.log('[DB] PostgreSQL connection pool initialized');
} else {
  console.log('[DB] SQLite database initialized (DATABASE_URL not set)');
}

// Run migrations and seeds
await runMigrations();
await initAdminSeed();
// await seedDemoUsers();

// Other services
// import { createBlockTable } from './src/services/blockService.js';
// import { createReportsTable } from './src/services/reportService.js';
// import { createCallHistoryTable } from './src/services/callHistoryService.js';
// import { initCallState } from './src/services/callStateService.js';
// import { initMetrics } from './src/services/metricsService.js';
// import { logAudit } from './src/services/auditService.js';

// await createBlockTable();
// await createReportsTable();
// await createCallHistoryTable();
// initCallState();
// initMetrics();

// Routes
import healthRoutes from './src/routes/healthRoutes.js';
import clientErrorRoutes from './src/routes/clientErrorRoutes.js';
import { attachAuthMiddleware } from './src/socket/socketAuthGuard.js';
import { initRedis } from './src/socket/redisAdapter.js';
import { authRateLimit } from './src/middleware/rateLimit.js';
import { globalLimiter } from './src/middleware/rateLimiter.js';
import { setupCallSocket } from './src/socket/callSocket.js';
import { setupChatSocket } from './src/socket/chatSocket.js';
import { setupAdminSocket } from './src/socket/adminSocket.js';
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
import messageRoutes from './src/routes/messageRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import mediaRoutes from './src/routes/mediaRoutes.js';
import turnRoutes from './src/routes/turnRoutes.js';
import connectivityRoutes from './src/routes/connectivityRoutes.js';

const app = express();
const httpServer = createServer(app);

const corsOrigin = config.clientOrigin;

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  cookie: true,
  pingTimeout: 60000,
  pingInterval: 25000
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
app.use(globalLimiter);

app.use(fileUpload({
  limits: { fileSize: 2 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Routes mounting
app.post('/api/register', register);
app.post('/api/login', authRateLimit(), login);
app.post('/api/admin/login', authRateLimit(), async (req, res) => {
  try {
    await adminLogin(req, res);
    await logAudit(null, 'admin_login_attempt', null, `Login attempt: ${req.body.username}`);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

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

app.use('/api/nearby', nearbyRoutes);
app.use('/api/users', userLookupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/turn', turnRoutes);
app.use('/api/connectivity', connectivityRoutes);
app.use('/api/auth', authRouter);
app.use('/api/otp', otpRoutes);
app.use('/api/admin', emailSettingsRoutes);
app.use('/api/admin/project-brain', projectBrainRoutes);
app.use(healthRoutes);
app.use(clientErrorRoutes);
app.use('/api', adControlRoutes); 
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

// Socket services
const redisResult = await initRedis(io);
if (redisResult.adapter) {
  io.adapter(redisResult.adapter);
}

// Sync database settings to Redis cache
import { db } from './src/db/db_provider.js';
async function syncFeaturesToRedis() {
  const redisClient = getRedisClient();
  if (redisClient) {
    try {
      const flags = await db.all("SELECT feature_key, enabled FROM feature_flags");
      for (const flag of flags) {
        await redisClient.hSet('zymi:features', flag.feature_key, flag.enabled ? 'true' : 'false');
      }
      const settings = await db.get("SELECT default_radius_km, approximate_only, privacy_mode FROM nearby_global_settings WHERE id = 1");
      if (settings) {
        const radiusMeters = (settings.default_radius_km || 5) * 1000;
        const fuzzing = settings.approximate_only ? '0.005' : '0.0';
        await redisClient.hSet('zymi:config:nearby', {
          radius: String(radiusMeters),
          fuzzing: fuzzing,
          privacy_mode: settings.privacy_mode || 'NORMAL'
        });
      }
      console.log('[REDIS] Feature flags and nearby settings synced to Redis');
    } catch (err) {
      console.error('[REDIS] Error syncing features to Redis:', err.message);
    }
  }
}
await syncFeaturesToRedis();

import { registry } from './src/socket/userSocketRegistry.js';

if (isProduction()) {
  attachAuthMiddleware(io);
}

// Global connection listener to register BACKGROUND (and UI) sockets automatically
io.on('connection', async (socket) => {
  if (socket.userId) {
    const socketType = socket.socketType || 'UI';
    try {
      await registry.register(socket.userId, socket.id, socketType);
      console.log(`[INDEX_SOCKET] Registered ${socketType} socket for user ${socket.userId}`);
    } catch (err) {
      console.error('[INDEX_SOCKET] Registry write failed:', err.message);
    }
  }
});

setupCallSocket(io, userSockets, callActivity);
setupChatSocket(io, userSockets);
setupAdminSocket(io);

const PORT = config.port || 5000;
const startServer = (port) => {
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`ZYMI server running on port ${port} (0.0.0.0)`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      startServer(port + 1);
    } else {
      process.exit(1);
    }
  });
};

startServer(PORT);
export const getApp = () => app;