"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useCart } from "@/components/shop/CartProvider";
import { useLiveCart, type LiveProduct } from "@/components/shop/useLiveCart";
import { CurrencyPicker } from "@/components/shop/CurrencyPicker";
import { LineThumb } from "@/components/shop/LineThumb";
import { formatPrice, type BookPrices } from "@/lib/books-shared";
import { variantLabel, type MerchTemplates } from "@/lib/merch-shared";
import type { CurrencyCode } from "@/lib/currencies";

export function CartClient({
  live,
  available,
  shipping,
  templates,
}: {
  live: Record<string, LiveProduct>;
  available: CurrencyCode[];
  /** Delivery for physical items, in every currency it is charged in. */
  shipping: BookPrices;
  templates: MerchTemplates;
}) {
  const { remove, setQuantity, clear } = useCart();
  const cart = useLiveCart(live, shipping);
  const { lines, blocked, subtotal, currency, ready, isEmpty, hasMerch, hasBooks, total } = cart;

  // Until localStorage has been read the basket is unknown, and rendering the
  // empty state would flash "your basket is empty" at someone with ten items.
  if (!ready) {
    return (
      <div className="min-h-[240px] flex items-center justify-center">
        <p className="text-midnight/40 text-sm">Loading your basket…</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="border border-midnight/15 bg-white px-8 py-16 text-center">
        <ShoppingBag className="mx-auto text-gold-deep" size={34} />
        <h2 className="font-display text-3xl text-midnight mt-5">Your basket is empty</h2>
        <p className="mt-4 text-midnight/70 max-w-sm mx-auto leading-relaxed">
          Nothing here yet. The library and the store are open whenever you are.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/store/" className="btn-gold justify-center">
            Browse the store <ArrowUpRight size={16} />
          </Link>
          <Link href="/books/" className="btn-ghost text-midnight border-midnight/30 justify-center">
            Browse the books
          </Link>
        </div>
      </div>
    );
  }

  const count = lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-14 items-start">
      {/* LINES */}
      <div>
        <CurrencyPicker available={available} className="mb-7" />

        <ul className="border-t border-midnight/12">
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              <motion.li
                key={line.key}
                layout
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.22 }}
                className="flex gap-4 sm:gap-5 py-5 border-b border-midnight/12 overflow-hidden"
              >
                <Link href={line.href} className="w-16 sm:w-20 shrink-0">
                  <LineThumb
                    kind={line.kind}
                    image={line.image}
                    category={line.category}
                    variant={line.variant}
                    templates={line.category ? templates[line.category] : undefined}
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg sm:text-xl text-midnight leading-tight">
                    <Link href={line.href} className="hover:text-gold-deep transition-colors">
                      {line.title}
                    </Link>
                  </h3>
                  {line.kind === "merch" && line.variant && (
                    <p className="mt-0.5 text-[11px] tracking-[0.18em] uppercase text-midnight/50">
                      {variantLabel(line.variant)}
                    </p>
                  )}

                  {!line.available ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-midnight-soft">
                      <AlertTriangle size={13} />
                      No longer available
                    </p>
                  ) : line.unitPrice > 0 ? (
                    <p className="mt-1 text-sm text-midnight/55">
                      {formatPrice(line.unitPrice, currency)} each
                    </p>
                  ) : (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-midnight-soft">
                      <AlertTriangle size={13} />
                      Not sold in {currency}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-4">
                    <div className="inline-flex items-center border border-midnight/20">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                        aria-label={`Fewer of ${line.title}`}
                        className="px-2.5 py-1.5 text-midnight/70 hover:bg-midnight hover:text-gold transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 text-sm tabular-nums text-midnight">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                        aria-label={`More of ${line.title}`}
                        className="px-2.5 py-1.5 text-midnight/70 hover:bg-midnight hover:text-gold transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(line.key)}
                      className="inline-flex items-center gap-1.5 text-xs text-midnight/45 hover:text-midnight-soft transition-colors"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>

                {line.available && line.unitPrice > 0 && (
                  <p className="font-display text-xl sm:text-2xl text-midnight shrink-0 self-start tabular-nums">
                    {formatPrice(line.lineTotal, currency)}
                  </p>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <button
          type="button"
          onClick={clear}
          className="mt-6 text-xs text-midnight/45 hover:text-midnight-soft transition-colors"
        >
          Empty the basket
        </button>
      </div>

      {/* SUMMARY */}
      <aside className="border border-midnight/15 bg-white p-7 lg:sticky lg:top-28">
        <p className="eyebrow text-gold-deep">Summary</p>

        <dl className="mt-6 space-y-3 border-b border-midnight/12 pb-6">
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-midnight/60">Items</dt>
            <dd className="text-midnight tabular-nums">{count}</dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-midnight/60">Subtotal</dt>
            <dd className="text-midnight tabular-nums">{formatPrice(subtotal, currency)}</dd>
          </div>
          {hasBooks && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-midnight/60">Books</dt>
              <dd className="text-gold-deep">Instant download</dd>
            </div>
          )}
          {hasMerch && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-midnight/60">Delivery</dt>
              <dd className="text-midnight tabular-nums">
                {cart.shipping > 0 ? formatPrice(cart.shipping, currency) : "Free"}
              </dd>
            </div>
          )}
        </dl>

        <div className="flex items-baseline justify-between gap-4 pt-6">
          <span className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">
            Total
          </span>
          <span className="font-display text-3xl text-midnight tabular-nums">
            {formatPrice(total, currency)}
            <span className="ml-1.5 text-xs tracking-[0.2em] uppercase text-midnight/45">
              {currency}
            </span>
          </span>
        </div>

        {blocked.length > 0 ? (
          <>
            <p
              role="alert"
              className="mt-6 border-l-2 border-midnight-soft bg-midnight-soft/5 px-4 py-3 text-sm text-midnight"
            >
              {blocked.length === 1
                ? `“${blocked[0].title}” cannot be bought right now.`
                : `${blocked.length} items in your basket cannot be bought right now.`}{" "}
              {blocked.some((l) => l.available)
                ? `Try another currency, or remove ${blocked.length === 1 ? "it" : "them"} to continue.`
                : `Please remove ${blocked.length === 1 ? "it" : "them"} to continue.`}
            </p>
            <button
              type="button"
              disabled
              className="btn-gold mt-6 w-full justify-center opacity-50 cursor-not-allowed"
            >
              Checkout
            </button>
          </>
        ) : (
          <Link href="/checkout/" className="btn-gold mt-7 w-full justify-center">
            Checkout <ArrowUpRight size={16} />
          </Link>
        )}

        <Link
          href={hasMerch && !hasBooks ? "/store/" : "/books/"}
          className="mt-4 block text-center text-xs text-midnight/50 hover:text-gold-deep transition-colors"
        >
          Keep browsing
        </Link>
      </aside>
    </div>
  );
}
