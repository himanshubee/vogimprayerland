import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New post — VOGIM Admin" };

export default async function NewPostPage() {
  if (!(await requireRole("admin"))) redirect("/admin/login");
  return <PostEditor />;
}
