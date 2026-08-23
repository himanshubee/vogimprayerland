import { NextRequest, NextResponse } from "next/server";
import {
  findPaidOrderForCustomer,
  linksFor,
  resendDeliveryEmail,
} from "@/lib/book-orders";

export const dynamic = "force-dynamic";

/**
 * Re-issue download links for an order the customer already paid for.
 *
 * Both the order reference and the email on it must match. The reference alone
 * would be guessable-adjacent if one ever leaked, and the email alone would let
 * anyone who knows an address pull that person's books — requiring the pair
 * keeps a lost link recoverable without making it a way in.
 *
 * The response is deliberately identical whether or not the order exists, so
 * this cannot be used to discover which email addresses have bought books.
 */

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max).trim();

const VAGUE =
  "If that order reference and email match a completed order, fresh download links are on their way to that address.";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = str(body.email, 200).toLowerCase();
  const ref = str(body.reference, 120);

  if (!email || !ref) {
    return NextResponse.json(
      { error: "Please enter both your order reference and your email address." },
      { status: 400 }
    );
  }

  const order = await findPaidOrderForCustomer(email, ref).catch((err) => {
    console.error("[shop/resend] lookup failed:", err);
    return null;
  });

  if (!order) {
    return NextResponse.json({ ok: true, message: VAGUE });
  }

  const result = await resendDeliveryEmail(order);

  // Email delivery needs SMTP, which may not be configured. Rather than tell
  // the customer their books are lost, hand the links straight back — they
  // proved they own this order to get here.
  return NextResponse.json({
    ok: true,
    message: result.ok
      ? VAGUE
      : "We could not send the email just now, but your download links are below.",
    emailed: result.ok,
    links: linksFor(order),
  });
}
