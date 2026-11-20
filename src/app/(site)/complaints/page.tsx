import type { Metadata } from "next";
import { RequestForm } from "@/components/RequestForm";
import { SimplePage } from "@/components/SimplePage";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { MINISTRY, absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Complaints and Concerns | VOGIM Prayer Land",
  description: "Raise a concern with VOGIM Prayer Land about a request, gift, order, online channel or the conduct of anyone at the ministry. Use the private complaints form.",
  alternates: { canonical: absoluteUrl("/complaints/") },
};

export default function ComplaintsPage() {
  return (
    <SimplePage eyebrow="Complaints and concerns" title="Tell us what went wrong" intro="Raise a concern about a request, a gift, an order, an online channel or the conduct of anyone at the ministry. Your concern goes to the protected admin inbox for review." closing={false}>
      <div className="mb-8 grid gap-4 rounded-2xl bg-mist p-6 sm:grid-cols-2"><div><h2 className="font-display text-2xl text-maroon">Email</h2><a href={`mailto:${MINISTRY.email}`} className="text-maroon underline">{MINISTRY.email}</a></div><div><h2 className="font-display text-2xl text-maroon">WhatsApp</h2><p className="text-slate">Use a neutral greeting. Do not include passwords or card details.</p></div></div>
      <RequestForm intent="Complaint" purpose="response" submitLabel="Send my concern" fields={[
        { name: "name", label: "Name", required: true, autoComplete: "name" },
        { name: "email", label: "Email", type: "email", inputMode: "email", required: true, autoComplete: "email" },
        { name: "subject", label: "What is this about?", type: "select", options: ["Prayer or request", "Gift or refund", "Store order", "Online channel or impersonation", "Conduct or safeguarding", "Something else"] },
        { name: "message", label: "Tell us what happened", type: "textarea", required: true, rows: 6 },
      ]} />
      <div className="mt-6"><WhatsAppLink className="btn-ghost" /></div>
    </SimplePage>
  );
}
