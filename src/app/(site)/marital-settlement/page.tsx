import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Heart, BookOpen, HandHeart, Hourglass, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { getPageContent } from "@/lib/page-content";
import { RichText } from "@/components/RichText";

export const metadata = {
  alternates: { canonical: "/marital-settlement/" },
  title: "Prayer for Marital Settlement — VOGIM",
  description:
    "A guide to finding divine guidance and peace in your marital journey. Through prayer and spiritual counsel, VOGIM helps individuals navigate the complexities of marriage.",
};

export const revalidate = 300;

export default async function MaritalSettlementPage() {
  const c = await getPageContent("marital-settlement");

  const POINTS = [
    {
      icon: BookOpen,
      title: c.point1Title,
      body: c.point1Body,
    },
    {
      icon: HandHeart,
      title: c.point2Title,
      body: c.point2Body,
    },
    {
      icon: Hourglass,
      title: c.point3Title,
      body: c.point3Body,
    },
    {
      icon: Sparkles,
      title: c.point4Title,
      body: c.point4Body,
    },
  ];

  const PRAYERS = [
    {
      title: c.prayer1Title,
      body: c.prayer1Body,
    },
    {
      title: c.prayer2Title,
      body: c.prayer2Body,
    },
    {
      title: c.prayer3Title,
      body: c.prayer3Body,
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
          ref: "Proverbs 18:22",
          text: "Whoso findeth a wife findeth a good thing, and obtaineth favour of the Lord.",
        }}
      />

      {/* INTRO with image */}
      <section className="bg-white paper-grain">
        <div className="mx-auto max-w-7xl px-6 py-24 grid lg:grid-cols-[1fr_1fr] gap-14 items-center">
          <Reveal>
            <div className="relative aspect-[5/4] max-w-lg">
              <div className="absolute -inset-3 border border-gold/40" />
              <Image
                src={c.introImage}
                alt="A couple in conversation — restored and at peace"
                fill
                className="object-cover relative"
                sizes="(max-width: 1024px) 80vw, 500px"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-display text-2xl md:text-3xl text-midnight leading-snug">
              <RichText text={c.introBody} accentClass="italic text-gold-deep" />
            </p>
          </Reveal>
        </div>
      </section>

      {/* HOW PRAYER HELPS */}
      <section className="bg-ivory-dark">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.howEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-5 leading-tight max-w-3xl">
              <RichText text={c.howTitle} accentClass="italic" />
            </h2>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-midnight/15">
            {POINTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 0.07}>
                  <div className="bg-ivory-dark p-8 lg:p-10 h-full">
                    <Icon className="text-gold-deep" size={28} />
                    <h3 className="font-display text-2xl text-midnight mt-6">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-midnight/70 leading-relaxed text-sm">
                      {p.body}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRAYER POINTS */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-30" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow text-gold">
              <span className="gold-rule mr-3" />
              {c.prayersEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl mt-5 leading-tight">
              <RichText text={c.prayersTitle} accentClass="italic text-gold" />
            </h2>
          </Reveal>

          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {PRAYERS.map((pr, i) => (
              <Reveal key={pr.title} delay={i * 0.08}>
                <article className="relative border border-ivory/15 p-7 h-full">
                  <Heart className="text-gold mb-4" size={22} />
                  <h3 className="font-display text-2xl text-ivory leading-tight">
                    {pr.title}
                  </h3>
                  <p className="mt-4 text-ivory/80 leading-relaxed font-display italic text-lg">
                    &ldquo;{pr.body}&rdquo;
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VOGIM HELP */}
      <section className="bg-ivory">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32 grid lg:grid-cols-[1fr_1fr] gap-16 items-start">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.helpEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-5 leading-tight">
              <RichText text={c.helpTitle} accentClass="italic" />
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              {c.helpBody}
            </p>
            <Link href={c.helpButtonHref} className="btn-gold mt-8">
              {c.helpButtonLabel}
              <ArrowUpRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="space-y-5">
              {[
                [c.feature1Title, c.feature1Body],
                [c.feature2Title, c.feature2Body],
                [c.feature3Title, c.feature3Body],
                [c.feature4Title, c.feature4Body],
              ].map(([title, body]) => (
                <li
                  key={title}
                  className="flex gap-5 border-b border-midnight/15 pb-5 last:border-0"
                >
                  <span className="font-display text-3xl text-gold-deep mt-1">
                    +
                  </span>
                  <div>
                    <p className="font-display text-2xl text-midnight">
                      {title}
                    </p>
                    <p className="text-midnight/70 mt-1">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-midnight-dark text-ivory overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(201,162,75,0.25) 0%, transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05]">
            <RichText text={c.ctaTitle} accentClass="italic text-gold" />
          </h2>
          <p className="mt-6 text-ivory/70 max-w-xl mx-auto">
            {c.ctaBody}
          </p>
          <Link
            href={c.ctaButtonHref}
            className="btn-gold mt-10 inline-flex"
          >
            {c.ctaButtonLabel}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
