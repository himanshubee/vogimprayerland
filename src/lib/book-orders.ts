import { randomUUID } from "crypto";
import { getDb } from "@/lib/mongodb";
import { linkSubmissionToContact } from "@/lib/crm";
import { sendEmail, sendSubmissionEmail } from "@/lib/mailer";
import { downloadUrl, TOKEN_TTL_DAYS } from "@/lib/book-tokens";
import { formatPrice } from "@/lib/books";
import {
  SITE_URL,
  verifyTransaction,
  verifyTransactionByReference,
  type CurrencyCode,
  type VerifiedTransaction,
} from "@/lib/flutterwave";
import { capturePaypalOrder, type CapturedOrder } from "@/lib/paypal";
import { verifyTransaction as verifyPaystack } from "@/lib/paystack";
import { gatewayLabel, type Provider } from "@/lib/gateways";
import { variantLabel, type MerchCategory, type MerchVariant } from "@/lib/merch-shared";

/**
 * Orders for the shop — books and store items alike.
 *
 * Mirrors lib/donations.ts deliberately — a row is written `pending` *before*
 * the buyer leaves for the gateway, and is settled by whichever callback
 * arrives first (browser redirect or server-to-server webhook). Settling is
 * idempotent, so both running is harmless.
 *
 * The one thing this adds over a donation is delivery: a settled order is what
 * entitles someone to download a PDF, so the prices and titles are frozen onto
 * the row at creation time. Re-pricing a book later never changes what an old
 * order says was bought.
 */

const COLLECTION = "book_orders";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";
export type { Provider } from "@/lib/gateways";
export type SettledVia = "redirect" | "webhook" | "reconcile";

export type OrderItem = {
  /** Absent on orders from before the store existed — those are all books. */
  kind?: "book" | "merch";
  /**
   * The product's id. Named for the download-token path it feeds; a garment's
   * id sits in the same field so one order shape serves both.
   */
  bookId: string;
  slug: string;
  title: string;
  coverImage: string | null;
  unitPrice: number;
  quantity: number;
  /** Garments only: the colour and size that were ordered. */
  variant?: MerchVariant;
  category?: MerchCategory;
};

export const isBookItem = (item: OrderItem): boolean => (item.kind ?? "book") === "book";
export const isMerchItem = (item: OrderItem): boolean => item.kind === "merch";

/** Where a physical order is sent. */
export type ShippingAddress = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
  phone: string;
};

export type Fulfilment = "unfulfilled" | "shipped" | "delivered";

export type BookOrderDoc = {
  _id: string; // our reference — unique per attempt
  status: OrderStatus;
  provider: Provider;
  currency: CurrencyCode;
  items: OrderItem[];
  total: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  /** Gateway's side of the record, filled in on settlement. */
  flwId?: number;
  flwRef?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  /** Paystack keys on our own reference, so this is just its numeric id. */
  paystackId?: number;
  chargedAmount?: number;
  paymentType?: string;
  settledVia?: SettledVia;
  failureReason?: string;
  /** Delivery bookkeeping — how often the files have actually been fetched. */
  downloadCount?: number;
  lastDownloadAt?: Date;
  deliveryEmailSent?: boolean;
  ip?: string | null;
  userAgent?: string | null;
  /** Present when the order holds anything physical. */
  shipping?: ShippingAddress;
  /** Delivery charged on this order, in `currency`; folded into `total`. */
  shippingFee?: number;
  fulfilment?: Fulfilment;
  fulfilledAt?: Date;
  fulfilmentNote?: string;
};

/**
 * `VOGIM-SHOP-<random>` — the prefix is what lets one shared Flutterwave
 * webhook URL tell a shop order apart from a donation. Orders placed before
 * the store existed carry `VOGIM-BOOK-`, and both are recognised.
 */
export function newOrderRef(): string {
  return `VOGIM-SHOP-${randomUUID()}`;
}

export const isBookRef = (ref: string): boolean =>
  /^VOGIM-(BOOK|SHOP)-/.test(String(ref ?? ""));

export const orderHasMerch = (order: Pick<BookOrderDoc, "items">): boolean =>
  order.items.some(isMerchItem);

/* -------------------------------- Writes -------------------------------- */

