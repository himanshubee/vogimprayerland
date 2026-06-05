import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { AdminDashboard, type Submission } from "./AdminDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — VOGIM Prayer Land" };

export default async function AdminPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  const db = await getDb();
  const raw = await db
    .collection("submissions")
    .find({})
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

  return <AdminDashboard initial={submissions} />;
}
