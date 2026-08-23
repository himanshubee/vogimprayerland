import { NextRequest, NextResponse } from "next/server";
import { settlePaypalOrder } from "@/lib/book-orders";
import { PaypalError, verifyPaypalWebhook } from "@/lib/paypal";

export const dynamic = "force-dynamic";

/**
 * PayPal webhook — the server-to-server confirmation of a book order.
 *
 * In the PayPal dashboard (Apps & Credentials → your app → Webhooks) set the
 * URL to
 *   https://www.vogimprayerland.org/api/shop/paypal/webhook/
 * — the trailing slash is REQUIRED, because next.config.ts sets
 * `trailingSlash: true` and the slash-less path answers with a 308 redirect
 * that PayPal's sender will not follow. Subscribe to CHECKOUT.ORDER.APPROVED
 * and PAYMENT.CAPTURE.COMPLETED, then copy the webhook id into
 * PAYPAL_WEBHOOK_ID.
 *
 * Authenticity is established by asking PayPal to verify the transmission
 * signature — unlike Flutterwave there is no shared secret to compare. As
 * everywhere else, the payload's own claims are not trusted: the order is
 * re-read from PayPal before anything is marked paid.
 */

export async function POST(req: NextRequest) {
  if (!process.env.PAYPAL_WEBHOOK_ID?.trim()) {
    console.error("[shop/paypal/webhook] PAYPAL_WEBHOOK_ID is not set — rejecting.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // The raw text is required: verification hashes the exact bytes PayPal sent.
  const raw = await req.text();

  const authentic = await verifyPaypalWebhook(req.headers, raw);
  if (!authentic) {
    console.warn("[shop/paypal/webhook] rejected: signature did not verify.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    event_type?: string;
    resource?: {
      id?: string;
      // CHECKOUT.ORDER.* carries the order id directly; PAYMENT.CAPTURE.*
      // carries the capture id and points back at the order via a link.
      supplementary_data?: { related_ids?: { order_id?: string } };
      invoice_id?: string;
      custom_id?: string;
    };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = String(payload.event_type ?? "");
  const resource = payload.resource ?? {};

  const orderId =
    event.startsWith("CHECKOUT.ORDER")
      ? resource.id
      : resource.supplementary_data?.related_ids?.order_id;

  const relevant =
    event === "CHECKOUT.ORDER.APPROVED" ||
    event === "PAYMENT.CAPTURE.COMPLETED";

  if (!relevant || !orderId) {
    // Acknowledge events we don't act on so PayPal stops retrying them.
    return NextResponse.json({ ok: true, ignored: event || "unknown" });
  }

  const ref = resource.invoice_id || resource.custom_id || undefined;

  try {
    const result = await settlePaypalOrder(orderId, "webhook", ref);
    if (result.outcome !== "paid" && result.outcome !== "already_settled") {
      console.warn(
        `[shop/paypal/webhook] ${ref ?? orderId}: ${result.outcome} — ${result.reason}`
      );
    }
    // Always 200 once authenticated — a retry cannot fix a mismatch, and the
    // record is already flagged for reconciliation.
    return NextResponse.json({ ok: true, outcome: result.outcome });
  } catch (err) {
    console.error("[shop/paypal/webhook] settle failed:", err);
    if (err instanceof PaypalError && !err.retryable) {
      return NextResponse.json({ ok: false, permanent: err.message });
    }
    // 500 asks PayPal to retry — correct for a transient DB/API failure.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
