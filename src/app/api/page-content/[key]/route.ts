import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getPageContent, updatePageContent, getSchema } from "@/lib/page-content";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ key: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { key } = await ctx.params;
  if (!getSchema(key)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ values: await getPageContent(key) });
}

// PUT — save edits to the live page and revalidate it.
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ key: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { key } = await ctx.params;
  const schema = getSchema(key);
  if (!schema) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const values = await updatePageContent(key, body.values ?? body);
    revalidatePath(schema.path);
    revalidatePath("/sitemap.xml"); // keep lastModified fresh for search engines
    return NextResponse.json({ ok: true, values });
  } catch (err) {
    console.error("[page-content] save error:", err);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}
