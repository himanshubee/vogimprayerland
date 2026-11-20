import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { runRetention } from "@/lib/retention";

export const dynamic = "force-dynamic";

/** A scheduler (cron, uptime monitor) calls this daily with
 *  `Authorization: Bearer $RETENTION_TOKEN`; an admin can also run it from /admin/privacy/. */
function schedulerAllowed(req: NextRequest) {
  const token = process.env.RETENTION_TOKEN || "";
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return token.length >= 24 && given.length === token.length && timingSafeEqual(Buffer.from(given), Buffer.from(token));
}

export async function POST(req: NextRequest) {
  const session = (await requireRole("admin")) ?? (schedulerAllowed(req) ? { username: "scheduler", role: "admin" as const, exp: 0 } : null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const run = await runRetention();
    await audit(session, "retention", { type: "retention", detail: `requests=${run.requestsAnonymised} enquiries=${run.enquiriesAnonymised}` });
    return NextResponse.json({ ok: true, ...run });
  } catch {
    return NextResponse.json({ error: "Retention run failed" }, { status: 500 });
  }
}
