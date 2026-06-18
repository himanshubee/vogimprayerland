import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SettingsEditor } from "./SettingsEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — VOGIM Admin" };

export default async function AdminSettingsPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const settings = await getSettings();
  return <SettingsEditor initial={settings} />;
}
