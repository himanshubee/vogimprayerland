import { CURRENCIES, type CurrencyCode } from "@/lib/currencies";

/**
 * Book types and pure helpers — safe to import from a client component.
 *
 * lib/books.ts is the database layer and pulls in the MongoDB driver, which
 * must never reach a browser bundle. Anything the shop UI needs in order to
 * *render* a book — its shape, its price formatting, which currencies PayPal
 * will take — lives here instead. lib/books.ts re-exports all of it, so server
 * code can keep importing from either module.
 */

/** Currencies PayPal will settle in. Everything else is Flutterwave-only —
 *  notably NGN, which PayPal does not support at all. */
export const PAYPAL_CURRENCIES: CurrencyCode[] = ["USD", "GBP", "EUR"];

export const isPaypalCurrency = (c: string): c is CurrencyCode =>
  (PAYPAL_CURRENCIES as string[]).includes(c);

export type BookStatus = "published" | "draft";

/** Missing/blank entry = the book is not sold in that currency. */
export type BookPrices = Partial<Record<CurrencyCode, number>>;

export type Book = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  description: string; // HTML (authored in the same TinyMCE as posts)
  coverImage: string | null;
  /** What the ministry actually typed, in `baseCurrency`. */
  basePrice: number;
  baseCurrency: CurrencyCode;
  /**
   * Every currency this book can be bought in, derived from `basePrice` at
   * the current exchange rates. This is what the whole shop renders and what
   * checkout prices against — never recompute it in a component.
   */
  prices: BookPrices;
  pages: number;
  category: string;
  status: BookStatus;
  featured: boolean;
  order: number;
  /** Present once a PDF has been uploaded. The id is never exposed publicly. */
  hasPdf: boolean;
  pdfFileName: string;
  pdfSize: number;
  createdAt: string;
  updatedAt: string;
};

export function slugifyBook(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Round to the precision the currency actually charges in. Flutterwave and
 * PayPal both reject a total whose decimals don't match the currency, and a
 * price of 4.999 would otherwise become an unpayable order.
 */
export function roundMoney(amount: number): number {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCIES[currency as CurrencyCode]?.symbol ?? "";
  const n = amount.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${n}`;
}

/** Keep only real, positive prices in currencies we actually know about. */
export function cleanPrices(input: unknown): BookPrices {
  const out: BookPrices = {};
  if (!input || typeof input !== "object") return out;
  for (const [code, raw] of Object.entries(input as Record<string, unknown>)) {
    const key = code.toUpperCase() as CurrencyCode;
    if (!(key in CURRENCIES)) continue;
    // "" / null / 0 all mean "not sold in this currency" — drop the key so the
    // shop never renders a free book by accident.
    const n = roundMoney(Number(raw));
    if (Number.isFinite(n) && n > 0) out[key] = n;
  }
  return out;
}

/** Currencies this book can actually be bought in. */
export function currenciesFor(book: Book): CurrencyCode[] {
  return (Object.keys(book.prices) as CurrencyCode[]).filter(
    (c) => (book.prices[c] ?? 0) > 0
  );
}

/**
 * A book is only sellable once it has both a price and a file to deliver —
 * publishing one without a PDF would take money for nothing.
 */
export function isSellable(book: Book): boolean {
  return book.status === "published" && book.hasPdf && currenciesFor(book).length > 0;
}

/* ---------------------------- Automatic pricing --------------------------- */

/**
 * Books are priced in USD and everything else is converted from it — NGN
 * included, with no special case for the home market. One base currency keeps
 * a single number per book authoritative; the day's rate does the rest.
 */
export const DEFAULT_BASE_CURRENCY: CurrencyCode = "USD";

/**
 * The increment each currency's converted price is rounded up to.
 *
 * Two reasons this matters more than it looks. Tidiness: a shop showing
 * "₦7,847.23" reads like a machine did it. And stability: rates drift a
 * fraction of a percent every day, so an unrounded price would visibly change
 * between one visit and the next — rounding to a step means the displayed
 * price only moves when the rate moves enough to matter.
 */
export const PRICE_STEPS: Record<CurrencyCode, number> = {
  NGN: 100,
  KES: 50,
  GHS: 1,
  ZAR: 5,
  AED: 1,
  USD: 0.5,
  GBP: 0.5,
  EUR: 0.5,
};

/**
 * Round *up* to the currency's step. Up, never down, so conversion rounding
 * can never quietly sell a book for less than the ministry intended.
 */
export function roundUpToStep(amount: number, currency: CurrencyCode): number {
  const step = PRICE_STEPS[currency] ?? 0.01;
  // The epsilon stops an exact multiple (5.0 / 0.5 = 10.000000000000002)
  // from being pushed up a whole extra step by floating-point noise.
  return roundMoney(Math.ceil(amount / step - 1e-9) * step);
}

/**
 * Derive what this book costs in every supported currency.
 *
 * One price in, every price out. The base currency is exactly the figure that
 * was typed; every other currency is converted at the day's rate and rounded
 * up. A currency is left out entirely when no rate is available for it — the
 * shop then says "not sold in X" rather than showing a price built on a guess.
 *
 * There is deliberately no per-currency override. A price the ministry can
 * pin by hand is a price that silently stops tracking the base one, and in
 * practice that only ever produced stale or invalid figures.
 */
export function computePrices(
  basePrice: number,
  baseCurrency: CurrencyCode,
  rates: Record<string, number> | null | undefined
): BookPrices {
  const out: BookPrices = {};
  const base = roundMoney(Number(basePrice));
  if (!(base > 0)) return out;

  const baseRate = rates?.[baseCurrency];

  for (const code of Object.keys(CURRENCIES) as CurrencyCode[]) {
    if (code === baseCurrency) {
      out[code] = base;
      continue;
    }

    const rate = rates?.[code];
    if (!rates || !baseRate || !rate) continue;

    const converted = (base / baseRate) * rate;
    // Never drop below what the gateway will accept for that currency.
    out[code] = Math.max(roundUpToStep(converted, code), CURRENCIES[code].min);
  }

  return out;
}
