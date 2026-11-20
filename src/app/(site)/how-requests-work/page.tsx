import type { Metadata } from "next";
import Link from "next/link";
import { SimplePage } from "@/components/SimplePage";
import { absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "How Prayer Requests Work | VOGIM Prayer Land",
  description: "See who receives your VOGIM prayer request, how it is kept private, what happens next and how to ask for your information to be corrected or deleted.",
  alternates: { canonical: absoluteUrl("/how-requests-work/") },
};

export default function HowRequestsWorkPage() {
  return (
    <SimplePage eyebrow="Your request, step by step" title="How your prayer request is handled" intro="Your request goes to the VOGIM prayer team. You choose how much to share. Intercessors pray over requests each morning, and a pastor may follow up where needed. Prayer, deliverance and counselling are free.">
      <div className="space-y-10">
        <section><h2 className="font-display text-3xl text-maroon">Who receives your request</h2><p className="mt-3 text-slate">Requests go to the prayer team. Urgent matters can be passed to a pastor for personal follow-up. Request details are not published.</p></section>
        <section><h2 className="font-display text-3xl text-maroon">What you need to share</h2><p className="mt-3 text-slate">The forms ask only for the details needed to pray and reply. You can share as much or as little as you like. Health, family and marriage details are optional. If you are under 18, please ask a parent or guardian to send the request.</p></section>
        <section><h2 className="font-display text-3xl text-maroon">What happens next</h2><ol className="mt-4 list-decimal space-y-2 pl-6 text-slate"><li>Send your request through the relevant form.</li><li>The team reviews it and arranges any session or follow-up that is needed.</li><li>Intercessors pray over requests each morning. Deliverance aftercare may include scripture, a prayer plan and follow-up.</li></ol></section>
        <section><h2 className="font-display text-3xl text-maroon">What we do not do with it</h2><p className="mt-3 text-slate">The ministry does not sell your information, publish your request or share it with advertisers. Notification emails contain only the type of request and a link to the protected inbox, not your message or contact details.</p></section>
        <section><h2 className="font-display text-3xl text-maroon">Storage and deletion</h2><p className="mt-3 text-slate">The current privacy policy says requests are ordinarily deleted or anonymised within five years of last contact, and general enquiries within two years. You can ask for access, correction or deletion sooner.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/privacy-requests/" className="btn-ghost">Make a privacy request</Link><Link href="/privacy-policy/" className="btn-ghost">Read the Privacy Policy</Link></div></section>
        <aside className="rounded-2xl bg-mist p-6"><h2 className="font-display text-2xl text-maroon">If you need urgent practical help</h2><p className="mt-2 text-slate">If you are in a medical emergency, or you are at risk of harming yourself or another person, contact your local emergency services immediately.</p></aside>
      </div>
    </SimplePage>
  );
}
