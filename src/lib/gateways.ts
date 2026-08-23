import type { CurrencyCode } from "@/lib/currencies";
import { PAYPAL_CURRENCIES } from "@/lib/books-shared";
import { PAYSTACK_CURRENCIES } from "@/lib/paystack";

/**
 * The payment gateways the bookshop can take money through.
 *
 * Client-safe: no secrets, no SDKs, just the facts the checkout UI needs to
 * describe each option. Whether a gateway is *configured* is a server question
 * and is passed down as a prop.
 *
 * This exists because "is it PayPal or Flutterwave" was becoming a chain of
 * ternaries in eight different files, and every new gateway meant editing all
 * of them. One table; the UI, the order records, and the admin all read it.
 */

export type Provider = "flutterwave" | "paystack" | "paypal";

export type GatewayInfo = {
  id: Provider;
  /** Shown on the checkout button and in the admin. */
  label: string;
  /** One line under the label explaining what a buyer can pay with. */
  blurb: string;
  /** Currencies this gateway can settle. */
  currencies: CurrencyCode[];
};

/** Flutterwave settles everything the shop prices in. */
const FLUTTERWAVE_CURRENCIES: CurrencyCode[] = [
  "USD",
  "NGN",
  "GBP",
  "EUR",
  "AED",
  "GHS",
  "KES",
  "ZAR",
];

/** Order matters — this is the order methods appear at checkout. */
export const GATEWAYS: GatewayInfo[] = [
  {
    id: "paystack",
    label: "Paystack",
    blurb: "Card, bank transfer, USSD and mobile money.",
    currencies: PAYSTACK_CURRENCIES,
  },
  {
    id: "flutterwave",
    label: "Flutterwave",
    blurb: "Card, bank transfer, USSD and mobile money.",
    currencies: FLUTTERWAVE_CURRENCIES,
  },
  {
    id: "paypal",
    label: "PayPal",
    blurb: "Pay with your PayPal balance or a linked card.",
    currencies: PAYPAL_CURRENCIES,
  },
];

const BY_ID = new Map(GATEWAYS.map((g) => [g.id, g]));

export function gateway(id: Provider): GatewayInfo {
  return BY_ID.get(id) ?? GATEWAYS[0];
}

export function gatewayLabel(id: string): string {
  return BY_ID.get(id as Provider)?.label ?? id;
}

export const isProvider = (v: unknown): v is Provider =>
  typeof v === "string" && BY_ID.has(v as Provider);

export function supportsCurrency(id: Provider, currency: string): boolean {
  return (gateway(id).currencies as string[]).includes(currency);
}

/**
 * The gateways a buyer can actually use right now: configured on the server
 * *and* able to settle the currency they are shopping in.
 */
export function usableGateways(
  configured: Record<Provider, boolean>,
  currency: string
): GatewayInfo[] {
  return GATEWAYS.filter(
    (g) => configured[g.id] && supportsCurrency(g.id, currency)
  );
}
