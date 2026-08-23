import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { listBooksAdmin } from "@/lib/books";
import { BooksManager } from "./BooksManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Books — VOGIM Admin" };

export default async function AdminBooksPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  // Never let an unreachable DB blank the whole admin — show an empty list.
  const items = await listBooksAdmin().catch((err) => {
    console.error("[admin/books] load failed:", err);
    return [];
  });

  return <BooksManager initial={items} />;
}
