import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { getShopCatalogue } from "@/lib/shop-catalogue";
import { CartClient } from "./CartClient";

export const metadata: Metadata = {
  title: "Your basket — VOGIM Prayer Land",
  description: "The books you have chosen from the VOGIM Prayer Land library.",
  robots: { index: false, follow: true },
};

/**
 * Never cached.
 *
 * This page's only server-side job is to hand the basket the current prices,
 * and the basket's total has to match what checkout (which is force-dynamic
 * and re-prices from the database) will actually charge. An ISR window here —
 * even a short one — means a price edit or an exchange-rate refresh can show a
 * shopper one total and bill them another. It is a low-traffic, per-visitor,
 * noindex page, so caching it buys nothing worth that risk.
 */
export const dynamic = "force-dynamic";

export default async function CartPage() {
  // The basket itself lives in the browser; the server's job is to hand down
  // current prices so an old basket is never priced from a stale snapshot.
  const { live, currencies } = await getShopCatalogue();

  return (
    <>
      <PageHeader
        eyebrow="The Bookshop"
        title={
          <>
            Your <span className="italic text-gold">basket</span>
          </>
        }
        intro="Review your books before checkout. Everything here is a PDF, delivered the moment your payment clears."
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-16 sm:py-24">
          <CartClient live={live} available={currencies} />
        </div>
      </section>
    </>
  );
}
