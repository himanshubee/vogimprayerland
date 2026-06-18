import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getMediaAdmin, createMedia, reorderMedia, seedMedia } from "@/lib/media";

export const dynamic = "force-dynamic";

function revalidateGallery() {
  revalidatePath("/gallery");
  revalidatePath("/media");
}

// GET — admin: real media rows.
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ items: await getMediaAdmin() });
  } catch (err) {
    console.error("[media] list error:", err);
    return NextResponse.json({ error: "Could not load media" }, { status: 500 });
  }
}

// POST — admin: create an item, seed the starter set, or reorder.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  try {
    if (body.action === "seed") {
      const inserted = await seedMedia();
      revalidateGallery();
      return NextResponse.json({ ok: true, inserted });
    }
    if (body.action === "reorder") {
      if (!Array.isArray(body.ids)) {
        return NextResponse.json({ error: "ids required" }, { status: 400 });
      }
      await reorderMedia(body.ids);
      revalidateGallery();
      return NextResponse.json({ ok: true });
    }
    if (!body.src) {
      return NextResponse.json({ error: "Image src is required" }, { status: 400 });
    }
    const item = await createMedia(body);
    revalidateGallery();
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[media] write error:", err);
    return NextResponse.json({ error: "Could not save media" }, { status: 500 });
  }
}
