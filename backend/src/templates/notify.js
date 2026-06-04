import { getServiceLabel } from '../validators/contact.js';

/**
 * HTML email sent to info@recruitit.es when a new lead submits the form.
 * Dark theme matching the Recruit IT brand (#0a0a0a, #ffffff).
 */
export function buildNotifyEmail(data) {
  const { name, company, email, phone, service, message, lang = 'es', submittedAt, ip } = data;
  const serviceLabel = getServiceLabel(service, lang);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>New Lead — Recruit IT</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="background:#111111;border:1px solid #262626;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #262626;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:18px;font-weight:800;letter-spacing:-0.04em;color:#f5f5f5;">
                      RecruitIT
                    </span>
                  </td>
                  <td align="right" style="text-align:right;">
                    <span style="display:inline-block;padding:4px 12px;background:rgba(74,222,128,0.1);
                                 border:1px solid rgba(74,222,128,0.3);border-radius:9999px;
                                 font-size:11px;font-weight:600;letter-spacing:0.1em;
                                 text-transform:uppercase;color:#4ade80;margin-right:6px;">
                      New Lead
                    </span>
                    <span style="display:inline-block;padding:4px 10px;background:#1a1a1a;
                                 border:1px solid #3a3a3a;border-radius:9999px;
                                 font-size:11px;font-weight:700;letter-spacing:0.08em;
                                 text-transform:uppercase;color:#a3a3a3;">
                      ${lang.toUpperCase()}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:32px 40px 8px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:-0.03em;color:#f5f5f5;">
                New Contact Form Submission
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:#737373;">
                Received ${submittedAt}
              </p>
            </td>
          </tr>

          <!-- Service pill -->
          <tr>
            <td style="padding:16px 40px 24px;">
              <span style="display:inline-block;padding:5px 14px;
                           background:#1a1a1a;border:1px solid #3a3a3a;
                           border-radius:9999px;font-size:12px;font-weight:600;
                           letter-spacing:0.06em;text-transform:uppercase;color:#a3a3a3;">
                ${serviceLabel}
              </span>
            </td>
          </tr>

          <!-- Fields table -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#1a1a1a;border:1px solid #262626;border-radius:8px;overflow:hidden;">

                ${buildRow('Name',    name)}
                ${buildRow('Company', company)}
                ${buildRow('Email',
                  `<a href="mailto:${email}" style="color:#f5f5f5;text-decoration:underline;">${email}</a>`)}
                ${phone ? buildRow('Phone', phone) : ''}
                ${buildRow('Service Interest', serviceLabel)}
                ${buildDivider()}
                ${buildRow('Message', `<span style="white-space:pre-wrap;">${escapeHtml(message)}</span>`, true)}
              </table>
            </td>
          </tr>

          <!-- Quick-reply CTA -->
          <tr>
            <td style="padding:0 40px 40px;">
              <a href="mailto:${email}?subject=Re: Your inquiry to Recruit IT"
                 style="display:inline-block;padding:12px 24px;background:#ffffff;
                        color:#0a0a0a;font-size:14px;font-weight:600;
                        border-radius:9999px;text-decoration:none;letter-spacing:-0.01em;">
                Reply to ${name}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #262626;">
              <p style="margin:0;font-size:11px;color:#6b6b6b;">
                Submitted from recruitit.es · IP: ${ip}<br>
                This is an automated notification. Do not reply to this address.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
NEW LEAD — Recruit IT
=====================
Received: ${submittedAt}
Service:  ${serviceLabel}

Name:     ${name}
Company:  ${company}
Email:    ${email}
${phone ? `Phone:    ${phone}\n` : ''}
Message:
${message}

---
IP: ${ip}
`.trim();

  return { html, text };
}

/* ─── helpers ───────────────────────────────────────────────────────────── */

function buildRow(label, value, isMessage = false) {
  return `
    <tr>
      <td style="padding:${isMessage ? '16px' : '12px'} 20px;
                 border-bottom:1px solid #262626;
                 vertical-align:top;width:130px;">
        <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;
                     text-transform:uppercase;color:#6b6b6b;">${label}</span>
      </td>
      <td style="padding:${isMessage ? '16px' : '12px'} 20px;
                 border-bottom:1px solid #262626;
                 font-size:14px;color:#f5f5f5;line-height:1.6;">${value}</td>
    </tr>`;
}

function buildDivider() {
  return `<tr><td colspan="2" style="padding:0;height:1px;background:#262626;"></td></tr>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}
