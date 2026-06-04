import { config, isProduction } from '../config/env.js';

const ADMIN_WEB_ORIGIN = 'https://rmrecap.github.io';

const getAllowedOrigins = () => {
  const envOrigins = (config.clientOrigin || '').split(',').map(o => o.trim()).filter(Boolean);
  return [...new Set([...envOrigins, ADMIN_WEB_ORIGIN])];
};

export const allowedOrigins = getAllowedOrigins();

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const sanitized = origin.replace(/\/+$/, '');
    if (getAllowedOrigins().includes(sanitized) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(sanitized)) {
      callback(null, true);
    } else {
      console.error(`[CORS REJECTION] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

export const socketCorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const sanitized = origin.replace(/\/+$/, '');
    if (getAllowedOrigins().includes(sanitized) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(sanitized)) {
      callback(null, true);
    } else {
      console.error(`[CORS REJECTION (Socket)] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
};

export const isOriginAllowed = (origin) => {
  if (!origin) return false;
  const sanitized = origin.replace(/\/+$/, '');
  return getAllowedOrigins().includes(sanitized);
};