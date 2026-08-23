import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock,
  Download,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { formatPrice } from "@/lib/books";
import { TOKEN_TTL_DAYS } from "@/lib/book-tokens";
import {
  getOrder,
  getOrderByPaypalId,
  linksFor,
  settleFlutterwaveOrder,
  settlePaypalOrder,
  type BookOrderDoc,
} from "@/lib/book-orders";
import { ClearCart } from "./ClearCart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your books — VOGIM Prayer Land",
  description: "Your download links from VOGIM Prayer Land.",
  // A transactional receipt page carrying private links — keep it out of the index.
  robots: { index: false, follow: false },
};

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type View = {
  tone: "success" | "pending" | "error";
  /** Rendered as `lead` + a gold italic `accent`. */
  heading: { lead: string; accent: string };
  message: string;
  order: BookOrderDoc | null;
};

const PAID: Pick<View, "tone" | "heading"> = {
  tone: "success",
  heading: { lead: "Your books are", accent: "ready." },
};

/**
 * Both gateways land here, and neither query string is trusted.
 *
 * Flutterwave returns ?status=&tx_ref=&transaction_id=; PayPal returns
 * ?token=<order id>&PayerID=… plus the ?ref= we put on the return URL. In
 * either case the payment is confirmed by re-verifying with the gateway
 * (see settle*Order) before a single download link is rendered.
 */
async function resolve(sp: Search): Promise<View> {
  const status = one(sp.status).toLowerCase();
  const ref = one(sp.ref) || one(sp.tx_ref);

  // ── PayPal ────────────────────────────────────────────────────────────
  // "token" is PayPal's order id on the return URL. PayerID is only present
  // once the buyer actually approved.
  const paypalOrderId = one(sp.token);
  if (paypalOrderId) {
    try {
      const result = await settlePaypalOrder(paypalOrderId, "redirect", ref || undefined);
      if (result.outcome === "paid" || result.outcome === "already_settled") {
        return { ...PAID, message: successMessage(result.order), order: result.order };
      }
      if (result.outcome === "mismatch") return checking(result.order);
      if (result.outcome === "failed") return notCompleted(result.order);
      return unmatched(await lookup(ref, paypalOrderId));
    } catch (err) {
      console.error("[books/thank-you] paypal settle failed:", err);
      return confirming(await lookup(ref, paypalOrderId));
    }
  }

  // ── Flutterwave ───────────────────────────────────────────────────────
  const transactionId = one(sp.transaction_id);
  if (transactionId) {
    try {
      const result = await settleFlutterwaveOrder(transactionId, "redirect");
      if (result.outcome === "paid" || result.outcome === "already_settled") {
        return { ...PAID, message: successMessage(result.order), order: result.order };
      }
      if (result.outcome === "mismatch") return checking(result.order);
      if (result.outcome === "failed") return notCompleted(result.order);
      return unmatched(null);
    } catch (err) {
      console.error("[books/thank-you] flutterwave settle failed:", err);
      return confirming(ref ? await getOrder(ref).catch(() => null) : null);
    }
  }

  // ── No gateway callback at all ────────────────────────────────────────
  // The buyer cancelled, closed the checkout, or reopened this page later.
  const order = ref ? await getOrder(ref).catch(() => null) : null;
  if (order?.status === "paid") {
    return { ...PAID, message: successMessage(order), order };
  }
  return {
    tone: "error",
    heading:
      status === "cancelled"
        ? { lead: "Your order was", accent: "cancelled." }
        : { lead: "Nothing was", accent: "charged." },
    message:
      "No payment was taken and your basket is exactly as you left it. Whenever you are ready, the bookshop is open.",
    order,
  };
}

async function lookup(ref: string, paypalOrderId: string) {
  const byRef = ref ? await getOrder(ref).catch(() => null) : null;
  return byRef ?? (await getOrderByPaypalId(paypalOrderId).catch(() => null));
}

const successMessage = (o: BookOrderDoc) =>
  `Thank you, ${o.name || "friend"}. Your download links are below and have been sent to ${o.email} as well.`;

const checking = (order: BookOrderDoc | null): View => ({
  tone: "pending",
  heading: { lead: "We are checking", accent: "your order." },
  message:
    "Your payment went through, but the details did not match our record exactly. Our team has been alerted and will send your books personally — please keep your reference below.",
  order,
});

const notCompleted = (order: BookOrderDoc | null): View => ({
  tone: "error",
  heading: { lead: "The payment did", accent: "not go through." },
  message:
    "No money has left your account and your basket is untouched. You are welcome to try again, or reach us directly if the problem continues.",
  order,
});

const unmatched = (order: BookOrderDoc | null): View => ({
  tone: "pending",
  heading: { lead: "We could not", accent: "confirm this yet." },
  message:
    "We could not match this payment to an order on our side. If your account has been debited, please contact us with the reference below and we will send your books at once.",
  order,
});

const confirming = (order: BookOrderDoc | null): View => ({
  tone: "pending",
  heading: { lead: "Your order is", accent: "being confirmed." },
  message:
    "We could not reach the payment provider to confirm this right now. If your account was debited, the order will still be recorded — our team checks every transaction, and your links will be emailed as soon as it clears.",
  order,
});

