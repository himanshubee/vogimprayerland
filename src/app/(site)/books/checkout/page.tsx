import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { isFlutterwaveConfigured, isTestMode } from "@/lib/flutterwave";
import { isPaypalConfigured, isPaypalSandbox } from "@/lib/paypal";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout — VOGIM Prayer Land",
  description: "Complete your book order from VOGIM Prayer Land.",
  robots: { index: false, follow: false },
};

// Which gateways are configured is read from the server environment at request
// time — prerendering would bake today's answer into the page for good.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const flutterwaveEnabled = isFlutterwaveConfigured();
  const paypalEnabled = isPaypalConfigured();

  if (!flutterwaveEnabled && !paypalEnabled) {
    // Loud, because the symptom is quiet: the checkout renders but no method
    // can be chosen. Check FLW_SECRET_KEY / PAYPAL_CLIENT_ID + PAYPAL_SECRET
    // are set on the server, then restart.
    console.error(
      "[shop/checkout] No payment gateway is configured — the bookshop cannot take orders."
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="The Bookshop"
        title={
          <>
            Complete your <span className="italic text-gold">order</span>
          </>
        }
        intro="One more step. Your books are delivered as PDFs the moment payment clears."
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-16 sm:py-24">
          {/* useSearchParams (for PayPal's ?cancelled=1) must sit under a
              Suspense boundary. */}
          <Suspense
            fallback={
              <div className="min-h-[240px] flex items-center justify-center">
                <p className="text-midnight/40 text-sm">Loading checkout…</p>
              </div>
            }
          >
            <CheckoutClient
              flutterwaveEnabled={flutterwaveEnabled}
              paypalEnabled={paypalEnabled}
              testMode={isTestMode()}
              paypalSandbox={isPaypalSandbox()}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
}
