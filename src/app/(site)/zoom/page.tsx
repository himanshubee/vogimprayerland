import Link from "next/link";
import { Video, ArrowUpRight, Hash, Clock, Smartphone, Monitor } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { getPageContent } from "@/lib/page-content";
import { RichText } from "@/components/RichText";

export const metadata = {
  alternates: { canonical: "/zoom/" },
  title: "Join Us on Zoom — VOGIM Prayer Land",
  description:
    "Join Voice of God International Ministry (VOGIM) live on Zoom for prayer, deliverance, and the Word. Connect from anywhere in the world.",
};

export const revalidate = 300;

export default async function ZoomPage() {
  const c = await getPageContent("zoom");

  const STEPS = [
    {
      icon: Smartphone,
      title: c.step1Title,
      body: c.step1Body,
    },
    {
      icon: Monitor,
      title: c.step2Title,
      body: c.step2Body,
    },
    {
      icon: Hash,
      title: c.step3Title,
      body: c.step3Body,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={c.heroEyebrow}
        title={<RichText text={c.heroTitle} />}
        intro={c.heroIntro}
        scripture={{
          ref: "Matthew 18:20",
          text: "For where two or three are gathered together in my name, there am I in the midst of them.",
        }}
      />

      {/* JOIN CARD */}
      <section className="bg-white paper-grain">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-20 sm:py-28">
          <Reveal>
            <div className="relative border border-midnight/15 bg-ivory p-8 sm:p-12 text-center">
              <div className="absolute -inset-3 border border-gold/30 pointer-events-none" />
              <div className="relative">
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-midnight text-gold">
                  <Video size={28} />
                </span>
                <h2 className="font-display text-3xl sm:text-4xl text-midnight mt-6 leading-tight">
                  {c.joinCardTitle}
                </h2>
                <p className="mt-4 text-midnight/70 max-w-md mx-auto leading-relaxed">
                  {c.joinCardBody}
                </p>

                <Link
                  href={c.joinCardButtonHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold mt-8 inline-flex"
                >
                  {c.joinCardButtonLabel}
                  <ArrowUpRight size={16} />
                </Link>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm text-midnight/75">
                  <p className="flex items-center gap-2">
                    <Hash size={15} className="text-gold-deep" />
                    {c.meetingIdLabel} <span className="font-medium text-midnight">{c.meetingId}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={15} className="text-gold-deep" />
                    {c.serviceTimesNote}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW TO JOIN */}
      <section className="bg-ivory-dark">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.howToJoinEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-5 leading-tight max-w-3xl">
              <RichText text={c.howToJoinTitle} accentClass="italic" />
            </h2>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-px bg-midnight/15">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i * 0.07}>
                  <div className="bg-ivory-dark p-8 lg:p-10 h-full">
                    <Icon className="text-gold-deep" size={28} />
                    <h3 className="font-display text-2xl text-midnight mt-6">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-midnight/70 leading-relaxed text-sm">
                      {s.body}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
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
            target="_blank"
            rel="noopener noreferrer"
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
