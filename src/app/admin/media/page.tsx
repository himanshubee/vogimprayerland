import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getMediaAdmin } from "@/lib/media";
import { MediaManager } from "./MediaManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media — VOGIM Admin" };

export default async function AdminMediaPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const items = await getMediaAdmin();
  return <MediaManager initial={items} />;
}
