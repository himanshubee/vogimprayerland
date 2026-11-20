import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HandsPraying } from "@phosphor-icons/react/dist/ssr";
import { SimplePage } from "@/components/SimplePage";
import { FAQ_CATEGORIES, faqHref, getCategory, metaDescription } from "@/lib/faq";
import { absoluteUrl } from "@/lib/ministry";

export const dynamicParams = false;

export function generateStaticParams() {
  return FAQ_CATEGORIES.map((c) => ({ category: c.slug }));
}

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategory((await params).category);
  if (!category) return {};
  return {
    title: `${category.name} FAQs | VOGIM Prayer Land`,
    description: metaDescription(category.intro),
    alternates: { canonical: absoluteUrl(`/faq/${category.slug}/`) },
  };
}

export default async function FaqCategoryPage({ params }: Props) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: category.questions.map((q) => ({ "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: q.short_answer } })),
  };
  const others = FAQ_CATEGORIES.filter((c) => c.slug !== category.slug);
  return (
    <SimplePage eyebrow="FAQs" title={`${category.name} FAQs`} intro={category.intro}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="space-y-3">
        {category.questions.map((q) => (
          <details key={q.slug} data-faq-id={`${q.category}/${q.slug}`} className="rounded-2xl border border-soft bg-white p-5">
            <summary className="min-h-11 font-semibold text-maroon">{q.question}</summary>
            <p className="mt-3 text-slate">{q.short_answer}</p>
            <Link href={faqHref(q)} className="mt-3 inline-flex min-h-11 items-center text-maroon underline underline-offset-4">Read the full answer →</Link>
          </details>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-display text-3xl text-maroon">Related topics</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {others.map((c) => <li key={c.slug}><Link href={`/faq/${c.slug}/`} className="btn-ghost">{c.name}</Link></li>)}
          <li><Link href="/faq/" className="btn-ghost">All FAQs</Link></li>
        </ul>
      </section>

      <div className="mt-12 text-center">
        <Link href="/prayer-request/" className="btn-gold" data-cta-id="faq-category-prayer"><HandsPraying size={22} weight="duotone" aria-hidden="true" />Request prayer</Link>
        <p className="mt-3 text-sm text-slate">Free · Private</p>
      </div>
    </SimplePage>
  );
}
