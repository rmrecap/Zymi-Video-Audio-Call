import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient, isRedisActive } from '../socket/redisAdapter.js';

let limiterInstance = null;

const getLimiter = () => {
  if (limiterInstance) return limiterInstance;

  const options = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  };

  const client = getRedisClient();
  if (client && isRedisActive()) {
    console.log('[RATE-LIMITER] Initializing Redis-backed Rate Limiter');
    options.store = new RedisStore({
      sendCommand: (...args) => {
        return client.sendCommand(args.flat());
      },
    });
  } else {
    console.warn('[RATE-LIMITER] Initializing memory-backed Rate Limiter');
  }

  limiterInstance = rateLimit(options);
  return limiterInstance;
};

export const globalLimiter = (req, res, next) => {
  const limiter = getLimiter();
  return limiter(req, res, next);
};
