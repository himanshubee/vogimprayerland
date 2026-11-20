import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { sendRequestConfirmation, sendSubmissionEmail } from "@/lib/mailer";
import { getSession } from "@/lib/auth";
import { listInbox } from "@/lib/inbox";
import { linkSubmissionToContact } from "@/lib/crm";
import { clientIp } from "@/lib/client-ip";

export const dynamic = "force-dynamic";
const COLLECTION = "submissions";
const MAX_FIELDS = 30;
const MAX_LEN = 5000;
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

const INTENTS: Record<string, { required: string[]; emailField?: string; noConsentBox?: boolean }> = {
  "Prayer Request": { required: ["name", "email", "request"], emailField: "email" },
  "Healing Request": { required: ["name", "email"], emailField: "email" },
  "Deliverance Request": { required: ["name", "email", "phone", "concerns", "timezone"], emailField: "email" },
  "Dream Interpretation": { required: ["name", "email", "dream"], emailField: "email" },
  "General Enquiry": { required: ["name", "email", "message"], emailField: "email" },
  "Partner Form": { required: ["name", "email", "phone"], emailField: "email" },
  Complaint: { required: ["name", "email", "message"], emailField: "email" },
  "Privacy Request": { required: ["name", "email", "requestType"], emailField: "email" },
  "Refund Request": { required: ["name", "contact", "date", "amount", "currency", "reference"] },
  // Event sign-ups collect contact details only, so they carry a notice line rather than a consent box.
  "Crusade Registration": { required: ["name", "email", "phone"], emailField: "email", noConsentBox: true },
  "Crusade Interest": { required: ["name", "email", "phone"], emailField: "email", noConsentBox: true },
};

function clean(value: unknown): string {
  return String(value ?? "").slice(0, MAX_LEN).trim();
}

async function withinRateLimit(req: NextRequest, db: Db, intent: string) {
  const ip = clientIp(req);
  const window = Math.floor(Date.now() / WINDOW_MS);
  const key = createHash("sha256").update(`${process.env.ADMIN_SECRET || "vogim-forms"}:${ip}:${intent}:${window}`).digest("hex");
  const collection = db.collection<{ _id: string; count: number; expiresAt: Date }>("form_rate_limits");
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  const result = await collection.findOneAndUpdate(
    { _id: key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + WINDOW_MS) } },
    { upsert: true, returnDocument: "after" }
  );
  return (result?.count ?? 1) <= RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const intent = clean(body.intent);
  const config = INTENTS[intent];
  if (!config) return NextResponse.json({ error: "Unknown form type." }, { status: 400 });
  const rawFields = (body.fields && typeof body.fields === "object" ? body.fields as Record<string, unknown> : null) ?? {};

  if (clean(rawFields.website)) return NextResponse.json({ ok: true }, { status: 201 });
  // Forms report how long they were open. Under 1.5 s is a script; it gets a quiet success and nothing is stored.
  const elapsed = Number(rawFields.formElapsedMs);
  if (rawFields.formElapsedMs !== undefined && Number.isFinite(elapsed) && elapsed < 1500) return NextResponse.json({ ok: true }, { status: 201 });

  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawFields).slice(0, MAX_FIELDS)) {
    if (["website", "formElapsedMs", "formStartedAt"].includes(key)) continue;
    const cleaned = clean(value);
    if (cleaned) fields[clean(key).slice(0, 60)] = cleaned;
  }
  if (!config.noConsentBox && fields.sensitiveConsent !== "true") return NextResponse.json({ error: "Please confirm that we may use your details to respond." }, { status: 400 });
  for (const name of config.required) {
    if (!fields[name]) return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }
  const email = config.emailField ? fields[config.emailField] : undefined;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

  try {
    const db = await getDb();
    if (!(await withinRateLimit(req, db, intent))) return NextResponse.json({ error: "Too many attempts. Please wait ten minutes and try again." }, { status: 429 });
    const createdAt = new Date();
    const result = await db.collection(COLLECTION).insertOne({ intent, fields, status: "new" as const, createdAt });
    const id = String(result.insertedId);

    sendSubmissionEmail({ intent, id }).catch(() => {});
    if (email) sendRequestConfirmation(email, intent).catch(() => {});
    linkSubmissionToContact({ id, intent, fields, createdAt }, db).catch((err) => console.error("[submissions] contact link failed:", err));
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[submissions] DB error:", err);
    return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ items: await listInbox(session) });
  } catch (err) {
    console.error("[submissions] DB read error:", err);
    return NextResponse.json({ error: "Could not load submissions" }, { status: 500 });
  }
}
