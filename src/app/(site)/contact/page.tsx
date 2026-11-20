import type { Metadata } from "next";
import { Clock, EnvelopeSimple, MapPin } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { MINISTRY, absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Contact VOGIM Prayer Land | Ikorodu, Lagos",
  description: "Contact VOGIM Prayer Land in Ikorodu, Lagos by form, email or WhatsApp. Find the church address and all weekly online and in-person service times.",
  alternates: { canonical: absoluteUrl("/contact/") },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title="Contact VOGIM Prayer Land" intro="Send a private message to the ministry in Ikorodu, Lagos. You can also use WhatsApp, visit for Sunday worship or join a weekly service online." />
      <section className="bg-cream"><div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl text-maroon">Reach the ministry</h2>
          <ul className="mt-7 space-y-6 text-slate">
            <li className="flex gap-3"><MapPin size={24} weight="duotone" className="mt-1 shrink-0 text-maroon" /><span>{MINISTRY.address.streetAddress}<br />{MINISTRY.address.addressLocality}<br />{MINISTRY.address.addressRegion}, Nigeria</span></li>
            <li className="flex gap-3"><EnvelopeSimple size={24} weight="duotone" className="mt-1 shrink-0 text-maroon" /><a href={`mailto:${MINISTRY.email}`} className="text-maroon underline">{MINISTRY.email}</a></li>
            <li className="flex gap-3"><Clock size={24} weight="duotone" className="mt-1 shrink-0 text-maroon" /><span>Online Prophetic Service<br />Mondays and Saturdays · 10:00 PM WAT</span></li>
          </ul>
          <div className="mt-7"><WhatsAppLink className="btn-gold" /></div>
          <aside className="mt-7 rounded-2xl bg-white p-5 text-sm text-slate">For urgent spiritual needs, message us on WhatsApp. For a medical or other emergency, contact your local emergency services.</aside>
        </div>
        <RequestForm intent="General Enquiry" purpose="response" submitLabel="Send my message" fields={[
          { name: "name", label: "Name", required: true, autoComplete: "name" },
          { name: "email", label: "Email", type: "email", inputMode: "email", required: true, autoComplete: "email" },
          { name: "subject", label: "Subject (optional)" },
          { name: "message", label: "Your message", type: "textarea", required: true, rows: 6 },
        ]} />
      </div></section>
      <section className="bg-midnight-dark text-white"><div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:px-6 md:grid-cols-3">{MINISTRY.services.map((service) => <article key={service.id} className="rounded-2xl border border-white/15 p-6"><h2 className="font-display text-2xl text-gold">{service.name}</h2><p className="mt-3">{service.day} · {service.displayTime}</p><p className="mt-1 text-sm text-white/70">{service.mode}</p></article>)}</div></section>
    </>
  );
}
