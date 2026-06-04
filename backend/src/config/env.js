/**
 * Loads and validates all required environment variables at startup.
 * The process exits with a clear message if anything critical is missing,
 * rather than failing silently at runtime.
 */
import 'dotenv/config';

const REQUIRED = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'NOTIFY_TO',
  'EMAIL_FROM',
];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[config] Missing required environment variables: ${missing.join(', ')}`);
    console.error('[config] Copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
}

validateEnv();

export const env = {
  nodeEnv:   process.env.NODE_ENV  || 'development',
  port:      parseInt(process.env.PORT || '3001', 10),

  /* CORS */
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  /* Rate limiting */
  rateLimitMax:      parseInt(process.env.RATE_LIMIT_MAX      || '5',        10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),

  /* SMTP */
  smtp: {
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user:   process.env.SMTP_USER,
    pass:   process.env.SMTP_PASS,
  },

  /* Emails */
  notifyTo:     process.env.NOTIFY_TO,
  emailFrom:    process.env.EMAIL_FROM,
  emailReplyTo: process.env.EMAIL_REPLY_TO || process.env.NOTIFY_TO,

  /* Honeypot */
  honeypotField: process.env.HONEYPOT_FIELD || 'website',

  isDev:  process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
};
