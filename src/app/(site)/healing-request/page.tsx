import type { Metadata } from "next";
import { RequestExperience } from "@/components/RequestExperience";
import { absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Healing Prayer Request, Free Online | VOGIM Prayer Land",
  description: "Send a free online healing prayer request. Health details are optional, your request stays private, and you can keep seeing your doctor while we pray.",
  alternates: { canonical: absoluteUrl("/healing-request/") },
};

const FAQS = [
  { question: "Do I have to share my condition?", answer: "No. Health information is optional. You can share as much or as little as you like, and you do not need to provide a diagnosis or medical records." },
  { question: "Is it free?", answer: "Yes. Prayer, deliverance and counselling are free. Giving is voluntary and separate from every request." },
  { question: "Should I keep seeing my doctor?", answer: "Yes. If you are continuing under medical care, please continue with your doctor while we stand in prayer with you." },
  { question: "Who reads my request?", answer: "Your request goes to the prayer team. Intercessors pray over requests each morning, and a pastor may follow up where needed." },
];

export default function HealingRequestPage() {
  return <RequestExperience eyebrow="Healing prayer request online" title="Send a Healing Prayer Request" intro="Ask the VOGIM team for free, private healing prayer. You do not have to share a condition. If you are continuing under medical care, please continue with your doctor while we stand in prayer with you." intent="Healing Request" submitLabel="Send my healing request" fields={[
    { name: "name", label: "Name", required: true, autoComplete: "name" },
    { name: "email", label: "Email", type: "email", inputMode: "email", required: true, autoComplete: "email" },
    { name: "phone", label: "Phone or WhatsApp (optional)", type: "tel", inputMode: "tel", autoComplete: "tel" },
    { name: "age", label: "Age (optional)", inputMode: "numeric" },
    { name: "condition", label: "What would you like us to pray about? (optional)", type: "textarea", rows: 5 },
  ]} steps={["Send only the details you choose.", "Intercessors pray over requests each morning.", "A pastor may follow up where needed."]} note="If you are continuing under medical care, please continue with your doctor while we stand in prayer with you." faqs={FAQS} />;
}
