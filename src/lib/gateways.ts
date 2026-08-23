import type { CurrencyCode } from "@/lib/currencies";
import type { BookPrices } from "@/lib/books-shared";

/**
 * The payment gateways the bookshop can take money through.
 *
 * Client-safe: no secrets, no SDKs, just the facts the checkout UI needs to
 * describe each option. Whether a gateway is *configured* is a server question
 * and is passed down as a prop.
 *
 * Every gateway is always offered. A gateway that cannot settle the currency
 * the shopper is browsing in charges in one it can instead, converted from the
 * same base price — see settlementCurrency below. Greying options out meant a
 * shopper looking at naira saw PayPal disabled, and one looking at dollars was
 * offered a Paystack account with no dollar channel.
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
 * Defaults reflect what each gateway supports as a product. An individual
 * merchant account is often narrower — a Nigerian Paystack account has no
 * dollar channel until it is enabled — so each list can be narrowed per
 * deployment with an env var (see resolveGatewayCurrencies).
 */
export const DEFAULT_GATEWAY_CURRENCIES: Record<Provider, CurrencyCode[]> = {
  // Settles everything the shop prices in.
  flutterwave: ["NGN", "USD", "GBP", "EUR", "AED", "GHS", "KES", "ZAR"],
  // NGN first: it is the home market and the channel most likely enabled.
  paystack: ["NGN", "USD", "GHS", "ZAR", "KES"],
  // PayPal does no African currencies at all.
  paypal: ["USD", "GBP", "EUR"],
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
  const parse = (
    raw: string | undefined,
    fallback: CurrencyCode[]
  ): CurrencyCode[] => {
    const wanted = String(raw ?? "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    if (!wanted.length) return fallback;
    // Intersect rather than replace: an env var can only ever narrow what the
    // gateway genuinely supports, never invent support it does not have.
    const narrowed = fallback.filter((c) => wanted.includes(c));
    return narrowed.length ? narrowed : fallback;
  };

  return {
    flutterwave: parse(
      env.FLUTTERWAVE_CURRENCIES,
      DEFAULT_GATEWAY_CURRENCIES.flutterwave
    ),
    paystack: parse(env.PAYSTACK_CURRENCIES, DEFAULT_GATEWAY_CURRENCIES.paystack),
    paypal: parse(env.PAYPAL_CURRENCIES, DEFAULT_GATEWAY_CURRENCIES.paypal),
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
  priceable: CurrencyCode[]
): CurrencyCode | null {
  if (
    (supported as string[]).includes(display) &&
    (priceable as string[]).includes(display)
  ) {
    return display as CurrencyCode;
  }
  return supported.find((c) => priceable.includes(c)) ?? null;
}

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
    const currency = settlementCurrency(currencies[id], display, priceable);
    return {
      id,
      label: META[id].label,
      blurb: META[id].blurb,
      currency,
      converted: Boolean(currency) && currency !== display,
    };
  });
}
