import type { Metadata } from "next";
import { RequestExperience } from "@/components/RequestExperience";
import { absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Send a Prayer Request Online (Free) | VOGIM Prayer Land",
  description: "Send a free, private online prayer request to VOGIM Prayer Land. Share as much or as little as you choose. Intercessors pray over requests each morning.",
  alternates: { canonical: absoluteUrl("/prayer-request/") },
};

const FAQS = [
  { question: "Who reads my request?", answer: "Your request goes to the prayer team. Intercessors gather each morning to pray over requests, and a pastor may follow up where needed." },
  { question: "Can I request prayer for someone else?", answer: "Yes. You can ask for prayer for another person. Share only the details you have permission and need to share; their name and personal details are not required for you to contact us." },
  { question: "Is my request private?", answer: "Requests are treated with confidentiality and reverence. They are not published or shared with advertisers. You can ask for your information to be deleted through the Privacy requests page." },
  { question: "Is prayer free?", answer: "Yes. Prayer, deliverance and counselling are free. Giving is voluntary and is never required before you can receive prayer." },
];

export default function PrayerRequestPage() {
  return <RequestExperience eyebrow="Online prayer request" title="Send a Prayer Request Online" intro="Tell us what you would like us to pray about. It is free and private, and you can share as much or as little as you choose. Intercessors pray over requests each morning." intent="Prayer Request" submitLabel="Send my prayer request" fields={[
    { name: "name", label: "Name", required: true, autoComplete: "name" },
    { name: "email", label: "Email", type: "email", inputMode: "email", required: true, autoComplete: "email" },
    { name: "phone", label: "Phone or WhatsApp (optional)", type: "tel", inputMode: "tel", autoComplete: "tel" },
    { name: "country", label: "City and country (optional)", autoComplete: "country-name" },
    { name: "request", label: "Your prayer request", type: "textarea", required: true, rows: 6, placeholder: "Share what is on your heart" },
  ]} steps={["Your request goes privately to the prayer team.", "Intercessors pray over requests each morning.", "A pastor may follow up where needed."]} faqs={FAQS} />;
}
