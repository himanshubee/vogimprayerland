"use client";

import { useCart } from "./CartProvider";
import { CURRENCIES, type CurrencyCode } from "@/lib/currencies";

/**
 * Chooses which currency the shop prices in. The choice is the buyer's, not
 * geolocation's — a Nigerian paying a diaspora relative's card in USD is a real
 * case, and guessing wrong hides the price they actually want.
 */
export function CurrencyPicker({
  available,
  className = "",
}: {
  /** Currency codes any book in the catalogue is priced in. */
  available: CurrencyCode[];
  className?: string;
}) {
  const { currency, setCurrency, ready } = useCart();
  if (available.length < 2) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[11px] tracking-[0.28em] uppercase text-midnight/50 mr-1">
        Prices in
      </span>
      {available.map((code) => {
        const active = ready && currency === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setCurrency(code)}
            aria-pressed={active}
            className={`px-3 py-1.5 border text-[11px] tracking-[0.18em] uppercase transition-colors ${
              active
                ? "border-gold bg-gold text-midnight"
                : "border-midnight/20 text-midnight/65 hover:border-gold"
            }`}
          >
            {CURRENCIES[code]?.symbol} {code}
          </button>
        );
      })}
    </div>
  );
}
