import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  getOrder,
  listOrders,
  reconcilePendingOrders,
  resendDeliveryEmail,
} from "@/lib/book-orders";

export const dynamic = "force-dynamic";

// GET — admin: recent book orders, newest first.
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ items: await listOrders() });
  } catch (err) {
    console.error("[book-orders] list error:", err);
    return NextResponse.json({ error: "Could not load orders" }, { status: 500 });
  }
}

// POST — admin: sweep for orders that were paid but never settled, or re-send
// a customer's download links.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  try {
    if (body.action === "reconcile") {
      const report = await reconcilePendingOrders();
      return NextResponse.json({ ok: true, report });
    }

    if (body.action === "resend") {
      const order = await getOrder(String(body.ref ?? ""));
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (order.status !== "paid") {
        return NextResponse.json(
          { error: "That order has not been paid, so there is nothing to send." },
          { status: 400 }
        );
      }
      const result = await resendDeliveryEmail(order);
      return NextResponse.json(
        result.ok
          ? { ok: true, message: `Download links re-sent to ${order.email}.` }
          : {
              ok: false,
              error:
                result.error ||
                "Could not send the email. Check the SMTP settings on the server.",
            },
        { status: result.ok ? 200 : 502 }
      );
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[book-orders] action failed:", err);
    return NextResponse.json({ error: "That action failed" }, { status: 500 });
  }
}
