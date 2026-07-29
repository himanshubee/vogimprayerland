"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Loader2, Lock } from "lucide-react";

type Props = {
  currencies: { code: string; symbol: string; min: number }[];
  /** Preset amounts per currency code. */
  presets: Record<string, number[]>;
  funds: string[];
  submitLabel: string;
  defaultCurrency: string;
  testMode: boolean;
  /** Where to send the donor if the gateway is unavailable server-side. */
  fallbackHref: string;
};

const OTHER = "other";

export function GiveForm({
  currencies,
  presets,
  funds,
  submitLabel,
  defaultCurrency,
  testMode,
  fallbackHref,
}: Props) {
  const [currency, setCurrency] = useState(
    currencies.some((c) => c.code === defaultCurrency)
      ? defaultCurrency
      : currencies[0]?.code ?? "NGN"
  );
  const [choice, setChoice] = useState<string>("");
  const [custom, setCustom] = useState("");
  const [fund, setFund] = useState(funds[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(
    () => currencies.find((c) => c.code === currency) ?? currencies[0],
    [currencies, currency]
  );
  const amounts = presets[currency] ?? [];
  const amount = choice === OTHER ? Number(custom) : Number(choice);

  // Switching currency invalidates the chosen preset — start that choice over.
  const onCurrency = (code: string) => {
    setCurrency(code);
    setChoice("");
    setCustom("");
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!Number.isFinite(amount) || amount < (active?.min ?? 1)) {
      setError(
        `Please choose an amount of ${active?.symbol}${active?.min} or more.`
      );
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
        window.location.href = fallbackHref;
        return;
      }

      if (!res.ok || !payload.link) {
        throw new Error(
          payload.error || "We could not start your gift. Please try again."
        );
      }
      // Hand off to Flutterwave's hosted checkout.
      window.location.href = payload.link;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-10">
      {/* CURRENCY */}
      {currencies.length > 1 && (
        <>
          <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-3">
            Currency
          </span>
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

      {/* AMOUNT */}
      <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mt-8 mb-3">
        Your gift <span className="text-gold-deep">*</span>
      </span>
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
          <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1">
            Amount in {currency}
          </span>
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
              onChange={(e) => setCustom(e.target.value)}
              placeholder={String(active?.min ?? 1)}
              className="input-line font-display text-2xl"
              autoFocus
            />
          </div>
        </label>
      )}

      {/* FUND */}
      {funds.length > 1 && (
        <>
          <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mt-8 mb-3">
            Direct my gift to
          </span>
          <div className="flex flex-wrap gap-2">
            {funds.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFund(f)}
                aria-pressed={fund === f}
                className={`px-4 py-2 border text-sm transition-colors ${
                  fund === f
                    ? "border-gold bg-gold/15 text-midnight"
                    : "border-midnight/20 text-midnight/70 hover:border-gold"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      )}

      {/* DONOR */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1">
            Full name <span className="text-gold-deep">*</span>
          </span>
          <input name="name" required className="input-line" placeholder="Your name" />
        </label>
        <label className="block">
          <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1">
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
          <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1">
            Phone or WhatsApp
          </span>
          <input name="phone" type="tel" className="input-line" placeholder="+234 …" />
        </label>
        <label className="block">
          <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1">
            City &amp; country
          </span>
          <input name="country" className="input-line" placeholder="e.g. Lagos, Nigeria" />
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1">
            Prayer point or note (optional)
          </span>
          <input
            name="note"
            className="input-line"
            placeholder="Anything you would like us to pray over as we receive this seed"
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 border-l-2 border-midnight-soft bg-midnight-soft/5 px-4 py-3 text-sm text-midnight"
        >
          {error}
        </p>
      )}

      {testMode && (
        <p className="mt-6 border border-dashed border-gold/60 bg-gold/5 px-4 py-3 text-xs text-midnight/70">
          <strong className="text-midnight">Test mode.</strong> Payments are running
          against Flutterwave&rsquo;s sandbox — no real money moves.
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-gold mt-9 disabled:opacity-60">
        {loading ? (
          <>
            Redirecting <Loader2 size={16} className="animate-spin" />
          </>
        ) : (
          <>
            {submitLabel} <ArrowUpRight size={16} />
          </>
        )}
      </button>

      <p className="mt-5 flex items-center gap-2 text-xs text-midnight/50">
        <Lock size={13} className="text-gold-deep" />
        Secured by Flutterwave. Card details are entered on Flutterwave&rsquo;s
        checkout and never touch this site.
      </p>
    </form>
  );
}
