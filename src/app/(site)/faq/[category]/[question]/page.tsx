import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HandsPraying } from "@phosphor-icons/react/dist/ssr";
import { SimplePage } from "@/components/SimplePage";
import { FaqHelpful } from "@/components/FaqHelpful";
import { FAQ_UPDATED, PAGE_LINK_LABELS, PUBLISHED_QUESTIONS, REQUEST_LABELS, faqHref, getCategory, getQuestion, metaDescription, relatedQuestions } from "@/lib/faq";
import { absoluteUrl } from "@/lib/ministry";

export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLISHED_QUESTIONS.map((q) => ({ category: q.category, question: q.slug }));
}

type Props = { params: Promise<{ category: string; question: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, question } = await params;
  const q = getQuestion(category, question);
  if (!q) return {};
  const title = `${q.question} | VOGIM Prayer Land`;
  return {
    title: title.length <= 60 ? title : `${q.question} | VOGIM`,
    description: metaDescription(q.short_answer),
    alternates: { canonical: absoluteUrl(faqHref(q)) },
  };
}

export default async function FaqQuestionPage({ params }: Props) {
  const { category: categorySlug, question } = await params;
  const q = getQuestion(categorySlug, question);
  const category = getCategory(categorySlug);
  if (!q || !category) notFound();
  const related = relatedQuestions(q);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    dateModified: FAQ_UPDATED,
    mainEntity: [{ "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: [q.short_answer, ...q.full_answer].join(" ") } }],
  };
  return (
    <SimplePage eyebrow={`${category.name} FAQs`} title={q.question} intro="">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section aria-label="Short answer" className="rounded-2xl border-l-4 border-gold bg-cream p-6 text-lg leading-8">
        <p>{q.short_answer}</p>
      </section>
      {q.full_answer.length > 0 && (
        <section className="mt-8 space-y-4 text-slate">
          {q.full_answer.map((p) => <p key={p}>{p}</p>)}
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-3xl text-maroon">Where to go next</h2>
        <ul className="mt-4 space-y-2">
          {q.related_pages.map((href) => (
            <li key={href}><Link href={href} className="inline-flex min-h-11 items-center text-maroon underline underline-offset-4">{PAGE_LINK_LABELS[href] ?? href}</Link></li>
          ))}
          <li><Link href={`/faq/${category.slug}/`} className="inline-flex min-h-11 items-center text-maroon underline underline-offset-4">More {category.name.toLowerCase()} questions</Link></li>
        </ul>
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-3xl text-maroon">Related questions</h2>
          <ul className="mt-4 space-y-2">
            {related.map((r) => <li key={r.slug}><Link href={faqHref(r)} className="inline-flex min-h-11 items-center text-maroon underline underline-offset-4">{r.question}</Link></li>)}
          </ul>
        </section>
      )}

      <div className="mt-10 rounded-2xl bg-mist p-6"><FaqHelpful questionId={`${q.category}/${q.slug}`} /></div>

      <div className="mt-10 text-center">
        <Link href={q.request_page} className="btn-gold" data-cta-id="faq-question-request"><HandsPraying size={22} weight="duotone" aria-hidden="true" />{REQUEST_LABELS[q.request_page] ?? "Request prayer"}</Link>
        <p className="mt-3 text-sm text-slate">Free · Private</p>
      </div>
      <p className="mt-10 text-sm text-slate">Last updated {new Date(FAQ_UPDATED).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
    </SimplePage>
  );
}
