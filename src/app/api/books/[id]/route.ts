import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteBook, getBookById, updateBook } from "@/lib/books";
import { revalidateShop } from "../route";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const book = await getBookById(id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ book });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  if (!body.title || !String(body.title).trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const previous = await getBookById(id);
  const book = await updateBook(id, body);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidateShop(book.slug);
  // A renamed book leaves its old URL behind — refresh that too, or the stale
  // page keeps serving until its ISR window lapses.
  if (previous && previous.slug !== book.slug) revalidateShop(previous.slug);

  return NextResponse.json({ ok: true, book });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const existing = await getBookById(id);
  const ok = await deleteBook(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidateShop(existing?.slug);
  return NextResponse.json({ ok: true });
}
