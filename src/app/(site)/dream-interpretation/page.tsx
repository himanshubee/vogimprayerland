import type { Metadata } from "next";
import { RequestExperience } from "@/components/RequestExperience";
import { absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Dream Interpretation Prayer Ministry | VOGIM Prayer Land",
  description: "Send your dream privately to VOGIM Prayer Land for free dream interpretation prayer. Share only what you choose and receive a reply from the ministry team.",
  alternates: { canonical: absoluteUrl("/dream-interpretation/") },
};

const FAQS = [
  { question: "How do I send a dream?", answer: "Complete the form with your name, email and a description of the dream. You can include the date and your phone or WhatsApp number if you choose." },
  { question: "Is dream interpretation free?", answer: "Yes. Prayer, deliverance and counselling are free. Giving is voluntary and separate from every request." },
  { question: "Is my dream kept private?", answer: "Yes. Requests are treated with confidentiality and reverence. They are not published or shared with advertisers." },
];

export default function DreamInterpretationPage() {
  return <RequestExperience eyebrow="Dream interpretation prayer ministry" title="Send Your Dream for Interpretation" intro="Send your dream privately to the VOGIM ministry team. This service is free. Include the details you remember and share only what you choose." intent="Dream Interpretation" submitLabel="Send my dream" fields={[
    { name: "name", label: "Name", required: true, autoComplete: "name" },
    { name: "email", label: "Email", type: "email", inputMode: "email", required: true, autoComplete: "email" },
    { name: "phone", label: "Phone or WhatsApp (optional)", type: "tel", inputMode: "tel", autoComplete: "tel" },
    { name: "dateOfDream", label: "Date of the dream (optional)" },
    { name: "dream", label: "Describe the dream", type: "textarea", required: true, rows: 7, placeholder: "Tell us what you remember" },
  ]} steps={["Your dream goes privately to the ministry team.", "The team reviews what you have shared.", "A team member replies or follows up where needed."]} faqs={FAQS} />;
}
