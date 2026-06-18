import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getSettings, updateSettings, type SiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// GET — admin only: current settings for the editor.
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

// PUT — admin only: save settings, then refresh the chrome everywhere.
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<SiteSettings>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const settings = await updateSettings(body);
    // Nav + footer + announcement appear on every page → revalidate the whole tree.
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("[settings] save error:", err);
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }
}
