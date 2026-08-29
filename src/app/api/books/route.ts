import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { createBook, listBooksAdmin, reorderBooks } from "@/lib/books";
import { refreshRates } from "@/lib/fx";

export const dynamic = "force-dynamic";

/**
 * The shop listing and book pages are cached (ISR) — refresh them whenever the
 * catalogue or the exchange rates change, so an edited price is visible at
 * once instead of after the revalidate window.
 *
 * /cart and /checkout are absent on purpose: both are
 * force-dynamic, because the total a shopper is shown must always match what
 * checkout re-prices from the database.
 */
export function revalidateShop(slug?: string) {
  revalidatePath("/books");
  // Store prices convert from the same rate table.
  revalidatePath("/store");
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
