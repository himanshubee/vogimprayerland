import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { BUILT_IN_TOPICS } from "@/lib/autoblog/generate";
import { openrouterConfigured } from "@/lib/autoblog/openrouter";
import { DEFAULT_AUTOBLOG, getAutoblogSettings, listRuns } from "@/lib/autoblog/settings";
import { AutoblogManager } from "./AutoblogManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Auto-blog — VOGIM Admin" };

export default async function AdminAutoblogPage() {
  if (!(await requireRole("admin"))) redirect("/admin/login");
  const [settings, runs] = await Promise.all([
    getAutoblogSettings().catch(() => DEFAULT_AUTOBLOG),
    listRuns().catch(() => []),
  ]);
  return <AutoblogManager initial={{ settings, runs, configured: openrouterConfigured(), builtInTopics: BUILT_IN_TOPICS.length }} />;
}
