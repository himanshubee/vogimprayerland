import type { Metadata } from "next";
import Link from "next/link";
import { SealCheck } from "@phosphor-icons/react/dist/ssr";
import { SimplePage } from "@/components/SimplePage";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { MINISTRY, absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Official Channels and Scam Notice | VOGIM Prayer Land",
  description: "Check VOGIM Prayer Land's official website, giving page, WhatsApp, Facebook and YouTube. Prayer is free. Never share your card PIN, CVV or one-time code.",
  alternates: { canonical: absoluteUrl("/notice/") },
};

const channels = [
  ["Website", "https://www.vogimprayerland.org/", "www.vogimprayerland.org"],
  ["Official giving page", MINISTRY.givingUrl, "give.vogimprayerland.org"],
  ["WhatsApp", MINISTRY.whatsapp, MINISTRY.phone],
  ["Facebook", MINISTRY.social.facebook, "vogimdeliveranceministries"],
  ["YouTube", MINISTRY.social.youtube, "@vogimdeliveranceministry"],
] as const;

export default function NoticePage() {
  return (
    <SimplePage eyebrow="Official channels and scam warning" title="Is this really VOGIM Prayer Land?" intro="Check the channel before you send a gift or share personal information. Our official online giving starts on this website. Prayer, deliverance and counselling are always free." closing={false}>
      <div className="rounded-2xl bg-cream p-6"><SealCheck size={36} weight="duotone" className="text-maroon" /><h2 className="mt-3 font-display text-3xl text-maroon">Our official channels</h2><ul className="mt-5 space-y-3">{channels.map(([label, href, display]) => <li key={label} className="flex flex-col gap-1 border-b border-soft pb-3 last:border-0 sm:flex-row sm:justify-between"><strong>{label}</strong><a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-maroon underline underline-offset-4">{display}</a></li>)}</ul></div>
      <section className="mt-10"><h2 className="font-display text-3xl text-maroon">We will never</h2><ul className="mt-4 list-disc space-y-3 pl-6 text-slate"><li>Charge for prayer, deliverance or counselling.</li><li>Ask for your card PIN, CVV, bank password or one-time code.</li><li>Make a gift a condition for prayer, a session or follow-up.</li><li>Promise a result in return for money.</li></ul></section>
      <section className="mt-10 rounded-2xl bg-mist p-6"><h2 className="font-display text-3xl text-maroon">Think something is not right?</h2><p className="mt-3 text-slate">Do not send money or personal details. Message us on WhatsApp or use the Complaints page. Screenshots can help the team check what you received.</p><div className="mt-5 flex flex-wrap gap-3"><WhatsAppLink className="btn-gold" /><Link href="/complaints/" className="btn-ghost">Raise a concern</Link></div></section>
      <div className="mt-10 text-center"><Link href="/give/" className="btn-ghost">Go to the official Give page</Link></div>
    </SimplePage>
  );
}
