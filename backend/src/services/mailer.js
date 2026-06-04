import nodemailer from 'nodemailer';
import { env }    from '../config/env.js';
import { logger } from '../utils/logger.js';

/* ─── Transport ─────────────────────────────────────────────────────────── */

let _transport = null;

function getTransport() {
  if (_transport) return _transport;

  _transport = nodemailer.createTransport({
    host:   env.smtp.host,
    port:   env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
    /* Reject self-signed certs in production */
    tls: {
      rejectUnauthorized: env.isProd,
    },
    /* Connection pool for sending multiple emails quickly */
    pool:           true,
    maxConnections: 5,
    maxMessages:    100,
  });

  return _transport;
}

/* ─── Verify connection at startup ──────────────────────────────────────── */

export async function verifyMailer() {
  try {
    await getTransport().verify();
    logger.info('Mailer SMTP connection verified', {
      host: env.smtp.host,
      port: env.smtp.port,
    });
  } catch (err) {
    logger.error('Mailer SMTP connection failed — emails will not send', {
      error:   err.message,
      host:    env.smtp.host,
      port:    env.smtp.port,
    });
    /* Don't crash the server — let the endpoint return 500 gracefully */
  }
}

/* ─── Send ──────────────────────────────────────────────────────────────── */

/**
 * Sends both emails in parallel:
 *  1. Notification to info@recruitit.es
 *  2. Auto-reply confirmation to the user
 *
 * Returns { notifyId, confirmId } on success.
 * Throws on error so the route can handle it.
 */
export async function sendContactEmails({ notifyPayload, confirmPayload }) {
  const transport = getTransport();

  const [notifyResult, confirmResult] = await Promise.all([

    /* ── Email 1: internal notification ─────────────────────────────────── */
    transport.sendMail({
      from:     env.emailFrom,
      to:       env.notifyTo,
      replyTo:  notifyPayload.replyTo,
      subject:  `[Recruit IT] New lead: ${notifyPayload.name} — ${notifyPayload.serviceLabel}`,
      html:     notifyPayload.html,
      text:     notifyPayload.text,
    }),

    /* ── Email 2: auto-reply to user ─────────────────────────────────────── */
    transport.sendMail({
      from:    env.emailFrom,
      to:      confirmPayload.to,
      subject: 'We received your message — Recruit IT',
      html:    confirmPayload.html,
      text:    confirmPayload.text,
    }),

  ]);

  return {
    notifyId:  notifyResult.messageId,
    confirmId: confirmResult.messageId,
  };
}