export type NewOrder = {
  provider: Provider;
  currency: CurrencyCode;
  items: OrderItem[];
  total: number;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  ip?: string | null;
  userAgent?: string | null;
  shipping?: ShippingAddress;
  shippingFee?: number;
};

export async function createPendingOrder(
  ref: string,
  input: NewOrder
): Promise<void> {
  const now = new Date();
  const db = await getDb();
  await db.collection<BookOrderDoc>(COLLECTION).insertOne({
    _id: ref,
    status: "pending",
    provider: input.provider,
    currency: input.currency,
    items: input.items,
    total: input.total,
    name: input.name,
    email: input.email,
    phone: input.phone ?? "",
    country: input.country ?? "",
    createdAt: now,
    updatedAt: now,
    downloadCount: 0,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    ...(input.shipping ? { shipping: input.shipping } : {}),
    ...(input.shippingFee ? { shippingFee: input.shippingFee } : {}),
    ...(orderHasMerch(input) ? { fulfilment: "unfulfilled" as const } : {}),
  });
}

/** Admin: record that a physical order has been sent or has arrived. */
export async function setFulfilment(
  ref: string,
  fulfilment: Fulfilment,
  note = ""
): Promise<BookOrderDoc | null> {
  const db = await getDb();
  const orders = db.collection<BookOrderDoc>(COLLECTION);
  await orders.updateOne(
    { _id: ref },
    {
      $set: {
        fulfilment,
        fulfilmentNote: String(note).slice(0, 500),
        updatedAt: new Date(),
        ...(fulfilment === "unfulfilled" ? {} : { fulfilledAt: new Date() }),
      },
    }
  );
  return orders.findOne({ _id: ref });
}

/** Record PayPal's order id against our reference so the return trip can
 *  find the row even if the buyer's query string is missing our ref. */
export async function attachPaypalOrderId(
  ref: string,
  paypalOrderId: string
): Promise<void> {
  const db = await getDb();
  await db
    .collection<BookOrderDoc>(COLLECTION)
    .updateOne({ _id: ref }, { $set: { paypalOrderId, updatedAt: new Date() } });
}

export async function getOrder(ref: string): Promise<BookOrderDoc | null> {
  if (!ref) return null;
  const db = await getDb();
  return db.collection<BookOrderDoc>(COLLECTION).findOne({ _id: ref });
}

export async function getOrderByPaypalId(
  paypalOrderId: string
): Promise<BookOrderDoc | null> {
  if (!paypalOrderId) return null;
  const db = await getDb();
  return db.collection<BookOrderDoc>(COLLECTION).findOne({ paypalOrderId });
}

/* ------------------------------- Settling ------------------------------- */

export type SettleResult =
  | { outcome: "paid"; order: BookOrderDoc }
  | { outcome: "already_settled"; order: BookOrderDoc }
  | { outcome: "failed"; order: BookOrderDoc | null; reason: string }
  | { outcome: "mismatch"; order: BookOrderDoc | null; reason: string }
  | { outcome: "not_found"; order: null; reason: string };

/**
 * Mark an order paid, but only when the gateway's own record agrees with what
 * we stored before checkout. A tampered redirect URL therefore cannot unlock a
 * download: the amount, currency and reference are all re-checked here.
 */
async function markPaid(
  existing: BookOrderDoc,
  verified: {
    status: string;
    amount: number;
    currency: string;
    via: SettledVia;
    fields: Partial<BookOrderDoc>;
  }
): Promise<SettleResult> {
  const db = await getDb();
  const orders = db.collection<BookOrderDoc>(COLLECTION);
  const now = new Date();
  const ref = existing._id;

  if (!verified.status) {
    return { outcome: "failed", order: existing, reason: "No payment status returned." };
  }

  if (verified.currency && verified.currency !== existing.currency) {
    const reason = `Currency mismatch: expected ${existing.currency}, received ${verified.currency}.`;
    await orders.updateOne(
      { _id: ref },
      { $set: { updatedAt: now, ...verified.fields, failureReason: reason } }
    );
    return { outcome: "mismatch", order: existing, reason };
  }

  // Tolerate a hair of floating-point drift, but nothing more.
  if (verified.amount + 0.001 < existing.total) {
    const reason = `Amount mismatch: expected ${existing.total}, received ${verified.amount}.`;
    await orders.updateOne(
      { _id: ref },
      { $set: { updatedAt: now, ...verified.fields, failureReason: reason } }
    );
    return { outcome: "mismatch", order: existing, reason };
  }

  await orders.updateOne(
    { _id: ref },
    {
      $set: {
        status: "paid",
        updatedAt: now,
        paidAt: now,
        settledVia: verified.via,
        ...verified.fields,
      },
      $unset: { failureReason: "" },
    }
  );

  const order = (await orders.findOne({ _id: ref })) as BookOrderDoc;

  // Delivery and CRM must never break the buyer's confirmation page — they
  // already have their download links rendered from the same order row.
  await deliverAndLink(order).catch((err) =>
    console.error("[book-orders] post-settle hook failed:", err)
  );

  return { outcome: "paid", order };
}

