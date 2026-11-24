import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { runAutoblog } from "@/lib/autoblog/run";
import { dryRun, improvePost, BUILT_IN_TOPICS, topicFromText } from "@/lib/autoblog/generate";
import { getAutoblogSettings, listRuns, saveAutoblogSettings } from "@/lib/autoblog/settings";
import { openrouterConfigured } from "@/lib/autoblog/openrouter";

export const dynamic = "force-dynamic";
// Writing an article and its image takes one to three minutes.
export const maxDuration = 600;

/** The server cron calls POST daily with `Authorization: Bearer $AUTOBLOG_TOKEN`. */
function schedulerAllowed(req: NextRequest) {
  const token = process.env.AUTOBLOG_TOKEN || "";
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return token.length >= 24 && given.length === token.length && timingSafeEqual(Buffer.from(given), Buffer.from(token));
}

export async function GET() {
  if (!(await requireRole("admin"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [settings, runs] = await Promise.all([getAutoblogSettings(), listRuns()]);
    return NextResponse.json({ settings, runs, configured: openrouterConfigured(), builtInTopics: BUILT_IN_TOPICS.length });
  } catch {
    return NextResponse.json({ error: "Could not load auto-blog settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await requireRole("admin"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  try {
    return NextResponse.json({ settings: await saveAutoblogSettings(body) });
  } catch {
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }
}

/**
 * Run the auto-blog.
 *   {}                    scheduled tick: writes only if enabled and due
 *   { force: true }       write now (admin button)
 *   { dryRun: "topic" }   write one article and return it, saving nothing
 *   { improvePostId }     add an image and fix the SEO checks on an existing post (admin only)
 */
export async function POST(req: NextRequest) {
  const admin = await requireRole("admin");
  if (!admin && !schedulerAllowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!openrouterConfigured()) return NextResponse.json({ error: "OPENROUTER_API_KEY is not set on the server" }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as { force?: boolean; dryRun?: string; improvePostId?: string };
  try {
    if (body.improvePostId) {
      if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.json({ ok: true, improved: await improvePost(body.improvePostId) });
    }
    if (body.dryRun) {
      const topic = BUILT_IN_TOPICS.find((t) => t.id === body.dryRun) ?? topicFromText(body.dryRun);
      return NextResponse.json({ ok: true, preview: await dryRun(topic) });
    }
    // Only a signed-in admin may force a run; the scheduler gets the due check.
    const outcome = await runAutoblog({ force: Boolean(admin && body.force) });
    return NextResponse.json({ ok: true, ...outcome });
  } catch (err) {
    console.error("[autoblog] run failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Run failed" }, { status: 500 });
  }
}
