import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Applied only to POST /api/contact.
 * 5 submissions per IP per hour (configurable via env).
 *
 * Using the default in-memory store — sufficient for a single instance.
 * For multi-instance deployments, swap for express-rate-limit + ioredis store.
 */
export const contactRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max:      env.rateLimitMax,
  standardHeaders: 'draft-7', /* RateLimit-* headers */
  legacyHeaders:   false,

  /* Skip successful requests from the count (count failures only — optional) */
  skipSuccessfulRequests: false,

  keyGenerator(req) {
    /* Use X-Forwarded-For if behind a proxy (Nginx, Cloudflare) */
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.ip;
  },

  handler(req, res) {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      success: false,
      code:    'RATE_LIMIT_EXCEEDED',
      message: `Too many submissions. Please wait before trying again.`,
      retryAfter: Math.ceil(env.rateLimitWindowMs / 1000 / 60), /* minutes */
    });
  },
});
