import { body, validationResult } from 'express-validator';
import { env } from '../config/env.js';

/* ─── Valid service options ───────────────────────────────────────────────── */
export const SERVICE_OPTIONS = {
  'scale-team':             { es: 'Escalar Equipo',             en: 'Scale Team' },
  'senior-talent':          { es: 'Talento Senior',             en: 'Senior Talent' },
  'long-term-partnership':  { es: 'Partnership a Largo Plazo',  en: 'Long-term Partnership' },
};

export function getServiceLabel(service, lang = 'es') {
  return SERVICE_OPTIONS[service]?.[lang] ?? service;
}

/**
 * Validation chain for POST /api/contact.
 *
 * Follows form-design skill rules:
 *  - Specific error messages ("at least 2 characters" not "Invalid input")
 *  - Field-level granularity so the frontend can display inline errors
 *  - Sanitize before validation (trim, escape) to avoid false negatives
 */
export const contactValidators = [

  /* ── name ────────────────────────────────────────────────────────────── */
  body('name')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters.'),

  /* ── company ─────────────────────────────────────────────────────────── */
  body('company')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Company name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters.'),

  /* ── email ───────────────────────────────────────────────────────────── */
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false })
    .isLength({ max: 254 }) /* RFC 5321 maximum */
    .withMessage('Email address is too long.'),

  /* ── phone (optional) ────────────────────────────────────────────────── */
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .matches(/^[\d\s\+\-\(\)\.]{6,20}$/)
    .withMessage('Phone number format is invalid (6–20 digits, spaces, +, -, ( ) allowed).'),

  /* ── service ─────────────────────────────────────────────────────────── */
  body('service')
    .trim()
    .notEmpty()
    .withMessage('Please select a service interest.')
    .isIn(Object.keys(SERVICE_OPTIONS))
    .withMessage(
      `Service must be one of: ${Object.keys(SERVICE_OPTIONS).join(', ')}.`
    ),

  /* ── message ─────────────────────────────────────────────────────────── */
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required.')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters.'),

  /* ── lang (optional — defaults to 'es') ─────────────────────────────── */
  body('lang')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['es', 'en'])
    .withMessage("Language must be 'es' or 'en'."),

  /* ── honeypot: bots fill this hidden field, humans leave it empty ─────── */
  body(env.honeypotField)
    .custom((value) => {
      if (value && value.trim().length > 0) {
        /* Throw a generic error so bots don't know they were caught */
        throw new Error('Submission rejected.');
      }
      return true;
    }),
];

/**
 * Express middleware that runs after the validator chain.
 * Collects all errors and returns them in a structured format.
 *
 * Response shape (400):
 * {
 *   success: false,
 *   code: "VALIDATION_ERROR",
 *   errors: [{ field: "email", message: "Please enter a valid email address." }]
 * }
 */
export function handleValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((e) => ({
    field:   e.path,
    message: e.msg,
  }));

  return res.status(400).json({
    success: false,
    code:    'VALIDATION_ERROR',
    message: 'Please correct the highlighted fields and try again.',
    errors,
  });
}
