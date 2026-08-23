import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Download, FileText, Lock } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { AddToCart } from "@/components/shop/AddToCart";
import { BookPrice } from "@/components/shop/BookPrice";
import { BookCard } from "@/components/shop/BookCard";
import { CurrencyPicker } from "@/components/shop/CurrencyPicker";
import { currenciesFor, getBookBySlug, listPublishedBooks } from "@/lib/books";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: "Book not found — VOGIM Prayer Land" };

  const description =
    book.subtitle ||
    book.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) ||
    `${book.title} — a book from VOGIM Prayer Land.`;

  return {
    title: `${book.title} — VOGIM Prayer Land`,
    description,
    openGraph: {
      type: "article",
      title: book.title,
      description,
      images: book.coverImage ? [{ url: book.coverImage }] : undefined,
    },
  };
}

export default async function BookPage({ params }: Params) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const all = await listPublishedBooks();
  const more = all.filter((b) => b.id !== book.id).slice(0, 4);
  const available = currenciesFor(book);

  return (
    <>
      <section className="bg-midnight text-white relative overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 py-12 sm:py-20">
          <Link
            href="/books/"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.24em] uppercase text-gold/80 hover:text-gold transition-colors"
          >
            <ArrowLeft size={14} /> All books
          </Link>

          <div className="mt-8 grid md:grid-cols-[minmax(0,320px)_1fr] gap-10 lg:gap-16 items-start">
            {/* COVER */}
            <div className="relative aspect-[3/4] w-full max-w-[320px] mx-auto md:mx-0 shadow-2xl shadow-black/40">
              {book.coverImage ? (
                <Image
                  src={book.coverImage}
                  alt={`Cover of ${book.title}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 80vw, 320px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 border border-gold/30 bg-maroon p-8 text-center">
                  <BookOpen size={38} className="text-gold" />
                  <span className="font-display text-2xl leading-tight text-gold">
                    {book.title}
                  </span>
                </div>
              )}
            </div>

            {/* DETAILS */}
            <div>
              {book.category && (
                <p className="eyebrow text-gold">
                  <span className="gold-rule mr-3" />
                  {book.category}
                </p>
              )}

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mt-4">
                {book.title}
              </h1>

              {book.subtitle && (
                <p className="mt-4 font-display italic text-xl sm:text-2xl text-gold-soft leading-snug">
                  {book.subtitle}
                </p>
              )}

              {book.author && (
                <p className="mt-5 text-[11px] tracking-[0.28em] uppercase text-white/60">
                  By {book.author}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/65">
                <span className="inline-flex items-center gap-2">
                  <FileText size={14} className="text-gold" /> PDF download
                </span>
                {book.pages > 0 && (
                  <span className="inline-flex items-center gap-2">
                    <BookOpen size={14} className="text-gold" /> {book.pages} pages
                  </span>
                )}
                <span className="inline-flex items-center gap-2">
                  <Download size={14} className="text-gold" /> Instant delivery
                </span>
              </div>

              <div className="mt-9 border-t border-white/15 pt-8">
                <p className="font-display text-4xl sm:text-5xl text-gold">
                  <BookPrice prices={book.prices} />
                </p>

                <div className="mt-7 max-w-xs">
                  <AddToCart book={book} />
                </div>

                {available.length > 1 && (
                  <CurrencyPicker
                    available={available}
                    className="mt-7 [&>span]:text-white/45 [&>button]:text-white/70 [&>button]:border-white/25"
                  />
                )}

                <p className="mt-7 flex items-center gap-2 text-xs text-white/50">
                  <Lock size={13} className="text-gold shrink-0" />
                  Secure checkout by card, transfer or PayPal. Your download link is
                  private to your order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESCRIPTION */}
      {book.description && (
        <section className="bg-ivory paper-grain">
          <div className="mx-auto max-w-3xl px-5 sm:px-6 py-16 sm:py-20">
            <Reveal>
              <p className="eyebrow text-gold-deep">
                <span className="gold-rule mr-3" />
                About this book
              </p>
              <div
                className="post-content mt-7"
                dangerouslySetInnerHTML={{ __html: book.description }}
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* MORE BOOKS */}
      {more.length > 0 && (
        <section className="bg-white border-t border-midnight/10">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-20">
            <Reveal>
              <h2 className="font-display text-3xl text-midnight leading-tight">
                More from the library
              </h2>
            </Reveal>
            <div className="mt-9 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7">
              {more.map((b, i) => (
                <Reveal key={b.id} delay={Math.min(i, 3) * 0.07}>
                  <BookCard book={b} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
