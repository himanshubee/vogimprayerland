"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { CurrencyPicker } from "./CurrencyPicker";
import { MerchCard } from "./MerchCard";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  type MerchCategory,
  type MerchItem,
  type MerchTemplates,
} from "@/lib/merch-shared";
import type { CurrencyCode } from "@/lib/currencies";

/**
 * The store listing with a category filter. The filter is browser state —
 * the whole (small) catalogue is already on the page, so switching between
 * T-shirts and caps costs nothing and the listing itself stays cacheable.
 */
export function StoreGrid({
  items,
  available,
  templates,
}: {
  items: MerchItem[];
  available: CurrencyCode[];
  templates: MerchTemplates;
}) {
  const [filter, setFilter] = useState<MerchCategory | "all">("all");

  const counts = Object.fromEntries(
    CATEGORY_KEYS.map((k) => [k, items.filter((i) => i.category === k).length])
  ) as Record<MerchCategory, number>;
  const shown = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <>
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              Made to order
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-midnight mt-4 leading-tight">
              {shown.length} {shown.length === 1 ? "design" : "designs"}
              {filter !== "all" && ` on ${CATEGORIES[filter].plural.toLowerCase()}`}
            </h2>
          </div>
          <CurrencyPicker available={available} />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {(["all", ...CATEGORY_KEYS] as const).map((key) => {
            const active = filter === key;
            const label = key === "all" ? "Everything" : CATEGORIES[key].plural;
            const n = key === "all" ? items.length : counts[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={active}
                className={`px-4 py-2 border text-[11px] tracking-[0.18em] uppercase transition-colors ${
                  active
                    ? "border-gold bg-gold text-midnight"
                    : "border-midnight/20 text-midnight/65 hover:border-gold"
                }`}
              >
                {label} <span className="opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7">
        {shown.map((item, i) => (
          // Stagger only across the first row — beyond that the delay
          // outlasts the scroll and cards arrive visibly late.
          <Reveal key={item.id} delay={Math.min(i, 3) * 0.07}>
            <MerchCard item={item} templates={templates[item.category]} />
          </Reveal>
        ))}
      </div>
    </>
  );
}
