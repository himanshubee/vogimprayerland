import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { listOrders } from "@/lib/book-orders";
import { isFlutterwaveConfigured, isTestMode } from "@/lib/flutterwave";
import { isPaystackConfigured, isPaystackTestMode } from "@/lib/paystack";
import { isPaypalConfigured, isPaypalSandbox } from "@/lib/paypal";
import { gatewayLabel, type Provider } from "@/lib/gateways";
import { OrdersClient } from "./OrdersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders — VOGIM Admin" };

export default async function AdminBookOrdersPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  // Never let an unreachable DB blank the whole admin — show an empty table.
  const items = await listOrders().catch((err) => {
    console.error("[admin/books/orders] load failed:", err);
    return [];
  });

  // Name every configured gateway that is pointed at a sandbox, so the banner
  // can't claim "Flutterwave is in test mode" while Paystack quietly takes
  // real money (or the reverse).
  const inSandbox: Provider[] = (
    [
      ["flutterwave", isFlutterwaveConfigured(), isTestMode()],
      ["paystack", isPaystackConfigured(), isPaystackTestMode()],
      ["paypal", isPaypalConfigured(), isPaypalSandbox()],
    ] as [Provider, boolean, boolean][]
  )
    .filter(([, configured, sandbox]) => configured && sandbox)
    .map(([id]) => id);

  return (
    <OrdersClient
      initial={items}
      sandboxGateways={inSandbox.map(gatewayLabel)}
    />
  );
}
