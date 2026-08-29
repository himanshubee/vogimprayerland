"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useCart } from "@/components/shop/CartProvider";
import { useLiveCart, type LiveBook } from "@/components/shop/useLiveCart";
import { CurrencyPicker } from "@/components/shop/CurrencyPicker";
import { formatPrice } from "@/lib/books-shared";
import type { CurrencyCode } from "@/lib/currencies";

export function CartClient({
  live,
  available,
}: {
  live: Record<string, LiveBook>;
  available: CurrencyCode[];
}) {
  const { remove, setQuantity, clear } = useCart();
  const { lines, blocked, subtotal, currency, ready, isEmpty } = useLiveCart(live);

  // Until localStorage has been read the basket is unknown, and rendering the
  // empty state would flash "your basket is empty" at someone who has ten books.
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
        <h2 className="font-display text-3xl text-midnight mt-5">
          Your basket is empty
        </h2>
        <p className="mt-4 text-midnight/70 max-w-sm mx-auto leading-relaxed">
          Nothing here yet. The library is open whenever you are.
        </p>
        <Link href="/books/" className="btn-gold mt-8">
          Browse the books <ArrowUpRight size={16} />
        </Link>
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
                key={line.bookId}
                layout
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.22 }}
                className="flex gap-4 sm:gap-5 py-5 border-b border-midnight/12 overflow-hidden"
              >
                <Link
                  href={`/books/${line.slug}/`}
                  className="relative w-16 sm:w-20 aspect-[3/4] shrink-0 bg-midnight/5"
                >
                  {line.coverImage ? (
                    <Image
                      src={line.coverImage}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center bg-midnight text-gold/70">
                      <BookOpen size={20} />
                    </span>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg sm:text-xl text-midnight leading-tight">
                    <Link
                      href={`/books/${line.slug}/`}
                      className="hover:text-gold-deep transition-colors"
                    >
                      {line.title}
                    </Link>
                  </h3>

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
                        onClick={() => setQuantity(line.bookId, line.quantity - 1)}
                        aria-label={`Fewer copies of ${line.title}`}
                        className="px-2.5 py-1.5 text-midnight/70 hover:bg-midnight hover:text-gold transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 text-sm tabular-nums text-midnight">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.bookId, line.quantity + 1)}
                        aria-label={`More copies of ${line.title}`}
                        className="px-2.5 py-1.5 text-midnight/70 hover:bg-midnight hover:text-gold transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(line.bookId)}
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
            <dt className="text-midnight/60">Books</dt>
            <dd className="text-midnight tabular-nums">{count}</dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-midnight/60">Delivery</dt>
            <dd className="text-gold-deep">Instant download</dd>
          </div>
        </dl>

        <div className="flex items-baseline justify-between gap-4 pt-6">
          <span className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">
            Total
          </span>
          <span className="font-display text-3xl text-midnight tabular-nums">
            {formatPrice(subtotal, currency)}
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
                : `${blocked.length} books in your basket cannot be bought right now.`}{" "}
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
          <Link href="/books/checkout/" className="btn-gold mt-7 w-full justify-center">
            Checkout <ArrowUpRight size={16} />
          </Link>
        )}

        <Link
          href="/books/"
          className="mt-4 block text-center text-xs text-midnight/50 hover:text-gold-deep transition-colors"
        >
          Keep browsing
        </Link>
      </aside>
    </div>
  );
}
