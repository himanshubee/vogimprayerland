"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  Loader2,
  Lock,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useLiveCart, type LiveProduct } from "@/components/shop/useLiveCart";
import { LineThumb } from "@/components/shop/LineThumb";
import { formatPrice, type BookPrices } from "@/lib/books-shared";
import { variantLabel, type MerchTemplates } from "@/lib/merch-shared";
import {
  gatewayOptions,
  type GatewayCurrencies,
  type GatewayOption,
  type Provider,
} from "@/lib/gateways";

type Props = {
  /** Current catalogue prices, so an old basket is never priced from a stale
   *  localStorage snapshot. */
  live: Record<string, LiveProduct>;
  /** Delivery for physical items, in every currency it is charged in. */
  shipping: BookPrices;
  templates: MerchTemplates;
  /** Which gateways have credentials on the server. */
  configured: Record<Provider, boolean>;
  /** Gateways currently pointed at a sandbox rather than real money. */
  sandbox: Record<Provider, boolean>;
  /** What each gateway can settle on THIS account, narrowed by env if needed. */
  gatewayCurrencies: GatewayCurrencies;
};

const labelCls = "block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1";

export function CheckoutClient({
  live,
  shipping,
  templates,
  configured,
  sandbox,
  gatewayCurrencies,
}: Props) {
  const search = useSearchParams();
  const cart = useLiveCart(live, shipping);
  const {
    lines,
    blocked,
    subtotal,
    total,
    currency,
    ready,
    isEmpty,
    priceable,
    totalIn,
    hasMerch,
    hasBooks,
  } = cart;

  const [preferred, setPreferred] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every configured gateway, each with the currency it will actually charge
  // in — the shopper's own where possible, otherwise the nearest one that
  // gateway can settle, converted from the same base price.
  const options = gatewayOptions(configured, gatewayCurrencies, currency, priceable);
  const usable = options.filter((o) => o.currency !== null);

  // A gateway that shares no currency with the basket must not stay selected.
  // Derived rather than synced in an effect, so the currency and the method can
  // never disagree for even one render.
  const selected: GatewayOption | null =
    usable.find((o) => o.id === preferred) ?? usable[0] ?? null;
  const provider: Provider | null = selected?.id ?? null;

  /** What the buyer will actually be charged, in the gateway's own currency. */
  const chargeCurrency = selected?.currency ?? currency;
  const chargeTotal = selected?.currency ? totalIn(selected.currency) : total;

  // The buyer bounced off PayPal's page without approving.
  const cancelled = search.get("cancelled") === "1";

  const hasBlocked = blocked.length > 0;
  const noMethod = usable.length === 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!provider) {
      setError("Please choose a payment method.");
      return;
    }

    if (hasBlocked) {
      setError(
        `Some items in your basket cannot be bought in ${currency}. Please go back to the basket and adjust it.`
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
          // Only ids, quantities and the chosen colour/size — the server
          // prices the order itself.
          items: lines.map((l) => ({
            productId: l.productId,
            kind: l.kind,
            quantity: l.quantity,
            variant: l.variant,
          })),
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          country: data.get("country"),
          shipping: hasMerch
            ? {
                name: data.get("ship_name") || data.get("name"),
                line1: data.get("line1"),
                line2: data.get("line2"),
                city: data.get("city"),
                state: data.get("state"),
                postcode: data.get("postcode"),
                country: data.get("ship_country"),
                phone: data.get("phone"),
              }
            : undefined,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload.link) {
        throw new Error(payload.error || "We could not start your order. Please try again.");
      }

      // The basket is deliberately NOT cleared here — if the buyer abandons the
      // gateway, they come back to an intact basket. The receipt page clears it
      // once the order is actually paid.
      // assign() rather than `location.href = …`: identical navigation, but the
      // compiler lint reads a property write on a global as a mutation.
      window.location.assign(payload.link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
        <h2 className="font-display text-3xl text-midnight mt-5">There is nothing to check out</h2>
        <p className="mt-4 text-midnight/70 max-w-sm mx-auto leading-relaxed">
          Your basket is empty. Choose something and it will appear here.
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

  return (
    <div className="grid lg:grid-cols-[1fr_0.85fr] gap-10 lg:gap-14 items-start">
      {/* DETAILS + PAYMENT */}
      <form onSubmit={onSubmit}>
        {cancelled && (
          <p className="mb-8 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm text-midnight">
            Your PayPal payment was cancelled and nothing was charged. Your basket is
            exactly as you left it.
          </p>
        )}

        <p className="eyebrow text-gold-deep">
          <span className="gold-rule mr-3" />
          Your details
        </p>
        <h2 className="font-display text-3xl text-midnight mt-4 leading-tight">
          {hasMerch ? "Who is this for?" : "Where should we send your books?"}
        </h2>
        <p className="mt-3 text-sm text-midnight/65 leading-relaxed">
          {hasBooks
            ? "Your download links appear on the next page and are emailed to you as well — so the email address matters."
            : "Your receipt and dispatch updates go to this email address — so it matters."}
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
            <span className={labelCls}>
              Phone or WhatsApp {hasMerch && <span className="text-gold-deep">*</span>}
            </span>
            <input
              name="phone"
              type="tel"
              required={hasMerch}
              className="input-line"
              placeholder="+234 …"
            />
          </label>
          {!hasMerch && (
            <label className="block">
              <span className={labelCls}>City &amp; country</span>
              <input name="country" className="input-line" placeholder="e.g. Lagos, Nigeria" />
            </label>
          )}
        </div>

        {/* DELIVERY ADDRESS — only when something physical is in the basket */}
        {hasMerch && (
          <>
            <p className="eyebrow text-gold-deep mt-12">
              <span className="gold-rule mr-3" />
              Delivery address
            </p>
            <p className="mt-3 text-sm text-midnight/65 leading-relaxed">
              Your T-shirts and caps are made to order and sent here. We will email you
              when they are dispatched.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={labelCls}>Deliver to (if not you)</span>
                <input name="ship_name" className="input-line" placeholder="Recipient's name" />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelCls}>
                  Street address <span className="text-gold-deep">*</span>
                </span>
                <input
                  name="line1"
                  required
                  className="input-line"
                  placeholder="House number and street"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelCls}>Apartment, landmark, etc.</span>
                <input name="line2" className="input-line" placeholder="Optional" />
              </label>
              <label className="block">
                <span className={labelCls}>
                  City <span className="text-gold-deep">*</span>
                </span>
                <input name="city" required className="input-line" placeholder="Lagos" />
              </label>
              <label className="block">
                <span className={labelCls}>State / region</span>
                <input name="state" className="input-line" placeholder="Lagos State" />
              </label>
              <label className="block">
                <span className={labelCls}>Postcode</span>
                <input name="postcode" className="input-line" placeholder="Optional" />
              </label>
              <label className="block">
                <span className={labelCls}>
                  Country <span className="text-gold-deep">*</span>
                </span>
                <input name="ship_country" required className="input-line" placeholder="Nigeria" />
              </label>
            </div>
          </>
        )}

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
            and we will arrange your order personally.
          </p>
        ) : (
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {/* Only methods that can actually take this basket. A gateway that
                does not convert (Paystack) simply isn't listed outside the
                currencies it settles, rather than sitting there greyed out. */}
            {usable.map((o) => (
              <MethodButton
                key={o.id}
                selected={provider === o.id}
                onSelect={() => setPreferred(o.id)}
                title={o.label}
                body={o.blurb}
                amount={o.currency ? formatPrice(totalIn(o.currency), o.currency) : null}
                amountCurrency={o.currency}
                // Say so plainly when the charge differs from what is on screen,
                // rather than surprising the buyer on the gateway's own page.
                note={
                  o.converted && o.currency
                    ? `charged in ${o.currency}, converted from ${currency}`
                    : null
                }
                icon={o.id === "paypal" ? <PaypalMark /> : <CreditCard size={20} />}
              />
            ))}
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

        {provider && sandbox[provider] && (
          <p className="mt-7 border border-dashed border-gold/60 bg-gold/5 px-4 py-3 text-xs text-midnight/70">
            <strong className="text-midnight">Test mode.</strong> {selected?.label} is
            running against its sandbox — no real money moves.
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
                  Pay {formatPrice(chargeTotal, chargeCurrency)} {chargeCurrency}
                  <ArrowUpRight size={16} />
                </>
              )}
            </button>

            <p className="mt-5 flex items-start gap-2 text-xs text-midnight/50">
              <Lock size={13} className="text-gold-deep shrink-0 mt-0.5" />
              <span>
                You finish securely on {selected?.label ?? "the payment provider"}&rsquo;s
                own checkout. Card details never touch this site.
                {selected?.converted && (
                  <>
                    {" "}
                    {selected.label} settles in {chargeCurrency}, so your basket of{" "}
                    {formatPrice(total, currency)} {currency} is charged as{" "}
                    {formatPrice(chargeTotal, chargeCurrency)} {chargeCurrency}.
                  </>
                )}
              </span>
            </p>
          </>
        )}
      </form>

      {/* ORDER SUMMARY */}
      <aside className="border border-midnight/15 bg-white p-7 lg:sticky lg:top-28">
        <p className="eyebrow text-gold-deep">Your order</p>

        <ul className="mt-6 space-y-4 border-b border-midnight/12 pb-6">
          {lines.map((line) => (
            <li key={line.key} className="flex gap-3.5 items-start">
              <LineThumb
                kind={line.kind}
                image={line.image}
                category={line.category}
                variant={line.variant}
                templates={line.category ? templates[line.category] : undefined}
                sizes="44px"
                className="w-11 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-midnight leading-snug">{line.title}</p>
                <p className="text-xs text-midnight/50 mt-0.5">
                  {line.kind === "merch" && line.variant ? variantLabel(line.variant) : null}
                  {line.kind === "merch" && line.variant && line.quantity > 1 ? " · " : null}
                  {line.quantity > 1 ? `× ${line.quantity}` : null}
                </p>
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

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-midnight/60">Subtotal</dt>
            <dd className="text-midnight tabular-nums">{formatPrice(subtotal, currency)}</dd>
          </div>
          {hasMerch && (
            <div className="flex justify-between gap-4">
              <dt className="text-midnight/60 inline-flex items-center gap-1.5">
                <Truck size={13} className="text-gold-deep" /> Delivery
              </dt>
              <dd className="text-midnight tabular-nums">
                {cart.shipping > 0 ? formatPrice(cart.shipping, currency) : "Free"}
              </dd>
            </div>
          )}
        </dl>

        <div className="flex items-baseline justify-between gap-4 pt-5 mt-5 border-t border-midnight/12">
          <span className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">Total</span>
          <span className="font-display text-3xl text-midnight tabular-nums">
            {formatPrice(total, currency)}
            <span className="ml-1.5 text-xs tracking-[0.2em] uppercase text-midnight/45">
              {currency}
            </span>
          </span>
        </div>

        {hasBlocked && (
          <p className="mt-5 text-xs text-midnight-soft leading-relaxed">
            Some items cannot be bought in {currency} right now.{" "}
            <Link href="/cart/" className="u-link">
              Fix your basket
            </Link>{" "}
            to continue.
          </p>
        )}

        <Link
          href="/cart/"
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
  amount,
  amountCurrency,
  note,
  icon,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  title: string;
  body: string;
  /** What this gateway will charge, already formatted. */
  amount?: string | null;
  amountCurrency?: string | null;
  /** Shown when the charge currency differs from the one on screen. */
  note?: string | null;
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
          <span className="ml-auto h-2 w-2 rounded-full bg-gold shrink-0" />
        )}
      </span>

      {amount && (
        <span className="mt-2.5 block font-display text-xl text-midnight tabular-nums">
          {amount}
          <span className="ml-1.5 text-[10px] tracking-[0.2em] uppercase text-midnight/45">
            {amountCurrency}
          </span>
        </span>
      )}

      <span className="mt-2 block text-xs text-midnight/60 leading-relaxed">{body}</span>

      {note && (
        <span className="mt-1.5 block text-[11px] text-gold-deep leading-relaxed">{note}</span>
      )}
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
