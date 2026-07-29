import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { listDonations } from "@/lib/donations";
import { isTestMode } from "@/lib/flutterwave";
import { DonationsClient } from "./DonationsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Giving — VOGIM Admin" };

export default async function DonationsPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  // Never let an unreachable DB blank the whole admin — show an empty table.
  const items = await listDonations().catch((err) => {
    console.error("[admin/donations] load failed:", err);
    return [];
  });

  return <DonationsClient initial={items} testMode={isTestMode()} />;
}
