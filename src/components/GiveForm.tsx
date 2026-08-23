"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CreditCard, Loader2, Lock, Plus, X } from "lucide-react";
import { CURRENCIES, type CurrencyCode } from "@/lib/currencies";
import {
  gatewayOptions,
  type GatewayCurrencies,
  type GatewayOption,
  type Provider,
} from "@/lib/gateways";

type Props = {
  currencies: { code: string; symbol: string; min: number }[];
  /** Preset amounts per currency code. */
  presets: Record<string, number[]>;
  funds: string[];
  submitLabel: string;
  defaultCurrency: string;
  /** Which gateways have credentials on the server. */
  configured: Record<Provider, boolean>;
  /** Gateways pointed at a sandbox rather than real money. */
  sandbox: Record<Provider, boolean>;
  /** What each gateway can settle on this account. */
  gatewayCurrencies: GatewayCurrencies;
  /** Where to send the donor if no gateway is available server-side. */
  fallbackHref: string;
};

const OTHER = "other";

/**
 * Two-step giving: the amount is chosen on the page (the inviting part), and
 * the donor details open in a modal only once an amount is picked — so the page
 * never reads as a long form.
 */
export function GiveForm({
  currencies,
  presets,
  funds,
  submitLabel,
  defaultCurrency,
  configured,
  sandbox,
  gatewayCurrencies,
  fallbackHref,
}: Props) {
  const reduce = useReducedMotion();
  const [currency, setCurrency] = useState(
    currencies.some((c) => c.code === defaultCurrency)
      ? defaultCurrency
      : currencies[0]?.code ?? "NGN"
  );
  const [choice, setChoice] = useState<string>("");
  const [custom, setCustom] = useState("");
  const [open, setOpen] = useState(false);
  const [fund, setFund] = useState(funds[0] ?? "");
  const [showExtras, setShowExtras] = useState(false);
  const [preferred, setPreferred] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const active = useMemo(
    () => currencies.find((c) => c.code === currency) ?? currencies[0],
    [currencies, currency]
  );
  const amounts = presets[currency] ?? [];

  // A gift can be converted at the day's rate, so every currency is reachable.
  const options = gatewayOptions(
    configured,
    gatewayCurrencies,
    currency,
    Object.keys(CURRENCIES) as CurrencyCode[]
  );
  const usable = options.filter((o) => o.currency !== null);
  const selected: GatewayOption | null =
    usable.find((o) => o.id === preferred) ?? usable[0] ?? null;
  const amount = choice === OTHER ? Number(custom) : Number(choice);
  const valid = Number.isFinite(amount) && amount >= (active?.min ?? 1);
  const pretty = `${active?.symbol ?? ""}${
    Number.isFinite(amount) && amount > 0 ? amount.toLocaleString() : ""
  }`;

  // Switching currency invalidates the chosen preset — start that choice over.
  const onCurrency = (code: string) => {
    setCurrency(code);
    setChoice("");
    setCustom("");
    setError(null);
  };

  // Close on Escape, stop the page scrolling behind the modal, and hand focus
  // to the first field — then give it back to the button that opened it.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => nameRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      opener?.focus?.();
    };
  }, [open, loading]);

  function proceed() {
    if (!valid) {
      setError(
        `Please choose an amount of ${active?.symbol}${active?.min} or more.`
      );
      return;
    }
    setError(null);
    setOpen(true);
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!valid) {
      setError("Please choose an amount before continuing.");
      setOpen(false);
      return;
    }

    setLoading(true);
    const data = new FormData(e.currentTarget);

    try {
      // Trailing slash matters: next.config sets trailingSlash, so the
      // slash-less path answers with a 308 redirect instead of the handler.
      const res = await fetch("/api/give/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selected?.id ?? "flutterwave",
          amount,
          currency,
          fund,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          country: data.get("country"),
          note: data.get("note"),
        }),
      });

      const payload = await res.json().catch(() => ({}));

      // The gateway is not configured on the server. Never dead-end a donor —
      // hand them to the ministry's hosted giving page instead.
      if (res.status === 503 && fallbackHref) {
        window.location.assign(fallbackHref);
        return;
      }

      if (!res.ok || !payload.link) {
        throw new Error(
          payload.error || "We could not start your gift. Please try again."
        );
      }
      // Hand off to the gateway's hosted checkout. assign() rather than
      // `location.href = …`: identical navigation, but the compiler lint reads
      // a property write on a global as a mutation.
      window.location.assign(payload.link);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  const labelCls =
    "block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1";

  return (
    <div className="mt-10">
      {/* ── STEP 1 · on the page ─────────────────────────────────── */}
      {currencies.length > 1 && (
        <>
          <span className={`${labelCls} mb-3`}>Currency</span>
          <div className="flex flex-wrap gap-2">
            {currencies.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => onCurrency(c.code)}
                aria-pressed={currency === c.code}
                className={`px-4 py-2 border text-xs tracking-[0.18em] uppercase transition-colors ${
                  currency === c.code
                    ? "border-gold bg-gold text-midnight"
                    : "border-midnight/20 text-midnight/70 hover:border-gold"
                }`}
              >
                {c.code}
              </button>
            ))}
          </div>
        </>
      )}

      <span className={`${labelCls} mt-8 mb-3`}>Choose an amount</span>
      <div className="flex flex-wrap gap-3 items-center">
        {amounts.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setChoice(String(a));
              setError(null);
            }}
            aria-pressed={choice === String(a)}
            className={`px-5 py-3 border font-display text-xl transition-colors ${
              choice === String(a)
                ? "border-gold bg-midnight text-gold"
                : "border-midnight/20 text-midnight hover:bg-midnight hover:text-gold"
            }`}
          >
            {active?.symbol}
            {a.toLocaleString()}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setChoice(OTHER)}
          aria-pressed={choice === OTHER}
          className={`px-5 py-3 border font-display text-xl italic transition-colors ${
            choice === OTHER
              ? "border-gold bg-midnight text-gold"
              : "border-midnight/20 text-midnight/70 hover:bg-midnight hover:text-gold"
          }`}
        >
          Other
        </button>
      </div>

      {choice === OTHER && (
        <label className="block mt-5 max-w-xs">
          <span className={labelCls}>Amount in {currency}</span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl text-gold-deep">
              {active?.symbol}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={active?.min}
              step="0.01"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setError(null);
              }}
              placeholder={String(active?.min ?? 1)}
              className="input-line font-display text-2xl"
              autoFocus
            />
          </div>
        </label>
      )}

      {!open && error && (
        <p
          role="alert"
          className="mt-6 border-l-2 border-midnight-soft bg-midnight-soft/5 px-4 py-3 text-sm text-midnight"
        >
          {error}
        </p>
      )}

      <button type="button" onClick={proceed} className="btn-gold mt-8">
        {submitLabel}
        {valid ? ` ${pretty}` : ""}
        <ArrowUpRight size={16} />
      </button>

      <p className="mt-5 flex items-center gap-2 text-xs text-midnight/50">
        <Lock size={13} className="text-gold-deep" />
        Secured by Flutterwave. Card details are entered on Flutterwave&rsquo;s
        checkout and never touch this site.
      </p>

      {/* ── STEP 2 · the modal ───────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-maroon/90 backdrop-blur-sm p-0 sm:p-6"
            onClick={() => !loading && setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="give-modal-title"
              initial={{ opacity: 0, y: reduce ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : 16 }}
              transition={{ duration: 0.28, ease: [0.22, 0.8, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-lg bg-ivory max-h-[92vh] overflow-y-auto shadow-2xl"
            >
              {/* header */}
              <div className="sticky top-0 bg-midnight text-ivory px-6 py-5 flex items-start justify-between gap-4 z-10">
                <div>
                  <p className="eyebrow text-gold leading-none">Your gift</p>
                  <p
                    id="give-modal-title"
                    className="font-display text-3xl sm:text-4xl mt-2 leading-none"
                  >
                    {pretty}
                    <span className="ml-2 text-sm text-ivory/50">{currency}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => !loading && setOpen(false)}
                    className="mt-2 text-[11px] tracking-[0.2em] uppercase text-gold/80 hover:text-gold underline underline-offset-4"
                  >
                    Change amount
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => !loading && setOpen(false)}
                  aria-label="Close"
                  className="text-ivory/60 hover:text-gold transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={onSubmit} className="px-6 py-6">
                {funds.length > 1 && (
                  <>
                    <span className={`${labelCls} mb-2`}>Direct my gift to</span>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {funds.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFund(f)}
                          aria-pressed={fund === f}
                          className={`px-3 py-1.5 border text-xs transition-colors ${
                            fund === f
                              ? "border-gold bg-gold/15 text-midnight"
                              : "border-midnight/20 text-midnight/65 hover:border-gold"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelCls}>
                      Full name <span className="text-gold-deep">*</span>
                    </span>
                    <input
                      ref={nameRef}
                      name="name"
                      required
                      className="input-line"
                      placeholder="Your name"
                    />
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
                </div>

                {showExtras ? (
                  <div className="grid gap-5 sm:grid-cols-2 mt-5">
                    <label className="block">
                      <span className={labelCls}>Phone or WhatsApp</span>
                      <input
                        name="phone"
                        type="tel"
                        className="input-line"
                        placeholder="+234 …"
                      />
                    </label>
                    <label className="block">
                      <span className={labelCls}>City &amp; country</span>
                      <input
                        name="country"
                        className="input-line"
                        placeholder="e.g. Lagos, Nigeria"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={labelCls}>Prayer point or note</span>
                      <input
                        name="note"
                        className="input-line"
                        placeholder="Anything you would like us to pray over"
                      />
                    </label>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowExtras(true)}
                    className="mt-5 inline-flex items-center gap-2 text-xs text-gold-deep hover:text-midnight transition-colors"
                  >
                    <Plus size={14} />
                    Add phone, location or a prayer note
                  </button>
                )}

                {/* HOW TO GIVE — only methods that can actually take this gift.
                    One is not a choice, so the picker only appears when there
                    is something to choose between. */}
                {usable.length > 1 && (
                  <>
                    <span className={`${labelCls} mt-7 mb-2`}>How would you like to give?</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {usable.map((o) => {
                        const isOn = selected?.id === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setPreferred(o.id)}
                            aria-pressed={isOn}
                            className={`text-left border px-3.5 py-3 transition-colors ${
                              isOn
                                ? "border-gold bg-gold/10"
                                : "border-midnight/20 hover:border-gold"
                            }`}
                          >
                            <span className="flex items-center gap-2 text-midnight">
                              <span className="text-gold-deep">
                                {o.id === "paypal" ? <PaypalMark /> : <CreditCard size={16} />}
                              </span>
                              <span className="text-sm font-medium">{o.label}</span>
                            </span>
                            {o.converted && o.currency && (
                              <span className="mt-1 block text-[10px] text-gold-deep leading-snug">
                                charged in {o.currency}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {error && (
                  <p
                    role="alert"
                    className="mt-6 border-l-2 border-midnight-soft bg-midnight-soft/5 px-4 py-3 text-sm text-midnight"
                  >
                    {error}
                  </p>
                )}

                {selected && sandbox[selected.id] && (
                  <p className="mt-6 border border-dashed border-gold/60 bg-gold/5 px-4 py-3 text-xs text-midnight/70">
                    <strong className="text-midnight">Test mode.</strong> Running
                    against {selected.label}&rsquo;s sandbox — no real money moves.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !selected}
                  className="btn-gold mt-7 w-full justify-center disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      Redirecting <Loader2 size={16} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      Give {pretty} <ArrowUpRight size={16} />
                    </>
                  )}
                </button>

                <p className="mt-4 flex items-start justify-center gap-2 text-[11px] text-midnight/50 text-center">
                  <Lock size={12} className="text-gold-deep shrink-0 mt-0.5" />
                  <span>
                    You&rsquo;ll finish securely on{" "}
                    {selected?.label ?? "the payment provider"}&rsquo;s checkout.
                    {selected?.converted && selected.currency && (
                      <>
                        {" "}
                        {selected.label} settles in {selected.currency}, so your
                        gift is converted at today&rsquo;s rate.
                      </>
                    )}
                  </span>
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** PayPal's monogram, drawn inline so no third-party asset is fetched. */
function PaypalMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.3 21.3H4.1c-.4 0-.7-.4-.6-.8L6.3 3.2c.1-.4.4-.7.9-.7h6.2c3.3 0 5.5 1.7 5 5.1-.5 3.6-3.2 5.4-6.6 5.4H9.5c-.4 0-.8.3-.9.8l-.6 6.8c0 .4-.3.7-.7.7z" />
      <path
        d="M18.9 8.8c.6.9.7 2 .5 3.3-.5 3.6-3.2 5.4-6.6 5.4h-1.3c-.4 0-.8.3-.9.8l-.9 5.1c0 .3-.3.6-.6.6h-2.7c-.4 0-.6-.3-.6-.7l.5-3.1"
        opacity="0.55"
      />
    </svg>
  );
}
