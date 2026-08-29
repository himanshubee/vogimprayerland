"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";

/**
 * Basket link for the site header. Renders nothing at all until there is
 * something in the basket — an empty basket icon on every page of a ministry
 * site is noise.
 */
export function CartBadge({ className = "" }: { className?: string }) {
  const { count, ready } = useCart();
  if (!ready || count === 0) return null;

  return (
    <Link
      href="/cart/"
      aria-label={`Basket — ${count} ${count === 1 ? "item" : "items"}`}
      className={`relative inline-flex items-center justify-center p-2 text-midnight hover:text-gold-deep transition-colors ${className}`}
    >
      <ShoppingBag size={20} />
      <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center bg-gold text-midnight text-[10px] font-semibold leading-none rounded-full">
        {count}
      </span>
    </Link>
  );
}
