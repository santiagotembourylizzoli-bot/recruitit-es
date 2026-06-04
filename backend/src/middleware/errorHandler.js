import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Global error handler — must be registered last in Express.
 *
 * Follows error-handling-ux principles:
 *  - Never expose stack traces or internal details in production
 *  - Always return a consistent JSON shape
 *  - Include an error code so the frontend can branch on it
 *  - Log the full error server-side for debugging
 */
export function errorHandler(err, req, res, _next) {
  /* CORS errors (thrown by cors middleware) */
  if (err.message?.includes('not allowed by CORS')) {
    return res.status(403).json({
      success: false,
      code:    'CORS_BLOCKED',
      message: 'Request origin not permitted.',
    });
  }

  /* Body-parser errors (malformed JSON) */
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      code:    'INVALID_JSON',
      message: 'Request body must be valid JSON.',
    });
  }

  /* Payload too large */
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      code:    'PAYLOAD_TOO_LARGE',
      message: 'Request body exceeds the allowed size limit.',
    });
  }

  /* Log unexpected errors with full context */
  logger.error('Unhandled error', {
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
    ip:      req.ip,
  });

  /* Never expose internal stack traces in production */
  const detail = env.isDev ? err.message : 'An unexpected error occurred. Please try again later.';

  res.status(err.status || 500).json({
    success: false,
    code:    'INTERNAL_ERROR',
    message: detail,
  });
}

/** 404 handler — place before errorHandler */
export function notFound(req, res) {
  res.status(404).json({
    success: false,
    code:    'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found.`,
  });
}
