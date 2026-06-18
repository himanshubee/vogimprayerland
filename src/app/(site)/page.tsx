import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Flame,
  HeartHandshake,
  Sparkles,
  MoonStar,
  Cross,
  Quote,
  Clock,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { RichText } from "@/components/RichText";
import { getPageContent } from "@/lib/page-content";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 300;

export default async function Home() {
  const c = await getPageContent("home");

  const ministries = [
    { icon: Flame, title: c.ministry1Title, body: c.ministry1Body, href: c.ministry1Href },
    { icon: HeartHandshake, title: c.ministry2Title, body: c.ministry2Body, href: c.ministry2Href },
    { icon: Sparkles, title: c.ministry3Title, body: c.ministry3Body, href: c.ministry3Href },
    { icon: MoonStar, title: c.ministry4Title, body: c.ministry4Body, href: c.ministry4Href },
  ];
  const testimonies = [
    { text: c.testimony1Text, name: c.testimony1Name, place: c.testimony1Place },
    { text: c.testimony2Text, name: c.testimony2Name, place: c.testimony2Place },
    { text: c.testimony3Text, name: c.testimony3Name, place: c.testimony3Place },
  ];
  const stats: [string, string][] = [
    [c.stat1Num, c.stat1Label],
    [c.stat2Num, c.stat2Label],
    [c.stat3Num, c.stat3Label],
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative bg-midnight text-white overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src={c.heroImage}
            alt=""
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 hero-tint" />
        </div>
        <div className="absolute inset-0 starfield opacity-40" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full breathe"
          style={{
            background:
              "radial-gradient(circle, rgba(212,164,55,0.18) 0%, transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-28 lg:pt-28 lg:pb-36">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 items-center">
            <div>
              <Reveal>
                <p className="eyebrow text-gold">
                  <span className="gold-rule mr-3" />
                  {c.heroEyebrow}
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <h1 className="font-display mt-7 text-6xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight">
                  <RichText text={c.heroTitle} />
                </h1>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/85">
                  {c.heroIntro}
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <Link href={c.heroPrimaryHref} className="btn-gold">
                    {c.heroPrimaryCta}
                    <ArrowUpRight size={16} />
                  </Link>
                  <Link
                    href={c.heroSecondaryHref}
                    className="text-sm tracking-widest uppercase text-white/90 u-link"
                  >
                    {c.heroSecondaryCta}
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.35} y={32}>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-gold/40 via-transparent to-transparent blur-2xl" />
                <div className="relative border border-gold/40 bg-midnight-dark/80 backdrop-blur p-10">
                  <Cross className="text-gold mb-6" size={28} />
                  <p className="font-display italic text-2xl leading-snug text-white">
                    {c.heroScripture}
                  </p>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-xs tracking-[0.3em] uppercase text-gold">
                      {c.heroScriptureRef}
                    </span>
                    <span className="text-xs text-white/40 font-mono">
                      Daily Word
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="border border-white/15 bg-midnight-dark/60 backdrop-blur p-5">
                    <Clock className="text-gold mb-3" size={16} />
                    <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">{c.schedule1Day}</p>
                    <p className="font-display text-xl mt-1 text-white">{c.schedule1Time} <span className="text-gold text-sm">{c.scheduleZone}</span></p>
                  </div>
                  <div className="border border-gold/40 bg-gold/15 backdrop-blur p-5">
                    <Clock className="text-gold mb-3" size={16} />
                    <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{c.schedule2Day}</p>
                    <p className="font-display text-xl mt-1 text-white">{c.schedule2Time} <span className="text-gold text-sm">{c.scheduleZone}</span></p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-midnight-dark/70 backdrop-blur">
          <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap gap-x-10 gap-y-2 text-[11px] tracking-[0.3em] uppercase text-white/70">
            <span className="text-gold">{c.keywordLead}</span>
            {c.keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
              .map((k) => (
                <span key={k}>{k}</span>
              ))}
            <span className="text-gold">{c.keywordLast}</span>
          </div>
        </div>
      </section>

      {/* MISSION STRIP — with imagery */}
      <section className="relative bg-white paper-grain">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32 grid lg:grid-cols-12 gap-14 items-start">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.missionEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-midnight leading-[1.03] mt-5">
              <RichText text={c.missionTitle} accentClass="italic text-gold-deep" />
            </h2>

            <div className="mt-10 relative aspect-[4/5] max-w-sm">
              <div className="absolute -inset-3 border border-gold/40" />
              <Image
                src={c.missionImage}
                alt="Worship at sunset — Believe"
                fill
                className="object-cover relative"
                sizes="(max-width: 768px) 80vw, 400px"
              />
            </div>
          </Reveal>

          <div className="lg:col-span-7 lg:pt-3">
            <Reveal delay={0.1}>
              <p className="text-xl text-midnight/85 leading-relaxed font-light drop-cap">
                {c.missionPara1}
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 text-ink/70 leading-relaxed">
                {c.missionPara2}
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-10 grid sm:grid-cols-3 gap-6">
                {stats.map(([num, label]) => (
                  <div key={label} className="border-t border-midnight/15 pt-5">
                    <p className="font-display text-4xl text-midnight">{num}</p>
                    <p className="text-xs tracking-[0.2em] uppercase text-midnight/60 mt-2">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* MINISTRIES */}
      <section className="relative bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="eyebrow text-gold-deep">
                <span className="gold-rule mr-3" />
                {c.ministriesEyebrow}
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-midnight mt-4 leading-tight">
                <RichText text={c.ministriesTitle} accentClass="italic" />
              </h2>
            </div>
            <Link href="/online-deliverance" className="btn-ghost text-midnight self-start md:self-end">
              See all ministries
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-midnight/15">
            {ministries.map((m, i) => {
              const Icon = m.icon;
              return (
                <Reveal key={m.title} delay={i * 0.08}>
                  <Link
                    href={m.href}
                    className="group relative h-full bg-white p-8 lg:p-10 flex flex-col gap-6 transition-colors hover:bg-midnight hover:text-white"
                  >
                    <div className="flex items-start justify-between">
                      <Icon className="text-gold-deep group-hover:text-gold transition-colors" size={28} />
                      <span className="font-display text-3xl text-midnight/25 group-hover:text-white/40">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl leading-tight">
                      {m.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink/70 group-hover:text-white/80 mt-auto">
                      {m.body}
                    </p>
                    <div className="flex items-center gap-2 text-xs tracking-[0.28em] uppercase text-gold-deep group-hover:text-gold">
                      Enter
                      <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIES */}
      <section className="relative bg-midnight text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://img.vogimprayerland.org/1780648525318-slider1.jpg"
            alt=""
            fill
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 hero-tint" />
        </div>
        <div className="absolute inset-0 starfield opacity-30 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32 relative">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-14">
            <Reveal>
              <p className="eyebrow text-gold">
                <span className="gold-rule mr-3" />
                Testimonies
              </p>
              <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
                <RichText text={c.testimoniesTitle} />
              </h2>
              <p className="mt-6 text-white/75 max-w-sm">
                {c.testimoniesIntro}
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-6">
              {testimonies.map((t, i) => (
                <Reveal key={t.name} delay={0.1 + i * 0.08}>
                  <figure
                    className={`relative border border-white/15 bg-midnight-dark/60 backdrop-blur p-7 h-full flex flex-col ${
                      i === 1 ? "sm:mt-12" : ""
                    } ${i === 2 ? "sm:-mt-6" : ""}`}
                  >
                    <Quote className="text-gold mb-4" size={22} />
                    <blockquote className="font-display italic text-xl leading-snug text-white">
                      &ldquo;{t.text}&rdquo;
                    </blockquote>
                    <figcaption className="mt-6 pt-5 border-t border-white/10">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-[11px] tracking-[0.28em] uppercase text-gold mt-1">
                        {t.place}
                      </p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROPHET / FOUNDER STRIP */}
      <section className="relative bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32 grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
          <Reveal>
            <div className="relative aspect-[4/5] max-w-md mx-auto">
              <div className="absolute -inset-4 border border-gold/50" />
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src={c.founderImage}
                  alt="Prophet Olaofe Oladele — a man of God"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 80vw, 480px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-gold">
                    {c.founderRole}
                  </p>
                  <p className="font-display text-4xl mt-2">
                    <RichText text={c.founderName} accentClass="italic" />
                  </p>
                </div>
              </div>
              <div className="absolute top-6 right-6 w-10 h-10 border border-gold/70 bg-midnight/70 backdrop-blur flex items-center justify-center text-gold">
                <Cross size={18} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.founderEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-[1.05]">
              <RichText text={c.founderTitle} accentClass="italic" />
            </h2>
            <p className="mt-6 text-ink/75 leading-relaxed">
              {c.founderBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-5">
              <Link href="/about" className="btn-gold">
                Read his story
                <ArrowUpRight size={16} />
              </Link>
              <Link href="/give" className="btn-ghost text-midnight">
                Partner with the ministry
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-midnight-dark text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://img.vogimprayerland.org/1780648526009-slider2.webp"
            alt=""
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 hero-tint" />
        </div>
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(212,164,55,0.25) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-24 lg:py-32 text-center">
          <p className="eyebrow text-gold">
            <span className="gold-rule mr-3" />
            {c.ctaEyebrow}
            <span className="gold-rule ml-3" />
          </p>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl mt-6 leading-[1.05]">
            <RichText text={c.ctaTitle} />
          </h2>
          <p className="mt-8 text-lg text-white/80 max-w-2xl mx-auto">
            {c.ctaIntro}
          </p>
          <div className="mt-10 flex flex-wrap gap-5 justify-center">
            <Link href={c.ctaPrimaryHref} className="btn-gold">
              {c.ctaPrimary}
            </Link>
            <Link href={c.ctaSecondaryHref} className="btn-ghost text-white border-white/40 hover:text-midnight">
              {c.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
