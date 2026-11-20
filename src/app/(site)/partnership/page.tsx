import Link from "next/link";
import type { Metadata } from "next";
import {
  Sprout,
  UserPlus,
  CreditCard,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { RequestForm } from "@/components/RequestForm";
import { getPageContent, getPageMeta } from "@/lib/page-content";
import { RichText } from "@/components/RichText";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMeta("partnership");
}

export const revalidate = 300;

const PARTNER_FIELDS = [
  { name: "name", label: "Full Name", required: true, placeholder: "How shall we address you?" },
  { name: "email", label: "Email", type: "email" as const, required: true, placeholder: "your@email.com" },
  { name: "phone", label: "Phone or WhatsApp", type: "tel" as const, required: true, placeholder: "+234 …" },
  { name: "country", label: "City & Country", placeholder: "e.g. Lagos, Nigeria" },
  {
    name: "message",
    label: "Partnership question (optional)",
    type: "textarea" as const,
    rows: 4,
    placeholder: "Ask about partnership or the official giving channel",
  },
];

export default async function PartnershipPage() {
  const c = await getPageContent("partnership");
  const STEPS = [
    { icon: UserPlus, step: "01", title: c.step1Title, body: c.step1Body },
    { icon: CreditCard, step: "02", title: c.step2Title, body: c.step2Body },
    { icon: MessageCircle, step: "03", title: c.step3Title, body: c.step3Body },
  ];
  return (
    <>
      <PageHeader
        image={c.heroImage}
        eyebrow={c.heroEyebrow}
        title={<RichText text={c.heroTitle} />}
        intro={c.heroIntro}
        scripture={{
          ref: "Philippians 4:17",
          text: "Not because I desire a gift: but I desire fruit that may abound to your account.",
        }}
      />

      {/* WHY PARTNER */}
      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 lg:py-28 grid lg:grid-cols-[1fr_1.1fr] gap-14 items-start">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.whyEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              <RichText text={c.whyTitle} accentClass="italic" />
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              {c.whyPara1}
            </p>
            <p className="mt-4 text-midnight/75 leading-relaxed">
              {c.whyPara2}
            </p>

            <Link href={c.whyButtonHref} className="btn-gold mt-10">
              {c.whyButtonLabel}
              <ArrowUpRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-soft bg-cream p-8">
              <p className="eyebrow text-gold-deep">Giving and prayer stay separate</p>
              <h3 className="mt-3 font-display text-3xl text-midnight">No one receives less prayer for giving less.</h3>
              <p className="mt-4 text-slate">Partnership is voluntary. Prayer, deliverance and counselling are free, whether or not you become a partner.</p>
              <Link href="/notice/" className="btn-ghost mt-6">Check our official channels</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SEED STRIP */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <Sprout className="mx-auto text-gold" size={30} />
          <p className="font-display italic text-3xl md:text-4xl leading-snug mt-6">
            {c.seedQuote}
          </p>
          <p className="mt-4 text-[11px] tracking-[0.32em] uppercase text-gold">
            {c.seedRef} · KJV
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-ivory-dark">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 lg:py-28">
          <Reveal>
            <p className="eyebrow text-gold-deep text-center justify-center flex">
              <span className="gold-rule mr-3" />
              {c.howEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 text-center leading-tight">
              {c.howTitle}
            </h2>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.step} delay={i * 0.1}>
                  <div className="h-full border border-midnight/15 bg-ivory p-8 relative">
                    <span className="absolute top-6 right-7 font-display text-5xl text-gold/25">
                      {s.step}
                    </span>
                    <Icon className="text-gold-deep" size={28} />
                    <p className="font-display text-2xl text-midnight mt-5">
                      {s.title}
                    </p>
                    <p className="text-midnight/70 text-sm leading-relaxed mt-3">
                      {s.body}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href={c.howButtonHref}
              className="btn-ghost text-midnight border-midnight/30"
              target="_blank"
              rel="noreferrer"
            >
              {c.howButtonLabel}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* SIGN UP FORM */}
      <section id="sign-up" className="bg-ivory paper-grain scroll-mt-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-20 lg:py-28">
          <RequestForm
            intent="Partner Form"
            purpose="response"
            fields={PARTNER_FIELDS}
            submitLabel="Become a Partner"
          />
        </div>
      </section>

      {/* ENQUIRIES */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-30" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="eyebrow text-gold justify-center flex">
            <span className="gold-rule mr-3" />
            {c.enquiriesEyebrow}
          </p>
          <h2 className="font-display text-3xl md:text-4xl mt-4">
            {c.enquiriesTitle}
          </h2>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={c.enquiriesWhatsappHref}
              target="_blank"
              rel="noreferrer"
              className="btn-gold justify-center"
            >
              {c.enquiriesWhatsappLabel}
            </Link>
            <a
              href={c.enquiriesEmailHref}
              className="btn-ghost text-ivory border-gold/40 justify-center"
            >
              {c.enquiriesEmailLabel}
            </a>
          </div>
          <p className="mt-6 text-white/60 text-sm">
            {c.enquiriesAddress}
          </p>
        </div>
      </section>
    </>
  );
}