export default async function BooksThankYouPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const view = await resolve(await searchParams);
  const order = view.order;
  const paid = order?.status === "paid";
  // Links are minted per page view, so a returning buyer always gets a token
  // with a fresh clock rather than one that expired in their inbox.
  const links = paid && order ? linksFor(order) : [];

  const Icon =
    view.tone === "success" ? Check : view.tone === "pending" ? Clock : AlertTriangle;
  const accent =
    view.tone === "success"
      ? "border-gold text-gold"
      : view.tone === "pending"
        ? "border-gold-deep text-gold-deep"
        : "border-midnight-soft text-midnight-soft";

  return (
    <>
      {/* Only a settled order empties the basket. */}
      {paid && <ClearCart />}

      <PageHeader
        eyebrow="The Bookshop"
        title={
          <>
            {view.heading.lead}{" "}
            <span className="italic text-gold">{view.heading.accent}</span>
          </>
        }
        intro={view.message}
        image="https://img.vogimprayerland.org/1780648526688-worship.jpg"
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-16 sm:py-24">
          {/* DOWNLOADS */}
          {paid && links.length > 0 && (
            <div className="border border-gold bg-white p-7 sm:p-9 mb-10">
              <p className="eyebrow text-gold-deep">
                <span className="gold-rule mr-3" />
                Your downloads
              </p>
              <h2 className="font-display text-3xl text-midnight mt-4 leading-tight">
                {links.length === 1 ? "Your book" : `All ${links.length} books`}
              </h2>

              <ul className="mt-7 divide-y divide-midnight/10">
                {links.map((link) => (
                  <li
                    key={link.url}
                    className="flex flex-wrap items-center justify-between gap-4 py-4"
                  >
                    <span className="font-display text-xl text-midnight">
                      {link.title}
                    </span>
                    <a
                      href={link.url}
                      className="btn-gold !py-2.5 !px-5 !text-[11px]"
                      // A same-origin streamed attachment; no prefetch, no referrer.
                      rel="nofollow noreferrer"
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  </li>
                ))}
              </ul>

              <p className="mt-7 flex items-start gap-2.5 text-xs text-midnight/55 leading-relaxed">
                <Mail size={14} className="text-gold-deep shrink-0 mt-0.5" />
                <span>
                  These links also went to <strong>{order.email}</strong> and stay
                  active for {TOKEN_TTL_DAYS} days. If one expires you can always{" "}
                  <Link href="/books/library/" className="text-gold-deep u-link">
                    retrieve fresh links
                  </Link>{" "}
                  with your email and the reference below.
                </span>
              </p>
            </div>
          )}

          {/* RECEIPT */}
          <div className="border border-midnight/15 bg-white p-8 sm:p-10">
            <div
              className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center border ${accent}`}
            >
              <Icon size={26} />
            </div>

            {order ? (
              <>
                <ul className="divide-y divide-midnight/10 border-b border-midnight/10 pb-1 mb-1">
                  {order.items.map((item) => (
                    <li
                      key={item.bookId}
                      className="flex justify-between gap-6 py-3 text-sm"
                    >
                      <span className="text-midnight">
                        {item.title}
                        {item.quantity > 1 && (
                          <span className="text-midnight/45"> × {item.quantity}</span>
                        )}
                      </span>
                      <span className="text-midnight/70 tabular-nums shrink-0">
                        {formatPrice(item.unitPrice * item.quantity, order.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="divide-y divide-midnight/10">
                  <div className="flex justify-between gap-6 py-3">
                    <dt className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">
                      Total
                    </dt>
                    <dd className="font-display text-2xl text-midnight">
                      {formatPrice(order.total, order.currency)}{" "}
                      <span className="text-sm text-midnight/50">
                        {order.currency}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-6 py-3">
                    <dt className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">
                      Paid with
                    </dt>
                    <dd className="text-midnight text-right">
                      {order.provider === "paypal" ? "PayPal" : "Card / bank"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-6 py-3">
                    <dt className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">
                      Reference
                    </dt>
                    <dd className="text-midnight/80 text-right text-xs break-all font-mono">
                      {order._id}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-6 py-3">
                    <dt className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">
                      Status
                    </dt>
                    <dd className="text-midnight capitalize">{order.status}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-center text-midnight/70">
                No order details are available for this page.
              </p>
            )}

            {view.tone === "success" && (
              <p className="mt-8 text-center font-display italic text-xl text-midnight/80">
                &ldquo;Write the vision, and make it plain.&rdquo;
                <span className="block mt-2 text-[11px] not-italic tracking-[0.32em] uppercase text-gold-deep">
                  Habakkuk 2:2
                </span>
              </p>
            )}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {view.tone === "success" ? (
              <>
                <Link href="/books/" className="btn-gold justify-center">
                  Browse more books <ArrowUpRight size={16} />
                </Link>
                <Link
                  href="/prayer-request/"
                  className="btn-ghost text-midnight border-midnight/30 justify-center"
                >
                  Send a prayer request
                </Link>
              </>
            ) : (
              <>
                <Link href="/books/cart/" className="btn-gold justify-center">
                  Back to your basket <ArrowUpRight size={16} />
                </Link>
                <Link
                  href="/contact/"
                  className="btn-ghost text-midnight border-midnight/30 justify-center"
                >
                  Contact the ministry
                </Link>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-midnight/50">
            Questions about an order? See our{" "}
            <Link href="/refund-policy/" className="text-gold-deep u-link">
              refund policy
            </Link>{" "}
            or write to us — we answer every message personally.
          </p>
        </div>
      </section>
    </>
  );
}
