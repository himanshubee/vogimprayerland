import type { CurrencyCode } from "@/lib/currencies";
import type { BookPrices } from "@/lib/books-shared";

/**
 * The payment gateways the bookshop can take money through.
 *
 * Client-safe: no secrets, no SDKs, just the facts the checkout UI needs to
 * describe each option. Whether a gateway is *configured* is a server question
 * and is passed down as a prop.
 *
 * Every gateway converts, so all three are offered in every currency. The one
 * a shopper is browsing in is used whenever the gateway settles it; otherwise
 * the charge falls back to that gateway's own currency (dollars for PayPal,
 * naira for Paystack) and the checkout says so before they commit.
 */

export type Provider = "flutterwave" | "paystack" | "paypal";

export type GatewayInfo = {
  id: Provider;
  /** Shown on the checkout button and in the admin. */
  label: string;
  /** One line under the label explaining what a buyer can pay with. */
  blurb: string;
  /**
   * Currencies this gateway can settle, in preference order. The first entry
   * that the basket can be priced in becomes the fallback when the shopper's
   * chosen currency isn't supported.
   */
  currencies: CurrencyCode[];
};

/**
 * Whether a gateway may charge in a currency other than the one on screen.
 *
 * All three may. A buyer browsing in dollars still gets Paystack's card, bank
 * transfer, USSD and mobile money — it simply bills naira at the day's rate,
 * which the checkout states next to the option rather than springing on them
 * at the gateway. Kept as a switch so a gateway can be pinned back to its own
 * currency later without touching the option-building code.
 */
const ALLOWS_CONVERSION: Record<Provider, boolean> = {
  flutterwave: true,
  paystack: true,
  paypal: true,
};

/**
 * What each gateway can settle *as a product*. This is the ceiling: an env
 * override may pick from this list but can never add to it, so a typo cannot
 * invent support and produce a rejected charge.
 */
const SUPPORTED: Record<Provider, CurrencyCode[]> = {
  flutterwave: ["NGN", "USD", "GBP", "EUR", "AED", "GHS", "KES", "ZAR"],
  paystack: ["NGN", "USD", "GHS", "ZAR", "KES"],
  // PayPal settles no African currency at all — sending it NGN returns
  // 422 CURRENCY_NOT_SUPPORTED.
  paypal: ["USD", "GBP", "EUR"],
};

/**
 * What this ministry's accounts are actually enabled for, which is narrower
 * than the ceiling above:
 *
 *  - Paystack has no dollar channel, so a USD charge fails with "No active
 *    channel to process transaction". Naira only.
 *  - PayPal is set to dollars only, rather than also offering GBP/EUR.
 *
 * Change these with PAYSTACK_CURRENCIES / PAYPAL_CURRENCIES /
 * FLUTTERWAVE_CURRENCIES once an account gains a channel — no code change.
 */
export const DEFAULT_GATEWAY_CURRENCIES: Record<Provider, CurrencyCode[]> = {
  flutterwave: SUPPORTED.flutterwave,
  paystack: ["NGN"],
  paypal: ["USD"],
};

const META: Record<Provider, Omit<GatewayInfo, "currencies">> = {
  paystack: {
    id: "paystack",
    label: "Paystack",
    blurb: "Card, bank transfer, USSD and mobile money.",
  },
  flutterwave: {
    id: "flutterwave",
    label: "Flutterwave",
    blurb: "Card, bank transfer, USSD and mobile money.",
  },
  paypal: {
    id: "paypal",
    label: "PayPal",
    blurb: "Pay with your PayPal balance or a linked card.",
  },
};

/** Order methods appear at checkout. */
export const PROVIDER_ORDER: Provider[] = ["paystack", "flutterwave", "paypal"];

export const isProvider = (v: unknown): v is Provider =>
  typeof v === "string" && v in META;

export function gatewayLabel(id: string): string {
  return META[id as Provider]?.label ?? id;
}

