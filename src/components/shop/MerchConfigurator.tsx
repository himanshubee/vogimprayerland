"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Lock, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { BookPrice } from "./BookPrice";
import { CurrencyPicker } from "./CurrencyPicker";
import { Mockup } from "./Mockup";
import {
  CATEGORIES,
  colorByKey,
  viewLabel,
  variantKey,
  visibleViews,
  type CategoryTemplates,
  type MerchItem,
  type MerchView,
} from "@/lib/merch-shared";
import type { CurrencyCode } from "@/lib/currencies";

/**
 * The product page's working half: the garment from five angles in the
 * chosen colour, the colour and size pickers, and add-to-basket.
 *
 * Everything the shopper changes here is browser state, so the page around
 * it stays a cached server render; the price still comes from the catalogue
 * the server sent.
 */
export function MerchConfigurator({
  item,
  available,
  templates,
}: {
  item: MerchItem;
  /** Currencies this design is priced in. */
  available: CurrencyCode[];
  /** Photos for this category, when the ministry has uploaded them. */
  templates?: CategoryTemplates;
}) {
  const info = CATEGORIES[item.category];
  const reduce = useReducedMotion();
  const { add, has, ready } = useCart();

  // Only angles with a photo, once photos exist; the drawn set until then.
  const views = visibleViews(item.category, templates);
  const [colorKey, setColorKey] = useState(item.defaultColor);
  const [view, setView] = useState<MerchView>(views[0] ?? "front");
  const [size, setSize] = useState(info.sizes[0]);
  const [justAdded, setJustAdded] = useState(false);

  const color = colorByKey(colorKey);
  const variant = { color: colorKey, size };
  const key = variantKey(item.id, variant);
  const inBasket = ready && has(key);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 2200);
    return () => clearTimeout(t);
  }, [justAdded]);

  function addToBasket() {
    add({
      key,
      kind: "merch",
      productId: item.id,
      slug: item.slug,
      title: item.title,
      image: item.design,
      prices: item.prices,
      variant,
    });
    setJustAdded(true);
  }

  return (
    <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
      {/* VIEWER */}
      <div>
        <div className="relative aspect-[5/6] w-full overflow-hidden bg-ivory-dark shadow-2xl shadow-black/40">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={`${view}-${colorKey}`}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 0.8, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Mockup
                templates={templates}
                category={item.category}
                view={view}
                color={color.hex}
                design={item.design}
                print={item.print}
                title={`${item.title} — ${info.label} in ${color.label}, ${viewLabel(item.category, view).toLowerCase()} view`}
                className="h-full w-full"
              />
            </motion.div>
          </AnimatePresence>
          <span className="absolute bottom-3 left-3 bg-midnight/85 text-gold text-[10px] tracking-[0.22em] uppercase px-2.5 py-1">
            {viewLabel(item.category, view)} · {color.label}
          </span>
        </div>

        {/* The five angles. */}
        <div className="mt-3 grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(views.length, 1)}, minmax(0, 1fr))` }}>
          {views.map((v) => {
            const active = v === view;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={active}
                aria-label={`${viewLabel(item.category, v)} view`}
                className={`group relative aspect-[5/6] overflow-hidden bg-ivory-dark border transition-colors ${
                  active ? "border-gold" : "border-white/10 hover:border-gold/60"
                }`}
              >
                <Mockup
                  templates={templates}
                  category={item.category}
                  view={v}
                  color={color.hex}
                  design={item.design}
                  print={item.print}
                  quality="lite"
                  className="h-full w-full"
                />
                <span
                  className={`absolute bottom-0 inset-x-0 text-[9px] sm:text-[10px] tracking-[0.16em] uppercase py-1 transition-colors ${
                    active ? "bg-gold text-midnight" : "bg-midnight/70 text-white/80"
                  }`}
                >
                  {viewLabel(item.category, v)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHOICES */}
      <div>
        <p className="eyebrow text-gold">
          <span className="gold-rule mr-3" />
          {info.label}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mt-4">
          {item.title}
        </h1>
        <p className="mt-4 text-sm text-white/65 leading-relaxed max-w-md">{info.blurb}</p>

        <p className="mt-8 font-display text-4xl sm:text-5xl text-gold">
          <BookPrice prices={item.prices} className="[&_span]:!text-white/45" />
        </p>

        {/* COLOUR */}
        <div className="mt-9 border-t border-white/15 pt-7">
          <p className="text-[11px] tracking-[0.28em] uppercase text-white/55">
            Colour <span className="text-gold ml-2 normal-case tracking-normal">{color.label}</span>
          </p>
          <ul className="mt-3 flex flex-wrap gap-2.5" role="listbox" aria-label="Colour">
            {item.colors.map((k) => {
              const c = colorByKey(k);
              const active = k === colorKey;
              return (
                <li key={k}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    aria-label={c.label}
                    title={c.label}
                    onClick={() => setColorKey(k)}
                    className={`relative h-9 w-9 rounded-full border-2 transition-transform hover:scale-105 ${
                      active ? "border-gold scale-105" : "border-white/25"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {active && (
                      <Check
                        size={15}
                        className="absolute inset-0 m-auto"
                        color={c.hex === "#F4F1EA" || c.hex === "#D9C6A5" || c.hex === "#D4A437" ? "#1A0608" : "#fff"}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* SIZE */}
        {info.sizes.length > 1 && (
          <div className="mt-7">
            <p className="text-[11px] tracking-[0.28em] uppercase text-white/55">Size</p>
            <ul className="mt-3 flex flex-wrap gap-2" role="listbox" aria-label="Size">
              {info.sizes.map((s) => {
                const active = s === size;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSize(s)}
                      className={`min-w-[3rem] px-3 py-2 border text-[12px] tracking-[0.14em] uppercase transition-colors ${
                        active
                          ? "border-gold bg-gold text-midnight"
                          : "border-white/25 text-white/80 hover:border-gold"
                      }`}
                    >
                      {s}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* BUY */}
        <div className="mt-9 flex flex-col sm:flex-row gap-3 max-w-md">
          <button
            type="button"
            disabled={!ready}
            onClick={addToBasket}
            className="btn-gold justify-center disabled:opacity-50"
          >
            {justAdded ? (
              <>
                <Check size={15} /> Added
              </>
            ) : (
              <>
                <ShoppingBag size={15} /> {inBasket ? "Add another" : "Add to basket"}
              </>
            )}
          </button>
          {(inBasket || justAdded) && (
            <Link href="/cart/" className="btn-ghost text-gold border-gold/50 justify-center">
              View basket <ArrowUpRight size={15} />
            </Link>
          )}
        </div>

        {available.length > 1 && (
          <CurrencyPicker
            available={available}
            className="mt-7 [&>span]:text-white/45 [&>button]:text-white/70 [&>button]:border-white/25"
          />
        )}

        <ul className="mt-8 space-y-2.5 text-xs text-white/55">
          <li className="flex items-start gap-2">
            <Truck size={13} className="text-gold shrink-0 mt-0.5" />
            Printed to order and delivered to your door. Add your address at checkout.
          </li>
          <li className="flex items-start gap-2">
            <Lock size={13} className="text-gold shrink-0 mt-0.5" />
            Secure checkout by card, transfer or PayPal. Card details never touch this site.
          </li>
        </ul>
      </div>
    </div>
  );
}
