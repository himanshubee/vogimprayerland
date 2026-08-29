import { NextRequest, NextResponse } from "next/server";
import { CURRENCIES } from "@/lib/currencies";
import {
  FlutterwaveError,
  SITE_URL,
  createPaymentLink,
  isCurrency,
  isFlutterwaveConfigured,
} from "@/lib/flutterwave";
import { PaypalError, createPaypalOrder, isPaypalConfigured } from "@/lib/paypal";
import {
  PaystackError,
  initializeTransaction,
  isPaystackConfigured,
} from "@/lib/paystack";
import {
  gatewayLabel,
  isProvider,
  priceableCurrencies,
  resolveGatewayCurrencies,
  settlementCurrency,
  type Provider,
} from "@/lib/gateways";
import { getSellableBooksByIds, roundMoney, type Book, type BookPrices } from "@/lib/books";
import {
  getSellableMerchByIds,
  getShippingPrices,
  isValidVariant,
  variantLabel,
  type MerchItem,
  type MerchVariant,
} from "@/lib/merch";
import {
  attachPaypalOrderId,
  createPendingOrder,
  itemLabel,
  newOrderRef,
  type OrderItem,
  type ShippingAddress,
} from "@/lib/book-orders";

export const dynamic = "force-dynamic";

/**
 * Start a shop order and hand back the gateway URL to redirect the buyer to.
 *
 * The basket arrives from the browser as ids, quantities and — for garments —
 * a colour and size, *only*. Every price is looked up from the database here:
 * a basket that claims a cap costs 1 naira is repriced to what the cap
 * actually costs before a payment link is made, and delivery is added from the
 * store's own settings rather than anything the client sent.
 */

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max).trim();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

const MAX_LINES = 30;
const MAX_QTY = 20;

type IncomingLine = {
  productId?: unknown;
  /** Older clients sent this name. */
  bookId?: unknown;
  kind?: unknown;
  quantity?: unknown;
  variant?: unknown;
};

type CartLine = {
  kind: "book" | "merch";
  productId: string;
  quantity: number;
  variant?: MerchVariant;
};

/** Collapse the raw basket into unique lines with sane quantities. */
function parseCart(input: unknown): Map<string, CartLine> {
  const out = new Map<string, CartLine>();
  if (!Array.isArray(input)) return out;
  for (const raw of input.slice(0, MAX_LINES)) {
    const line = (raw ?? {}) as IncomingLine;
    const productId = str(line.productId ?? line.bookId, 40);
    if (!productId) continue;
    const qty = Math.round(Number(line.quantity) || 1);
    if (!Number.isFinite(qty) || qty < 1) continue;

    const kind = line.kind === "merch" ? "merch" : "book";
    const v = (line.variant ?? {}) as Record<string, unknown>;
    const variant: MerchVariant | undefined =
      kind === "merch" ? { color: str(v.color, 40), size: str(v.size, 20) } : undefined;

    // A repeated line is one line with a bigger quantity, not two lines.
    const key = variant ? `${productId}:${variant.color}:${variant.size}` : productId;
    const existing = out.get(key);
    out.set(key, {
      kind,
      productId,
      quantity: Math.min(MAX_QTY, (existing?.quantity ?? 0) + qty),
      variant,
    });
  }
  return out;
}

function parseShipping(input: unknown): ShippingAddress {
  const o = (input ?? {}) as Record<string, unknown>;
  return {
    name: str(o.name, 200),
    line1: str(o.line1, 300),
    line2: str(o.line2, 300),
    city: str(o.city, 120),
    state: str(o.state, 120),
    country: str(o.country, 120),
    postcode: str(o.postcode, 40),
    phone: str(o.phone, 60),
  };
}

