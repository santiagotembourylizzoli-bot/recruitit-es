import cors from 'cors';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const { allowedOrigins } = env;

logger.info('CORS allowed origins', { origins: allowedOrigins });

export const corsMiddleware = cors({
  origin(origin, callback) {
    /* Allow requests with no origin (curl, Postman, server-to-server) only in dev */
    if (!origin) {
      if (env.isDev) return callback(null, true);
      return callback(new Error('Origin header required in production'));
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn('CORS blocked request', { origin });
    return callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
  },

  methods:          ['GET', 'POST', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Accept'],
  exposedHeaders:   [],
  credentials:      false,
  optionsSuccessStatus: 204,
});
