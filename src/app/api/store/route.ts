import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  createMerch,
  getMerchPricing,
  getMerchTemplates,
  listMerchAdmin,
  reorderMerch,
  updateMerchPricing,
  updateMerchTemplates,
} from "@/lib/merch";
import { revalidateStore } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

// GET — admin: the full catalogue, drafts included, plus store-wide pricing.
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [items, pricing, templates] = await Promise.all([
      listMerchAdmin(),
      getMerchPricing(),
      getMerchTemplates(),
    ]);
    return NextResponse.json({ items, pricing, templates });
  } catch (err) {
    console.error("[store] list error:", err);
    return NextResponse.json({ error: "Could not load the store" }, { status: 500 });
  }
}

// POST — admin: create a design, reorder the catalogue, or save pricing.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  try {
    if (body.action === "reorder") {
      if (!Array.isArray(body.ids)) {
        return NextResponse.json({ error: "ids required" }, { status: 400 });
      }
      await reorderMerch(body.ids);
      revalidateStore();
      return NextResponse.json({ ok: true });
    }

    if (body.action === "templates") {
      const templates = await updateMerchTemplates(body.templates);
      // Every mockup on the store is drawn from these.
      revalidateStore();
      return NextResponse.json({ ok: true, templates });
    }

    if (body.action === "pricing") {
      const pricing = await updateMerchPricing(body.pricing);
      // Every design in a category is priced from this — refresh the lot.
      revalidateStore();
      return NextResponse.json({ ok: true, pricing });
    }

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: "A title is required" }, { status: 400 });
    }

    const item = await createMerch(body);
    revalidateStore(item.slug);
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[store] write error:", err);
    return NextResponse.json({ error: "Could not save the design" }, { status: 500 });
  }
}
