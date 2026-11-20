import type { Metadata } from "next";
import { RequestForm } from "@/components/RequestForm";
import { SimplePage } from "@/components/SimplePage";
import { absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Privacy Requests | Access, Correct or Delete Your Data",
  description: "Ask VOGIM Prayer Land to access, correct or delete your data, restrict or object to its use, or withdraw consent. Free, and answered within 30 days.",
  alternates: { canonical: absoluteUrl("/privacy-requests/") },
};

export default function PrivacyRequestsPage() {
  return (
    <SimplePage eyebrow="Your information, your choice" title="Make a privacy request" intro="Ask for access, correction, deletion, restriction, objection, portability or withdrawal of consent. Supply only the details needed to find your record. Do not include card numbers or passwords." closing={false}>
      <div className="mb-8 rounded-2xl bg-mist p-5 text-slate"><h2 className="font-display text-2xl text-maroon">What happens next</h2><p className="mt-2">Your request creates an item in the protected admin inbox. The privacy policy says rights requests are answered within 30 days. The team may need to verify your identity before releasing or changing information.</p></div>
      <RequestForm intent="Privacy Request" purpose="response" submitLabel="Send my privacy request" fields={[
        { name: "name", label: "Name", required: true, autoComplete: "name" },
        { name: "email", label: "Email used with us", type: "email", inputMode: "email", required: true, autoComplete: "email" },
        { name: "requestType", label: "What would you like to ask?", type: "select", required: true, options: ["Access my information", "Correct my information", "Delete my information", "Restrict processing", "Object to processing", "Data portability", "Withdraw consent"] },
        { name: "message", label: "Details that help us find your record (optional)", type: "textarea", rows: 4 },
      ]} />
    </SimplePage>
  );
}
