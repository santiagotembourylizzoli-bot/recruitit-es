/**
 * Minimal structured logger.
 * Outputs JSON in production so log aggregators (Datadog, Logtail, etc.)
 * can parse fields easily. Human-readable in development.
 */
import { env } from '../config/env.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT = env.isDev ? LEVELS.debug : LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function write(level, message, meta = {}) {
  if (LEVELS[level] > CURRENT) return;

  if (env.isProd) {
    /* JSON output for production log aggregators */
    const line = JSON.stringify({
      ts:      timestamp(),
      level,
      message,
      ...meta,
    });
    level === 'error' ? console.error(line) : console.log(line);
  } else {
    /* Human-readable for development */
    const prefix = `[${timestamp()}] [${level.toUpperCase().padEnd(5)}]`;
    const metaStr = Object.keys(meta).length
      ? '  ' + JSON.stringify(meta)
      : '';
    const out = `${prefix} ${message}${metaStr}`;
    level === 'error' ? console.error(out) : console.log(out);
  }
}

export const logger = {
  error: (msg, meta) => write('error', msg, meta),
  warn:  (msg, meta) => write('warn',  msg, meta),
  info:  (msg, meta) => write('info',  msg, meta),
  debug: (msg, meta) => write('debug', msg, meta),

  /* Convenience: log an incoming request */
  req: (req, extra = {}) =>
    write('info', `${req.method} ${req.path}`, {
      ip:     req.ip,
      ua:     req.get('user-agent'),
      ...extra,
    }),
};
