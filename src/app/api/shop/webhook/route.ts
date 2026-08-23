import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { settleFlutterwaveOrder } from "@/lib/book-orders";
import { FlutterwaveError } from "@/lib/flutterwave";

export const dynamic = "force-dynamic";

/**
 * Flutterwave webhook for book orders.
 *
 * Flutterwave only lets one webhook URL be configured per account, and that
 * slot is already taken by /api/give/webhook — which is why that handler now
 * forwards book references here rather than this route needing to be
 * registered. This route exists so the shop can be pointed at its own URL if
 * the giving and bookshop accounts are ever separated.
 *
 * Authentication is the same shared secret (FLW_SECRET_HASH, sent verbatim in
 * the `verif-hash` header), and as with giving we never trust the payload's
 * own status — the transaction id is re-verified against Flutterwave's API
 * before an order is marked paid.
 */

function hashMatches(received: string | null, expected: string): boolean {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expected = process.env.FLW_SECRET_HASH?.trim() || "";
  if (!expected) {
    console.error("[shop/webhook] FLW_SECRET_HASH is not set — rejecting.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  if (!hashMatches(req.headers.get("verif-hash"), expected)) {
    console.warn("[shop/webhook] rejected: bad or missing verif-hash.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { event?: string; data?: { id?: number | string; tx_ref?: string } };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = String(payload.event ?? "");
  const transactionId = payload.data?.id;

  if (!event.startsWith("charge.completed") || !transactionId) {
    // Acknowledge events we don't act on so Flutterwave stops retrying them.
    return NextResponse.json({ ok: true, ignored: event || "unknown" });
  }

  return settleBookCharge(transactionId, payload.data?.tx_ref);
}

/**
 * Shared with /api/give/webhook, which forwards book references here so a
 * single configured Flutterwave URL serves both flows.
 */
export async function settleBookCharge(
  transactionId: string | number,
  txRef?: string
): Promise<NextResponse> {
  try {
    const result = await settleFlutterwaveOrder(transactionId, "webhook");
    if (result.outcome !== "paid" && result.outcome !== "already_settled") {
      console.warn(
        `[shop/webhook] ${txRef ?? transactionId}: ${result.outcome} — ${result.reason}`
      );
    }
    // Always 200 once authenticated — a retry cannot fix a mismatch, and the
    // record is already flagged for reconciliation.
    return NextResponse.json({ ok: true, outcome: result.outcome });
  } catch (err) {
    console.error("[shop/webhook] settle failed:", err);
    if (err instanceof FlutterwaveError && !err.retryable) {
      // A bad key or malformed request will fail identically forever — take it
      // off Flutterwave's retry queue and let the log raise the alarm.
      return NextResponse.json({ ok: false, permanent: err.message });
    }
    // 500 asks Flutterwave to retry — correct for a transient DB/API failure.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
