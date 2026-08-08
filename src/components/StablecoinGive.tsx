"use client";

import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";

type Coin = { code: string; address: string };

type Props = {
  intro: string;
  /** e.g. "Polygon" — the chain the addresses live on. */
  network: string;
  coins: Coin[];
};

/**
 * Stablecoin giving (USDT / USDC / RLUSD). These cannot go through the
 * Flutterwave hosted checkout — the donor sends directly to the ministry's
 * Treasury wallet address, so all we owe them is the address, a copy button,
 * and a clear warning about the network.
 */
export function StablecoinGive({ intro, network, coins }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  if (coins.length === 0) return null;

  const copy = async (coin: Coin) => {
    try {
      await navigator.clipboard.writeText(coin.address);
      setCopied(coin.code);
      setTimeout(() => setCopied((c) => (c === coin.code ? null : c)), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, http) — the address is
      // visible and selectable below, so there is nothing to recover from.
    }
  };

  return (
    <div className="mt-12 border-t border-midnight/15 pt-8">
      <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60">
        Give with stablecoin
      </span>
      <p className="mt-3 text-sm text-midnight/70 leading-relaxed">{intro}</p>

      <ul className="mt-5 space-y-3">
        {coins.map((coin) => (
          <li
            key={coin.code}
            className="border border-midnight/15 px-4 py-3 flex items-center gap-4"
          >
            <span className="font-display text-lg text-midnight w-16 shrink-0">
              {coin.code}
            </span>
            <code className="min-w-0 flex-1 truncate text-xs text-midnight/70 select-all">
              {coin.address}
            </code>
            <button
              type="button"
              onClick={() => copy(coin)}
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-gold-deep hover:text-midnight transition-colors shrink-0"
              aria-label={`Copy ${coin.code} wallet address`}
            >
              {copied === coin.code ? (
                <>
                  <Check size={13} /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex items-start gap-2 text-xs text-midnight/55 leading-relaxed">
        <TriangleAlert size={14} className="text-gold-deep shrink-0 mt-0.5" />
        <span>
          {network
            ? `Send only on the ${network} network. `
            : ""}
          Funds sent to a wrong address or on a wrong network cannot be
          recovered. These addresses are published only on this page — no one
          from the ministry will ever send you a wallet address privately.
        </span>
      </p>
    </div>
  );
}