async function markNotPaid(
  existing: BookOrderDoc,
  status: string,
  fields: Partial<BookOrderDoc>,
  via: SettledVia
): Promise<SettleResult> {
  const db = await getDb();
  const orders = db.collection<BookOrderDoc>(COLLECTION);
  const cancelled = /cancel|void/i.test(status);
  await orders.updateOne(
    { _id: existing._id },
    {
      $set: {
        status: cancelled ? "cancelled" : "failed",
        updatedAt: new Date(),
        settledVia: via,
        failureReason: `The gateway reported status “${status}”.`,
        ...fields,
      },
    }
  );
  return {
    outcome: "failed",
    order: await orders.findOne({ _id: existing._id }),
    reason: `The payment was not completed (${status}).`,
  };
}

/* ---- Flutterwave ---- */

export async function settleFlutterwaveOrder(
  transactionId: string | number,
  via: SettledVia
): Promise<SettleResult> {
  const tx = await verifyTransaction(transactionId);
  if (!tx) {
    return {
      outcome: "not_found",
      order: null,
      reason: "Flutterwave has no record of that transaction.",
    };
  }
  return settleVerifiedFlw(tx, via);
}

export async function settleFlutterwaveOrderByReference(
  ref: string,
  via: SettledVia
): Promise<SettleResult> {
  const tx = await verifyTransactionByReference(ref);
  if (!tx) {
    return {
      outcome: "not_found",
      order: null,
      reason: "Flutterwave has no transaction for that reference.",
    };
  }
  return settleVerifiedFlw(tx, via);
}

async function settleVerifiedFlw(
  tx: VerifiedTransaction,
  via: SettledVia
): Promise<SettleResult> {
  const existing = await getOrder(tx.txRef);
  if (!existing) {
    return {
      outcome: "not_found",
      order: null,
      reason: `No local order for reference ${tx.txRef}.`,
    };
  }
  if (existing.status === "paid") {
    return { outcome: "already_settled", order: existing };
  }

  const fields: Partial<BookOrderDoc> = {
    flwId: tx.id,
    flwRef: tx.flwRef,
    chargedAmount: tx.chargedAmount,
    paymentType: tx.paymentType,
  };

  if (tx.status !== "successful") {
    return markNotPaid(existing, tx.status, fields, via);
  }
  return markPaid(existing, {
    status: tx.status,
    amount: tx.amount,
    currency: tx.currency,
    via,
    fields,
  });
}

/* ---- Paystack ---- */

/**
 * Settle against Paystack. Verification is keyed on *our* reference, so this
 * one function serves the redirect, the webhook and the reconcile sweep alike.
 */
export async function settlePaystackOrder(
  ref: string,
  via: SettledVia
): Promise<SettleResult> {
  const tx = await verifyPaystack(ref);
  if (!tx) {
    return {
      outcome: "not_found",
      order: null,
      reason: "Paystack has no transaction for that reference.",
    };
  }

  const existing = await getOrder(tx.reference);
  if (!existing) {
    return {
      outcome: "not_found",
      order: null,
      reason: `No local order for reference ${tx.reference}.`,
    };
  }
  if (existing.status === "paid") {
    return { outcome: "already_settled", order: existing };
  }

  const fields: Partial<BookOrderDoc> = {
    paystackId: tx.id,
    chargedAmount: tx.amount,
    paymentType: tx.channel || "paystack",
  };

  if (tx.status !== "success") {
    return markNotPaid(existing, tx.status || "unknown", fields, via);
  }
  return markPaid(existing, {
    status: tx.status,
    amount: tx.amount,
    currency: tx.currency,
    via,
    fields,
  });
}

