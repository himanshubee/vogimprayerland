import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getMerchPricing, getMerchTemplates, listMerchAdmin } from "@/lib/merch";
import { getRates } from "@/lib/fx";
import { StoreManager } from "./StoreManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store — VOGIM Admin" };

export default async function AdminStorePage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  // Never let an unreachable DB or rate service blank the whole admin.
  const [items, pricing, templates, rates] = await Promise.all([
    listMerchAdmin().catch((err) => {
      console.error("[admin/store] load failed:", err);
      return [];
    }),
    getMerchPricing(),
    getMerchTemplates(),
    getRates().catch((err) => {
      console.error("[admin/store] rates unavailable:", err);
      return null;
    }),
  ]);

  return <StoreManager initial={items} pricing={pricing} templates={templates} fx={rates} />;
}
