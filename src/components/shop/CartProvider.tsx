"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
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
};

/*
 * Note: this context deliberately exposes NO prices or totals.
 *
 * The stored CartItem.prices is a snapshot taken when a book was added, and
 * pricing a basket from it silently goes wrong the moment an exchange rate
 * refreshes or an admin edits a price — a book that had no USD price when it
 * was added would read "not sold in USD" forever. Use useLiveCart(), which
 * prices against the catalogue the server just sent.
 */

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
    };
  }, [snapshot, currency, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