/* ---- PayPal ---- */

/**
 * Capture the PayPal order and settle ours. `ref` is our own reference when we
 * have it; PayPal also echoes it back as invoice_id, which is what we fall
 * back to when the buyer returns without it in the query string.
 */
export async function settlePaypalOrder(
  paypalOrderId: string,
  via: SettledVia,
  ref?: string
): Promise<SettleResult> {
  let captured: CapturedOrder | null;
  try {
    captured = await capturePaypalOrder(paypalOrderId);
  } catch (err) {
    console.error("[book-orders] paypal capture failed:", err);
    throw err;
  }
  if (!captured) {
    return {
      outcome: "not_found",
      order: null,
      reason: "PayPal has no record of that order.",
    };
  }

  const reference = ref || captured.reference;
  const existing =
    (reference ? await getOrder(reference) : null) ??
    (await getOrderByPaypalId(paypalOrderId));

  if (!existing) {
    return {
      outcome: "not_found",
      order: null,
      reason: `No local order for PayPal order ${paypalOrderId}.`,
    };
  }
  if (existing.status === "paid") {
    return { outcome: "already_settled", order: existing };
  }

  const fields: Partial<BookOrderDoc> = {
    paypalOrderId: captured.id,
    paypalCaptureId: captured.captureId,
    chargedAmount: captured.amount,
    paymentType: "paypal",
  };

  if (captured.status !== "COMPLETED") {
    return markNotPaid(existing, captured.status || "unknown", fields, via);
  }
  return markPaid(existing, {
    status: captured.status,
    amount: captured.amount,
    currency: captured.currency,
    via,
    fields,
  });
}

/* ------------------------------- Delivery ------------------------------- */

/** Fresh signed links for every book on a paid order. Garments have none. */
export function linksFor(order: BookOrderDoc): { title: string; url: string }[] {
  return order.items.filter(isBookItem).map((item) => ({
    title: item.title,
    url: downloadUrl(SITE_URL, order._id, item.bookId),
  }));
}

/** "Navy · L" for a garment line, "" for a book. */
export function itemVariantLabel(item: OrderItem): string {
  return isMerchItem(item) ? variantLabel(item.variant) : "";
}

/** One line per item, as it should read on a receipt or in the admin. */
export function itemLabel(item: OrderItem): string {
  const variant = itemVariantLabel(item);
  const base = variant ? `${item.title} (${variant})` : item.title;
  return item.quantity > 1 ? `${base} ×${item.quantity}` : base;
}

export function formatShipping(address: ShippingAddress | undefined): string[] {
  if (!address) return [];
  return [
    address.name,
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    [address.postcode, address.country].filter(Boolean).join(" "),
    address.phone,
  ].filter(Boolean);
}

function deliveryEmailText(order: BookOrderDoc): string {
  const links = linksFor(order);
  const goods = order.items.filter(isMerchItem);
  const out: string[] = [`Dear ${order.name || "friend"},`, "", "Thank you for your order."];

  if (links.length) {
    out.push(
      "",
      links.length === 1 ? "Your book download link is below." : "Your book download links are below.",
      "",
      ...links.map((l) => `• ${l.title}\n  ${l.url}`),
      "",
      `These links stay active for ${TOKEN_TTL_DAYS} days. If one expires, visit`,
      `${SITE_URL}/books/library/ and enter this email address together with your`,
      `order reference to have fresh links issued.`
    );
  }

  if (goods.length) {
    out.push(
      "",
      goods.length === 1 ? "Being made and sent to you:" : "Being made and sent to you:",
      "",
      ...goods.map((i) => `• ${itemLabel(i)}`),
      "",
      "Delivery address:",
      ...formatShipping(order.shipping).map((l) => `  ${l}`),
      "",
      "We will be in touch on this email address when it is dispatched."
    );
  }

  out.push(
    "",
    `Order reference: ${order._id}`,
    `Total: ${formatPrice(order.total, order.currency)} ${order.currency}` +
      (order.shippingFee
        ? ` (including ${formatPrice(order.shippingFee, order.currency)} delivery)`
        : ""),
    "",
    links.length ? "May the word in these pages bear fruit in your life." : "Thank you for standing with the ministry.",
    "",
    "VOGIM Prayer Land"
  );
  return out.join("\n");
}

