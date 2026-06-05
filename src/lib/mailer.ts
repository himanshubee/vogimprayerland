import nodemailer from "nodemailer";

const TO = process.env.SUBMISSIONS_EMAIL || "vogimdeliveranceministry@gmail.com";

// ── Optional SMTP (Brevo/Gmail/etc.) ─────────────────────────────────────
// If SMTP_* creds are present we use them (most reliable). If they're blank,
// we fall back to FormSubmit.co below, which needs NO account and NO signup.
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

const smtpEnabled = Boolean(host && user && pass);

const transporter = smtpEnabled
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

function buildHtml(submission: {
  intent: string;
  fields: Record<string, string>;
}) {
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

  return `
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
}

// ── FormSubmit.co — zero-signup email delivery ───────────────────────────
// No account, no API key. We POST the submission to their AJAX endpoint and
// they email it to TO. The FIRST time a new address is used, FormSubmit sends
// a one-time "Activate" email to that inbox — click it once and every future
// submission is delivered automatically.
async function sendViaFormSubmit(submission: {
  intent: string;
  fields: Record<string, string>;
}): Promise<boolean> {
  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(TO)}`;

  const payload: Record<string, string> = {
    _subject: `New ${submission.intent} — ${
      submission.fields.name || "Anonymous"
    }`,
    _template: "table",
    _captcha: "false",
    intent: submission.intent,
    ...submission.fields,
  };
  // Let replies go straight to the person who submitted, when we have it.
  if (submission.fields.email) payload._replyto = submission.fields.email;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[mailer] FormSubmit HTTP ${res.status}`);
      return false;
    }
    const data = (await res.json().catch(() => ({}))) as {
      success?: string | boolean;
      message?: string;
    };
    const ok = String(data.success) === "true";
    if (!ok) {
      // Most commonly this is the one-time "please activate" response.
      console.warn(
        `[mailer] FormSubmit not yet active: ${
          data.message || "confirm the activation email sent to " + TO
        }`
      );
    }
    return ok;
  } catch (err) {
    console.error("[mailer] FormSubmit request failed:", err);
    return false;
  }
}

/**
 * Email a new submission to the ministry inbox.
 * Best-effort: uses SMTP if configured, otherwise FormSubmit.co (no signup).
 * Never throws — a mail failure must never block the DB write.
 */
export async function sendSubmissionEmail(submission: {
  intent: string;
  fields: Record<string, string>;
}): Promise<boolean> {
  // Preferred path: SMTP, if credentials are configured.
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `VOGIM Prayer Land <${user}>`,
        to: TO,
        replyTo: submission.fields.email || undefined,
        subject: `New ${submission.intent} — ${
          submission.fields.name || "Anonymous"
        }`,
        html: buildHtml(submission),
      });
      return true;
    } catch (err) {
      console.error("[mailer] SMTP send failed, falling back to FormSubmit:", err);
      // fall through to FormSubmit
    }
  }

  // Zero-signup path: FormSubmit.co.
  return sendViaFormSubmit(submission);
}
