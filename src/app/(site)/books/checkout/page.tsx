import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { isFlutterwaveConfigured, isTestMode } from "@/lib/flutterwave";
import { isPaypalConfigured, isPaypalSandbox } from "@/lib/paypal";
import { isPaystackConfigured, isPaystackTestMode } from "@/lib/paystack";
import { resolveGatewayCurrencies, type Provider } from "@/lib/gateways";
import { getShopCatalogue } from "@/lib/shop-catalogue";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout — VOGIM Prayer Land",
  description: "Complete your book order from VOGIM Prayer Land.",
  robots: { index: false, follow: false },
};

// Which gateways are configured is read from the server environment at request
// time — prerendering would bake today's answer into the page for good.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Which gateways can take money, and which are pointed at a sandbox. Read
  // per request so adding credentials needs a restart, not a rebuild.
  const configured: Record<Provider, boolean> = {
    flutterwave: isFlutterwaveConfigured(),
    paystack: isPaystackConfigured(),
    paypal: isPaypalConfigured(),
  };
  const sandbox: Record<Provider, boolean> = {
    flutterwave: isTestMode(),
    paystack: isPaystackTestMode(),
    paypal: isPaypalSandbox(),
  };

  // Current prices for whatever is sitting in the visitor's basket, so the
  // total they approve is the total the server will charge.
  const { live } = await getShopCatalogue();

  // What each gateway can settle on THIS account. Narrowed per deployment by
  // e.g. PAYSTACK_CURRENCIES=NGN, and passed down so the buyer is shown exactly
  // the currency the server will charge in.
  const gatewayCurrencies = resolveGatewayCurrencies(process.env);

  if (!Object.values(configured).some(Boolean)) {
    // Loud, because the symptom is quiet: the checkout renders but no method
    // can be chosen. Check FLW_SECRET_KEY / PAYSTACK_SECRET_KEY /
    // PAYPAL_CLIENT_ID + PAYPAL_SECRET are set on the server, then restart.
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
              live={live}
              configured={configured}
              sandbox={sandbox}
              gatewayCurrencies={gatewayCurrencies}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
}
