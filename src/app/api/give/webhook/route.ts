import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { settleDonation } from "@/lib/donations";
import { FlutterwaveError } from "@/lib/flutterwave";

export const dynamic = "force-dynamic";

/**
 * Flutterwave webhook — the authoritative confirmation of a gift.
 *
 * In Flutterwave's dashboard (Settings → Webhooks) set the URL to
 *   https://www.vogimprayerland.org/api/give/webhook/
 * — the trailing slash is REQUIRED, because next.config.ts sets
 * `trailingSlash: true` and the slash-less path answers with a 308 redirect
 * that Flutterwave's sender will not follow. Set the "secret hash" field to the
 * value of FLW_SECRET_HASH. V3 sends that hash verbatim in the `verif-hash`
 * header; anything that doesn't match it is discarded.
 *
 * We never trust the payload's own status — the transaction id is re-verified
 * against Flutterwave's API before a gift is marked successful.
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
    console.error("[give/webhook] FLW_SECRET_HASH is not set — rejecting.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  if (!hashMatches(req.headers.get("verif-hash"), expected)) {
    console.warn("[give/webhook] rejected: bad or missing verif-hash.");
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

  try {
    const result = await settleDonation(transactionId, "webhook");
    if (result.outcome !== "successful" && result.outcome !== "already_settled") {
      console.warn(
        `[give/webhook] ${payload.data?.tx_ref ?? transactionId}: ${result.outcome} — ${result.reason}`
      );
    }
    // Always 200 once authenticated — a retry cannot fix a mismatch, and the
    // record is already flagged for reconciliation.
    return NextResponse.json({ ok: true, outcome: result.outcome });
  } catch (err) {
    console.error("[give/webhook] settle failed:", err);
    if (err instanceof FlutterwaveError && !err.retryable) {
      // A bad key or malformed request will fail identically forever — take it
      // off Flutterwave's retry queue and let the log raise the alarm.
      return NextResponse.json({ ok: false, permanent: err.message });
    }
    // 500 asks Flutterwave to retry — correct for a transient DB/API failure.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
