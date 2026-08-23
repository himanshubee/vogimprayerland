import type { BookPrices } from "@/lib/books-shared";

/**
 * The basket, as an external store.
 *
 * localStorage genuinely *is* an external store — shared across tabs, absent on
 * the server — so this is modelled with useSyncExternalStore rather than state
 * copied out of storage by an effect. That gets hydration right for free
 * (React renders the server snapshot, then swaps in the real basket) and keeps
 * two open tabs in step.
 *
 * The authoritative copy is the module-level `state`; localStorage is a mirror.
 * That matters in private browsing, where writes throw: the basket still works
 * for the session instead of silently refusing to change.
 */

const ITEMS_KEY = "vogim_cart_v1";
const CURRENCY_KEY = "vogim_cart_currency";
const MAX_QTY = 20;
const MAX_LINES = 30;

export type CartItem = {
  bookId: string;
  slug: string;
  title: string;
  coverImage: string | null;
  prices: BookPrices;
  quantity: number;
};

export type CartSnapshot = {
  items: CartItem[];
  /** "" means the shopper has not chosen one — callers fall back to a default. */
  currency: string;
};

/**
 * The snapshot the server renders, and the one React hydrates against.
 * Its identity doubles as the "storage not read yet" signal, so no separate
 * `ready` state (and no setState-in-effect) is needed.
 */
export const SERVER_SNAPSHOT: CartSnapshot = { items: [], currency: "" };

let state: CartSnapshot | null = null;
const listeners = new Set<() => void>();

/* ----------------------------- Storage I/O ------------------------------ */

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode or quota — the in-memory basket carries the session */
  }
}

function parseItems(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.bookId === "string")
      .map((i) => ({
        bookId: String(i.bookId),
        slug: String(i.slug ?? ""),
        title: String(i.title ?? ""),
        coverImage: i.coverImage ?? null,
        prices: (i.prices ?? {}) as BookPrices,
        quantity: Math.max(1, Math.min(MAX_QTY, Number(i.quantity) || 1)),
      }))
      .slice(0, MAX_LINES);
  } catch {
    // A corrupt basket must never white-screen the shop.
    return [];
  }
}

function readFromStorage(): CartSnapshot {
  return {
    items: parseItems(safeGet(ITEMS_KEY)),
    currency: safeGet(CURRENCY_KEY) ?? "",
  };
}

/* ------------------------------- The store ------------------------------ */

function emit(): void {
  for (const listener of listeners) listener();
}

/**
 * useSyncExternalStore compares snapshots by identity, so this must return the
 * *same object* until something actually changes — a fresh object every call
 * would re-render forever.
 */
export function getSnapshot(): CartSnapshot {
  if (!state) state = readFromStorage();
  return state;
}

export function getServerSnapshot(): CartSnapshot {
  return SERVER_SNAPSHOT;
}

let wired = false;

export function subscribe(listener: () => void): () => void {
  if (!wired && typeof window !== "undefined") {
    wired = true;
    // Another tab changed the basket — re-read rather than trusting our copy.
    window.addEventListener("storage", (e) => {
      if (e.key === ITEMS_KEY || e.key === CURRENCY_KEY) {
        state = readFromStorage();
        emit();
      }
    });
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: CartSnapshot): void {
  state = next;
  safeSet(ITEMS_KEY, JSON.stringify(next.items));
  if (next.currency) safeSet(CURRENCY_KEY, next.currency);
  emit();
}

function setItems(items: CartItem[]): void {
  commit({ ...getSnapshot(), items });
}

/* ------------------------------ Mutations ------------------------------- */

export function addItem(item: Omit<CartItem, "quantity">, quantity = 1): void {
  const { items } = getSnapshot();
  const existing = items.find((i) => i.bookId === item.bookId);
  setItems(
    existing
      ? items.map((i) =>
          i.bookId === item.bookId
            ? { ...i, ...item, quantity: Math.min(MAX_QTY, i.quantity + quantity) }
            : i
        )
      : [...items, { ...item, quantity: Math.min(MAX_QTY, quantity) }]
  );
}

export function removeItem(bookId: string): void {
  setItems(getSnapshot().items.filter((i) => i.bookId !== bookId));
}

export function setItemQuantity(bookId: string, quantity: number): void {
  const q = Math.round(quantity);
  const { items } = getSnapshot();
  setItems(
    q < 1
      ? items.filter((i) => i.bookId !== bookId)
      : items.map((i) =>
          i.bookId === bookId ? { ...i, quantity: Math.min(MAX_QTY, q) } : i
        )
  );
}

export function setStoredCurrency(code: string): void {
  commit({ ...getSnapshot(), currency: code });
}

export function clearItems(): void {
  setItems([]);
}