function priceLines(
  cart: Map<string, CartLine>,
  books: Map<string, Book>,
  merch: Map<string, MerchItem>,
  currency: string
): { items: OrderItem[]; total: number; missing: string[] } {
  const items: OrderItem[] = [];
  const missing: string[] = [];
  let total = 0;

  for (const line of cart.values()) {
    if (line.kind === "merch") {
      const item = merch.get(line.productId);
      const unitPrice = item?.prices[currency as keyof BookPrices];
      if (!item || !unitPrice || unitPrice <= 0 || !line.variant) {
        missing.push(item?.title ?? line.productId);
        continue;
      }
      items.push({
        kind: "merch",
        bookId: item.id,
        slug: item.slug,
        title: item.title,
        coverImage: item.design,
        unitPrice,
        quantity: line.quantity,
        variant: line.variant,
        category: item.category,
      });
      total += unitPrice * line.quantity;
      continue;
    }

    const book = books.get(line.productId);
    const unitPrice = book?.prices[currency as keyof BookPrices];

    // Either the product vanished/unpublished since the basket was filled, or
    // it simply isn't sold in this currency. Both are the buyer's problem to
    // see, not something to silently drop from a total they already read.
    if (!book || !unitPrice || unitPrice <= 0) {
      missing.push(book?.title ?? line.productId);
      continue;
    }

    items.push({
      kind: "book",
      bookId: book.id,
      slug: book.slug,
      title: book.title,
      coverImage: book.coverImage,
      unitPrice,
      quantity: line.quantity,
    });
    total += unitPrice * line.quantity;
  }

  return { items, total: roundMoney(total), missing };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  /* ---- who and how ---- */

  const provider: Provider = isProvider(body.provider) ? body.provider : "flutterwave";

  const currency = str(body.currency, 8).toUpperCase();
  if (!isCurrency(currency)) {
    return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
  }

  const label = gatewayLabel(provider);

  const CONFIGURED: Record<Provider, boolean> = {
    flutterwave: isFlutterwaveConfigured(),
    paystack: isPaystackConfigured(),
    paypal: isPaypalConfigured(),
  };
  if (!CONFIGURED[provider]) {
    return NextResponse.json(
      { error: `${label} is not available right now. Please choose another payment method.` },
      { status: 503 }
    );
  }

  const email = str(body.email, 200).toLowerCase();
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address — your receipt is sent there." },
      { status: 400 }
    );
  }

  const name = str(body.name, 200);
  if (!name) {
    return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  }

  /* ---- what, and what it really costs ---- */

  const cart = parseCart(body.items);
  if (!cart.size) {
    return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
  }

  const bookIds = [...cart.values()].filter((l) => l.kind === "book").map((l) => l.productId);
  const merchIds = [...cart.values()].filter((l) => l.kind === "merch").map((l) => l.productId);

  let books: Map<string, Book>;
  let merch: Map<string, MerchItem>;
  let shippingPrices: BookPrices;
  try {
    [books, merch, shippingPrices] = await Promise.all([
      getSellableBooksByIds(bookIds),
      getSellableMerchByIds(merchIds),
      merchIds.length ? getShippingPrices() : Promise.resolve({} as BookPrices),
    ]);
  } catch (err) {
    // Outside a try this escaped as an HTML 500, which the browser could not
    // parse — so the buyer saw the client's generic fallback instead of a
    // reason. Every failure past this point returns JSON.
    console.error("[shop/checkout] could not load the catalogue:", err);
    return NextResponse.json(
      { error: "We could not reach our catalogue just now. Please try again in a moment." },
      { status: 503 }
    );
  }

  // Anything that has left the catalogue entirely — unpublished, deleted, or
  // a garment in a colour no longer offered. Reported before currency is
  // considered, because no choice of currency can bring it back.
  const gone = [...cart.values()].filter((l) => {
    if (l.kind === "book") return !books.has(l.productId);
    const item = merch.get(l.productId);
    return !item || !l.variant || !isValidVariant(item, l.variant);
  });
  if (gone.length) {
    const names = gone.map((l) => {
      const item = l.kind === "merch" ? merch.get(l.productId) : books.get(l.productId);
      const variant = l.kind === "merch" && l.variant ? ` (${variantLabel(l.variant)})` : "";
      return item ? `${item.title}${variant}` : null;
    });
    const known = names.filter((n): n is string => Boolean(n));
    return NextResponse.json(
      {
        error:
          (known.length
            ? `${known.join(", ")} ${known.length === 1 ? "is" : "are"}`
            : `${gone.length === 1 ? "An item" : `${gone.length} items`} in your basket ${
                gone.length === 1 ? "is" : "are"
              }`) +
          ` no longer available. Please remove ${gone.length === 1 ? "it" : "them"} and try again.`,
        unavailable: gone.map((l) => l.productId),
      },
      { status: 409 }
    );
  }

  const physical = merchIds.length > 0;
  const chargesShipping = physical && Object.keys(shippingPrices).length > 0;

  /**
   * Which currency this gateway will actually charge in.
   *
   * The shopper's own currency when the gateway can settle it, otherwise the
   * nearest one it can — the same derivation the checkout page used to show
   * them the figure, so the amount they approved is the amount charged.
   * Delivery must be priceable in it too.
   */
  const priceable = priceableCurrencies([
    ...[...books.values()].map((b) => b.prices),
    ...[...merch.values()].map((m) => m.prices),
    ...(chargesShipping ? [shippingPrices] : []),
  ]);
  const settlement = settlementCurrency(
    resolveGatewayCurrencies(process.env)[provider],
    currency,
    priceable
  );

  if (!settlement) {
    return NextResponse.json(
      {
        error: `${label} cannot settle any currency your basket is priced in. Please choose another payment method.`,
      },
      { status: 400 }
    );
  }

  const { items, total: goodsTotal, missing } = priceLines(cart, books, merch, settlement);

  if (missing.length) {
    return NextResponse.json(
      {
        error: `${missing.join(", ")} ${
          missing.length === 1 ? "is" : "are"
        } not priced in ${settlement}. Please choose another payment method or currency.`,
        unavailable: missing,
      },
      { status: 409 }
    );
  }
  if (!items.length || goodsTotal <= 0) {
    return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
  }

  /* ---- where, for anything physical ---- */

  let shipping: ShippingAddress | undefined;
  if (physical) {
    shipping = parseShipping(body.shipping);
    if (!shipping.line1 || !shipping.city || !shipping.country) {
      return NextResponse.json(
        { error: "Please give us a delivery address — street, city and country at least." },
        { status: 400 }
      );
    }
    if (!shipping.name) shipping.name = name;
    if (!shipping.phone) shipping.phone = str(body.phone, 60);
  }

  const shippingFee = chargesShipping
    ? roundMoney(Number(shippingPrices[settlement as keyof BookPrices] ?? 0))
    : 0;
  const total = roundMoney(goodsTotal + shippingFee);

  // Below the gateway's floor the payment link is refused outright, so catch it
  // here with an explanation rather than bouncing the buyer off a gateway error
  // page. Reachable when a product carries a manually pinned price under the
  // minimum — converted prices are already floored at it.
  const min = CURRENCIES[settlement].min;
  if (total < min) {
    return NextResponse.json(
      {
        error: `The smallest order ${label} can process is ${CURRENCIES[settlement].symbol}${min} ${settlement}. Please add something else, or choose another payment method.`,
      },
      { status: 400 }
    );
  }

  const ref = newOrderRef();
  const order = {
    provider,
    // The currency the money actually moves in — what the gateway charged and
    // what the receipt and admin must show.
    currency: settlement,
    items,
    total,
    name,
    email,
    phone: str(body.phone, 60),
    country: str(body.country, 120) || shipping?.country || "",
    shipping,
    shippingFee,
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null,
    userAgent: req.headers.get("user-agent") || null,
  };

  const description =
    items.length === 1
      ? itemLabel(items[0])
      : `${items.length} items from VOGIM Prayer Land`;

  try {
    // Record the intent *before* handing the buyer to the gateway, so the order
    // can always be reconciled even if the browser never comes back.
    await createPendingOrder(ref, order);

    if (provider === "paypal") {
      const created = await createPaypalOrder({
        reference: ref,
        currency: settlement,
        total,
        items: [
          ...items.map((i) => ({
            name: itemLabel({ ...i, quantity: 1 }),
            quantity: i.quantity,
            unitAmount: i.unitPrice,
          })),
          ...(shippingFee > 0
            ? [{ name: "Delivery", quantity: 1, unitAmount: shippingFee }]
            : []),
        ],
        returnUrl: `${SITE_URL}/checkout/thank-you/?ref=${encodeURIComponent(ref)}`,
        cancelUrl: `${SITE_URL}/checkout/?cancelled=1`,
        brandName: "VOGIM Prayer Land",
      });
      await attachPaypalOrderId(ref, created.id);
      return NextResponse.json({ link: created.approveUrl, reference: ref }, { status: 201 });
    }

    if (provider === "paystack") {
      const link = await initializeTransaction({
        reference: ref,
        amount: total,
        currency: settlement,
        email,
        // Paystack appends ?reference= &trxref= to this.
        callbackUrl: `${SITE_URL}/checkout/thank-you/`,
        metadata: {
          kind: physical ? "shop" : "books",
          name,
          custom_fields: items.map((i) => ({
            display_name: itemLabel({ ...i, quantity: 1 }),
            variable_name: i.slug,
            value: `${i.quantity} × ${i.unitPrice}`,
          })),
        },
      });
      return NextResponse.json({ link, reference: ref }, { status: 201 });
    }

    const link = await createPaymentLink({
      txRef: ref,
      amount: total,
      currency: settlement,
      redirectUrl: `${SITE_URL}/checkout/thank-you/`,
      customer: { email, name, phonenumber: order.phone || undefined },
      title: physical ? "VOGIM Prayer Land — Store" : "VOGIM Prayer Land — Books",
      description,
      meta: {
        kind: physical ? "shop" : "books",
        source: physical ? "vogimprayerland.org/store" : "vogimprayerland.org/books",
      },
    });

    return NextResponse.json({ link, reference: ref }, { status: 201 });
  } catch (err) {
    console.error(`[shop/checkout] ${label} failed:`, err);

    const gatewayError =
      err instanceof PaystackError ||
      err instanceof FlutterwaveError ||
      err instanceof PaypalError;

    // A gateway that answered with a complaint is telling us something useful;
    // one we could not reach at all is a transient network problem.
    const unreachable = gatewayError && (err as { status: number }).status === 0;

    if (gatewayError && !unreachable) {
      return NextResponse.json(
        { error: `${label} could not start this payment: ${(err as Error).message}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: `We could not reach ${label} just now. Please try again in a moment, or choose another payment method.`,
      },
      { status: 502 }
    );
  }
}
