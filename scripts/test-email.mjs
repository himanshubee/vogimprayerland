/**
 * Verify email delivery end-to-end without going through the website form.
 *
 * - If SMTP_* is configured in .env, it tests the SMTP login + sends a message.
 * - Otherwise it tests the zero-signup FormSubmit.co path: it POSTs a test
 *   submission, which also triggers the one-time activation email on first use.
 *
 * Run:  node scripts/test-email.mjs
 */
import nodemailer from "nodemailer";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---- load env (.env.local preferred, then .env.production) ----
function loadEnv() {
  for (const f of [".env.local", ".env.production"]) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}
loadEnv();

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const to = process.env.SUBMISSIONS_EMAIL || user || "vogimdeliveranceministry@gmail.com";
const from = process.env.SMTP_FROM || `VOGIM Prayer Land <${user}>`;

async function testSmtp() {
  console.log(`🔌 SMTP configured — connecting to ${host}:${port} as ${user} ...`);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transporter.verify();
  console.log("✅ SMTP login OK.");
  const info = await transporter.sendMail({
    from,
    to,
    subject: "✅ VOGIM Prayer Land — email setup test (SMTP)",
    text: "If you can read this, form submissions will be emailed correctly.",
  });
  console.log(`✅ Test email sent to ${to}. Message id: ${info.messageId}`);
}

async function testFormSubmit() {
  console.log(`📮 No SMTP creds — testing zero-signup FormSubmit.co for ${to} ...`);
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: "✅ VOGIM Prayer Land — email setup test (FormSubmit)",
      _template: "table",
      _captcha: "false",
      intent: "Setup Test",
      message: "If you can read this, website form submissions will be emailed here.",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (String(data.success) === "true") {
    console.log(`✅ FormSubmit accepted the message — check ${to} (and spam).`);
  } else {
    console.log(
      `📧 FormSubmit sent a ONE-TIME activation email to ${to}.\n` +
        `   → Open that inbox, click "Activate Form" once, then run this again.\n` +
        `   Server said: ${data.message || JSON.stringify(data)}`
    );
  }
}

try {
  if (host && user && pass) {
    await testSmtp();
  } else {
    await testFormSubmit();
  }
  process.exit(0);
} catch (err) {
  console.error("❌ Email test failed:");
  console.error("   " + (err?.message || err));
  process.exit(1);
}
