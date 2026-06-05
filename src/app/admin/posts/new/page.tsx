import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New post — VOGIM Admin" };

export default async function NewPostPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return <PostEditor />;
}
