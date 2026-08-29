import { CURRENCIES, type CurrencyCode } from "@/lib/currencies";
import {
  DEFAULT_BASE_CURRENCY,
  computePrices,
  roundMoney,
  type BookPrices,
} from "@/lib/books-shared";
import type { GarmentCategory, GarmentView } from "@/components/shop/GarmentMockup";
import { cleanQuad, type Quad } from "@/lib/quad";

/**
 * Store (T-shirts and caps) — types and pure helpers, safe in the browser.
 *
 * The store sells *designs*: the ministry uploads a piece of artwork, says
 * whether it goes on a T-shirt or a cap, and the site draws the garment around
 * it from five angles in every colour on offer. There are no product photos
 * to take — the mockup (see components/shop/GarmentMockup) is the photo.
 *
 * lib/merch.ts is the database layer and re-exports everything here.
 */

export type { GarmentCategory as MerchCategory, GarmentView as MerchView };

export type MerchStatus = "published" | "draft";

/* ------------------------------- Categories ------------------------------- */

export type CategoryInfo = {
  label: string;
  plural: string;
  /** The five angles this garment is shown from, in the order they appear. */
  views: GarmentView[];
  /** Sizes a shopper chooses between. A single entry means one-size. */
  sizes: string[];
  /** Fallback price in USD until the ministry sets one in the admin. */
  defaultPrice: number;
  blurb: string;
};

