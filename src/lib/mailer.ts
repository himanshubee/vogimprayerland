import nodemailer from "nodemailer";

const TO = process.env.SUBMISSIONS_EMAIL || "vogimdeliveranceministry@gmail.com";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

const enabled = Boolean(host && user && pass);

const transporter = enabled
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587 (STARTTLS)
      auth: { user, pass },
    })
  : null;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Email a new submission to the ministry inbox.
 * Best-effort: if SMTP isn't configured, it logs a warning and resolves false
 * instead of throwing, so a missing mail setup never blocks the DB write.
 */
export async function sendSubmissionEmail(submission: {
  intent: string;
  fields: Record<string, string>;
}): Promise<boolean> {
  if (!transporter) {
    console.warn(
      "[mailer] SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS) — skipping email."
    );
    return false;
  }

  const rows = Object.entries(submission.fields)
    .map(
      ([k, v]) =>
        `<tr>
          <td style="padding:6px 12px;border:1px solid #eee;font-weight:600;text-transform:capitalize;color:#7A0E1A;">${escapeHtml(
            k
          )}</td>
          <td style="padding:6px 12px;border:1px solid #eee;color:#1A0608;white-space:pre-wrap;">${escapeHtml(
            v
          )}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#7A0E1A;color:#D4A437;padding:20px 24px;">
        <h2 style="margin:0;font-size:20px;">New ${escapeHtml(
          submission.intent
        )}</h2>
        <p style="margin:4px 0 0;font-size:12px;color:#E5C97A;">VOGIM Prayer Land — website submission</p>
      </div>
      <table style="border-collapse:collapse;width:100%;margin-top:0;">
        ${rows}
      </table>
      <p style="font-size:11px;color:#999;padding:16px 24px;">
        Sent automatically from vogimprayerland.org
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `VOGIM Prayer Land <${user}>`,
      to: TO,
      replyTo: submission.fields.email || undefined,
      subject: `New ${submission.intent} — ${
        submission.fields.name || "Anonymous"
      }`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[mailer] Failed to send submission email:", err);
    return false;
  }
}
