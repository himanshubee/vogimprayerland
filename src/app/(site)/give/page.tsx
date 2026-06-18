import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ArrowUpRight, HandHeart, Sprout, HomeIcon } from "lucide-react";
import { getPageContent } from "@/lib/page-content";
import { RichText } from "@/components/RichText";

export const metadata = {
  alternates: { canonical: "/give/" },
  title: "Give — VOGIM Prayer Land",
  description:
    "Partner with VOGIM. Give to support the work of deliverance, healing, and care for widows and orphans.",
};

export const revalidate = 300;

export default async function GivePage() {
  const c = await getPageContent("give");
  const AMOUNTS = [c.amount1, c.amount2, c.amount3, c.amount4, c.amount5];
  const AREAS = [
    {
      icon: HandHeart,
      title: c.area1Title,
      body: c.area1Body,
    },
    {
      icon: Sprout,
      title: c.area2Title,
      body: c.area2Body,
    },
    {
      icon: HomeIcon,
      title: c.area3Title,
      body: c.area3Body,
    },
  ];
  return (
    <>
      <PageHeader
        image={c.heroImage}
        eyebrow={c.heroEyebrow}
        title={<RichText text={c.heroTitle} />}
        intro={c.heroIntro}
        scripture={{
          ref: "2 Corinthians 9:7",
          text: "God loveth a cheerful giver.",
        }}
      />

      {/* GIVE CARD */}
      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-start">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.giveEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              <RichText text={c.giveTitle} accentClass="italic" />
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              {c.giveIntro}
            </p>

            <div className="mt-10 flex flex-wrap gap-3 items-center">
              {AMOUNTS.map((a) => (
                <span
                  key={a}
                  className="px-5 py-3 border border-midnight/20 font-display text-xl text-midnight hover:bg-midnight hover:text-gold transition-colors cursor-pointer"
                >
                  ${a}
                </span>
              ))}
              <span className="px-5 py-3 border border-midnight/20 font-display text-xl italic text-midnight/70">
                {c.amountOther}
              </span>
            </div>

            <Link
              href={c.giveButtonHref}
              className="btn-gold mt-10"
              target="_blank"
              rel="noreferrer"
            >
              {c.giveButtonLabel}
              <ArrowUpRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border border-midnight/15 bg-ivory p-8">
              <p className="eyebrow text-gold-deep">{c.pledgeEyebrow}</p>
              <h3 className="font-display text-3xl text-midnight mt-3 leading-tight">
                {c.pledgeTitle}
              </h3>
              <ul className="mt-6 space-y-5">
                {AREAS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <li key={a.title} className="flex gap-4">
                      <Icon className="text-gold-deep shrink-0 mt-1" size={22} />
                      <div>
                        <p className="font-display text-xl text-midnight">{a.title}</p>
                        <p className="text-midnight/70 text-sm leading-relaxed mt-1">
                          {a.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* THANK YOU STRIP */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-display italic text-3xl md:text-4xl leading-snug">
            {c.thankQuote}
          </p>
          <p className="mt-4 text-[11px] tracking-[0.32em] uppercase text-gold">
            {c.thankRef}
          </p>
        </div>
      </section>
    </>
  );
}
