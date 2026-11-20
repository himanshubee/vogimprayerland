import nodemailer from "nodemailer";

const TO = process.env.SUBMISSIONS_EMAIL || "vogimdeliveranceministry@gmail.com";
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const smtpEnabled = Boolean(host && user && pass);

const transporter = smtpEnabled
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  : null;

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!transporter) return { ok: false, error: "Email sending is not configured (SMTP)." };
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `VOGIM Prayer Land <${user}>`,
      to: opts.to,
      replyTo: opts.replyTo || undefined,
      subject: opts.subject,
      text: opts.text,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1A0608;white-space:pre-wrap;">${escapeHtml(opts.text)}</div>`,
    });
    return { ok: true };
  } catch (err) {
    console.error("[mailer] sendEmail failed:", err);
    return { ok: false, error: "Could not send the email. Please try again." };
  }
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function notificationHtml(intent: string, id: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1A0608">
    <div style="background:#4A0A12;color:#E3B23C;padding:20px 24px;border-radius:12px 12px 0 0">
      <h2 style="margin:0;font-size:20px">New ${escapeHtml(intent)}</h2>
      <p style="margin:4px 0 0;font-size:14px;color:#FFFFFF">VOGIM Prayer Land</p>
    </div>
    <div style="padding:24px;border:1px solid #E4D9CB;border-top:0;border-radius:0 0 12px 12px">
      <p>A new ${escapeHtml(intent)} arrived. Open the protected inbox to read it.</p>
      <p><a href="https://www.vogimprayerland.org/admin/" style="color:#7A0E1A;font-weight:600">Open the admin inbox</a></p>
      <p style="font-size:12px;color:#5B4B4D">Reference: ${escapeHtml(id)}. This notification intentionally contains no name, contact details or request text.</p>
    </div>
  </div>`;
}

async function sendViaFormSubmit(intent: string, id: string): Promise<boolean> {
  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(TO)}`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `New ${intent} — open the inbox`,
        _template: "box",
        _captcha: "false",
        message: `A new ${intent} arrived. Open https://www.vogimprayerland.org/admin/ to read it. Reference: ${id}`,
      }),
    });
    return res.ok && String(((await res.json().catch(() => ({}))) as { success?: string | boolean }).success) === "true";
  } catch (err) {
    console.error("[mailer] FormSubmit request failed:", err);
    return false;
  }
}

export async function sendSubmissionEmail({ intent, id }: { intent: string; id: string }): Promise<boolean> {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `VOGIM Prayer Land <${user}>`,
        to: TO,
        subject: `New ${intent} — open the inbox`,
        text: `A new ${intent} arrived. Open https://www.vogimprayerland.org/admin/ to read it. Reference: ${id}`,
        html: notificationHtml(intent, id),
      });
      return true;
    } catch (err) {
      console.error("[mailer] SMTP notification failed:", err);
    }
  }
  return sendViaFormSubmit(intent, id);
}

export async function sendRequestConfirmation(email: string, intent: string): Promise<void> {
  if (!transporter) return;
  const prayerFlow = ["Prayer Request", "Healing Request", "Deliverance Request", "Dream Interpretation"].includes(intent);
  await sendEmail({
    to: email,
    subject: `We received your ${intent.toLowerCase()}`,
    text: `We have received your ${intent.toLowerCase()}. The VOGIM Prayer Land team will review it and arrange any follow-up that is needed.\n\n${prayerFlow ? "Intercessors pray over requests each morning. Prayer, deliverance and counselling are free." : "The responsible team will review your request and contact you about the next steps."}\n\nYou can reply to this email if you need to contact the team.`,
  });
}
