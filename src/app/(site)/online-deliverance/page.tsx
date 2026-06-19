import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Shield,
  Globe2,
  HeartPulse,
  Eye,
  Hourglass,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { getPageContent, getPageMeta } from "@/lib/page-content";
import { RichText } from "@/components/RichText";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMeta("online-deliverance");
}

export const revalidate = 300;

export default async function OnlineDeliverancePage() {
  const c = await getPageContent("online-deliverance");

  const WHY = [
    { icon: Globe2, title: c.why1Title, body: c.why1Body },
    { icon: Shield, title: c.why2Title, body: c.why2Body },
    { icon: HeartPulse, title: c.why3Title, body: c.why3Body },
    { icon: Flame, title: c.why4Title, body: c.why4Body },
  ];

  const STEPS = [
    [c.step1Num, c.step1Title, c.step1Body],
    [c.step2Num, c.step2Title, c.step2Body],
    [c.step3Num, c.step3Title, c.step3Body],
    [c.step4Num, c.step4Title, c.step4Body],
  ];

  const SIGNS = [
    c.sign1,
    c.sign2,
    c.sign3,
    c.sign4,
    c.sign5,
    c.sign6,
    c.sign7,
    c.sign8,
  ];

  return (
    <>
      <PageHeader
        image={c.heroImage}
        eyebrow={c.heroEyebrow}
        title={<RichText text={c.heroTitle} />}
        intro={c.heroIntro}
        scripture={{
          ref: "Luke 4:18",
          text: "He hath sent me to heal the brokenhearted, to preach deliverance to the captives.",
        }}
      />

      {/* INTRO with image */}
      <section className="bg-white paper-grain">
        <div className="mx-auto max-w-7xl px-6 py-24 grid lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          <Reveal>
            <p className="font-display text-2xl md:text-3xl text-midnight leading-snug">
              <RichText text={c.introParagraph} accentClass="italic text-gold-deep" />
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative aspect-[4/5] max-w-sm mx-auto">
              <div className="absolute -inset-3 border border-gold/40" />
              <Image
                src={c.introImage}
                alt="An online deliverance session — candle-lit and Spirit-led"
                fill
                className="object-cover relative"
                sizes="(max-width: 1024px) 80vw, 400px"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* WHY VOGIM */}
      <section className="bg-ivory-dark">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.whyEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-5 leading-tight max-w-3xl">
              <RichText text={c.whyTitle} accentClass="italic" />
            </h2>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-midnight/15">
            {WHY.map((w, i) => {
              const Icon = w.icon;
              return (
                <Reveal key={w.title} delay={i * 0.07}>
                  <div className="bg-ivory-dark p-8 lg:p-10 h-full">
                    <Icon className="text-gold-deep" size={28} />
                    <h3 className="font-display text-2xl text-midnight mt-6">
                      {w.title}
                    </h3>
                    <p className="mt-3 text-midnight/70 leading-relaxed text-sm">
                      {w.body}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow text-gold">
              <span className="gold-rule mr-3" />
              {c.processEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl mt-5 leading-tight max-w-3xl">
              <RichText text={c.processTitle} accentClass="italic text-gold" />
            </h2>
          </Reveal>

          <ol className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(([num, title, body], i) => (
              <Reveal key={num} delay={i * 0.08}>
                <li className="relative">
                  <div className="absolute -top-1 left-0 h-px w-12 bg-gold" />
                  <p className="font-display text-5xl text-gold mt-4">{num}</p>
                  <h3 className="font-display text-2xl mt-3">{title}</h3>
                  <p className="mt-3 text-ivory/70 leading-relaxed">{body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* WHAT TO EXPECT */}
      <section className="bg-ivory">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32 grid lg:grid-cols-[1fr_1.2fr] gap-16">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.expectEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-5 leading-tight">
              <RichText text={c.expectTitle} accentClass="italic" />
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              {c.expectBody}
            </p>
            <Link href={c.expectButtonHref} className="btn-gold mt-8">
              {c.expectButtonLabel}
              <ArrowUpRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border border-midnight/15 p-8 lg:p-10 bg-ivory">
              <p className="eyebrow text-gold-deep">
                <Eye className="inline mr-2 -mt-1" size={14} />
                {c.signsLabel}
              </p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {SIGNS.map((s) => (
                  <li
                    key={s}
                    className="flex gap-3 text-sm text-midnight/85 leading-snug"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 text-gold-deep shrink-0"
                    />
                    {s}
                  </li>
                ))}
              </ul>
              <div className="diamond-rule mt-8 text-gold-deep">
                <Hourglass size={14} />
              </div>
              <p className="text-midnight/70 mt-5 text-sm italic">
                {c.signsFootnote}
              </p>
            </div>
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
