import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SimplePage } from "@/components/SimplePage";
import { MINISTRY, absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Our Leaders | VOGIM Prayer Land",
  description: "Meet Prophet Olaofe Oladele, Founder and General Overseer of VOGIM Prayer Land, an online deliverance and prayer ministry rooted in Ikorodu, Lagos, Nigeria.",
  alternates: { canonical: absoluteUrl("/leaders/") },
};

export default function LeadersPage() {
  const jsonLd = { "@context": "https://schema.org", "@type": "Person", "@id": `${absoluteUrl()}#founder`, name: MINISTRY.founder.name, jobTitle: MINISTRY.founder.role, worksFor: { "@id": `${absoluteUrl()}#organization` }, image: absoluteUrl("/past.jpeg") };
  return (
    <SimplePage eyebrow="Our leaders" title="Leadership at VOGIM Prayer Land" intro="VOGIM Prayer Land is led by Prophet Olaofe Oladele, Founder and General Overseer. He founded the ministry in May 2021 as village evangelism in Porto Novo and the surrounding communities.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="card grid overflow-hidden md:grid-cols-2"><div className="relative aspect-[4/5]"><Image src="/past.jpeg" alt={MINISTRY.founder.name} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" /></div><div className="p-7"><h2 className="font-display text-4xl text-maroon">{MINISTRY.founder.name}</h2><p className="mt-2 font-semibold text-gold-deep">{MINISTRY.founder.role}</p><p className="mt-5 text-slate">The ministry began in May 2021 in Porto Novo. Today it is based in Ikorodu, Lagos, and meets people online through prayer, deliverance, healing and restoration.</p><p className="mt-5"><Link href="/author/prophet-olaofe-oladele/" className="text-maroon underline">Read his articles and profile</Link></p></div></article>
    </SimplePage>
  );
}
