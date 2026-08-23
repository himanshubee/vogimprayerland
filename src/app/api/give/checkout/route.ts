import { NextRequest, NextResponse } from "next/server";
import { CURRENCIES, type CurrencyCode } from "@/lib/currencies";
import {
  FlutterwaveError,
  SITE_URL,
  createPaymentLink,
  isCurrency,
  isFlutterwaveConfigured,
} from "@/lib/flutterwave";
import {
  PaystackError,
  initializeTransaction,
  isPaystackConfigured,
} from "@/lib/paystack";
import { PaypalError, createPaypalOrder, isPaypalConfigured } from "@/lib/paypal";
import { convert, getRates } from "@/lib/fx";
import {
  gatewayLabel,
  isProvider,
  resolveGatewayCurrencies,
  settlementCurrency,
  allowsConversion,
  type Provider,
} from "@/lib/gateways";
import { createPendingDonation, getDonation, newTxRef } from "@/lib/donations";

export const dynamic = "force-dynamic";

/**
 * Start a gift and hand back the gateway URL to redirect the donor to.
 *
 * Mirrors the bookshop's checkout: the donor chooses an amount in a currency,
 * and the gateway settles in a currency it can actually take — converted at the
 * day's rate when it differs, and shown to the donor before they commit.
 */

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max).trim();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Gifts are rounded to the cent, never up to a "tidy" figure — the donor
 *  chose the amount, and inflating it would be taking more than they meant. */
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const provider: Provider = isProvider(body.provider)
    ? body.provider
    : "flutterwave";
  const label = gatewayLabel(provider);

  const CONFIGURED: Record<Provider, boolean> = {
    flutterwave: isFlutterwaveConfigured(),
    paystack: isPaystackConfigured(),
    paypal: isPaypalConfigured(),
  };
  if (!CONFIGURED[provider]) {
    return NextResponse.json(
      {
        error: `${label} is not available right now. Please choose another way to give.`,
      },
      { status: 503 }
    );
  }

  const currency = str(body.currency, 8).toUpperCase();
  if (!isCurrency(currency)) {
    return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
  }

  const amount = money(Number(body.amount));
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

  /* ---- which currency this gateway will actually charge in ---- */

  const rates = await getRates().catch(() => null);
  const supported = resolveGatewayCurrencies(process.env)[provider];

  // Without rates nothing can be converted, so the gateway is limited to the
  // donor's own currency — better than guessing at an exchange rate.
  const priceable = rates
    ? (Object.keys(CURRENCIES) as CurrencyCode[])
    : [currency as CurrencyCode];

  const settlement = settlementCurrency(
    supported,
    currency,
    priceable,
    allowsConversion(provider)
  );

  if (!settlement) {
    return NextResponse.json(
      {
        error: `${label} cannot take ${currency}. Please choose another way to give.`,
      },
      { status: 400 }
    );
  }

  let charge = amount;
  if (settlement !== currency) {
    const converted = convert(amount, currency, settlement, rates?.rates);
    if (!converted) {
      return NextResponse.json(
        {
          error: `We could not convert your gift to ${settlement} just now. Please try another way to give.`,
        },
        { status: 503 }
      );
    }
    charge = money(converted);
  }

  // The converted figure still has to clear the gateway's own floor.
  const chargeMin = CURRENCIES[settlement].min;
  if (charge < chargeMin) {
    return NextResponse.json(
      {
        error: `${label} settles in ${settlement}, and its smallest gift is ${CURRENCIES[settlement].symbol}${chargeMin} — about ${CURRENCIES[currency].symbol}${money(convert(chargeMin, settlement, currency, rates?.rates) ?? chargeMin)}. Please give a little more, or choose another way.`,
      },
      { status: 400 }
    );
  }

  const txRef = newTxRef();
  const donation = {
    provider,
    // Recorded in the currency the money actually moves in.
    amount: charge,
    currency: settlement,
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
    // Record the intent *before* handing the donor to the gateway, so the gift
    // can always be reconciled even if the browser never comes back.
    await createPendingDonation(txRef, donation);

    if (provider === "paypal") {
      const created = await createPaypalOrder({
        reference: txRef,
        currency: settlement,
        total: charge,
        items: [{ name: donation.fund, quantity: 1, unitAmount: charge }],
        returnUrl: `${SITE_URL}/give/thank-you/?ref=${encodeURIComponent(txRef)}`,
        cancelUrl: `${SITE_URL}/give/?cancelled=1`,
        brandName: "VOGIM Prayer Land",
      });
      return NextResponse.json(
        { link: created.approveUrl, reference: txRef },
        { status: 201 }
      );
    }

    if (provider === "paystack") {
      const link = await initializeTransaction({
        reference: txRef,
        amount: charge,
        currency: settlement,
        email,
        // Paystack appends ?reference= &trxref= to this.
        callbackUrl: `${SITE_URL}/give/thank-you/`,
        metadata: { kind: "donation", fund: donation.fund, name },
      });
      return NextResponse.json({ link, reference: txRef }, { status: 201 });
    }

    const link = await createPaymentLink({
      txRef,
      amount: charge,
      currency: settlement,
      redirectUrl: `${SITE_URL}/give/thank-you/`,
      customer: { email, name, phonenumber: donation.phone || undefined },
      title: "VOGIM Prayer Land",
      description: `${donation.fund} — thank you for your gift`,
      meta: { fund: donation.fund, source: "vogimprayerland.org/give" },
    });

    return NextResponse.json({ link, reference: txRef }, { status: 201 });
  } catch (err) {
    console.error(`[give/checkout] ${label} failed:`, err);

    const gatewayError =
      err instanceof PaystackError ||
      err instanceof FlutterwaveError ||
      err instanceof PaypalError;
    const unreachable = gatewayError && (err as { status: number }).status === 0;

    // A gateway that answered with a complaint is telling us something useful.
    if (gatewayError && !unreachable) {
      return NextResponse.json(
        { error: `${label} could not start this gift: ${(err as Error).message}` },
        { status: 502 }
      );
    }

    const saved = await getDonation(txRef).catch(() => null);
    return NextResponse.json(
      {
        error: saved
          ? `We could not reach ${label}. Please try again in a moment, or choose another way to give.`
          : "We could not start your gift. Please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
