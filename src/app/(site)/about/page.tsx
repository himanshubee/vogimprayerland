import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Cross } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { RichText } from "@/components/RichText";
import { getPageContent, getPageMeta } from "@/lib/page-content";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMeta("about");
}

export const revalidate = 300;

export default async function AboutPage() {
  const c = await getPageContent("about");

  const pillars = [
    { no: "I", title: c.pillar1Title, body: c.pillar1Body },
    { no: "II", title: c.pillar2Title, body: c.pillar2Body },
    { no: "III", title: c.pillar3Title, body: c.pillar3Body },
  ];

  return (
    <>
      <PageHeader
        image={c.heroImage}
        eyebrow={c.heroEyebrow}
        title={<RichText text={c.heroTitle} />}
        intro={c.heroIntro}
      />

      {/* INTRO + IMAGE */}
      <section className="relative bg-ivory">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-16 sm:py-24 lg:py-32 grid lg:grid-cols-[1.1fr_1fr] gap-12 sm:gap-16 items-start">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.storyEyebrow}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-midnight mt-5 leading-[1.05]">
              <RichText text={c.storyTitle} accentClass="italic" />
            </h2>
            <div className="mt-6 sm:mt-8 space-y-5 text-midnight/80 leading-relaxed text-base sm:text-lg">
              <p className="drop-cap">{c.storyPara1}</p>
              <p>{c.storyPara2}</p>
              <p>{c.storyPara3}</p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative aspect-[4/5] max-w-[18rem] sm:max-w-sm mx-auto lg:sticky lg:top-32">
              <div className="absolute -inset-3 sm:-inset-4 border border-gold/50" />
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src={c.storyImage}
                  alt="Prophet Olaofe Oladele"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 70vw, (max-width: 1024px) 50vw, 380px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 text-white">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-gold">
                    {c.founderRole}
                  </p>
                  <p className="font-display text-2xl sm:text-3xl mt-2 leading-tight">
                    {c.founderName}
                  </p>
                  <p className="mt-2 sm:mt-3 text-white/80 text-xs sm:text-sm italic font-display">
                    {c.founderTagline}
                  </p>
                </div>
              </div>
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 sm:w-10 sm:h-10 border border-gold/70 bg-midnight/70 backdrop-blur flex items-center justify-center text-gold">
                <Cross size={18} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* MISSION + VISION */}
      <section className="relative bg-ivory-dark">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-16 sm:py-24 lg:py-32 grid md:grid-cols-2 gap-px bg-midnight/15">
          <Reveal>
            <div className="bg-ivory-dark p-7 sm:p-10 lg:p-14">
              <p className="eyebrow text-gold-deep">Mission Statement</p>
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl text-midnight mt-4 leading-tight">
                <RichText text={c.missionTitle} accentClass="italic" />
              </h3>
              <p className="mt-5 sm:mt-6 text-midnight/80 leading-relaxed text-sm sm:text-base">
                {c.missionPara1}
              </p>
              <p className="mt-4 text-midnight/80 leading-relaxed text-sm sm:text-base">
                {c.missionPara2}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="bg-midnight text-ivory p-7 sm:p-10 lg:p-14 h-full">
              <p className="eyebrow text-gold">Our Vision</p>
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl mt-4 leading-tight">
                <RichText text={c.visionTitle} />
              </h3>
              <p className="mt-5 sm:mt-6 text-ivory/80 leading-relaxed text-sm sm:text-base">
                {c.visionPara}
              </p>
              <figure className="mt-8 sm:mt-10 border-l-2 border-gold pl-4 sm:pl-5">
                <blockquote className="font-display italic text-lg sm:text-xl text-ivory/95 leading-snug">
                  &ldquo;{c.visionScripture}&rdquo;
                </blockquote>
                <figcaption className="mt-3 text-[10px] tracking-[0.32em] uppercase text-gold">
                  {c.visionScriptureRef}
                </figcaption>
              </figure>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PILLARS */}
      <section className="relative bg-ivory paper-grain">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-16 sm:py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              Three Pillars
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-midnight mt-5 leading-[1.05] max-w-2xl">
              The threefold work of the
              <span className="italic"> ministry.</span>
            </h2>
          </Reveal>

          <div className="mt-10 sm:mt-14 grid md:grid-cols-3 gap-px bg-midnight/15">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <article className="bg-ivory p-7 sm:p-10 h-full flex flex-col">
                  <span className="font-display text-5xl sm:text-6xl text-gold-deep/90">
                    {p.no}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl text-midnight mt-5 sm:mt-6">
                    {p.title}
                  </h3>
                  <p className="mt-3 sm:mt-4 text-midnight/70 leading-relaxed flex-1 text-sm sm:text-base">
                    {p.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-6 py-16 sm:py-20 lg:py-28 text-center">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight">
            <RichText text={c.ctaTitle} />
          </h2>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-5 justify-center items-center">
            <Link href="/deliverance-request" className="btn-gold w-full sm:w-auto justify-center">
              Request deliverance
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="btn-ghost text-ivory border-ivory/40 hover:text-midnight w-full sm:w-auto justify-center"
            >
              Visit the church
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
