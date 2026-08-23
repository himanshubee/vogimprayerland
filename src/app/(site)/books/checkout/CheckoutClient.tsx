"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CreditCard,
  Loader2,
  Lock,
  ShoppingBag,
} from "lucide-react";
import { useLiveCart, type LiveBook } from "@/components/shop/useLiveCart";
import { formatPrice, isPaypalCurrency } from "@/lib/books-shared";

type Provider = "flutterwave" | "paypal";

type Props = {
  /** Current catalogue prices, so an old basket is never priced from a stale
   *  localStorage snapshot. */
  live: Record<string, LiveBook>;
  flutterwaveEnabled: boolean;
  paypalEnabled: boolean;
  /** True when Flutterwave is running against its sandbox keys. */
  testMode: boolean;
  paypalSandbox: boolean;
};

const labelCls =
  "block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1";

export function CheckoutClient({
  live,
  flutterwaveEnabled,
  paypalEnabled,
  testMode,
  paypalSandbox,
}: Props) {
  const search = useSearchParams();
  const { lines, blocked, subtotal, currency, ready, isEmpty } = useLiveCart(live);

  const paypalUsable = paypalEnabled && isPaypalCurrency(currency);
  const [preferred, setPreferred] = useState<Provider>("flutterwave");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Switching to a currency PayPal cannot take (NGN, and most of Africa) must
  // not leave a dead method selected. Derived rather than synced in an effect,
  // so the currency and the method can never disagree for even one render.
  const provider: Provider =
    preferred === "paypal" && !paypalUsable
      ? "flutterwave"
      : preferred === "flutterwave" && !flutterwaveEnabled && paypalUsable
        ? "paypal"
        : preferred;

  // The buyer bounced off PayPal's page without approving.
  const cancelled = search.get("cancelled") === "1";

  const hasBlocked = blocked.length > 0;
  const noMethod = !flutterwaveEnabled && !paypalEnabled;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (hasBlocked) {
      setError(
        `Some books in your basket cannot be bought in ${currency}. Please go back to the basket and adjust it.`
      );
      return;
    }

    setLoading(true);
    const data = new FormData(e.currentTarget);

    try {
      // Trailing slash matters: next.config sets trailingSlash, so the
      // slash-less path answers with a 308 redirect instead of the handler.
      const res = await fetch("/api/shop/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          currency,
          // Only ids and quantities — the server prices the order itself.
          items: lines.map((l) => ({ bookId: l.bookId, quantity: l.quantity })),
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          country: data.get("country"),
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload.link) {
        throw new Error(
          payload.error || "We could not start your order. Please try again."
        );
      }

      // The basket is deliberately NOT cleared here — if the buyer abandons the
      // gateway, they come back to an intact basket. The receipt page clears it
      // once the order is actually paid.
      window.location.href = payload.link;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  }

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
          There is nothing to check out
        </h2>
        <p className="mt-4 text-midnight/70 max-w-sm mx-auto leading-relaxed">
          Your basket is empty. Choose a book and it will appear here.
        </p>
        <Link href="/books/" className="btn-gold mt-8">
          Browse the books <ArrowUpRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_0.85fr] gap-10 lg:gap-14 items-start">
      {/* DETAILS + PAYMENT */}
      <form onSubmit={onSubmit}>
        {cancelled && (
          <p className="mb-8 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm text-midnight">
            Your PayPal payment was cancelled and nothing was charged. Your basket
            is exactly as you left it.
          </p>
        )}

        <p className="eyebrow text-gold-deep">
          <span className="gold-rule mr-3" />
          Your details
        </p>
        <h2 className="font-display text-3xl text-midnight mt-4 leading-tight">
          Where should we send your books?
        </h2>
        <p className="mt-3 text-sm text-midnight/65 leading-relaxed">
          Your download links appear on the next page and are emailed to you as
          well — so the email address matters.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>
              Full name <span className="text-gold-deep">*</span>
            </span>
            <input name="name" required className="input-line" placeholder="Your name" />
          </label>
          <label className="block">
            <span className={labelCls}>
              Email <span className="text-gold-deep">*</span>
            </span>
            <input
              name="email"
              type="email"
              required
              className="input-line"
              placeholder="your@email.com"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Phone or WhatsApp</span>
            <input name="phone" type="tel" className="input-line" placeholder="+234 …" />
          </label>
          <label className="block">
            <span className={labelCls}>City &amp; country</span>
            <input
              name="country"
              className="input-line"
              placeholder="e.g. Lagos, Nigeria"
            />
          </label>
        </div>

        {/* PAYMENT METHOD */}
        <p className="eyebrow text-gold-deep mt-12">
          <span className="gold-rule mr-3" />
          How would you like to pay?
        </p>

        {noMethod ? (
          <p
            role="alert"
            className="mt-6 border-l-2 border-midnight-soft bg-midnight-soft/5 px-4 py-3 text-sm text-midnight"
          >
            Online payment is not available right now. Please{" "}
            <Link href="/contact/" className="text-gold-deep u-link">
              contact the ministry
            </Link>{" "}
            and we will arrange your books personally.
          </p>
        ) : (
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {flutterwaveEnabled && (
              <MethodButton
                selected={provider === "flutterwave"}
                onSelect={() => setPreferred("flutterwave")}
                title="Card & bank"
                body="Debit or credit card, bank transfer, USSD and mobile money."
                icon={<CreditCard size={20} />}
              />
            )}
            {paypalEnabled && (
              <MethodButton
                selected={provider === "paypal"}
                onSelect={() => paypalUsable && setPreferred("paypal")}
                disabled={!paypalUsable}
                title="PayPal"
                body={
                  paypalUsable
                    ? "Pay with your PayPal balance or a linked card."
                    : `PayPal cannot take ${currency}. Switch to USD, GBP or EUR in your basket to use it.`
                }
                icon={<PaypalMark />}
              />
            )}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-7 border-l-2 border-midnight-soft bg-midnight-soft/5 px-4 py-3 text-sm text-midnight"
          >
            {error}
          </p>
        )}

        {((provider === "flutterwave" && testMode) ||
          (provider === "paypal" && paypalSandbox)) && (
          <p className="mt-7 border border-dashed border-gold/60 bg-gold/5 px-4 py-3 text-xs text-midnight/70">
            <strong className="text-midnight">Test mode.</strong> This checkout is
            running against the payment provider&rsquo;s sandbox — no real money
            moves.
          </p>
        )}

        {/* With no gateway configured there is nothing to submit to. Showing a
            "Pay ₦x" button and a "you finish securely on Flutterwave" note under
            a notice saying payment is unavailable reads as a broken page —
            offer the way to reach the ministry instead. */}
        {noMethod ? (
          <Link href="/contact/" className="btn-gold mt-8 w-full sm:w-auto justify-center">
            Contact the ministry <ArrowUpRight size={16} />
          </Link>
        ) : (
          <>
            <button
              type="submit"
              disabled={loading || hasBlocked}
              className="btn-gold mt-8 w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  Redirecting <Loader2 size={16} className="animate-spin" />
                </>
              ) : (
                <>
                  Pay {formatPrice(subtotal, currency)} {currency}
                  <ArrowUpRight size={16} />
                </>
              )}
            </button>

            <p className="mt-5 flex items-center gap-2 text-xs text-midnight/50">
              <Lock size={13} className="text-gold-deep shrink-0" />
              You finish securely on{" "}
              {provider === "paypal" ? "PayPal" : "Flutterwave"}&rsquo;s own
              checkout. Card details never touch this site.
            </p>
          </>
        )}
      </form>

      {/* ORDER SUMMARY */}
      <aside className="border border-midnight/15 bg-white p-7 lg:sticky lg:top-28">
        <p className="eyebrow text-gold-deep">Your order</p>

        <ul className="mt-6 space-y-4 border-b border-midnight/12 pb-6">
          {lines.map((line) => (
            <li key={line.bookId} className="flex gap-3.5 items-start">
              <div className="relative w-11 aspect-[3/4] shrink-0 bg-midnight/5">
                {line.coverImage ? (
                  <Image
                    src={line.coverImage}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center bg-midnight text-gold/70">
                    <BookOpen size={14} />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-midnight leading-snug">{line.title}</p>
                {line.quantity > 1 && (
                  <p className="text-xs text-midnight/50 mt-0.5">× {line.quantity}</p>
                )}
              </div>
              <p className="text-sm text-midnight tabular-nums shrink-0">
                {line.available && line.unitPrice > 0 ? (
                  formatPrice(line.lineTotal, currency)
                ) : (
                  <span className="inline-flex items-center gap-1 text-midnight-soft text-xs">
                    <AlertTriangle size={12} />
                    {line.available ? "n/a" : "gone"}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>

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

        {hasBlocked && (
          <p className="mt-5 text-xs text-midnight-soft leading-relaxed">
            Some books cannot be bought in {currency} right now.{" "}
            <Link href="/books/cart/" className="u-link">
              Fix your basket
            </Link>{" "}
            to continue.
          </p>
        )}

        <Link
          href="/books/cart/"
          className="mt-6 block text-center text-xs text-midnight/50 hover:text-gold-deep transition-colors"
        >
          Edit basket
        </Link>
      </aside>
    </div>
  );
}

function MethodButton({
  selected,
  onSelect,
  disabled = false,
  title,
  body,
  icon,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`text-left border p-5 transition-colors ${
        disabled
          ? "border-midnight/10 opacity-55 cursor-not-allowed"
          : selected
            ? "border-gold bg-gold/10"
            : "border-midnight/20 hover:border-gold"
      }`}
    >
      <span className="flex items-center gap-2.5 text-midnight">
        <span className="text-gold-deep">{icon}</span>
        <span className="font-display text-lg">{title}</span>
        {selected && !disabled && (
          <span className="ml-auto h-2 w-2 rounded-full bg-gold" />
        )}
      </span>
      <span className="mt-2 block text-xs text-midnight/60 leading-relaxed">
        {body}
      </span>
    </button>
  );
}

/** PayPal's monogram, drawn inline so no third-party asset is fetched. */
function PaypalMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.3 21.3H4.1c-.4 0-.7-.4-.6-.8L6.3 3.2c.1-.4.4-.7.9-.7h6.2c3.3 0 5.5 1.7 5 5.1-.5 3.6-3.2 5.4-6.6 5.4H9.5c-.4 0-.8.3-.9.8l-.6 6.8c0 .4-.3.7-.7.7z" />
      <path
        d="M18.9 8.8c.6.9.7 2 .5 3.3-.5 3.6-3.2 5.4-6.6 5.4h-1.3c-.4 0-.8.3-.9.8l-.9 5.1c0 .3-.3.6-.6.6h-2.7c-.4 0-.6-.3-.6-.7l.5-3.1"
        opacity="0.55"
      />
    </svg>
  );
}
