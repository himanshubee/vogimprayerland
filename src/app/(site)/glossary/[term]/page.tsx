import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HandsPraying } from "@phosphor-icons/react/dist/ssr";
import { SimplePage } from "@/components/SimplePage";
import { GLOSSARY_PUBLISHED, GLOSSARY_TERMS, GLOSSARY_UPDATED } from "@/lib/owner-content";
import { PAGE_LINK_LABELS } from "@/lib/faq";
import { absoluteUrl } from "@/lib/ministry";

export const dynamicParams = false;

export function generateStaticParams() {
  // Next needs at least one param for a static route; an unpublished glossary yields a 404 placeholder.
  return GLOSSARY_PUBLISHED ? GLOSSARY_TERMS.map((t) => ({ term: t.slug })) : [{ term: "unpublished" }];
}

type Props = { params: Promise<{ term: string }> };
const find = (slug: string) => (GLOSSARY_PUBLISHED ? GLOSSARY_TERMS.find((t) => t.slug === slug) ?? null : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const term = find((await params).term);
  if (!term) return { robots: { index: false, follow: false } };
  return {
    title: `What is ${term.term}? | VOGIM Prayer Land`,
    description: term.definition.slice(0, 160),
    alternates: { canonical: absoluteUrl(`/glossary/${term.slug}/`) },
  };
}

export default async function GlossaryTermPage({ params }: Props) {
  const term = find((await params).term);
  if (!term) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.definition,
    url: absoluteUrl(`/glossary/${term.slug}/`),
    inDefinedTermSet: absoluteUrl("/glossary/"),
  };
  return (
    <SimplePage eyebrow="Glossary" title={`What is ${term.term}?`} intro={term.definition}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="space-y-4 text-slate">{term.explanation.map((p) => <p key={p}>{p}</p>)}</div>
      <section className="mt-10">
        <h2 className="font-display text-3xl text-maroon">Related pages</h2>
        <ul className="mt-4 space-y-2">
          {term.related_pages.map((href) => <li key={href}><Link href={href} className="inline-flex min-h-11 items-center text-maroon underline underline-offset-4">{PAGE_LINK_LABELS[href] ?? href}</Link></li>)}
          <li><Link href="/faq/" className="inline-flex min-h-11 items-center text-maroon underline underline-offset-4">Frequently asked questions</Link></li>
          <li><Link href="/glossary/" className="inline-flex min-h-11 items-center text-maroon underline underline-offset-4">All glossary terms</Link></li>
        </ul>
      </section>
      <div className="mt-10 text-center">
        <Link href="/prayer-request/" className="btn-gold" data-cta-id="glossary-prayer"><HandsPraying size={22} weight="duotone" aria-hidden="true" />Request prayer</Link>
      </div>
      <p className="mt-10 text-sm text-slate">Last updated {new Date(GLOSSARY_UPDATED).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
    </SimplePage>
  );
}
