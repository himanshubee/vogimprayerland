"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { BookPrices } from "@/lib/books-shared";
import {
  SERVER_SNAPSHOT,
  addItem,
  clearItems,
  getServerSnapshot,
  getSnapshot,
  removeItem,
  setItemQuantity,
  setStoredCurrency,
  subscribe,
  type CartItem,
} from "./cart-store";

export type { CartItem } from "./cart-store";

/**
 * The basket, exposed to the tree.
 *
 * State lives in cart-store.ts (localStorage, an external store) so it survives
 * a reload and the round trip out to a payment gateway. Prices are cached there
 * *only* to render the basket without a network call — /api/shop/checkout
 * re-reads every price from the database before it creates a payment link, so a
 * tampered basket buys nothing cheaply.
 */

type CartContextValue = {
  items: CartItem[];
  currency: string;
  /** False until localStorage has been read — guards against an SSR mismatch. */
  ready: boolean;
  count: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (bookId: string) => void;
  setQuantity: (bookId: string, quantity: number) => void;
  setCurrency: (code: string) => void;
  clear: () => void;
  has: (bookId: string) => boolean;
  /** Lines that cannot be priced in the active currency. */
  unavailable: CartItem[];
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  defaultCurrency = "NGN",
}: {
  children: React.ReactNode;
  defaultCurrency?: string;
}) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // The server snapshot's identity IS the "not read yet" signal, so no effect
  // and no extra state are needed to know whether the basket is trustworthy.
  const ready = snapshot !== SERVER_SNAPSHOT;
  const currency = snapshot.currency || defaultCurrency;

  const value = useMemo<CartContextValue>(() => {
    const { items } = snapshot;
    const priceIn = (i: CartItem) =>
      Number(i.prices[currency as keyof BookPrices] ?? 0);

    const subtotal = items.reduce((sum, i) => sum + priceIn(i) * i.quantity, 0);

    return {
      items,
      currency,
      ready,
      count: items.reduce((n, i) => n + i.quantity, 0),
      add: addItem,
      remove: removeItem,
      setQuantity: setItemQuantity,
      setCurrency: setStoredCurrency,
      clear: clearItems,
      has: (bookId: string) => items.some((i) => i.bookId === bookId),
      unavailable: items.filter((i) => priceIn(i) <= 0),
      subtotal: Math.round((subtotal + Number.EPSILON) * 100) / 100,
    };
  }, [snapshot, currency, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
