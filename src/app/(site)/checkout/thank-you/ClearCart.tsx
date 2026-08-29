"use client";

import { useEffect } from "react";
import { useCart } from "@/components/shop/CartProvider";

/**
 * Empties the basket once an order is confirmed paid.
 *
 * Deliberately *not* done at checkout: a buyer who abandons the gateway, or
 * whose card is declined, must come back to the basket they built. Only a
 * settled order clears it.
 */
export function ClearCart() {
  const { clear, items, ready } = useCart();

  useEffect(() => {
    if (ready && items.length > 0) clear();
  }, [ready, items.length, clear]);

  return null;
}
