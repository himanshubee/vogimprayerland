import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sendSubmissionEmail } from "@/lib/mailer";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

const COLLECTION = "submissions";

// Basic guard against abuse / oversized payloads.
const MAX_FIELDS = 30;
const MAX_LEN = 5000;

function clean(value: unknown): string {
  return String(value ?? "").slice(0, MAX_LEN).trim();
}

// POST — public: visitors submit a request form.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const intent = clean(body.intent) || "Request";
  const rawFields =
    (body.fields && typeof body.fields === "object"
      ? (body.fields as Record<string, unknown>)
      : null) ?? {};

  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawFields).slice(0, MAX_FIELDS)) {
    const val = clean(v);
    if (val) fields[clean(k).slice(0, 60)] = val;
  }

  if (!fields.name && !fields.email && Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Empty submission" }, { status: 400 });
  }

  const doc = {
    intent,
    fields,
    status: "new" as const,
    createdAt: new Date(),
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null,
    userAgent: req.headers.get("user-agent") || null,
  };

  try {
    const db = await getDb();
    const result = await db.collection(COLLECTION).insertOne(doc);

    // Fire the email but never let a mail failure break the user's submission.
    sendSubmissionEmail({ intent, fields }).catch(() => {});

    return NextResponse.json({ ok: true, id: result.insertedId }, { status: 201 });
  } catch (err) {
    console.error("[submissions] DB error:", err);
    return NextResponse.json(
      { error: "Could not save your request. Please try again." },
      { status: 500 }
    );
  }
}

// GET — admin only: list submissions for the dashboard.
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const items = await db
      .collection(COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[submissions] DB read error:", err);
    return NextResponse.json({ error: "Could not load submissions" }, { status: 500 });
  }
}
