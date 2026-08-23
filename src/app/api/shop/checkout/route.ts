import { NextRequest, NextResponse } from "next/server";
import { CURRENCIES } from "@/lib/currencies";
import {
  SITE_URL,
  createPaymentLink,
  isCurrency,
  isFlutterwaveConfigured,
} from "@/lib/flutterwave";
import { createPaypalOrder, isPaypalConfigured } from "@/lib/paypal";
import {
  getSellableBooksByIds,
  isPaypalCurrency,
  roundMoney,
  type Book,
} from "@/lib/books";
import {
  attachPaypalOrderId,
  createPendingOrder,
  newOrderRef,
  type OrderItem,
  type Provider,
} from "@/lib/book-orders";

export const dynamic = "force-dynamic";

/**
 * Start a book order and hand back the gateway URL to redirect the buyer to.
 *
 * The cart arrives from the browser as ids and quantities *only*. Every price
 * is looked up from the database here — a cart that claims a book costs 1 naira
 * is repriced to what the book actually costs before a payment link is made.
 */

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max).trim();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

const MAX_LINES = 30;
const MAX_QTY = 20;

type IncomingLine = { bookId?: unknown; quantity?: unknown };

/** Collapse the raw cart into unique ids with sane quantities. */
function parseCart(input: unknown): Map<string, number> {
  const out = new Map<string, number>();
  if (!Array.isArray(input)) return out;
  for (const raw of input.slice(0, MAX_LINES)) {
    const line = (raw ?? {}) as IncomingLine;
    const id = str(line.bookId, 40);
    if (!id) continue;
    const qty = Math.round(Number(line.quantity) || 1);
    if (!Number.isFinite(qty) || qty < 1) continue;
    // A repeated id is one line with a bigger quantity, not two lines.
    const total = Math.min(MAX_QTY, (out.get(id) ?? 0) + qty);
    out.set(id, total);
  }
  return out;
}

function priceLines(
  cart: Map<string, number>,
  books: Map<string, Book>,
  currency: string
): { items: OrderItem[]; total: number; missing: string[] } {
  const items: OrderItem[] = [];
  const missing: string[] = [];
  let total = 0;

  for (const [bookId, quantity] of cart) {
    const book = books.get(bookId);
    const unitPrice = book?.prices[currency as keyof typeof book.prices];

    // Either the book vanished/unpublished since the cart was filled, or it
    // simply isn't sold in this currency. Both are the buyer's problem to see,
    // not something to silently drop from a total they already read.
    if (!book || !unitPrice || unitPrice <= 0) {
      missing.push(book?.title ?? bookId);
      continue;
    }

    items.push({
      bookId: book.id,
      slug: book.slug,
      title: book.title,
      coverImage: book.coverImage,
      unitPrice,
      quantity,
    });
    total += unitPrice * quantity;
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

  const provider: Provider = body.provider === "paypal" ? "paypal" : "flutterwave";

  const currency = str(body.currency, 8).toUpperCase();
  if (!isCurrency(currency)) {
    return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
  }

  if (provider === "paypal" && !isPaypalCurrency(currency)) {
    return NextResponse.json(
      {
        error: `PayPal cannot take ${currency}. Please switch to USD, GBP or EUR, or pay by card instead.`,
      },
      { status: 400 }
    );
  }

  const configured =
    provider === "paypal" ? isPaypalConfigured() : isFlutterwaveConfigured();
  if (!configured) {
    return NextResponse.json(
      {
        error:
          provider === "paypal"
            ? "PayPal is not available right now. Please pay by card instead."
            : "Card payment is not available right now. Please try again later.",
      },
      { status: 503 }
    );
  }

  const email = str(body.email, 200).toLowerCase();
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address — your books are sent there." },
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

  const books = await getSellableBooksByIds([...cart.keys()]);
  const { items, total, missing } = priceLines(cart, books, currency);

  if (missing.length) {
    return NextResponse.json(
      {
        error: `${missing.join(", ")} ${
          missing.length === 1 ? "is" : "are"
        } no longer available in ${currency}. Please remove it from your basket or choose another currency.`,
        unavailable: missing,
      },
      { status: 409 }
    );
  }
  if (!items.length || total <= 0) {
    return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
  }

  // Below the gateway's floor the payment link is refused outright, so catch it
  // here with an explanation rather than bouncing the buyer off a gateway error
  // page. Reachable when a book carries a manually pinned price under the
  // minimum — converted prices are already floored at it.
  const min = CURRENCIES[currency].min;
  if (total < min) {
    return NextResponse.json(
      {
        error: `The smallest order we can process is ${CURRENCIES[currency].symbol}${min} ${currency}. Please add another book, or switch currency.`,
      },
      { status: 400 }
    );
  }

  const ref = newOrderRef();
  const order = {
    provider,
    currency,
    items,
    total,
    name,
    email,
    phone: str(body.phone, 60),
    country: str(body.country, 120),
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null,
    userAgent: req.headers.get("user-agent") || null,
  };

  try {
    // Record the intent *before* handing the buyer to the gateway, so the order
    // can always be reconciled even if the browser never comes back.
    await createPendingOrder(ref, order);

    if (provider === "paypal") {
      const created = await createPaypalOrder({
        reference: ref,
        currency,
        total,
        items: items.map((i) => ({
          name: i.title,
          quantity: i.quantity,
          unitAmount: i.unitPrice,
        })),
        returnUrl: `${SITE_URL}/books/thank-you/?ref=${encodeURIComponent(ref)}`,
        cancelUrl: `${SITE_URL}/books/checkout/?cancelled=1`,
        brandName: "VOGIM Prayer Land",
      });
      await attachPaypalOrderId(ref, created.id);
      return NextResponse.json(
        { link: created.approveUrl, reference: ref },
        { status: 201 }
      );
    }

    const link = await createPaymentLink({
      txRef: ref,
      amount: total,
      currency,
      redirectUrl: `${SITE_URL}/books/thank-you/`,
      customer: { email, name, phonenumber: order.phone || undefined },
      title: "VOGIM Prayer Land — Books",
      description:
        items.length === 1
          ? items[0].title
          : `${items.length} books from VOGIM Prayer Land`,
      meta: { kind: "books", source: "vogimprayerland.org/books" },
    });

    return NextResponse.json({ link, reference: ref }, { status: 201 });
  } catch (err) {
    console.error(`[shop/checkout] ${provider} failed:`, err);
    return NextResponse.json(
      {
        error:
          "We could not reach the payment provider. Please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
