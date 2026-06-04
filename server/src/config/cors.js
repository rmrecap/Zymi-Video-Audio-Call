import { config, isProduction, isDevelopment } from '../config/env.js';

const ADMIN_WEB_ORIGIN = 'https://rmrecap.github.io';

const getAllowedOrigins = () => {
  const envOrigins = (config.clientOrigin || '').split(',').map(o => o.trim()).filter(Boolean);
  return [...new Set([...envOrigins, ADMIN_WEB_ORIGIN])];
};

export const corsOptions = {
  origin: isProduction() ? getAllowedOrigins() : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

export const socketCorsOptions = {
  origin: isProduction() ? getAllowedOrigins() : '*',
  methods: ['GET', 'POST'],
  credentials: true
};

export const isOriginAllowed = (origin) => {
  if (isDevelopment()) {
    return true;
  }

  if (!origin) {
    return false;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
};

export const createCorsMiddleware = () => {
  const { cors } = require('cors');

  if (isProduction()) {
    return cors(corsOptions);
  }

  return cors({
    origin: '*',
    credentials: true
  });
};