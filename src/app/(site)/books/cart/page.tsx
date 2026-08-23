import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { currenciesFor, listPublishedBooks } from "@/lib/books";
import type { CurrencyCode } from "@/lib/flutterwave";
import { CartClient } from "./CartClient";

export const metadata: Metadata = {
  title: "Your basket — VOGIM Prayer Land",
  description: "The books you have chosen from the VOGIM Prayer Land library.",
  robots: { index: false, follow: true },
};

export const revalidate = 300;

export default async function CartPage() {
  // The basket itself lives in the browser; the server's only job here is to
  // say which currencies the catalogue can actually be priced in.
  const books = await listPublishedBooks();
  const available = [...new Set(books.flatMap(currenciesFor))] as CurrencyCode[];

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
          <CartClient available={available} />
        </div>
      </section>
    </>
  );
}
