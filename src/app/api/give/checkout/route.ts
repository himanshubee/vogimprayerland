import { NextRequest, NextResponse } from "next/server";
import {
  CURRENCIES,
  SITE_URL,
  createPaymentLink,
  isCurrency,
  isFlutterwaveConfigured,
} from "@/lib/flutterwave";
import { createPendingDonation, getDonation, newTxRef } from "@/lib/donations";

export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max).trim();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** POST — public: start a gift and hand back the Flutterwave checkout URL. */
export async function POST(req: NextRequest) {
  if (!isFlutterwaveConfigured()) {
    return NextResponse.json(
      { error: "Online giving is not available right now. Please try again later." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const currency = str(body.currency, 8).toUpperCase();
  if (!isCurrency(currency)) {
    return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount) * 100) / 100;
  const min = CURRENCIES[currency].min;
  if (!Number.isFinite(amount) || amount < min) {
    return NextResponse.json(
      {
        error: `The smallest gift we can process is ${CURRENCIES[currency].symbol}${min}.`,
      },
      { status: 400 }
    );
  }
  if (amount > 100_000_000) {
    return NextResponse.json(
      { error: "That amount is too large to process online — please contact us." },
      { status: 400 }
    );
  }

  const email = str(body.email, 200).toLowerCase();
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address so we can send your receipt." },
      { status: 400 }
    );
  }

  const name = str(body.name, 200);
  if (!name) {
    return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  }

  const txRef = newTxRef();
  const donation = {
    amount,
    currency,
    fund: str(body.fund, 120) || "Where the need is greatest",
    name,
    email,
    phone: str(body.phone, 60),
    country: str(body.country, 120),
    note: str(body.note, 1000),
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null,
    userAgent: req.headers.get("user-agent") || null,
  };

  try {
    // Record the intent *before* handing the donor to Flutterwave, so the gift
    // can always be reconciled even if the browser never comes back.
    await createPendingDonation(txRef, donation);

    const link = await createPaymentLink({
      txRef,
      amount,
      currency,
      redirectUrl: `${SITE_URL}/give/thank-you/`,
      customer: { email, name, phonenumber: donation.phone || undefined },
      title: "VOGIM Prayer Land",
      description: `${donation.fund} — thank you for your gift`,
      meta: { fund: donation.fund, source: "vogimprayerland.org/give" },
    });

    return NextResponse.json({ link, reference: txRef }, { status: 201 });
  } catch (err) {
    console.error("[give/checkout] failed:", err);
    // Leave the pending row in place only if it was written; it is harmless and
    // makes an orphaned attempt visible when reconciling.
    const saved = await getDonation(txRef).catch(() => null);
    return NextResponse.json(
      {
        error: saved
          ? "We could not reach the payment provider. Please try again in a moment."
          : "We could not start your gift. Please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
