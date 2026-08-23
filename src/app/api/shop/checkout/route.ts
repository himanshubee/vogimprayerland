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
import { getSellableBooksByIds, roundMoney, type Book } from "@/lib/books";
import {
  attachPaypalOrderId,
  createPendingOrder,
  newOrderRef,
  type OrderItem,
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

  const provider: Provider = isProvider(body.provider)
    ? body.provider
    : "flutterwave";

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
      {
        error: `${label} is not available right now. Please choose another payment method.`,
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

  let books: Map<string, Book>;
  try {
    books = await getSellableBooksByIds([...cart.keys()]);
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

  // A book that has left the catalogue entirely — unpublished, deleted, or its
  // PDF removed. Reported before currency is considered, because no choice of
  // currency can bring it back.
  const gone = [...cart.keys()].filter((id) => !books.has(id));
  if (gone.length) {
    return NextResponse.json(
      {
        error: `${gone.length === 1 ? "A book" : `${gone.length} books`} in your basket ${
          gone.length === 1 ? "is" : "are"
        } no longer available. Please remove ${gone.length === 1 ? "it" : "them"} and try again.`,
        unavailable: gone,
      },
      { status: 409 }
    );
  }

  /**
   * Which currency this gateway will actually charge in.
   *
   * The shopper's own currency when the gateway can settle it, otherwise the
   * nearest one it can — the same derivation the checkout page used to show
   * them the figure, so the amount they approved is the amount charged.
   */
  const settlement = settlementCurrency(
    resolveGatewayCurrencies(process.env)[provider],
    currency,
    priceableCurrencies([...books.values()].map((b) => b.prices))
  );

  if (!settlement) {
    return NextResponse.json(
      {
        error: `${label} cannot settle any currency your basket is priced in. Please choose another payment method.`,
      },
      { status: 400 }
    );
  }

  const { items, total, missing } = priceLines(cart, books, settlement);

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
  if (!items.length || total <= 0) {
    return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
  }

  // Below the gateway's floor the payment link is refused outright, so catch it
  // here with an explanation rather than bouncing the buyer off a gateway error
  // page. Reachable when a book carries a manually pinned price under the
  // minimum — converted prices are already floored at it.
  const min = CURRENCIES[settlement].min;
  if (total < min) {
    return NextResponse.json(
      {
        error: `The smallest order ${label} can process is ${CURRENCIES[settlement].symbol}${min} ${settlement}. Please add another book, or choose another payment method.`,
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
        currency: settlement,
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

    if (provider === "paystack") {
      const link = await initializeTransaction({
        reference: ref,
        amount: total,
        currency: settlement,
        email,
        // Paystack appends ?reference= &trxref= to this.
        callbackUrl: `${SITE_URL}/books/thank-you/`,
        metadata: {
          kind: "books",
          name,
          custom_fields: items.map((i) => ({
            display_name: i.title,
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
        {
          error: `${label} could not start this payment: ${
            (err as Error).message
          }`,
        },
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
