import type { Metadata } from "next";
import { SimplePage } from "@/components/SimplePage";
import { absoluteUrl } from "@/lib/ministry";
import { TESTIMONIES } from "@/lib/testimonies";
import { TestimonyList } from "@/components/TestimonyList";

export const metadata: Metadata = {
  title: "Testimonies | VOGIM Prayer Land",
  description: "Read personal accounts shared with VOGIM Prayer Land. Testimonies are published only with consent and are not promises of the same result for another person.",
  alternates: { canonical: absoluteUrl("/testimonies/") },
  robots: { index: TESTIMONIES.length > 0, follow: true },
};

export default function TestimoniesPage() {
  return (
    <SimplePage eyebrow="Personal accounts" title="Testimonies from VOGIM Prayer Land" intro="Testimonies are personal accounts, not promises of the same result. They are published only with the person's written consent and in the form of name they have chosen.">
      {TESTIMONIES.length > 0 ? <TestimonyList /> : <section className="rounded-2xl bg-mist p-6 text-slate"><h2 className="font-display text-2xl text-maroon">Consent comes first</h2><p className="mt-2">No testimony is displayed without a consent record. A request or story sent privately to the ministry is never published automatically.</p></section>}
    </SimplePage>
  );
}