/**
 * Email the buyer their links, tell the ministry inbox about the sale, and log
 * the buyer into the CRM. All best-effort and independent — a bounced email
 * must not cost the ministry the sale record.
 *
 * Emailing the buyer needs real SMTP: the FormSubmit fallback can only deliver
 * to the ministry's own inbox. Without SMTP the receipt page is the delivery
 * channel, which is why it renders the links directly.
 */
async function deliverAndLink(order: BookOrderDoc): Promise<void> {
  const pretty = `${formatPrice(order.total, order.currency)} ${order.currency}`;
  const titles = order.items.map(itemLabel).join(", ");
  const physical = orderHasMerch(order);
  const intent = physical ? "Shop Order" : "Book Order";

  const fields: Record<string, string> = {
    name: order.name,
    email: order.email,
    phone: order.phone,
    country: order.country,
    items: titles,
    total: pretty,
    "paid with": gatewayLabel(order.provider),
    reference: order._id,
    ...(physical ? { "deliver to": formatShipping(order.shipping).join(", ") } : {}),
    message: `${intent} — ${titles}`,
  };

  const results = await Promise.allSettled([
    sendEmail({
      to: order.email,
      subject: `Your order from VOGIM Prayer Land (${order._id})`,
      text: deliveryEmailText(order),
    }),
    sendSubmissionEmail({ intent, fields }),
    linkSubmissionToContact({
      id: order._id,
      intent,
      fields,
      createdAt: order.paidAt ?? order.createdAt,
    }),
  ]);

  const delivery = results[0];
  const sent = delivery.status === "fulfilled" && delivery.value.ok;
  if (!sent) {
    const why =
      delivery.status === "fulfilled"
        ? delivery.value.error
        : String(delivery.reason);
    console.warn(
      `[book-orders] ${order._id}: could not email download links (${why}). ` +
        `The buyer still has them on the receipt page.`
    );
  }

  const db = await getDb();
  await db
    .collection<BookOrderDoc>(COLLECTION)
    .updateOne({ _id: order._id }, { $set: { deliveryEmailSent: sent } });
}

/** Re-send the links for an already-paid order (the /books/library flow). */
export async function resendDeliveryEmail(
  order: BookOrderDoc
): Promise<{ ok: boolean; error?: string }> {
  const res = await sendEmail({
    to: order.email,
    subject: `Your order from VOGIM Prayer Land (${order._id})`,
    text: deliveryEmailText(order),
  });
  if (res.ok) {
    const db = await getDb();
    await db
      .collection<BookOrderDoc>(COLLECTION)
      .updateOne({ _id: order._id }, { $set: { deliveryEmailSent: true } });
  }
  return res;
}

/** Count a download. Purely for the admin's visibility — never a limit. */
export async function recordDownload(ref: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<BookOrderDoc>(COLLECTION)
    .updateOne(
      { _id: ref },
      { $inc: { downloadCount: 1 }, $set: { lastDownloadAt: new Date() } }
    );
}

/**
 * Find a paid order from what a customer can actually remember: their email,
 * plus the order reference. Both must match — the email alone would let anyone
 * who knows an address pull someone else's books.
 */
export async function findPaidOrderForCustomer(
  email: string,
  ref: string
): Promise<BookOrderDoc | null> {
  const db = await getDb();
  return db.collection<BookOrderDoc>(COLLECTION).findOne({
    _id: String(ref).trim(),
    email: String(email).trim().toLowerCase(),
    status: "paid",
  });
}

/* -------------------------------- Reads --------------------------------- */

