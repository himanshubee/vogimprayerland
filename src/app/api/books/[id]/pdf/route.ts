import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deletePdf, savePdf } from "@/lib/books";
import { revalidateShop } from "../../route";

export const dynamic = "force-dynamic";

/**
 * Upload the sellable PDF for one book.
 *
 * Unlike cover images — which go to the public S3/CDN service via /api/upload —
 * the PDF is stored in MongoDB (GridFS) precisely so it never acquires a public
 * URL. It leaves only through /api/shop/download, against a signed token tied
 * to a paid order.
 */

const MAX_BYTES = 64 * 1024 * 1024; // 64 MB — comfortably above a long book

/** %PDF — the magic bytes every real PDF starts with. */
function looksLikePdf(buf: Buffer): boolean {
  return buf.length > 4 && buf.subarray(0, 4).toString("latin1") === "%PDF";
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That PDF is larger than 64MB. Please compress it and try again." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Check the bytes, not the filename or the browser-supplied MIME type —
  // both are trivially wrong, and a non-PDF here would be sold as a book.
  if (!looksLikePdf(buffer)) {
    return NextResponse.json(
      { error: "That file is not a PDF." },
      { status: 400 }
    );
  }

  try {
    const book = await savePdf(id, {
      buffer,
      filename: file.name,
      contentType: "application/pdf",
    });
    if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // A book only becomes sellable once it has a file, so the shop listing
    // changes the moment this succeeds.
    revalidateShop(book.slug);
    return NextResponse.json({ ok: true, book });
  } catch (err) {
    console.error("[books/pdf] upload failed:", err);
    return NextResponse.json({ error: "Could not store the PDF" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const book = await deletePdf(id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidateShop(book.slug);
  return NextResponse.json({ ok: true, book });
}
