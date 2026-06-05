import { redirect, notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getPostById } from "@/lib/posts";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit post — VOGIM Admin" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();
  return <PostEditor post={post} />;
}
