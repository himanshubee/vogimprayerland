import type { Metadata } from "next";
import { RequestExperience } from "@/components/RequestExperience";
import { absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Online Deliverance Request, Free and Private | VOGIM",
  description: "Request a free, private online deliverance session with VOGIM Prayer Land. Tell the team how to contact you and share only what you choose about your situation.",
  alternates: { canonical: absoluteUrl("/deliverance-request/") },
};

const FAQS = [
  { question: "Is a deliverance session free?", answer: "Yes. Prayer, deliverance and counselling are free. Giving is voluntary and is never a condition for a session." },
  { question: "What happens before a session?", answer: "The team confirms your request and proposes a session slot. You receive scripture to read before the session." },
  { question: "What happens afterwards?", answer: "Aftercare may include scripture, a prayer plan and follow-up. The team will explain the next steps for your situation." },
  { question: "Is my request private?", answer: "Yes. Your request is treated with confidentiality and reverence. Health, family and marriage details are optional." },
];

export default function DeliveranceRequestPage() {
  return <RequestExperience eyebrow="Online deliverance request" title="Request an Online Deliverance Session" intro="Request a free, private online deliverance session. The team will confirm your request and propose a time. Share only what you choose, and read what happens before and after the session." intent="Deliverance Request" submitLabel="Request my session" timezone fields={[
    { name: "name", label: "Name", required: true, autoComplete: "name" },
    { name: "email", label: "Email", type: "email", inputMode: "email", required: true, autoComplete: "email" },
    { name: "phone", label: "Phone or WhatsApp", type: "tel", inputMode: "tel", required: true, autoComplete: "tel" },
    { name: "country", label: "City and country (optional)", autoComplete: "country-name" },
    { name: "preferredTime", label: "Preferred session time (optional)", placeholder: "Tell us a suitable day or time" },
    { name: "concerns", label: "What are you walking through?", type: "textarea", required: true, rows: 6 },
  ]} steps={["The team confirms your request and proposes a session slot.", "You receive scripture to read before the session.", "After the one-to-one online session, aftercare may include scripture, a prayer plan and follow-up."]} faqs={FAQS} />;
}
