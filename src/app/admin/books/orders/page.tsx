import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { listOrders } from "@/lib/book-orders";
import { isTestMode } from "@/lib/flutterwave";
import { OrdersClient } from "./OrdersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Book orders — VOGIM Admin" };

export default async function AdminBookOrdersPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  // Never let an unreachable DB blank the whole admin — show an empty table.
  const items = await listOrders().catch((err) => {
    console.error("[admin/books/orders] load failed:", err);
    return [];
  });

  return <OrdersClient initial={items} testMode={isTestMode()} />;
}