export const CATEGORIES: Record<GarmentCategory, CategoryInfo> = {
  tshirt: {
    label: "T-shirt",
    plural: "T-shirts",
    views: ["front", "right", "side", "back", "detail"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    defaultPrice: 25,
    blurb: "Heavyweight cotton crew neck, printed on the chest.",
  },
  cap: {
    label: "Cap",
    plural: "Caps",
    views: ["front", "left", "right", "back", "top"],
    sizes: ["One size"],
    defaultPrice: 18,
    blurb: "Structured six-panel cap with an adjustable strap, printed on the front panel.",
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as GarmentCategory[];

export const isCategory = (v: unknown): v is GarmentCategory =>
  typeof v === "string" && v in CATEGORIES;

export const VIEW_LABELS: Record<GarmentView, string> = {
  front: "Front",
  back: "Back",
  left: "Left",
  right: "Right",
  side: "Side",
  detail: "Close-up",
  top: "Top",
};

/** The T-shirt's turned view is its only one, so it reads as "three-quarter". */
export function viewLabel(category: GarmentCategory, view: GarmentView): string {
  if (category === "tshirt" && view === "right") return "Three-quarter";
  return VIEW_LABELS[view];
}

/* ----------------------------- Photo templates ---------------------------- */

/**
 * A photograph of a blank white garment, and where the print goes on it.
 *
 * When a template exists for an angle the store composites the real photo —
 * recoloured per swatch, with the design perspective-warped onto the print
 * area — instead of the drawn mockup. The photo must have its background
 * removed (a transparent PNG), because the fabric colour is applied by
 * multiplying a flat colour through the photo's own alpha.
 */
export type MockupTemplate = {
  photo: string;
  /** Natural pixel size, for the aspect ratio. */
  width: number;
  height: number;
  /** Print area corners, TL → TR → BR → BL, in percent of the photo. */
  quad: Quad;
  /** Whether the design is printed on this angle at all. */
  showDesign: boolean;
};

export type CategoryTemplates = Partial<Record<GarmentView, MockupTemplate>>;

/** Whether an angle normally shows the print: the front and the turned views. */
export function defaultShowDesign(view: GarmentView): boolean {
  return view === "front" || view === "right" || view === "left";
}

/**
 * The angles a design is shown from. Once a category has any photo, only the
 * angles with a photo appear (plus the close-up when there is a front); with
 * no photos at all the drawn mockup's full set stands in.
 */
export function visibleViews(category: GarmentCategory, templates?: CategoryTemplates): GarmentView[] {
  const all = CATEGORIES[category].views;
  if (!templates || Object.keys(templates).length === 0) return all;
  return all.filter((v) => (v === "detail" ? Boolean(templates.front) : Boolean(templates[v])));
}
export type MerchTemplates = Record<GarmentCategory, CategoryTemplates>;

export const DEFAULT_TEMPLATES: MerchTemplates = { tshirt: {}, cap: {} };

/** The angles that take a photo. The close-up is the front photo, zoomed. */
export function photoViews(category: GarmentCategory): GarmentView[] {
  return CATEGORIES[category].views.filter((v) => v !== "detail");
}

function cleanTemplate(input: unknown): MockupTemplate | null {
  const o = (input ?? {}) as Record<string, unknown>;
  const photo = String(o.photo ?? "").slice(0, 600).trim();
  if (!photo) return null;
  const width = Math.round(Number(o.width)) || 0;
  const height = Math.round(Number(o.height)) || 0;
  return {
    photo,
    width: width > 0 ? width : 1000,
    height: height > 0 ? height : 1200,
    quad: cleanQuad(o.quad),
    showDesign: o.showDesign !== false,
  };
}

export function cleanTemplates(input: unknown): MerchTemplates {
  const o = (input ?? {}) as Record<string, unknown>;
  const out: MerchTemplates = { tshirt: {}, cap: {} };
  for (const category of CATEGORY_KEYS) {
    const views = (o[category] ?? {}) as Record<string, unknown>;
    for (const view of photoViews(category)) {
      const t = cleanTemplate(views[view]);
      if (t) out[category][view] = t;
    }
  }
  return out;
}

/** Count of angles with a photo, per category — for the admin's summary. */
export function templateCount(templates: MerchTemplates, category: GarmentCategory): number {
  return Object.keys(templates[category]).length;
}

/* --------------------------------- Colours -------------------------------- */

export type GarmentColor = { key: string; label: string; hex: string };

/**
 * The fabric colours a design can be ordered in. The admin picks a subset per
 * design; the first in this list is the default when nothing is chosen. Keys
 * are what the basket and orders store, so they must never be renamed.
 */
export const COLORS: GarmentColor[] = [
  { key: "white", label: "White", hex: "#F4F1EA" },
  { key: "black", label: "Black", hex: "#17171A" },
  { key: "maroon", label: "Maroon", hex: "#7A0E1A" },
  { key: "gold", label: "Gold", hex: "#D4A437" },
  { key: "navy", label: "Navy", hex: "#1B2A49" },
  { key: "royal", label: "Royal blue", hex: "#2456C4" },
  { key: "forest", label: "Forest green", hex: "#1F5A3A" },
  { key: "red", label: "Red", hex: "#B3202A" },
  { key: "heather", label: "Heather grey", hex: "#9A9CA3" },
  { key: "sand", label: "Sand", hex: "#D9C6A5" },
];

export const COLOR_KEYS = COLORS.map((c) => c.key);

export function colorByKey(key: string | null | undefined): GarmentColor {
  return COLORS.find((c) => c.key === key) ?? COLORS[0];
}

export const isColorKey = (v: unknown): v is string =>
  typeof v === "string" && COLOR_KEYS.includes(v);

/* ---------------------------- Print placement ----------------------------- */

/** Where a design sits inside the print area: nudged up/down, and sized. */
export type PrintPlacement = {
  /** Percent of the print area's height; positive moves the print down. */
  offsetY: number;
  /** 1 = fills the print area; 0.5 = half size. */
  scale: number;
};

export const DEFAULT_PRINT: PrintPlacement = { offsetY: 0, scale: 1 };

export function cleanPrint(input: unknown): PrintPlacement {
  const o = (input ?? {}) as Record<string, unknown>;
  const offsetY = Number(o.offsetY);
  const scale = Number(o.scale);
  return {
    offsetY: Number.isFinite(offsetY) ? Math.max(-60, Math.min(60, Math.round(offsetY))) : 0,
    scale: Number.isFinite(scale) && scale > 0 ? Math.max(0.3, Math.min(1.3, Math.round(scale * 100) / 100)) : 1,
  };
}

/* -------------------------------- The item -------------------------------- */

export type MerchItem = {
  id: string;
  slug: string;
  title: string;
  category: GarmentCategory;
  description: string; // HTML
  /** CDN URL of the uploaded artwork. Null until one is uploaded. */
  design: string | null;
  /** Colour keys this design can be ordered in, in display order. */
  colors: string[];
  defaultColor: string;
  /** Where the design sits inside the print area. */
  print: PrintPlacement;
  /**
   * Null means "use the category's price" — the usual case. A number here is
   * a per-design override, in `baseCurrency`.
   */
  basePrice: number | null;
  baseCurrency: CurrencyCode;
  /** What this design actually costs after the category default is applied. */
  effectivePrice: number;
  effectiveCurrency: CurrencyCode;
  /** Every currency, derived from the effective price — what the shop renders. */
  prices: BookPrices;
  status: MerchStatus;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

/** A design is only sellable once it has artwork and a price. */
export function isMerchSellable(item: MerchItem): boolean {
  return (
    item.status === "published" &&
    Boolean(item.design) &&
    item.colors.length > 0 &&
    Object.keys(item.prices).length > 0
  );
}

/* --------------------------------- Pricing -------------------------------- */

export type Money = { basePrice: number; baseCurrency: CurrencyCode };

/**
 * Store-wide pricing: one figure per category, plus delivery. Set once in the
 * admin, applied to every design in that category unless overridden.
 */
export type MerchPricing = {
  tshirt: Money;
  cap: Money;
  /** Charged once per order that contains anything physical. 0 = free. */
  shipping: Money;
};

export const DEFAULT_MERCH_PRICING: MerchPricing = {
  tshirt: { basePrice: CATEGORIES.tshirt.defaultPrice, baseCurrency: DEFAULT_BASE_CURRENCY },
  cap: { basePrice: CATEGORIES.cap.defaultPrice, baseCurrency: DEFAULT_BASE_CURRENCY },
  shipping: { basePrice: 0, baseCurrency: DEFAULT_BASE_CURRENCY },
};

function cleanMoney(input: unknown, fallback: Money): Money {
  const o = (input ?? {}) as Record<string, unknown>;
  const cur = String(o.baseCurrency ?? "").toUpperCase();
  const amount = roundMoney(Number(o.basePrice));
  return {
    basePrice: Number.isFinite(amount) && amount >= 0 ? amount : fallback.basePrice,
    baseCurrency: cur in CURRENCIES ? (cur as CurrencyCode) : fallback.baseCurrency,
  };
}

export function cleanPricing(input: unknown): MerchPricing {
  const o = (input ?? {}) as Record<string, unknown>;
  return {
    tshirt: cleanMoney(o.tshirt, DEFAULT_MERCH_PRICING.tshirt),
    cap: cleanMoney(o.cap, DEFAULT_MERCH_PRICING.cap),
    shipping: cleanMoney(o.shipping, DEFAULT_MERCH_PRICING.shipping),
  };
}

/** The price a design sells at: its own override, else its category's. */
export function effectiveMoney(
  item: { category: GarmentCategory; basePrice: number | null; baseCurrency: CurrencyCode },
  pricing: MerchPricing
): Money {
  if (item.basePrice !== null && item.basePrice > 0) {
    return { basePrice: item.basePrice, baseCurrency: item.baseCurrency };
  }
  return pricing[item.category];
}

/** Delivery in every currency, from the same rate table as the products. */
export function shippingPrices(
  pricing: MerchPricing,
  rates: Record<string, number> | null | undefined
): BookPrices {
  if (!(pricing.shipping.basePrice > 0)) return {};
  return computePrices(pricing.shipping.basePrice, pricing.shipping.baseCurrency, rates);
}

/* -------------------------------- Variants -------------------------------- */

export type MerchVariant = { color: string; size: string };

/** One basket line per colour + size of a design. */
export function variantKey(id: string, variant: MerchVariant): string {
  return `${id}:${variant.color}:${variant.size}`;
}

export function variantLabel(variant: MerchVariant | undefined | null): string {
  if (!variant) return "";
  const color = colorByKey(variant.color).label;
  return variant.size && variant.size !== "One size" ? `${color} · ${variant.size}` : color;
}

export function isValidVariant(item: MerchItem, variant: MerchVariant): boolean {
  return (
    item.colors.includes(variant.color) &&
    CATEGORIES[item.category].sizes.includes(variant.size)
  );
}

export function slugifyMerch(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
