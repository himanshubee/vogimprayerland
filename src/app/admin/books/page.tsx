import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { listBooksAdmin } from "@/lib/books";
import { getRates } from "@/lib/fx";
import { BooksManager } from "./BooksManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Books — VOGIM Admin" };

export default async function AdminBooksPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  // Never let an unreachable DB or rate service blank the whole admin.
  const [items, rates] = await Promise.all([
    listBooksAdmin().catch((err) => {
      console.error("[admin/books] load failed:", err);
      return [];
    }),
    getRates().catch((err) => {
      console.error("[admin/books] rates unavailable:", err);
      return null;
    }),
  ]);

  return <BooksManager initial={items} fx={rates} />;
}
