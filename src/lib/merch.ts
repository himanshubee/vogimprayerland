import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getRates } from "@/lib/fx";
import { CURRENCIES, type CurrencyCode } from "@/lib/currencies";
import {
  DEFAULT_BASE_CURRENCY,
  computePrices,
  roundMoney,
  type BookPrices,
} from "@/lib/books-shared";
import {
  COLORS,
  DEFAULT_MERCH_PRICING,
  DEFAULT_TEMPLATES,
  cleanPricing,
  cleanPrint,
  cleanTemplates,
  effectiveMoney,
  isCategory,
  isColorKey,
  isMerchSellable,
  shippingPrices,
  slugifyMerch,
  type MerchCategory,
  type MerchItem,
  type MerchPricing,
  type MerchStatus,
  type MerchTemplates,
} from "@/lib/merch-shared";

/**
 * The store catalogue — database layer (server only).
 *
 * A store item is a piece of artwork plus a category. The artwork is public —
 * it is served from the same CDN as every other image on the site — so unlike
 * a book there is nothing to guard; the whole row is safe to send anywhere.
 *
 * Pricing is by category. The ministry sets one price for T-shirts and one
 * for caps (plus a delivery fee) in the admin, stored in `merch_settings`, and
 * every design inherits its category's figure unless it carries an override.
 * Currencies convert from there exactly as books do (see lib/books-shared).
 *
 * Types and pure helpers live in lib/merch-shared.ts, which the client
 * imports. Everything shared is re-exported below.
 */

export * from "@/lib/merch-shared";

const COLLECTION = "merch";
const SETTINGS = "merch_settings";
const PRICING_ID = "pricing";
const TEMPLATES_ID = "templates";

const str = (v: unknown, max = 500) => String(v ?? "").slice(0, max).trim();
const toISO = (v: Date | string | undefined) =>
  (v instanceof Date ? v : new Date(v ?? 0)).toISOString();

