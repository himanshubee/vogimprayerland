"use client";

import { useCart } from "./CartProvider";
import { formatPrice, type BookPrices } from "@/lib/books-shared";

/**
 * A price in whichever currency the shopper picked.
 *
 * Rendered on the client because the currency is a browser-side choice while
 * the shop listing itself is cached and shared by everyone.
 */
export function BookPrice({
  prices,
  className = "",
}: {
  prices: BookPrices;
  className?: string;
}) {
  const { currency, ready } = useCart();
  const amount = Number(prices[currency as keyof BookPrices] ?? 0);

  // Reserve the line's height before hydration so the card doesn't jump.
  if (!ready) {
    return <span className={`${className} opacity-0`} aria-hidden="true">—</span>;
  }

  if (amount <= 0) {
    const others = Object.keys(prices);
    return (
      <span className={`${className} !text-midnight/45 !text-base !not-italic`}>
        {others.length
          ? `Not sold in ${currency}`
          : "Price on request"}
      </span>
    );
  }

  return (
    <span className={className}>
      {formatPrice(amount, currency)}
      <span className="ml-1.5 text-[0.5em] tracking-[0.2em] uppercase align-middle text-midnight/45">
        {currency}
      </span>
    </span>
  );
}
