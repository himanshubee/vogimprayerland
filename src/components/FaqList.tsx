import Link from "next/link";
import { Question } from "@phosphor-icons/react/dist/ssr";
import { PUBLISHED_QUESTIONS, faqHref } from "@/lib/faq";

export type Faq = { question: string; answer: string };

/** relatedPath links up to five deeper answers from the FAQ hub that point back at this page. */
export function FaqList({ faqs, title = "Frequently asked questions", relatedPath }: { faqs: Faq[]; title?: string; relatedPath?: string }) {
  if (!faqs.length) return null;
  // Questions repeated on the page still link out: the FAQ page carries the fuller answer and next steps.
  const more = relatedPath
    ? PUBLISHED_QUESTIONS.filter((q) => q.related_pages.includes(relatedPath) || q.request_page === relatedPath).slice(0, 5)
    : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  return (
    <section className="bg-mist">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="flex items-center justify-center gap-3 text-maroon">
          <Question size={28} weight="duotone" aria-hidden="true" />
          <h2 className="text-center font-display text-3xl sm:text-4xl">{title}</h2>
        </div>
        <div className="mt-8 space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-2xl border border-soft bg-white p-5">
              <summary className="min-h-11 font-semibold text-maroon">{faq.question}</summary>
              <p className="mt-3 text-slate">{faq.answer}</p>
            </details>
          ))}
        </div>
        {more.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-maroon">Fuller answers</h3>
            <ul className="mt-3 space-y-1">
              {more.map((q) => <li key={q.slug}><Link href={faqHref(q)} className="inline-flex min-h-11 items-center text-maroon underline underline-offset-4">{q.question}</Link></li>)}
              <li><Link href="/faq/" className="inline-flex min-h-11 items-center text-maroon underline underline-offset-4">All FAQs</Link></li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
