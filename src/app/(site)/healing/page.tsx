import type { Metadata } from "next";
import Link from "next/link";
import { SimplePage } from "@/components/SimplePage";
import { FaqList } from "@/components/FaqList";
import { Reassurance } from "@/components/Reassurance";
import { absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Healing Prayer Ministry Online, Free and Private | VOGIM",
  description: "Ask VOGIM Prayer Land for free online healing prayer. Share only what you choose, keep seeing your doctor and send a private request to the prayer team.",
  alternates: { canonical: absoluteUrl("/healing/") },
};

const FAQS = [
  { question: "What can I send?", answer: "You can ask for prayer about your own health or for someone else. Share only what you choose. You do not need to name a condition or provide medical records." },
  { question: "Do I have to share my condition?", answer: "No. Health details are optional. The request form asks what you would like us to pray about, and you can share as much or as little as you like." },
  { question: "Is healing prayer free?", answer: "Yes. Prayer, deliverance and counselling are free. Giving is voluntary and is never a condition for receiving prayer." },
  { question: "Should I keep seeing my doctor?", answer: "Yes. If you are continuing under medical care, please continue with your doctor while we stand in prayer with you." },
  { question: "Who reads my request?", answer: "Your request goes to the prayer team. Intercessors pray over requests each morning, and a pastor may follow up where needed." },
];

export default function HealingPage() {
  return (
    <>
      <SimplePage eyebrow="Healing ministry" title="Healing Prayer Ministry Online" intro="VOGIM Prayer Land offers free online healing prayer. You can ask for prayer without sharing a diagnosis or medical records. Send a private request, and please continue with your doctor while we stand in prayer with you.">
        <Reassurance />
        <section className="mt-10"><h2 className="font-display text-4xl text-maroon">How a healing prayer request works</h2><ol className="mt-6 space-y-5">{["Send your name, email and whatever you would like us to pray about. Health details are optional.", "Your request goes privately to the prayer team. Intercessors pray over requests each morning.", "A pastor may follow up where needed. You can also contact the ministry on WhatsApp."].map((text, index) => <li key={text} className="flex gap-4 rounded-2xl bg-mist p-5"><span className="font-display text-3xl text-gold-deep">0{index + 1}</span><p className="text-slate">{text}</p></li>)}</ol></section>
        <aside className="mt-8 rounded-2xl border-l-4 border-gold bg-cream p-6"><h2 className="font-display text-2xl text-maroon">Your medical care continues</h2><p className="mt-2 text-slate">If you are continuing under medical care, please continue with your doctor while we stand in prayer with you.</p></aside>
        <div className="mt-10 text-center"><Link href="/healing-request/" className="btn-gold">Send a healing request</Link><p className="mt-3 text-sm text-slate">Free · Private · Health details are optional</p></div>
      </SimplePage>
      <FaqList faqs={FAQS} relatedPath="/healing/" />
    </>
  );
}
