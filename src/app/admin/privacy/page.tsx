import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { PrivacyTools } from "./PrivacyTools";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy and audit — VOGIM Admin" };

export default async function AdminPrivacyPage() {
  if (!(await requireRole("admin"))) redirect("/admin/login");
  const db = await getDb().catch(() => null);
  const [log, runs] = db
    ? await Promise.all([
        db.collection("audit_log").find({}).sort({ at: -1 }).limit(200).toArray(),
        db.collection("retention_runs").find({}).sort({ runAt: -1 }).limit(10).toArray(),
      ]).catch(() => [[], []])
    : [[], []];

  return (
    <PrivacyTools
      log={log.map((e) => ({
        id: String(e._id),
        at: new Date(e.at).toISOString(),
        username: String(e.username),
        role: String(e.role),
        action: String(e.action),
        target: `${e.targetType}${e.targetId ? ` ${e.targetId}` : ""}`,
        detail: e.detail ? String(e.detail) : "",
      }))}
      runs={runs.map((r) => ({
        id: String(r._id),
        at: new Date(r.runAt).toISOString(),
        requests: Number(r.requestsAnonymised ?? 0),
        enquiries: Number(r.enquiriesAnonymised ?? 0),
      }))}
    />
  );
}
