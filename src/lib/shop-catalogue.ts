import { currenciesFor, listPublishedBooks } from "@/lib/books";
import { getMerchTemplates, getShippingPrices, listPublishedMerch } from "@/lib/merch";
import type { MerchTemplates } from "@/lib/merch-shared";
import type { BookPrices } from "@/lib/books-shared";
import type { CurrencyCode } from "@/lib/currencies";
import type { LiveProduct } from "@/components/shop/useLiveCart";

/**
 * The catalogue the basket and checkout pages price against.
 *
 * Neither page can know what is in a visitor's basket while rendering on the
 * server — it lives in their browser — so the whole sellable catalogue goes
 * down and the client picks out the lines it needs by product id. Books and
 * store designs together are a few kilobytes, and it buys correct prices in
 * every basket without a second round trip after hydration.
 */
export type ShopCatalogue = {
  live: Record<string, LiveProduct>;
  /** Currencies at least one product is actually priced in. */
  currencies: CurrencyCode[];
  /** Delivery for physical items, in every currency it can be charged in. */
  shipping: BookPrices;
  /** Garment photos, so basket thumbnails match the store. */
  templates: MerchTemplates;
};

export async function getShopCatalogue(): Promise<ShopCatalogue> {
  const [books, merch, shipping, templates] = await Promise.all([
    listPublishedBooks(),
    listPublishedMerch(),
    getShippingPrices().catch(() => ({}) as BookPrices),
    getMerchTemplates(),
  ]);

  const live: Record<string, LiveProduct> = {};
  for (const book of books) {
    live[book.id] = {
      kind: "book",
      slug: book.slug,
      title: book.title,
      image: book.coverImage,
      prices: book.prices,
    };
  }
  for (const item of merch) {
    live[item.id] = {
      kind: "merch",
      slug: item.slug,
      title: item.title,
      image: item.design,
      prices: item.prices,
      category: item.category,
      colors: item.colors,
    };
  }

  const currencies = new Set<CurrencyCode>(books.flatMap(currenciesFor));
  for (const item of merch) {
    for (const code of Object.keys(item.prices) as CurrencyCode[]) currencies.add(code);
  }

  return { live, currencies: [...currencies], shipping, templates };
}
