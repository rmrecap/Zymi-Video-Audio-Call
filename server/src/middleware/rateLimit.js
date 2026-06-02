import { isProduction } from '../config/env.js';

const rateLimit = {};

let cleanupInterval = null;

export const rateLimitMiddleware = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    maxRequests = 10,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
    handler = (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.keys(rateLimit).forEach(key => {
        if (now - rateLimit[key].resetTime > 60000) {
          delete rateLimit[key];
        }
      });
    }, 60000);
  }

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!rateLimit[key]) {
      rateLimit[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    if (now > rateLimit[key].resetTime) {
      rateLimit[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    rateLimit[key].count++;

    if (rateLimit[key].count > maxRequests) {
      return handler(req, res);
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - rateLimit[key].count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit[key].resetTime / 1000));

    next();
  };
};

export const authRateLimit = () => rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  maxRequests: isProduction() ? 5 : 100,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      retryAfter: 900
    });
  }
});

export const uploadRateLimit = () => rateLimitMiddleware({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many upload requests',
      retryAfter: 3600
    });
  }
});

export const reportRateLimit = () => rateLimitMiddleware({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many report requests',
      retryAfter: 3600
    });
  }
});

export const exportRateLimit = () => rateLimitMiddleware({
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many export requests',
      retryAfter: 3600
    });
  }
});

export const getRateLimitStats = () => {
  const now = Date.now();
  let activeKeys = 0;
  let totalRequests = 0;

  Object.values(rateLimit).forEach(limit => {
    if (limit.resetTime > now) {
      activeKeys++;
      totalRequests += limit.count;
    }
  });

  return {
    activeKeys,
    totalRequests,
    timestamp: now
  };
};