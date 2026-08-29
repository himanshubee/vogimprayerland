import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteMerch, getMerchById, updateMerch } from "@/lib/merch";
import { revalidateStore } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const item = await getMerchById(id).catch(() => null);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  if (!body.title || !String(body.title).trim()) {
    return NextResponse.json({ error: "A title is required" }, { status: 400 });
  }

  try {
    // The old slug's page must be refreshed too, or it keeps serving the
    // design under a URL that no longer exists.
    const before = await getMerchById(id);
    const item = await updateMerch(id, body);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidateStore(item.slug);
    if (before && before.slug !== item.slug) revalidateStore(before.slug);
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    console.error("[store] update error:", err);
    return NextResponse.json({ error: "Could not save the design" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const before = await getMerchById(id);
    const ok = await deleteMerch(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidateStore(before?.slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[store] delete error:", err);
    return NextResponse.json({ error: "Could not delete the design" }, { status: 500 });
  }
}
