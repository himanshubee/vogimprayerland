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