type MerchDoc = {
  _id: ObjectId;
  slug: string;
  title?: string;
  category?: MerchCategory;
  description?: string;
  design?: string | null;
  colors?: string[];
  defaultColor?: string;
  printOffsetY?: number;
  printScale?: number;
  basePrice?: number | null;
  baseCurrency?: CurrencyCode;
  status?: MerchStatus;
  featured?: boolean;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

/* -------------------------------- Pricing -------------------------------- */

export async function getMerchPricing(): Promise<MerchPricing> {
  try {
    const db = await getDb();
    const doc = await db.collection(SETTINGS).findOne({ _id: PRICING_ID as never });
    return doc ? cleanPricing(doc) : DEFAULT_MERCH_PRICING;
  } catch (err) {
    console.error("[merch] pricing read failed:", err);
    return DEFAULT_MERCH_PRICING;
  }
}

export async function updateMerchPricing(input: unknown): Promise<MerchPricing> {
  const clean = cleanPricing(input);
  const db = await getDb();
  await db
    .collection(SETTINGS)
    .updateOne(
      { _id: PRICING_ID as never },
      { $set: { ...clean, updatedAt: new Date() } },
      { upsert: true }
    );
  return clean;
}

/* ----------------------------- Photo templates ---------------------------- */

export async function getMerchTemplates(): Promise<MerchTemplates> {
  try {
    const db = await getDb();
    const doc = await db.collection(SETTINGS).findOne({ _id: TEMPLATES_ID as never });
    return doc ? cleanTemplates(doc) : DEFAULT_TEMPLATES;
  } catch (err) {
    console.error("[merch] templates read failed:", err);
    return DEFAULT_TEMPLATES;
  }
}

export async function updateMerchTemplates(input: unknown): Promise<MerchTemplates> {
  const clean = cleanTemplates(input);
  const db = await getDb();
  await db
    .collection(SETTINGS)
    .updateOne(
      { _id: TEMPLATES_ID as never },
      { $set: { ...clean, updatedAt: new Date() } },
      { upsert: true }
    );
  return clean;
}

/**
 * Everything a price depends on, fetched once per request so a whole listing
 * is priced from one rate table and one settings row.
 */
type PriceContext = {
  pricing: MerchPricing;
  rates: Record<string, number> | null;
};

async function priceContext(): Promise<PriceContext> {
  const [pricing, fx] = await Promise.all([getMerchPricing(), getRates()]);
  return { pricing, rates: fx?.rates ?? null };
}

/** Delivery, in every currency it can be charged in. */
export async function getShippingPrices(): Promise<BookPrices> {
  const { pricing, rates } = await priceContext();
  return shippingPrices(pricing, rates);
}

/* ------------------------------- Serialize -------------------------------- */

function serialize(d: MerchDoc, ctx: PriceContext): MerchItem {
  const category: MerchCategory = isCategory(d.category) ? d.category : "tshirt";
  const colors = (d.colors ?? []).filter(isColorKey);
  const defaultColor =
    d.defaultColor && colors.includes(d.defaultColor) ? d.defaultColor : colors[0] ?? COLORS[0].key;
  const basePrice = Number(d.basePrice) > 0 ? roundMoney(Number(d.basePrice)) : null;
  const baseCurrency =
    d.baseCurrency && d.baseCurrency in CURRENCIES ? d.baseCurrency : DEFAULT_BASE_CURRENCY;
  const money = effectiveMoney({ category, basePrice, baseCurrency }, ctx.pricing);

  return {
    id: String(d._id),
    slug: d.slug,
    title: d.title ?? "(untitled)",
    category,
    description: d.description ?? "",
    design: d.design ?? null,
    colors,
    defaultColor,
    print: cleanPrint({ offsetY: d.printOffsetY, scale: d.printScale }),
    basePrice,
    baseCurrency,
    effectivePrice: money.basePrice,
    effectiveCurrency: money.baseCurrency,
    prices: computePrices(money.basePrice, money.baseCurrency, ctx.rates),
    status: d.status === "published" ? "published" : "draft",
    featured: Boolean(d.featured),
    order: d.order ?? 0,
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  };
}

/* --------------------------------- Reads ---------------------------------- */

/** Public: the store listing. Drafts and designs without artwork are hidden. */
export async function listPublishedMerch(): Promise<MerchItem[]> {
  try {
    const db = await getDb();
    const docs = await db
      .collection<MerchDoc>(COLLECTION)
      .find({ status: "published", design: { $nin: [null, ""] } })
      .sort({ order: 1, createdAt: -1 })
      .limit(300)
      .toArray();
    const ctx = await priceContext();
    return docs.map((d) => serialize(d, ctx)).filter(isMerchSellable);
  } catch (err) {
    // A store that 500s is worse than a store that is briefly empty.
    console.error("[merch] list failed:", err);
    return [];
  }
}

export async function getMerchBySlug(slug: string): Promise<MerchItem | null> {
  const db = await getDb();
  const doc = await db.collection<MerchDoc>(COLLECTION).findOne({ slug });
  if (!doc) return null;
  const item = serialize(doc, await priceContext());
  return isMerchSellable(item) ? item : null;
}

/** Admin: everything, drafts included. */
export async function listMerchAdmin(): Promise<MerchItem[]> {
  const db = await getDb();
  const docs = await db
    .collection<MerchDoc>(COLLECTION)
    .find({})
    .sort({ order: 1, createdAt: -1 })
    .limit(500)
    .toArray();
  const ctx = await priceContext();
  return docs.map((d) => serialize(d, ctx));
}

export async function getMerchById(id: string): Promise<MerchItem | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection<MerchDoc>(COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return serialize(doc, await priceContext());
}

/** Several designs at once, for pricing a basket without an N+1. */
export async function getSellableMerchByIds(ids: string[]): Promise<Map<string, MerchItem>> {
  const objectIds = ids.filter(ObjectId.isValid).map((id) => new ObjectId(id));
  const map = new Map<string, MerchItem>();
  if (!objectIds.length) return map;

  const db = await getDb();
  const docs = await db
    .collection<MerchDoc>(COLLECTION)
    .find({ _id: { $in: objectIds }, status: "published" })
    .toArray();

  const ctx = await priceContext();
  for (const doc of docs) {
    const item = serialize(doc, ctx);
    if (isMerchSellable(item)) map.set(item.id, item);
  }
  return map;
}

/* --------------------------------- Writes --------------------------------- */

export type MerchInput = {
  slug?: string;
  title: string;
  category?: string;
  description?: string;
  design?: string | null;
  colors?: string[];
  defaultColor?: string;
  printOffsetY?: number;
  printScale?: number;
  /** Null/0/blank = inherit the category price. */
  basePrice?: number | null;
  baseCurrency?: string;
  status?: MerchStatus;
  featured?: boolean;
};

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = await getDb();
  const coll = db.collection<MerchDoc>(COLLECTION);
  let slug = base || "design";
  let n = 1;
  for (;;) {
    const existing = await coll.findOne({ slug });
    if (!existing || (excludeId && String(existing._id) === excludeId)) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

function normalize(input: MerchInput) {
  const colors = [...new Set((input.colors ?? []).filter(isColorKey))];
  const defaultColor =
    input.defaultColor && colors.includes(input.defaultColor) ? input.defaultColor : colors[0] ?? "";
  const override = roundMoney(Number(input.basePrice) || 0);
  const print = cleanPrint({ offsetY: input.printOffsetY, scale: input.printScale });
  return {
    printOffsetY: print.offsetY,
    printScale: print.scale,
    title: str(input.title, 200) || "(untitled)",
    category: isCategory(input.category) ? input.category : ("tshirt" as const),
    description: String(input.description ?? "").slice(0, 40_000),
    design: input.design ? str(input.design, 600) : null,
    // No colours chosen means every colour — a design with none could never
    // be bought, and "all" is what a new upload wants anyway.
    colors: colors.length ? colors : COLORS.map((c) => c.key),
    defaultColor: defaultColor || COLORS[0].key,
    basePrice: override > 0 ? override : null,
    baseCurrency:
      input.baseCurrency && input.baseCurrency.toUpperCase() in CURRENCIES
        ? (input.baseCurrency.toUpperCase() as CurrencyCode)
        : DEFAULT_BASE_CURRENCY,
    status: input.status === "published" ? ("published" as const) : ("draft" as const),
    featured: Boolean(input.featured),
  };
}

export async function createMerch(input: MerchInput): Promise<MerchItem> {
  const db = await getDb();
  const now = new Date();
  const slug = await uniqueSlug(slugifyMerch(input.slug || input.title));
  const order = await db.collection(COLLECTION).countDocuments();

  const doc: MerchDoc = {
    _id: new ObjectId(),
    slug,
    ...normalize(input),
    order,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<MerchDoc>(COLLECTION).insertOne(doc);
  return serialize(doc, await priceContext());
}

export async function updateMerch(id: string, input: MerchInput): Promise<MerchItem | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const slug = await uniqueSlug(slugifyMerch(input.slug || input.title), id);
  await db
    .collection<MerchDoc>(COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: { slug, ...normalize(input), updatedAt: new Date() } });
  return getMerchById(id);
}

export async function deleteMerch(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const res = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}

export async function reorderMerch(ids: string[]): Promise<void> {
  const db = await getDb();
  await Promise.all(
    ids
      .filter(ObjectId.isValid)
      .map((id, i) =>
        db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: { order: i } })
      )
  );
}
