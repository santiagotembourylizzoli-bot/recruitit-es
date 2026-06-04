/**
 * Entry point — Recruit IT backend
 *
 * Stack decisions:
 *  - helmet:            security headers (XSS, clickjacking, sniffing)
 *  - cors:              origin allow-list from .env
 *  - express-rate-limit: 5 req/IP/hour on the contact endpoint
 *  - express-validator: field-level validation with specific messages
 *  - sanitize-html:     strip HTML from all user input
 *  - nodemailer:        SMTP email dispatch (pool transport)
 */

import './config/env.js'; /* validates env vars before anything else */

import express           from 'express';
import helmet            from 'helmet';
import { corsMiddleware }  from './middleware/cors.js';
import { contactRouter }   from './routes/contact.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { verifyMailer }    from './services/mailer.js';
import { logger }          from './utils/logger.js';
import { env }             from './config/env.js';

const app = express();

/* ─── Security headers ───────────────────────────────────────────────────── */
app.use(helmet({
  contentSecurityPolicy: false, /* let the frontend set its own CSP */
}));

/* ─── Trust proxy (needed for correct IP behind Nginx / Cloudflare) ─────── */
app.set('trust proxy', 1);

/* ─── CORS ───────────────────────────────────────────────────────────────── */
app.use(corsMiddleware);

/* ─── Body parsing ───────────────────────────────────────────────────────── */
app.use(express.json({
  limit:  '16kb',  /* prevent large payload attacks */
  strict: true,    /* only accept arrays and objects */
}));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

/* ─── Request logging ────────────────────────────────────────────────────── */
app.use((req, _res, next) => {
  logger.req(req);
  next();
});

/* ─── Routes ─────────────────────────────────────────────────────────────── */
app.use(contactRouter);

/* ─── Health check ───────────────────────────────────────────────────────── */
app.get('/health', (_req, res) => {
  res.json({
    status:  'ok',
    env:     env.nodeEnv,
    ts:      new Date().toISOString(),
  });
});

/* ─── 404 + Global error handler (must be last) ─────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ─── Start ──────────────────────────────────────────────────────────────── */
async function start() {
  /* Verify SMTP before accepting requests */
  await verifyMailer();

  app.listen(env.port, () => {
    logger.info(`Server running`, {
      port: env.port,
      env:  env.nodeEnv,
      pid:  process.pid,
    });
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});

/* ─── Graceful shutdown ──────────────────────────────────────────────────── */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  process.exit(1);
});
