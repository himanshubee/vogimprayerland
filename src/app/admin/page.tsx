import { redirect } from "next/navigation";
import { getSession, staffDirectory, usesSharedLogin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { careRefreshOn } from "@/lib/flags";
import { audit } from "@/lib/audit";
import { listInbox, replyStats, visibleFilter } from "@/lib/inbox";
import { AdminDashboard, type Submission } from "./AdminDashboard";
import { InboxV2 } from "./InboxV2";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — VOGIM Prayer Land" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session.role === "finance") redirect("/admin/donations");

  // care_refresh_v1: the staged inbox. CARE_REFRESH_V1=off rolls back to the previous dashboard.
  if (careRefreshOn({ staff: true })) {
    const items = await listInbox(session).catch(() => []);
    return (
      <InboxV2
        initial={items}
        role={session.role}
        username={session.username}
        staff={staffDirectory()}
        stats={replyStats(items)}
        sharedLogin={usesSharedLogin()}
      />
    );
  }

  const db = await getDb();
  const raw = await db
    .collection("submissions")
    .find(visibleFilter(session))
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  const submissions: Submission[] = raw.map((d) => ({
    id: String(d._id),
    intent: d.intent ?? "Request",
    fields: d.fields ?? {},
    status: d.status ?? "new",
    createdAt: (d.createdAt instanceof Date
      ? d.createdAt
      : new Date(d.createdAt)
    ).toISOString(),
    ip: d.ip ?? null,
  }));

  // The previous dashboard sends every visible request's text with the page, so record that as one open.
  await audit(session, "open", { type: "submission-list", detail: `legacy dashboard rows=${submissions.length}` }).catch(() => {});

  return <AdminDashboard initial={submissions} />;
}
