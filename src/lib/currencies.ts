/**
 * Currency data — pure, and safe to import from a client component.
 *
 * Kept apart from lib/flutterwave.ts on purpose: that module is the gateway
 * client and has no business in a browser bundle, but the symbols and minimums
 * are needed to render a price. lib/flutterwave.ts re-exports everything here,
 * so server code can keep importing it from either place.
 */

export type CurrencyCode =
  | "NGN"
  | "USD"
  | "GBP"
  | "EUR"
  | "AED"
  | "GHS"
  | "KES"
  | "ZAR";

// Stablecoins (USDT/USDC/RLUSD) are deliberately absent: the /v3/payments API
// issues a link for them but the hosted checkout finds no payment methods and
// hangs on a spinner. Stablecoin gifts go through the wallet addresses on
// /give instead (see StablecoinGive).
export const CURRENCIES: Record<
  CurrencyCode,
  { symbol: string; label: string; min: number }
> = {
  NGN: { symbol: "₦", label: "Naira", min: 100 },
  USD: { symbol: "$", label: "US Dollar", min: 1 },
  GBP: { symbol: "£", label: "Pound", min: 1 },
  EUR: { symbol: "€", label: "Euro", min: 1 },
  AED: { symbol: "Dh", label: "UAE Dirham", min: 5 },
  GHS: { symbol: "₵", label: "Cedi", min: 1 },
  KES: { symbol: "KSh", label: "Shilling", min: 50 },
  ZAR: { symbol: "R", label: "Rand", min: 10 },
};

export const isCurrency = (v: string): v is CurrencyCode => v in CURRENCIES;
