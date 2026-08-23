import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Download, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { BookCard } from "@/components/shop/BookCard";
import { CurrencyPicker } from "@/components/shop/CurrencyPicker";
import { currenciesFor, listPublishedBooks } from "@/lib/books";
import type { CurrencyCode } from "@/lib/flutterwave";

export const metadata: Metadata = {
  title: "Books — VOGIM Prayer Land",
  description:
    "Books by the ministry of VOGIM Prayer Land, delivered as PDFs you can download the moment your payment clears.",
};

export const revalidate = 300;

const HOW_IT_WORKS = [
  {
    icon: BookOpen,
    title: "Choose your books",
    body: "Every title is a PDF you can read on a phone, a tablet or a computer — no app, no reader account.",
  },
  {
    icon: ShieldCheck,
    title: "Pay securely",
    body: "Card, bank transfer and mobile money through Flutterwave, or pay with your PayPal balance. Your details never touch this site.",
  },
  {
    icon: Download,
    title: "Download at once",
    body: "Your links appear the moment payment clears, and are emailed to you as well. Lost them? They can be re-issued any time.",
  },
];

export default async function BooksPage() {
  const books = await listPublishedBooks();

  // Only offer currencies something is actually priced in, so the picker can
  // never leave the whole shop reading "not sold in this currency".
  const available = [
    ...new Set(books.flatMap(currenciesFor)),
  ] as CurrencyCode[];

  return (
    <>
      <PageHeader
        eyebrow="The Bookshop"
        title={
          <>
            Words that carry the <span className="italic text-gold">anointing</span>
          </>
        }
        intro="Teaching from the altar of VOGIM Deliverance Ministries, set down in writing so you can return to it again and again. Every title is delivered as a PDF, straight after payment."
        scripture={{
          ref: "Habakkuk 2:2",
          text: "Write the vision, and make it plain upon tables, that he may run that readeth it.",
        }}
        image="https://img.vogimprayerland.org/1780648526688-worship.jpg"
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-24">
          {books.length > 0 ? (
            <>
              <Reveal>
                <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
                  <div>
                    <p className="eyebrow text-gold-deep">
                      <span className="gold-rule mr-3" />
                      Available now
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl text-midnight mt-4 leading-tight">
                      {books.length} {books.length === 1 ? "title" : "titles"} in the
                      library
                    </h2>
                  </div>
                  <CurrencyPicker available={available} />
                </div>
              </Reveal>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7">
                {books.map((book, i) => (
                  // Stagger only across the first row — beyond that the delay
                  // outlasts the scroll and cards arrive visibly late.
                  <Reveal key={book.id} delay={Math.min(i, 3) * 0.07}>
                    <BookCard book={book} />
                  </Reveal>
                ))}
              </div>
            </>
          ) : (
            <Reveal>
              <div className="border border-midnight/15 bg-white px-8 py-16 text-center">
                <BookOpen className="mx-auto text-gold-deep" size={34} />
                <h2 className="font-display text-3xl text-midnight mt-5">
                  The shelves are being filled
                </h2>
                <p className="mt-4 text-midnight/70 max-w-md mx-auto leading-relaxed">
                  There are no titles published just yet. Come back shortly — or
                  write to us and we will tell you the moment the first one lands.
                </p>
                <Link href="/contact/" className="btn-gold mt-8">
                  Contact the ministry <ArrowUpRight size={16} />
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-t border-midnight/10">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-20">
          <div className="grid sm:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={i * 0.08}>
                  <Icon className="text-gold-deep" size={24} />
                  <h3 className="font-display text-xl text-midnight mt-4">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-midnight/70 leading-relaxed">
                    {step.body}
                  </p>
                </Reveal>
              );
            })}
          </div>

          <p className="mt-12 text-center text-xs text-midnight/50">
            Already bought something and lost the link?{" "}
            <Link href="/books/library/" className="text-gold-deep u-link">
              Retrieve your downloads
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