/** Plain-JSON shape handed to the admin client component. */
export type OrderView = {
  ref: string;
  status: OrderStatus;
  provider: Provider;
  currency: string;
  total: number;
  totalLabel: string;
  items: OrderItem[];
  name: string;
  email: string;
  phone: string;
  country: string;
  createdAt: string;
  paidAt: string | null;
  paymentType: string;
  settledVia: string;
  failureReason: string;
  downloadCount: number;
  deliveryEmailSent: boolean;
  gatewayRef: string;
  hasMerch: boolean;
  shipping: ShippingAddress | null;
  shippingFee: number;
  fulfilment: Fulfilment | "";
  fulfilmentNote: string;
};

const iso = (d: Date | string | undefined) =>
  d ? (d instanceof Date ? d : new Date(d)).toISOString() : null;

function view(d: BookOrderDoc): OrderView {
  return {
    ref: d._id,
    status: d.status,
    provider: d.provider,
    currency: d.currency,
    total: d.total,
    totalLabel: formatPrice(d.total, d.currency),
    items: d.items ?? [],
    name: d.name ?? "",
    email: d.email ?? "",
    phone: d.phone ?? "",
    country: d.country ?? "",
    createdAt: iso(d.createdAt) ?? new Date(0).toISOString(),
    paidAt: iso(d.paidAt),
    paymentType: d.paymentType ?? "",
    settledVia: d.settledVia ?? "",
    failureReason: d.failureReason ?? "",
    downloadCount: d.downloadCount ?? 0,
    deliveryEmailSent: Boolean(d.deliveryEmailSent),
    gatewayRef:
      d.paypalCaptureId ||
      d.flwRef ||
      d.paypalOrderId ||
      (d.paystackId ? String(d.paystackId) : "") ||
      "",
    hasMerch: orderHasMerch(d),
    shipping: d.shipping ?? null,
    shippingFee: d.shippingFee ?? 0,
    fulfilment: d.fulfilment ?? (orderHasMerch(d) ? "unfulfilled" : ""),
    fulfilmentNote: d.fulfilmentNote ?? "",
  };
}

export const isFulfilment = (v: unknown): v is Fulfilment =>
  v === "unfulfilled" || v === "shipped" || v === "delivered";

export async function listOrders(limit = 500): Promise<OrderView[]> {
  const db = await getDb();
  const docs = await db
    .collection<BookOrderDoc>(COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(view);
}

/* ----------------------------- Reconciling ------------------------------ */

export type ReconcileReport = {
  checked: number;
  settled: number;
  stillPending: number;
  errors: number;
};

/**
 * Ask each gateway about every order still sitting `pending` and settle any
 * that actually went through — the safety net for a buyer who paid but whose
 * browser never came back and whose webhook was missed.
 *
 * Orders younger than `minAgeMinutes` are skipped: the buyer may still be on
 * the gateway's page, and an unpaid reference simply doesn't exist there yet.
 */
export async function reconcilePendingOrders(
  minAgeMinutes = 15,
  limit = 200
): Promise<ReconcileReport> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - minAgeMinutes * 60_000);
  const pending = await db
    .collection<BookOrderDoc>(COLLECTION)
    .find({ status: "pending", createdAt: { $lte: cutoff } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const report: ReconcileReport = {
    checked: pending.length,
    settled: 0,
    stillPending: 0,
    errors: 0,
  };

  for (const o of pending) {
    try {
      let result: SettleResult;
      if (o.provider === "paypal") {
        // PayPal is the odd one out: without its order id there is nothing to
        // ask about, since it does not key on our reference.
        result = o.paypalOrderId
          ? await settlePaypalOrder(o.paypalOrderId, "reconcile", o._id)
          : { outcome: "not_found", order: null, reason: "No PayPal order id." };
      } else if (o.provider === "paystack") {
        result = await settlePaystackOrder(o._id, "reconcile");
      } else {
        result = await settleFlutterwaveOrderByReference(o._id, "reconcile");
      }

      if (result.outcome === "paid" || result.outcome === "already_settled") {
        report.settled += 1;
      } else if (result.outcome === "not_found") {
        // Nothing at the gateway — the buyer never paid. Leave it pending
        // rather than inventing a failure that never happened.
        report.stillPending += 1;
      }
    } catch (err) {
      report.errors += 1;
      console.error(`[book-orders] reconcile failed for ${o._id}:`, err);
    }
  }

  return report;
}
