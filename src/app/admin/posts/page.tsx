import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getAllPostsAdmin } from "@/lib/posts";
import { PostsList } from "./PostsList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Posts — VOGIM Admin" };

export default async function AdminPostsPage() {
  if (!(await requireRole("admin"))) redirect("/admin/login");
  const posts = await getAllPostsAdmin();
  return <PostsList initial={posts} />;
}
