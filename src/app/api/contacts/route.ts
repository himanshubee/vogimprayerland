import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listContacts, syncContactsFromSubmissions } from "@/lib/crm";

export const dynamic = "force-dynamic";

// GET — admin: all contacts (most recently active first).
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const items = await listContacts();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[contacts] list error:", err);
    return NextResponse.json({ error: "Could not load contacts" }, { status: 500 });
  }
}

// POST — admin: rebuild contacts from existing submissions (idempotent).
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (body?.action !== "sync") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  try {
    const result = await syncContactsFromSubmissions();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[contacts] sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
