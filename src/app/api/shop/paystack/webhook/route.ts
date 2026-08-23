import { NextRequest, NextResponse } from "next/server";
import { isBookRef, settlePaystackOrder } from "@/lib/book-orders";
import { settlePaystackDonation } from "@/lib/donations";
import { PaystackError, verifyPaystackWebhook } from "@/lib/paystack";

export const dynamic = "force-dynamic";

/**
 * Paystack webhook — the server-to-server confirmation of a book order.
 *
 * In the Paystack dashboard (Settings → API Keys & Webhooks) set the live
 * webhook URL to
 *   https://www.vogimprayerland.org/api/shop/paystack/webhook/
 * — the trailing slash is REQUIRED, because next.config.ts sets
 * `trailingSlash: true` and the slash-less path answers with a 308 redirect
 * that Paystack's sender will not follow.
 *
 * There is no separate webhook secret to configure: Paystack signs the body
 * with HMAC-SHA512 using the secret key we already hold. As everywhere else,
 * the payload's own claims are not trusted — the transaction is re-verified
 * against Paystack's API before anything is marked paid.
 *
 * Paystack allows one webhook URL per account, so this single route serves
 * both flows. A reference beginning VOGIM-BOOK- is a book order; anything else
 * is a gift. Without that dispatch every donation would arrive here, find no
 * matching order, and be logged as "not_found" while the donor waited.
 */

export async function POST(req: NextRequest) {
  // The raw text is required: the signature covers the exact bytes Paystack
  // sent, so re-serializing parsed JSON would never match.
  const raw = await req.text();

  if (!verifyPaystackWebhook(raw, req.headers.get("x-paystack-signature"))) {
    console.warn("[shop/paystack/webhook] rejected: bad or missing signature.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { event?: string; data?: { reference?: string } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = String(payload.event ?? "");
  const reference = payload.data?.reference;

  if (event !== "charge.success" || !reference) {
    // Acknowledge events we don't act on so Paystack stops retrying them.
    return NextResponse.json({ ok: true, ignored: event || "unknown" });
  }

  const isBook = isBookRef(reference);

  try {
    const result = isBook
      ? await settlePaystackOrder(reference, "webhook")
      : await settlePaystackDonation(reference, "webhook");
    const settled =
      result.outcome === "already_settled" ||
      (isBook ? result.outcome === "paid" : result.outcome === "successful");
    if (!settled) {
      console.warn(
        `[shop/paystack/webhook] ${reference}: ${result.outcome}` +
          ("reason" in result ? ` — ${result.reason}` : "")
      );
    }
    // Always 200 once authenticated — a retry cannot fix a mismatch, and the
    // record is already flagged for reconciliation.
    return NextResponse.json({ ok: true, outcome: result.outcome });
  } catch (err) {
    console.error("[shop/paystack/webhook] settle failed:", err);
    if (err instanceof PaystackError && !err.retryable) {
      // A bad key or malformed request will fail identically forever — take it
      // off Paystack's retry queue and let the log raise the alarm.
      return NextResponse.json({ ok: false, permanent: err.message });
    }
    // 500 asks Paystack to retry — correct for a transient DB/API failure.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
