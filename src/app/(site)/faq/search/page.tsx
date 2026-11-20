import type { Metadata } from "next";
import Link from "next/link";
import { SimplePage } from "@/components/SimplePage";
import { FaqSearchForm } from "@/components/FaqSearchForm";
import { faqHref, searchFaq } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Search the FAQs | VOGIM Prayer Land",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function FaqSearchPage({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const term = (Array.isArray(raw) ? raw[0] : raw ?? "").slice(0, 100).trim();
  const results = term ? searchFaq(term) : [];
  return (
    <SimplePage eyebrow="FAQs" title="Search the FAQs" intro="Search answers about prayer requests, services, deliverance, healing, giving and privacy.">
      <FaqSearchForm defaultValue={term} />
      <section className="mt-10" aria-live="polite">
        {term && <h2 className="font-display text-3xl text-maroon">{results.length ? `${results.length} ${results.length === 1 ? "answer" : "answers"} found` : "No answers found"}</h2>}
        {term && !results.length && <p className="mt-3 text-slate">Try another word, <Link href="/faq/" className="text-maroon underline">browse all FAQs</Link>, or <Link href="/contact/" className="text-maroon underline">ask the team</Link>.</p>}
        <ul className="mt-5 space-y-4">
          {results.map((q) => (
            <li key={`${q.category}/${q.slug}`} className="rounded-2xl border border-soft bg-white p-5">
              <Link href={faqHref(q)} className="font-semibold text-maroon underline underline-offset-4">{q.question}</Link>
              <p className="mt-2 text-slate">{q.short_answer}</p>
            </li>
          ))}
        </ul>
      </section>
    </SimplePage>
  );
}
