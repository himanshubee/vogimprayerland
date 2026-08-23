import { currenciesFor, listPublishedBooks } from "@/lib/books";
import type { CurrencyCode } from "@/lib/currencies";
import type { LiveBook } from "@/components/shop/useLiveCart";

/**
 * The catalogue the basket and checkout pages price against.
 *
 * Neither page can know what is in a visitor's basket while rendering on the
 * server — it lives in their browser — so the whole sellable catalogue goes
 * down and the client picks out the books it needs by id. For a ministry
 * bookshop that is a few kilobytes, and it buys correct prices in every basket
 * without a second round trip after hydration.
 */
export type ShopCatalogue = {
  live: Record<string, LiveBook>;
  /** Currencies at least one book is actually priced in. */
  currencies: CurrencyCode[];
};

export async function getShopCatalogue(): Promise<ShopCatalogue> {
  const books = await listPublishedBooks();

  const live: Record<string, LiveBook> = {};
  for (const book of books) {
    live[book.id] = {
      slug: book.slug,
      title: book.title,
      coverImage: book.coverImage,
      prices: book.prices,
    };
  }

  return {
    live,
    currencies: [...new Set(books.flatMap(currenciesFor))] as CurrencyCode[],
  };
}
