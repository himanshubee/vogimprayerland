import type { Metadata } from "next";
import { MapPin } from "@phosphor-icons/react/dist/ssr";
import { SimplePage } from "@/components/SimplePage";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { MINISTRY, absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Visit VOGIM Prayer Land | Ikorodu, Lagos",
  description: "Visit VOGIM Prayer Land at 18 Association Avenue, Owutu-Agric, Ikorodu, Lagos. Sunday Worship is at 9:00 AM WAT, in person and by livestream. Plan your visit.",
  alternates: { canonical: absoluteUrl("/visit/") },
};

const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${MINISTRY.address.streetAddress}, ${MINISTRY.address.addressLocality}, ${MINISTRY.address.addressRegion}, Nigeria`)}`;

export default function VisitPage() {
  return (
    <SimplePage eyebrow="Plan your visit" title="Visit our church in Ikorodu" intro="You are welcome at VOGIM Prayer Land in Ikorodu, Lagos. Find the church address, Sunday worship time and a direct map link below. You can also message us on WhatsApp before you come.">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-7"><MapPin size={32} weight="duotone" className="text-maroon" /><h2 className="mt-4 font-display text-3xl text-maroon">Church address</h2><p className="mt-4 text-slate">{MINISTRY.address.streetAddress}<br />{MINISTRY.address.addressLocality}<br />{MINISTRY.address.addressRegion}, Nigeria</p><a href={mapUrl} target="_blank" rel="noreferrer" className="btn-ghost mt-6">Open in Google Maps</a></section>
        <section className="card p-7"><h2 className="font-display text-3xl text-maroon">Sunday Worship</h2><p className="mt-4 text-lg font-semibold">Sundays · 9:00 AM WAT</p><p className="mt-2 text-slate">In person and by livestream.</p><p className="mt-4 text-slate">For questions before your visit, send a neutral greeting to the ministry on WhatsApp.</p><WhatsAppLink className="btn-gold mt-6" /></section>
      </div>
    </SimplePage>
  );
}
