import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { getShopCatalogue } from "@/lib/shop-catalogue";
import { CartClient } from "./CartClient";

export const metadata: Metadata = {
  title: "Your basket — VOGIM Prayer Land",
  description: "The books you have chosen from the VOGIM Prayer Land library.",
  robots: { index: false, follow: true },
};

export const revalidate = 300;

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
