import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AddToCart } from "./AddToCart";
import { BookPrice } from "./BookPrice";
import type { Book } from "@/lib/books-shared";

/** One book in the shop grid. */
export function BookCard({ book }: { book: Book }) {
  return (
    <article className="group flex flex-col border border-midnight/12 bg-white transition-colors hover:border-gold/60">
      <Link
        href={`/books/${book.slug}/`}
        className="relative block aspect-[3/4] overflow-hidden bg-midnight/5"
      >
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          // No cover yet — a titled placeholder reads better than a grey box.
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-midnight text-gold/70 p-6 text-center">
            <BookOpen size={30} />
            <span className="font-display text-lg leading-tight text-gold">
              {book.title}
            </span>
          </div>
        )}
        <span className="absolute top-0 right-0 bg-gold text-midnight text-[10px] tracking-[0.2em] uppercase px-2.5 py-1">
          PDF
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {book.category && (
          <p className="eyebrow text-gold-deep text-[10px] mb-2">{book.category}</p>
        )}

        <h3 className="font-display text-xl leading-tight text-midnight">
          <Link href={`/books/${book.slug}/`} className="hover:text-gold-deep transition-colors">
            {book.title}
          </Link>
        </h3>

        {book.subtitle && (
          <p className="mt-1.5 text-sm text-midnight/60 leading-snug line-clamp-2">
            {book.subtitle}
          </p>
        )}

        {book.author && (
          <p className="mt-2 text-[11px] tracking-[0.18em] uppercase text-midnight/45">
            {book.author}
          </p>
        )}

        {/* mt-auto pins the price and button to the bottom so cards of
            different text lengths still line up across the grid. */}
        <div className="mt-auto pt-5">
          <p className="font-display text-2xl text-midnight mb-4">
            <BookPrice prices={book.prices} />
          </p>
          <AddToCart book={book} size="small" />
        </div>
      </div>
    </article>
  );
}
