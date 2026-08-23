"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";
import type { Book } from "@/lib/books-shared";

/**
 * Add-to-basket for one book.
 *
 * Once a book is in the basket the button becomes a link to the basket rather
 * than a way to keep incrementing — for a PDF, a second copy means nothing.
 */
export function AddToCart({
  book,
  size = "default",
}: {
  book: Pick<Book, "id" | "slug" | "title" | "coverImage" | "prices">;
  size?: "default" | "small";
}) {
  const { add, has, ready } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = ready && has(book.id);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(t);
  }, [justAdded]);

  const cls =
    size === "small"
      ? "btn-gold w-full justify-center !px-4 !py-2.5 !text-[11px]"
      : "btn-gold justify-center";

  if (inCart) {
    return (
      <Link href="/books/cart/" className={`${cls} !bg-midnight !text-gold`}>
        {justAdded ? (
          <>
            <Check size={15} /> Added
          </>
        ) : (
          <>
            <ShoppingBag size={15} /> In basket
          </>
        )}
      </Link>
    );
  }

  return (
    <button
      type="button"
      // Before localStorage has been read we cannot know whether this book is
      // already in the basket, so hold the button rather than flash the wrong one.
      disabled={!ready}
      onClick={() => {
        add({
          bookId: book.id,
          slug: book.slug,
          title: book.title,
          coverImage: book.coverImage,
          prices: book.prices,
        });
        setJustAdded(true);
      }}
      className={`${cls} disabled:opacity-50`}
    >
      <ShoppingBag size={15} />
      Add to basket
    </button>
  );
}
