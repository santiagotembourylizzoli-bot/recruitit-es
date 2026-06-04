import { Router }              from 'express';
import sanitizeHtml             from 'sanitize-html';
import {
  contactValidators,
  handleValidationErrors,
  SERVICE_OPTIONS,
}                               from '../validators/contact.js';
import { contactRateLimiter }   from '../middleware/rateLimiter.js';
import { sendContactEmails }    from '../services/mailer.js';
import { buildNotifyEmail }     from '../templates/notify.js';
import { buildConfirmEmail }    from '../templates/confirm.js';
import { logger }               from '../utils/logger.js';
import { env }                  from '../config/env.js';

export const contactRouter = Router();

/* ── Sanitize options ───────────────────────────────────────────────────── */
const SANITIZE_OPTS = {
  allowedTags:       [],  /* strip ALL HTML — plain text only */
  allowedAttributes: {},
};

function sanitize(str) {
  return sanitizeHtml(String(str || ''), SANITIZE_OPTS).trim();
}

/* ── Health ping ────────────────────────────────────────────────────────── */
contactRouter.get('/api/contact', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ── POST /api/contact ──────────────────────────────────────────────────── */

/**
 * Request lifecycle (state-machine):
 *  IDLE → VALIDATING → SANITIZING → EMAILING → SUCCESS | ERROR
 *
 * HTTP responses:
 *  200  success
 *  400  validation error (field-level details)
 *  429  rate limit exceeded
 *  500  mailer or unexpected error
 */
contactRouter.post(
  '/api/contact',
  contactRateLimiter,
  contactValidators,
  handleValidationErrors,

  async (req, res, next) => {

    /* ── 1. Extract and sanitize ──────────────────────────────────────── */
    const ip   = req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.ip;
    const raw  = req.body;

    const data = {
      name:    sanitize(raw.name),
      company: sanitize(raw.company),
      email:   sanitize(raw.email).toLowerCase(),
      phone:   raw.phone ? sanitize(raw.phone) : null,
      service: raw.service,
      message: sanitize(raw.message),
      ip,
      submittedAt: new Date().toLocaleString('en-GB', {
        timeZone:   'Europe/Madrid',
        dateStyle:  'medium',
        timeStyle:  'short',
      }),
    };

    logger.info('Contact form submission received', {
      company: data.company,
      service: data.service,
      ip,
    });

    /* ── 2. Build email payloads ──────────────────────────────────────── */
    const { html: notifyHtml, text: notifyText } = buildNotifyEmail(data);
    const { html: confirmHtml, text: confirmText } = buildConfirmEmail(data);

    const notifyPayload = {
      html:         notifyHtml,
      text:         notifyText,
      name:         data.name,
      serviceLabel: SERVICE_OPTIONS[data.service],
      replyTo:      data.email,
    };

    const confirmPayload = {
      html: confirmHtml,
      text: confirmText,
      to:   data.email,
    };

    /* ── 3. Send emails ───────────────────────────────────────────────── */
    try {
      const { notifyId, confirmId } = await sendContactEmails({
        notifyPayload,
        confirmPayload,
      });

      logger.info('Contact emails sent', {
        company:   data.company,
        notifyId,
        confirmId,
      });

      return res.status(200).json({
        success: true,
        message: 'Your message was sent. We\'ll be in touch within 2 business hours.',
      });

    } catch (err) {
      logger.error('Failed to send contact emails', {
        error:   err.message,
        company: data.company,
        ip,
      });

      /* Don't expose mail server internals — pass to global error handler */
      const publicErr = new Error('Failed to send your message. Please try again or email us directly at info@recruitit.es.');
      publicErr.status = 500;
      return next(publicErr);
    }
  }
);
