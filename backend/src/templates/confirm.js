import { SERVICE_OPTIONS } from '../validators/contact.js';

/**
 * Auto-reply confirmation sent to the user right after submission.
 * Warm, professional tone — confirms receipt and sets expectations.
 */
export function buildConfirmEmail(data) {
  const { name, service } = data;
  const serviceLabel = SERVICE_OPTIONS[service] ?? service;
  const firstName = name.split(' ')[0];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>We received your message — Recruit IT</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="background:#111111;border:1px solid #262626;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 28px;border-bottom:1px solid #262626;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:18px;font-weight:800;letter-spacing:-0.04em;color:#f5f5f5;">
                      RecruitIT
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;font-weight:600;letter-spacing:0.1em;
                                 text-transform:uppercase;color:#6b6b6b;">
                      IT Outsourcing · Staff Augmentation
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 0;">
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;
                         letter-spacing:-0.03em;line-height:1.2;color:#f5f5f5;">
                We got your message, ${firstName}.
              </h1>
              <p style="margin:0 0 20px;font-size:16px;color:#a3a3a3;line-height:1.65;">
                Thank you for reaching out. A member of our team will review your inquiry
                and get back to you within <strong style="color:#f5f5f5;">2 business hours</strong>.
              </p>
              <p style="margin:0 0 32px;font-size:16px;color:#a3a3a3;line-height:1.65;">
                In the meantime, here's a summary of what we received:
              </p>
            </td>
          </tr>

          <!-- Summary card -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#1a1a1a;border:1px solid #262626;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #262626;">
                    <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;
                                 text-transform:uppercase;color:#6b6b6b;">Service Interest</span>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#f5f5f5;">
                      ${serviceLabel}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;
                                 text-transform:uppercase;color:#6b6b6b;">Next Step</span>
                    <p style="margin:4px 0 0;font-size:15px;color:#a3a3a3;line-height:1.55;">
                      A 30-minute discovery call with a Recruit IT specialist
                      to understand your tech stack and exact needs.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What to expect -->
          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:0 0 20px;font-size:14px;font-weight:600;
                         letter-spacing:0.06em;text-transform:uppercase;color:#6b6b6b;">
                What happens next
              </p>
              ${buildStep('01', 'Our team reviews your submission', 'We read every message carefully to understand your needs before we respond.')}
              ${buildStep('02', 'We schedule a discovery call', 'A specialist will reach out to book a 30-minute call at a time that works for you.')}
              ${buildStep('03', 'Senior profiles within 72 hours', 'After the call, we deliver 2–3 pre-vetted senior candidates matched to your stack.')}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#a3a3a3;">
                Can't wait? Reach us directly:
              </p>
              <a href="mailto:info@recruitit.es"
                 style="display:inline-block;padding:12px 24px;background:#ffffff;
                        color:#0a0a0a;font-size:14px;font-weight:600;
                        border-radius:9999px;text-decoration:none;">
                info@recruitit.es
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #262626;">
              <p style="margin:0;font-size:11px;color:#6b6b6b;line-height:1.6;">
                You're receiving this because you submitted the contact form at
                <a href="https://recruitit.es" style="color:#6b6b6b;">recruitit.es</a>.<br>
                If this wasn't you, you can safely ignore this email.
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
Hi ${firstName},

We received your message and will get back to you within 2 business hours.

Service Interest: ${serviceLabel}

WHAT HAPPENS NEXT
─────────────────
01. Our team reviews your submission
02. We schedule a 30-minute discovery call
03. Senior profiles delivered within 72 hours

Can't wait? Email us directly at info@recruitit.es

—
Recruit IT
Senior tech talent. Deployed with precision.
https://recruitit.es
`.trim();

  return { html, text };
}

/* ─── helper ────────────────────────────────────────────────────────────── */
function buildStep(num, title, desc) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr>
        <td width="36" valign="top" style="padding-top:2px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;
                       width:28px;height:28px;border-radius:50%;background:#1a1a1a;
                       border:1px solid #3a3a3a;font-size:11px;font-weight:700;color:#a3a3a3;">
            ${num}
          </span>
        </td>
        <td valign="top" style="padding-left:12px;">
          <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#f5f5f5;">${title}</p>
          <p style="margin:0;font-size:13px;color:#6b6b6b;line-height:1.5;">${desc}</p>
        </td>
      </tr>
    </table>`;
}