export function gatewayBlurb(id: string): string {
  return META[id as Provider]?.blurb ?? "";
}

/* --------------------------- Per-deployment config -------------------------- */

export type GatewayCurrencies = Record<Provider, CurrencyCode[]>;

/**
 * SERVER ONLY — reads process.env, which is not available in the browser.
 *
 * Narrow a gateway to what this particular merchant account can actually
 * settle, e.g. `PAYSTACK_CURRENCIES=NGN` for an account without a dollar
 * channel. Anything unset keeps the full default list. The result is passed
 * down to the checkout as a prop so client and server agree on which currency
 * a gateway will charge in.
 */
export function resolveGatewayCurrencies(
  env: Record<string, string | undefined>
): GatewayCurrencies {
  const parse = (id: Provider, raw: string | undefined): CurrencyCode[] => {
    const wanted = String(raw ?? "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    if (!wanted.length) return DEFAULT_GATEWAY_CURRENCIES[id];
    // Checked against what the gateway genuinely supports, so an override can
    // widen beyond this deployment's default but never beyond reality.
    const allowed = SUPPORTED[id].filter((c) => wanted.includes(c));
    return allowed.length ? allowed : DEFAULT_GATEWAY_CURRENCIES[id];
  };

  return {
    flutterwave: parse("flutterwave", env.FLUTTERWAVE_CURRENCIES),
    paystack: parse("paystack", env.PAYSTACK_CURRENCIES),
    paypal: parse("paypal", env.PAYPAL_CURRENCIES),
  };
}

/* ------------------------------- Settlement ------------------------------- */

/**
 * Currencies every line in the basket has a price in.
 *
 * An intersection, not a union: a total can only be charged in a currency that
 * *all* the books are priced in. With exchange rates available that is every
 * supported currency; without them it is only each book's base currency.
 */
export function priceableCurrencies(lines: BookPrices[]): CurrencyCode[] {
  if (!lines.length) return [];
  const [first, ...rest] = lines;
  return (Object.keys(first) as CurrencyCode[]).filter(
    (code) =>
      (first[code] ?? 0) > 0 && rest.every((prices) => (prices[code] ?? 0) > 0)
  );
}

/**
 * The currency a gateway will actually charge in.
 *
 * Prefers the currency the shopper is browsing in, so most people are charged
 * exactly what they were shown. Otherwise falls back to the gateway's first
 * supported currency the basket can be priced in — the buyer is told about the
 * conversion before they commit. Returns null when there is no overlap at all,
 * which is the only case where a gateway is genuinely unusable.
 */
export function settlementCurrency(
  supported: CurrencyCode[],
  display: string,
  priceable: CurrencyCode[],
  allowConversion = true
): CurrencyCode | null {
  if (
    (supported as string[]).includes(display) &&
    (priceable as string[]).includes(display)
  ) {
    return display as CurrencyCode;
  }
  // A gateway that does not convert is simply not on offer here.
  if (!allowConversion) return null;
  return supported.find((c) => priceable.includes(c)) ?? null;
}

export const allowsConversion = (id: Provider): boolean => ALLOWS_CONVERSION[id];

/** Everything the checkout needs to render one payment method. */
export type GatewayOption = {
  id: Provider;
  label: string;
  blurb: string;
  /** Null when this gateway shares no currency with the basket. */
  currency: CurrencyCode | null;
  /** True when the buyer will be charged in something other than they browsed. */
  converted: boolean;
};

export function gatewayOptions(
  configured: Record<Provider, boolean>,
  currencies: GatewayCurrencies,
  display: string,
  priceable: CurrencyCode[]
): GatewayOption[] {
  return PROVIDER_ORDER.filter((id) => configured[id]).map((id) => {
    const currency = settlementCurrency(
      currencies[id],
      display,
      priceable,
      ALLOWS_CONVERSION[id]
    );
    return {
      id,
      label: META[id].label,
      blurb: META[id].blurb,
      currency,
      converted: Boolean(currency) && currency !== display,
    };
  });
}
