import type { Metadata } from "next";
import Link from "next/link";
import { Plant } from "@phosphor-icons/react/dist/ssr";
import { SimplePage } from "@/components/SimplePage";
import { absoluteUrl } from "@/lib/ministry";

// noindex until real outreach photos with written consent exist (brief 10.11).
export const metadata: Metadata = {
  title: "Outreach to Widows and Orphans | VOGIM Prayer Land",
  description: "VOGIM Prayer Land has committed to reaching widows, orphans and orphanages. Photos and details of outreach will be added once consent is in place.",
  alternates: { canonical: absoluteUrl("/outreach/") },
  robots: { index: false, follow: true },
};

export default function OutreachPage() {
  return (
    <SimplePage eyebrow="Outreach" title="Outreach to widows and orphans" intro="VOGIM Prayer Land has committed to reaching widows, orphans and orphanages.">
      <section className="rounded-2xl bg-mist p-6 text-center">
        <Plant size={40} weight="duotone" className="mx-auto text-maroon" aria-hidden="true" />
        <p className="mt-4 text-slate">Photos from our outreach will be added here soon.</p>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-3xl text-maroon">How we share outreach photos</h2>
        <p className="mt-3 text-slate">We publish no identifiable image of a child, and no image of a widow, without written consent from the person, their guardian or the institution responsible. We do not name children or publish the locations of children&apos;s homes.</p>
        <p className="mt-3 text-slate">To support this work, see the <Link href="/give/" className="text-maroon underline">official Give page</Link>. Giving is voluntary.</p>
      </section>
    </SimplePage>
  );
}
