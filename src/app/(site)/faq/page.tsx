import type { Metadata } from "next";
import Link from "next/link";
import { Question, WhatsappLogo, HandsPraying, ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import { SimplePage } from "@/components/SimplePage";
import { FaqSearchForm } from "@/components/FaqSearchForm";
import { FAQ_CATEGORIES, PUBLISHED_QUESTIONS, faqHref } from "@/lib/faq";
import { MINISTRY, absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "FAQs: Prayer, Services and Giving | VOGIM Prayer Land",
  description: "Answers about VOGIM Prayer Land: free prayer requests, Zoom services, deliverance sessions, healing prayer, safe giving and how requests are kept private.",
  alternates: { canonical: absoluteUrl("/faq/") },
};

const POPULAR = [
  "is-it-free",
  "how-do-i-join-a-service",
  "when-are-the-services",
  "is-my-request-private",
  "how-does-a-session-work",
  "should-i-keep-seeing-my-doctor",
  "which-channel-is-official",
  "how-do-i-delete-my-data",
];

export default function FaqHubPage() {
  const popular = POPULAR.map((slug) => PUBLISHED_QUESTIONS.find((q) => q.slug === slug)).filter((q) => q !== undefined);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "VOGIM Prayer Land FAQ categories",
    itemListElement: FAQ_CATEGORIES.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: `${c.name} FAQs`, url: absoluteUrl(`/faq/${c.slug}/`) })),
  };
  return (
    <SimplePage
      eyebrow="Frequently asked questions"
      title="VOGIM Prayer Land FAQs: answers for visitors, requesters and givers"
      intro="Find plain answers about sending a free prayer request, joining an online service on Zoom, deliverance sessions, healing prayer and giving safely. Every answer comes from the ministry's own published information."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FaqSearchForm />

      <section className="mt-12">
        <h2 className="font-display text-3xl text-maroon">Browse by topic</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {FAQ_CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/faq/${c.slug}/`} className="flex min-h-full items-start gap-4 rounded-2xl border border-soft bg-white p-5 hover:border-maroon">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream text-maroon"><Question size={24} weight="duotone" aria-hidden="true" /></span>
                <span>
                  <span className="block font-semibold text-maroon">{c.name}</span>
                  <span className="block text-sm text-slate">{c.questions.length} {c.questions.length === 1 ? "question" : "questions"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl text-maroon">Popular questions</h2>
        <ul className="mt-5 space-y-2">
          {popular.map((q) => (
            <li key={q.slug}><Link href={faqHref(q)} className="inline-flex min-h-11 items-center text-maroon underline underline-offset-4">{q.question}</Link></li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl bg-mist p-6">
        <h2 className="font-display text-3xl text-maroon">Still need help?</h2>
        <p className="mt-2 text-slate">Ask the team directly. Prayer, deliverance and counselling are free.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/prayer-request/" className="btn-gold" data-cta-id="faq-hub-prayer"><HandsPraying size={22} weight="duotone" aria-hidden="true" />Request prayer</Link>
          <a href={MINISTRY.whatsapp} target="_blank" rel="noreferrer" className="btn-ghost" data-cta-id="faq-hub-whatsapp"><WhatsappLogo size={22} aria-hidden="true" />Message us on WhatsApp</a>
          <Link href="/contact/" className="btn-ghost"><ChatCircleText size={22} weight="duotone" aria-hidden="true" />Contact</Link>
        </div>
      </section>
    </SimplePage>
  );
}
