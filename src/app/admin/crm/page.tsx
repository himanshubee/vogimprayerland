import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { listContacts, getStages } from "@/lib/crm";
import { CrmClient } from "./CrmClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM — VOGIM Admin" };

export default async function CrmPage() {
  if (!(await requireRole("pastor", "admin"))) redirect("/admin/login");
  const [contacts, stages] = await Promise.all([listContacts(), getStages()]);
  return <CrmClient initial={contacts} stages={stages} />;
}
