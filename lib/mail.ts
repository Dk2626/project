import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outbound email (currently: password resets).
 *
 * Configure with SMTP credentials in .env.local — any provider works
 * (Gmail app password, Zoho, Brevo, Amazon SES, Mailgun...):
 *
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=no-reply@uravctc.com
 *   SMTP_PASS=app-password-here
 *   MAIL_FROM="URAV <no-reply@uravctc.com>"
 *   APP_URL=https://uravctc.com
 */

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.MAIL_FROM || (user ? `URAV <${user}>` : "");

let _transporter: Transporter | null = null;

/** True when SMTP is set up. Routes use this to fail with a clear message. */
export function isMailConfigured(): boolean {
  return Boolean(host && user && pass);
}

function transporter(): Transporter {
  if (!isMailConfigured()) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in .env.local (see .env.example)."
    );
  }
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host,
      port,
      // 465 is implicit TLS; 587 upgrades with STARTTLS.
      secure: port === 465,
      auth: { user: user!, pass: pass! },
    });
  }
  return _transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(msg: MailMessage): Promise<void> {
  await transporter().sendMail({ from, ...msg });
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

const NAVY = "#0B3E77";
const DARK = "#0A2540";
const MUTED = "#5A6B82";
const LIGHT = "#F5F8FC";

/** Keep a user-supplied name from breaking out of the HTML. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function passwordResetEmail({
  name,
  link,
  minutes,
}: {
  name: string;
  link: string;
  minutes: number;
}): Omit<MailMessage, "to"> {
  const greeting = name ? `Hi ${esc(name)},` : "Hi,";

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${LIGHT};font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:${NAVY};padding:24px 32px;">
                <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">URAV</span>
                <span style="display:block;color:#ffffff;opacity:0.7;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Learn &middot; Grow &middot; Succeed</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;color:${DARK};">Reset your password</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${MUTED};">${greeting}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${MUTED};">
                  We received a request to reset the password on your URAV account.
                  Click the button below to choose a new one. This link is valid for
                  ${minutes} minutes and can only be used once.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border-radius:8px;background:${NAVY};">
                      <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Reset password</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${MUTED};">
                  If the button doesn't work, paste this link into your browser:
                </p>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;">
                  <a href="${link}" style="color:${NAVY};">${link}</a>
                </p>
                <hr style="border:none;border-top:1px solid #E2E8F0;margin:0 0 20px;" />
                <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">
                  Didn't ask for this? You can safely ignore this email — your
                  password stays exactly as it is.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:${LIGHT};padding:18px 32px;text-align:center;">
                <span style="font-size:12px;color:${MUTED};">&copy; ${new Date().getFullYear()} URAV. All rights reserved.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    greeting.replace(/&amp;/g, "&"),
    "",
    "We received a request to reset the password on your URAV account.",
    `Open this link to choose a new one (valid for ${minutes} minutes, single use):`,
    link,
    "",
    "Didn't ask for this? Ignore this email — your password stays as it is.",
    "",
    "— URAV",
  ].join("\n");

  return { subject: "Reset your URAV password", html, text };
}
