import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { createBook, listBooksAdmin, reorderBooks } from "@/lib/books";
import { refreshRates } from "@/lib/fx";

export const dynamic = "force-dynamic";

/** The shop is cached (ISR) — refresh it whenever the catalogue changes. */
export function revalidateShop(slug?: string) {
  revalidatePath("/books");
  if (slug) revalidatePath(`/books/${slug}`);
}

// GET — admin: the full catalogue, drafts included.
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ items: await listBooksAdmin() });
  } catch (err) {
    console.error("[books] list error:", err);
    return NextResponse.json({ error: "Could not load books" }, { status: 500 });
  }
}

// POST — admin: create a book, or reorder the catalogue.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  try {
    if (body.action === "refresh-rates") {
      const rates = await refreshRates();
      if (!rates) {
        return NextResponse.json(
          {
            error:
              "Could not reach any exchange-rate service. Prices are still being converted from the last rates we hold.",
          },
          { status: 502 }
        );
      }
      // Every price on the site is derived from these — refresh the shop.
      revalidateShop();
      return NextResponse.json({ ok: true, rates });
    }

    if (body.action === "reorder") {
      if (!Array.isArray(body.ids)) {
        return NextResponse.json({ error: "ids required" }, { status: 400 });
      }
      await reorderBooks(body.ids);
      revalidateShop();
      return NextResponse.json({ ok: true });
    }

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const book = await createBook(body);
    revalidateShop(book.slug);
    return NextResponse.json({ ok: true, book }, { status: 201 });
  } catch (err) {
    console.error("[books] write error:", err);
    return NextResponse.json({ error: "Could not save the book" }, { status: 500 });
  }
}
