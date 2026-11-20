import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SimplePage } from "@/components/SimplePage";
import { GLOSSARY_PUBLISHED, GLOSSARY_TERMS } from "@/lib/owner-content";
import { absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = GLOSSARY_PUBLISHED
  ? {
      title: "Glossary of Ministry Terms | VOGIM Prayer Land",
      description: "Plain explanations of words used at VOGIM Prayer Land, from deliverance and intercession to WAT service times. Free, private prayer is always available.",
      alternates: { canonical: absoluteUrl("/glossary/") },
    }
  : { robots: { index: false, follow: false } };

export default function GlossaryPage() {
  if (!GLOSSARY_PUBLISHED) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "VOGIM Prayer Land glossary",
    url: absoluteUrl("/glossary/"),
    hasDefinedTerm: GLOSSARY_TERMS.map((t) => ({ "@type": "DefinedTerm", name: t.term, description: t.definition, url: absoluteUrl(`/glossary/${t.slug}/`) })),
  };
  return (
    <SimplePage eyebrow="Glossary" title="Glossary of ministry terms" intro="Short, plain explanations of words you will meet on this website and in our services.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <dl className="space-y-6">
        {GLOSSARY_TERMS.map((t) => (
          <div key={t.slug} className="rounded-2xl border border-soft bg-white p-5">
            <dt><Link href={`/glossary/${t.slug}/`} className="font-semibold text-maroon underline underline-offset-4">{t.term}</Link></dt>
            <dd className="mt-2 text-slate">{t.definition}</dd>
          </div>
        ))}
      </dl>
    </SimplePage>
  );
}
