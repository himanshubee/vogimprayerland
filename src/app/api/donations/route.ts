import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listDonations, reconcilePendingDonations } from "@/lib/donations";

export const dynamic = "force-dynamic";

/** GET — admin only: every gift, newest first. */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ items: await listDonations() });
  } catch (err) {
    console.error("[donations] list failed:", err);
    return NextResponse.json({ error: "Could not load gifts." }, { status: 500 });
  }
}

/** POST — admin only: { action: "reconcile" } re-checks every pending gift. */
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (body?.action !== "reconcile") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    const report = await reconcilePendingDonations();
    return NextResponse.json({ ok: true, report, items: await listDonations() });
  } catch (err) {
    console.error("[donations] reconcile failed:", err);
    return NextResponse.json(
      { error: "Could not reach the payment provider. Please try again." },
      { status: 502 }
    );
  }
}
