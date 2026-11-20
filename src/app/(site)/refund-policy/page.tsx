import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { RequestForm } from "@/components/RequestForm";
import { getLegalDoc, legalMetadata } from "@/lib/legal";

export const metadata: Metadata = legalMetadata("refund-policy");
export const revalidate = 3600;

export default function RefundPolicyPage() {
  return (
    <>
      <LegalPage doc={getLegalDoc("refund-policy")} />
      <section className="bg-cream"><div className="mx-auto max-w-3xl px-5 py-14 sm:px-6 sm:py-20">
        <h2 className="font-display text-4xl text-maroon">Request a gift refund</h2>
        <p className="mt-3 text-slate">Provide only the transaction details listed. Never send a full card number, CVV, PIN, bank password or one-time code.</p>
        <div className="mt-7"><RequestForm intent="Refund Request" purpose="response" submitLabel="Send my refund request" fields={[
          { name: "name", label: "Name", required: true, autoComplete: "name" },
          { name: "contact", label: "Email or phone used when giving", required: true },
          { name: "date", label: "Date of the gift", required: true, placeholder: "For example, 20 November 2026" },
          { name: "amount", label: "Amount", required: true, inputMode: "numeric" },
          { name: "currency", label: "Currency", type: "select", required: true, options: ["NGN", "USD", "GBP", "EUR", "AED"] },
          { name: "reference", label: "Transaction reference", required: true },
        ]} /></div>
      </div></section>
    </>
  );
}
