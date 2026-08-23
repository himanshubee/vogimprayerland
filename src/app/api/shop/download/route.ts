import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { verifyDownloadToken } from "@/lib/book-tokens";
import { getOrder, recordDownload } from "@/lib/book-orders";
import { openPdf } from "@/lib/books";

export const dynamic = "force-dynamic";

/**
 * The only way a book PDF ever leaves the server.
 *
 * A valid signature is necessary but not sufficient: the order it names is
 * re-read from the database and must still be `paid`, and the book must
 * actually be one of the lines on that order. So a refunded order stops
 * working immediately, and a token minted for one book cannot be pointed at
 * another by editing the URL — the signature covers the book id.
 */

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!token) return fail("This download link is incomplete.", 400);

  const result = verifyDownloadToken(token);
  if (!result.ok) {
    if (result.reason === "expired") {
      return fail(
        "This download link has expired. Please request a fresh one from the Books library page.",
        410
      );
    }
    return fail("This download link is not valid.", 403);
  }

  const { orderId, bookId } = result.payload;

  // A database blip must not read as "your link is bad" — the customer would
  // reasonably conclude they had lost the book they paid for.
  let order;
  try {
    order = await getOrder(orderId);
  } catch (err) {
    console.error("[shop/download] could not load order:", err);
    return fail(
      "We could not reach our records just now. Please try this link again in a moment — it is still valid.",
      503
    );
  }
  if (!order) return fail("We could not find that order.", 404);

  if (order.status !== "paid") {
    return fail(
      "This order has not been completed, so the download is not available yet.",
      403
    );
  }

  // The signature proves we minted the token; this proves the book was on the
  // order at the time it was paid for.
  if (!order.items.some((item) => item.bookId === bookId)) {
    return fail("That book is not part of this order.", 403);
  }

  let pdf;
  try {
    pdf = await openPdf(bookId);
  } catch (err) {
    console.error("[shop/download] could not open PDF:", err);
    return fail(
      "We could not reach the file store just now. Please try this link again in a moment — it is still valid.",
      503
    );
  }
  if (!pdf) {
    console.error(
      `[shop/download] order ${orderId} is paid but book ${bookId} has no PDF.`
    );
    return fail(
      "This book's file is temporarily unavailable. Please contact us and we will send it to you directly.",
      404
    );
  }

  // Bookkeeping only — never a limit. A buyer who loses a file must not find
  // themselves locked out of what they paid for.
  recordDownload(orderId).catch((err) =>
    console.error("[shop/download] could not record download:", err)
  );

  // Node's Readable → the Web stream the Response constructor wants. Streaming
  // rather than buffering keeps a large book off the server's heap.
  const stream = Readable.toWeb(pdf.stream) as unknown as ReadableStream;
  const safeName = pdf.filename.replace(/["\\\r\n]/g, "").slice(0, 150) || "book.pdf";

  const headers = new Headers({
    "Content-Type": pdf.contentType || "application/pdf",
    "Content-Disposition": `attachment; filename="${safeName}"`,
    // A paid file must never sit in a shared cache.
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  });
  if (pdf.length > 0) headers.set("Content-Length", String(pdf.length));

  return new NextResponse(stream, { headers });
}
