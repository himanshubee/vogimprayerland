import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { updateMedia, deleteMedia } from "@/lib/media";

export const dynamic = "force-dynamic";

function revalidateGallery() {
  revalidatePath("/gallery");
  revalidatePath("/media");
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const item = await updateMedia(id, body);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidateGallery();
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await deleteMedia(id);
  if (ok) revalidateGallery();
  return NextResponse.json({ ok });
}
