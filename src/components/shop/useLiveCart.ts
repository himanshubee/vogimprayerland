"use client";

import { useMemo } from "react";
import { useCart } from "./CartProvider";
import { roundMoney, type BookPrices } from "@/lib/books-shared";

/**
 * Price the basket from the live catalogue rather than from what was cached
 * when each book was added.
 *
 * The basket persists a snapshot of a book's prices in localStorage so it can
 * render instantly with no network call. That snapshot goes stale the moment
 * anything changes: an exchange-rate refresh, an edited price, or — the case
 * that actually bit — a book that had no price in the shopper's currency when
 * they added it and has one now. Pricing off the snapshot made such a line read
 * "not sold in USD" forever and blocked checkout on a book that was perfectly
 * buyable.
 *
 * So the server hands the current catalogue down and every line is priced from
 * that, keyed by book id. The stored snapshot is only a fallback for a book
 * that has since left the catalogue — enough to still show its title and cover
 * while telling the shopper it is no longer available.
 *
 * This is display only. /api/shop/checkout re-reads every price from the
 * database before creating a payment link, so it remains the authority.
 */

export type LiveBook = {
  slug: string;
  title: string;
  coverImage: string | null;
  prices: BookPrices;
};

export type LiveLine = {
  bookId: string;
  slug: string;
  title: string;
  coverImage: string | null;
  quantity: number;
  /** 0 when the book has no price in the active currency. */
  unitPrice: number;
  lineTotal: number;
  /** False once a book has been unpublished, deleted, or lost its PDF. */
  available: boolean;
};

export type LiveCart = {
  lines: LiveLine[];
  /** Lines that cannot be bought right now, for whatever reason. */
  blocked: LiveLine[];
  subtotal: number;
  currency: string;
  ready: boolean;
  isEmpty: boolean;
};

export function useLiveCart(live: Record<string, LiveBook>): LiveCart {
  const { items, currency, ready } = useCart();

  return useMemo(() => {
    const lines: LiveLine[] = items.map((item) => {
      const current = live[item.bookId];
      const prices = current?.prices ?? item.prices;
      const unitPrice = Number(prices[currency as keyof BookPrices] ?? 0);

      return {
        bookId: item.bookId,
        // Prefer live details so a renamed book or a replaced cover updates in
        // an old basket too.
        slug: current?.slug ?? item.slug,
        title: current?.title ?? item.title,
        coverImage: current?.coverImage ?? item.coverImage,
        quantity: item.quantity,
        unitPrice,
        lineTotal: roundMoney(unitPrice * item.quantity),
        available: Boolean(current),
      };
    });

    const blocked = lines.filter((l) => !l.available || l.unitPrice <= 0);
    const subtotal = lines
      .filter((l) => l.available && l.unitPrice > 0)
      .reduce((sum, l) => sum + l.lineTotal, 0);

    return {
      lines,
      blocked,
      subtotal: roundMoney(subtotal),
      currency,
      ready,
      isEmpty: ready && lines.length === 0,
    };
  }, [items, currency, live, ready]);
}
