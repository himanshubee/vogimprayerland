"use client";

import { useMemo } from "react";
import { useCart } from "./CartProvider";
import type { CartKind, CartVariant } from "./cart-store";
import { roundMoney, type BookPrices } from "@/lib/books-shared";
import { priceableCurrencies } from "@/lib/gateways";
import type { CurrencyCode } from "@/lib/currencies";
import type { MerchCategory } from "@/lib/merch-shared";

/**
 * Price the basket from the live catalogue rather than from what was cached
 * when each line was added.
 *
 * The basket persists a snapshot of each product's prices in localStorage so
 * it can render instantly with no network call. That snapshot goes stale the
 * moment anything changes: an exchange-rate refresh, an edited price, or — the
 * case that actually bit — a book that had no price in the shopper's currency
 * when they added it and has one now. Pricing off the snapshot made such a
 * line read "not sold in USD" forever and blocked checkout on a book that was
 * perfectly buyable.
 *
 * So the server hands the current catalogue down and every line is priced from
 * that, keyed by product id. The stored snapshot is only a fallback for a
 * product that has since left the catalogue — enough to still show its title
 * while telling the shopper it is no longer available.
 *
 * Delivery works the same way: the current fee in every currency comes down
 * with the catalogue and is added once whenever the basket holds anything
 * physical.
 *
 * This is display only. /api/shop/checkout re-reads every price from the
 * database before creating a payment link, so it remains the authority.
 */

export type LiveProduct = {
  kind: CartKind;
  slug: string;
  title: string;
  image: string | null;
  prices: BookPrices;
  /** Garments only. */
  category?: MerchCategory;
  /** Garments only — colours still on offer, so a dropped colour blocks the line. */
  colors?: string[];
};

export type LiveLine = {
  key: string;
  kind: CartKind;
  productId: string;
  slug: string;
  title: string;
  image: string | null;
  /** Where the line's title links to. */
  href: string;
  variant?: CartVariant;
  category?: MerchCategory;
  quantity: number;
  /** 0 when the product has no price in the active currency. */
  unitPrice: number;
  lineTotal: number;
  /** False once a product has been unpublished, deleted, or lost its file/colour. */
  available: boolean;
};

export type LiveCart = {
  lines: LiveLine[];
  /** Lines that cannot be bought right now, for whatever reason. */
  blocked: LiveLine[];
  /** Items only. */
  subtotal: number;
  /** Delivery in the active currency; 0 when nothing physical is in the basket. */
  shipping: number;
  /** Items plus delivery. */
  total: number;
  hasMerch: boolean;
  hasBooks: boolean;
  currency: string;
  ready: boolean;
  isEmpty: boolean;
  /** Currencies every line — and delivery, if charged — has a price in. */
  priceable: CurrencyCode[];
  /**
   * The basket total in any currency it can be priced in — how a gateway that
   * cannot settle the displayed currency shows what it will actually charge.
   */
  totalIn: (currency: string) => number;
};

export function hrefFor(kind: CartKind, slug: string): string {
  return kind === "merch" ? `/store/${slug}/` : `/books/${slug}/`;
}

export function useLiveCart(
  live: Record<string, LiveProduct>,
  shippingPrices: BookPrices = {}
): LiveCart {
  const { items, currency, ready } = useCart();

  return useMemo(() => {
    const lines: LiveLine[] = items.map((item) => {
      const current = live[item.productId];
      const prices = current?.prices ?? item.prices;
      const unitPrice = Number(prices[currency as keyof BookPrices] ?? 0);
      const colorGone =
        item.kind === "merch" &&
        Boolean(current?.colors) &&
        !current!.colors!.includes(item.variant?.color ?? "");

      return {
        key: item.key,
        kind: item.kind,
        productId: item.productId,
        // Prefer live details so a renamed product or a replaced image updates
        // in an old basket too.
        slug: current?.slug ?? item.slug,
        title: current?.title ?? item.title,
        image: current?.image ?? item.image,
        href: hrefFor(item.kind, current?.slug ?? item.slug),
        variant: item.variant,
        category: current?.category,
        quantity: item.quantity,
        unitPrice,
        lineTotal: roundMoney(unitPrice * item.quantity),
        available: Boolean(current) && !colorGone,
      };
    });

    const hasMerch = lines.some((l) => l.kind === "merch" && l.available);
    const hasBooks = lines.some((l) => l.kind === "book" && l.available);
    const chargesShipping = hasMerch && Object.keys(shippingPrices).length > 0;

    const blocked = lines.filter((l) => !l.available || l.unitPrice <= 0);
    const subtotal = roundMoney(
      lines
        .filter((l) => l.available && l.unitPrice > 0)
        .reduce((sum, l) => sum + l.lineTotal, 0)
    );
    const shipping = chargesShipping
      ? Number(shippingPrices[currency as keyof BookPrices] ?? 0)
      : 0;

    // Only lines still in the catalogue can be converted — a product that has
    // gone cannot be priced in anything and would otherwise empty the list.
    const present = items
      .map((item) => live[item.productId]?.prices)
      .filter((p): p is BookPrices => Boolean(p));
    if (chargesShipping) present.push(shippingPrices);

    const totalIn = (target: string) =>
      roundMoney(
        items.reduce((sum, item) => {
          const prices = live[item.productId]?.prices ?? item.prices;
          const unit = Number(prices[target as keyof BookPrices] ?? 0);
          return sum + unit * item.quantity;
        }, 0) +
          (chargesShipping ? Number(shippingPrices[target as keyof BookPrices] ?? 0) : 0)
      );

    return {
      lines,
      blocked,
      subtotal,
      shipping,
      total: roundMoney(subtotal + shipping),
      hasMerch,
      hasBooks,
      currency,
      ready,
      isEmpty: ready && lines.length === 0,
      priceable: priceableCurrencies(present),
      totalIn,
    };
  }, [items, currency, live, shippingPrices, ready]);
}
