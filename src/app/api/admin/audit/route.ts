import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Lets the previous dashboard record a CSV export, which happens in the browser. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const count = Number(body.count);
  await audit(session, "export", { type: "submission-list", detail: `csv rows=${Number.isFinite(count) ? count : "unknown"}` });
  return NextResponse.json({ ok: true });
}
