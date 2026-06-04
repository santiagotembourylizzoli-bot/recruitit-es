# Recruit IT — Contact Form Backend

Node.js + Express API that handles the contact form for recruitit.es.

## Quick start

```bash
# 1. Clone and install
cd recruit-it-backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your SMTP credentials and domain

# 3. Run in development (auto-restart on file changes)
npm run dev

# 4. Run in production
NODE_ENV=production npm start
```

The server starts on `http://localhost:3001` by default.

---

## Folder structure

```
recruit-it-backend/
├── .env.example           ← copy to .env and fill in values
├── package.json
└── src/
    ├── index.js           ← Express app entry point
    ├── config/
    │   └── env.js         ← validates + exports all env vars
    ├── middleware/
    │   ├── cors.js        ← origin allow-list
    │   ├── rateLimiter.js ← 5 req / IP / hour
    │   └── errorHandler.js← global error + 404 handlers
    ├── routes/
    │   └── contact.js     ← POST /api/contact
    ├── validators/
    │   └── contact.js     ← express-validator chain + error formatter
    ├── services/
    │   └── mailer.js      ← Nodemailer transport + send helper
    ├── templates/
    │   ├── notify.js      ← email to info@recruitit.es
    │   └── confirm.js     ← auto-reply to the user
    └── utils/
        └── logger.js      ← structured logger (JSON in prod)
```

---

## API

### `POST /api/contact`

**Request body** (JSON):

| Field     | Type   | Required | Notes                                         |
|-----------|--------|----------|-----------------------------------------------|
| name      | string | yes      | 2–80 chars                                    |
| company   | string | yes      | 2–100 chars                                   |
| email     | string | yes      | valid email, max 254 chars                    |
| phone     | string | no       | 6–20 chars, digits / spaces / + - ( )         |
| service   | string | yes      | `scale-team` / `senior-talent` / `long-term-partnership` |
| message   | string | yes      | 10–2000 chars                                 |
| website   | string | no       | **Honeypot** — must be empty (bot detection)  |

**Success (200)**
```json
{
  "success": true,
  "message": "Your message was sent. We'll be in touch within 2 business hours."
}
```

**Validation error (400)**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Please correct the highlighted fields and try again.",
  "errors": [
    { "field": "email", "message": "Please enter a valid email address." }
  ]
}
```

**Rate limited (429)**
```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many submissions. Please wait before trying again.",
  "retryAfter": 60
}
```

**Server error (500)**
```json
{
  "success": false,
  "code": "INTERNAL_ERROR",
  "message": "Failed to send your message. Please try again or email us directly at info@recruitit.es."
}
```

### `GET /health`

Returns server status — useful for uptime monitoring (UptimeRobot, etc.).

---

## Environment variables

See `.env.example` for the full list.  
Key variables to configure:

| Variable             | Description                                      |
|----------------------|--------------------------------------------------|
| `SMTP_HOST`          | SMTP server hostname (e.g. `smtp.gmail.com`)     |
| `SMTP_PORT`          | SMTP port (`587` for STARTTLS, `465` for SSL)    |
| `SMTP_USER`          | SMTP username / email                            |
| `SMTP_PASS`          | SMTP password or app password                    |
| `NOTIFY_TO`          | Where leads land (`info@recruitit.es`)           |
| `EMAIL_FROM`         | Sender shown to recipients                       |
| `ALLOWED_ORIGINS`    | Comma-separated list of allowed frontend origins |
| `RATE_LIMIT_MAX`     | Max submissions per IP per window (default: 5)   |
| `RATE_LIMIT_WINDOW_MS` | Window in ms (default: 3600000 = 1 hour)       |

### Gmail setup

1. Enable 2-factor authentication on the Google account.
2. Generate an **App Password**: Google Account → Security → App Passwords.
3. Use the app password as `SMTP_PASS` (not your regular Gmail password).

### Other providers

| Provider   | `SMTP_HOST`              | `SMTP_PORT` | `SMTP_SECURE` |
|------------|--------------------------|-------------|---------------|
| Gmail      | `smtp.gmail.com`         | `587`       | `false`       |
| Brevo      | `smtp-relay.brevo.com`   | `587`       | `false`       |
| Mailgun    | `smtp.mailgun.org`       | `587`       | `false`       |
| SendGrid   | `smtp.sendgrid.net`      | `587`       | `false`       |
| Outlook365 | `smtp.office365.com`     | `587`       | `false`       |

---

## Deployment checklist

- [ ] Set `NODE_ENV=production` on the server
- [ ] Add all required env vars (never commit `.env`)
- [ ] Set `ALLOWED_ORIGINS` to your production frontend domain only
- [ ] Put the API behind Nginx as a reverse proxy
- [ ] Set `app.set('trust proxy', 1)` (already done) and configure Nginx to forward `X-Forwarded-For`
- [ ] Enable HTTPS — rate limiter uses IP which requires a real IP in production
- [ ] Monitor `/health` with UptimeRobot or similar

### Nginx reverse proxy snippet

```nginx
location /api/ {
    proxy_pass         http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

---

## Frontend integration

Replace the `await new Promise(...)` mock in `recruit-it.html` with:

```javascript
async function submitForm(formData) {
  const res = await fetch('https://api.recruitit.es/api/contact', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:    formData.get('name'),
      company: formData.get('company'),
      email:   formData.get('email'),
      phone:   formData.get('phone') || undefined,
      service: formData.get('service'),
      message: formData.get('message'),
      website: '',   // honeypot — always empty
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.code === 'VALIDATION_ERROR') {
      // Map field-level errors back to the form
      data.errors.forEach(({ field, message }) => {
        const input = document.getElementById(`f${field}`);
        const err   = document.getElementById(`f${field}-err`);
        if (input) input.classList.add('err');
        if (err)   { err.textContent = message; err.classList.add('show'); }
      });
      throw new Error(data.message);
    }
    throw new Error(data.message || 'Submission failed.');
  }

  return data;
}
```
