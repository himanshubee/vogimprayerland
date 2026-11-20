import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getContact, getTimeline, getStages } from "@/lib/crm";
import { audit } from "@/lib/audit";
import { ContactProfile } from "./ContactProfile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact — VOGIM Admin" };

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("pastor", "admin");
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) notFound();
  await audit(session, "open", { type: "contact", id });
  const [timeline, stages] = await Promise.all([getTimeline(id), getStages()]);
  return <ContactProfile contact={contact} timeline={timeline} stages={stages} />;
}
