import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Check, Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  formatAmount,
  getDonation,
  settleDonation,
  type DonationDoc,
} from "@/lib/donations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thank you for your gift — VOGIM Prayer Land",
  description: "Confirmation of your gift to VOGIM Deliverance Ministries.",
  // A transactional receipt page — keep it out of the index.
  robots: { index: false, follow: false },
};

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type View = {
  tone: "success" | "pending" | "error";
  /** Rendered as `lead` + a gold italic `accent`. */
  heading: { lead: string; accent: string };
  message: string;
  donation: DonationDoc | null;
};

/**
 * Flutterwave returns the donor here with ?status=&tx_ref=&transaction_id=.
 * The query string is *not* trusted — the gift is confirmed by verifying the
 * transaction id against Flutterwave's API (see settleDonation).
 */
async function resolve(sp: Search): Promise<View> {
  const status = one(sp.status).toLowerCase();
  const txRef = one(sp.tx_ref);
  const transactionId = one(sp.transaction_id);

  if (transactionId) {
    try {
      const result = await settleDonation(transactionId, "redirect");
      if (result.outcome === "successful" || result.outcome === "already_settled") {
        return {
          tone: "success",
          heading: { lead: "Your gift has been", accent: "received." },
          message:
            "Thank you for sowing into the work of this ministry. A confirmation has been sent to your email, and our team is standing with you in prayer.",
          donation: result.donation,
        };
      }
      if (result.outcome === "mismatch") {
        return {
          tone: "pending",
          heading: { lead: "We are checking", accent: "your gift." },
          message:
            "Your payment went through, but the details did not match our record exactly. Our team has been alerted and will confirm it with you personally — please keep your reference below.",
          donation: result.donation,
        };
      }
      if (result.outcome === "failed") {
        return {
          tone: "error",
          heading: { lead: "The payment did", accent: "not go through." },
          message:
            "No money has left your account. You are welcome to try again, or reach us directly if the problem continues.",
          donation: result.donation,
        };
      }
      return {
        tone: "pending",
        heading: { lead: "We could not", accent: "confirm this yet." },
        message:
          "We could not match this transaction to a gift on our side. If your account has been debited, please contact us with the reference below and we will resolve it.",
        donation: null,
      };
    } catch (err) {
      console.error("[give/thank-you] verification failed:", err);
      const donation = txRef ? await getDonation(txRef).catch(() => null) : null;
      return {
        tone: "pending",
        heading: { lead: "Your gift is", accent: "being confirmed." },
        message:
          "We could not reach the payment provider to confirm this right now. If your account was debited, the gift will still be recorded — our team checks every transaction. Please keep your reference below.",
        donation,
      };
    }
  }

  // No transaction id — the donor cancelled or closed the checkout.
  const donation = txRef ? await getDonation(txRef).catch(() => null) : null;
  if (donation?.status === "successful") {
    return {
      tone: "success",
      heading: { lead: "Your gift has been", accent: "received." },
      message:
        "Thank you for sowing into the work of this ministry. Our team is standing with you in prayer.",
      donation,
    };
  }
  return {
    tone: "error",
    heading:
      status === "cancelled"
        ? { lead: "Your gift was", accent: "cancelled." }
        : { lead: "Nothing was", accent: "charged." },
    message:
      "No payment was taken. Whenever you are ready, the giving page is open — and you are welcome here whether you give or not.",
    donation,
  };
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const view = await resolve(await searchParams);
  const d = view.donation;

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
      <PageHeader
        eyebrow="Online Giving"
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
          <div className="border border-midnight/15 bg-ivory p-8 sm:p-10">
            <div
              className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center border ${accent}`}
            >
              <Icon size={26} />
            </div>

            {d ? (
              <dl className="divide-y divide-midnight/10">
                <div className="flex justify-between gap-6 py-3">
                  <dt className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">
                    Gift
                  </dt>
                  <dd className="font-display text-2xl text-midnight">
                    {formatAmount(d.amount, d.currency)}{" "}
                    <span className="text-sm text-midnight/50">{d.currency}</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-6 py-3">
                  <dt className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">
                    Directed to
                  </dt>
                  <dd className="text-midnight text-right">{d.fund}</dd>
                </div>
                <div className="flex justify-between gap-6 py-3">
                  <dt className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">
                    Reference
                  </dt>
                  <dd className="text-midnight/80 text-right text-xs break-all font-mono">
                    {d._id}
                  </dd>
                </div>
                <div className="flex justify-between gap-6 py-3">
                  <dt className="text-[11px] tracking-[0.28em] uppercase text-midnight/50">
                    Status
                  </dt>
                  <dd className="text-midnight capitalize">{d.status}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-center text-midnight/70">
                No transaction details are available for this page.
              </p>
            )}

            {view.tone === "success" && (
              <p className="mt-8 text-center font-display italic text-xl text-midnight/80">
                &ldquo;God loveth a cheerful giver.&rdquo;
                <span className="block mt-2 text-[11px] not-italic tracking-[0.32em] uppercase text-gold-deep">
                  2 Corinthians 9:7
                </span>
              </p>
            )}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {view.tone === "success" ? (
              <>
                <Link href="/prayer-request/" className="btn-gold justify-center">
                  Send a prayer request <ArrowUpRight size={16} />
                </Link>
                <Link
                  href="/"
                  className="btn-ghost text-midnight border-midnight/30 justify-center"
                >
                  Back to home
                </Link>
              </>
            ) : (
              <>
                <Link href="/give/" className="btn-gold justify-center">
                  Try again <ArrowUpRight size={16} />
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
            Questions about a gift? See our{" "}
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
