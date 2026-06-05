import Link from "next/link";
import type { Metadata } from "next";
import {
  Hash,
  BellRing,
  PhoneCall,
  Globe2,
  HeartHandshake,
  CalendarDays,
  Sprout,
  UserPlus,
  CreditCard,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { RequestForm } from "@/components/RequestForm";

export const metadata: Metadata = {
  alternates: { canonical: "/partnership/" },
  title: "Partnership — VOGIM Prayer Land",
  description:
    "Become a covenant partner of Voice of God International Ministry (VOGIM). Stand with us in prayer and giving to reach a generation with deliverance, healing, and the gospel of Jesus Christ.",
  openGraph: {
    title: "Partnership — VOGIM Prayer Land",
    description:
      "Become a covenant partner of VOGIM and help carry deliverance, healing, and the gospel to the nations.",
    url: "/partnership/",
    type: "website",
  },
};

const BENEFITS = [
  {
    icon: Hash,
    title: "A personal partner number",
    body: "You are enrolled into the covenant register and assigned a partner number that identifies you with the ministry.",
  },
  {
    icon: BellRing,
    title: "News & ministry updates",
    body: "Regular updates from the VOGIM team — what the Lord is doing, and how your seed is bearing fruit.",
  },
  {
    icon: CalendarDays,
    title: "Notice of crusades & events",
    body: "Be the first to know about upcoming online services, prophetic nights, crusades, and special programmes.",
  },
  {
    icon: PhoneCall,
    title: "A dedicated prayer line",
    body: "Priority access to a prayer and counselling line — our intercessors stand with you whenever you call.",
  },
  {
    icon: Globe2,
    title: "Expanding our reach",
    body: "Your partnership widens our coverage online and on air, so more souls in more nations can be reached.",
  },
  {
    icon: HeartHandshake,
    title: "Growing humanitarian work",
    body: "More care for widows, orphans, and the vulnerable — locally in Ikorodu and internationally.",
  },
];

const STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up",
    body: "Complete the partnership form below. We enrol you and send your partner number and welcome details.",
  },
  {
    icon: CreditCard,
    step: "02",
    title: "Give",
    body: "Sow your partnership seed through our official giving channel — monthly, or as the Lord leads your heart.",
  },
  {
    icon: MessageCircle,
    step: "03",
    title: "Notify Us",
    body: "Send us your payment notification on WhatsApp so we can confirm your seed and stand with you in prayer.",
  },
];

const PARTNER_FIELDS = [
  { name: "name", label: "Full Name", required: true, placeholder: "How shall we address you?" },
  { name: "email", label: "Email", type: "email" as const, required: true, placeholder: "your@email.com" },
  { name: "phone", label: "Phone or WhatsApp", type: "tel" as const, required: true, placeholder: "+234 …" },
  { name: "country", label: "City & Country", placeholder: "e.g. Lagos, Nigeria" },
  {
    name: "partnership_level",
    label: "Partnership Level (Seed / Covenant / Kingdom)",
    placeholder: "e.g. Covenant — ₦10,000 monthly",
  },
  {
    name: "message",
    label: "Your testimony or prayer request",
    type: "textarea" as const,
    rows: 4,
    placeholder: "Share what the Lord is doing, or how we can pray with you…",
  },
];

export default function PartnershipPage() {
  return (
    <>
      <PageHeader
        image="https://img.vogimprayerland.org/1780648526688-worship.jpg"
        eyebrow="Partnership"
        title={
          <>
            Become a covenant
            <br />
            <span className="italic text-gold">partner.</span>
          </>
        }
        intro="Partners of VOGIM commit themselves to the cause of the gospel — reaching a generation without faith and hope with the sweet story of our Lord Jesus Christ, deliverance, and healing."
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
              Why become a partner?
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              When you give, you <span className="italic">plant a seed</span> that is multiplied back to you.
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              We always want the best from God, therefore when you give, give the
              best seed you have. Partnership is a decision of the heart — to stand
              with the work of God so that more captives are set free, more bodies
              are healed, and more homes are restored.
            </p>
            <p className="mt-4 text-midnight/75 leading-relaxed">
              As you sow into this ministry, you sow into every soul it reaches.
              Your seed becomes a deliverance session, a meal for a widow, a Bible
              in a seeking hand, and the gospel carried farther than before.
            </p>

            <Link href="#sign-up" className="btn-gold mt-10">
              Become a Partner
              <ArrowUpRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border border-midnight/15 bg-ivory p-8">
              <p className="eyebrow text-gold-deep">As a VOGIM Partner</p>
              <h3 className="font-display text-3xl text-midnight mt-3 leading-tight">
                You will receive.
              </h3>
              <ul className="mt-6 space-y-5">
                {BENEFITS.map((b) => {
                  const Icon = b.icon;
                  return (
                    <li key={b.title} className="flex gap-4">
                      <Icon className="text-gold-deep shrink-0 mt-1" size={22} />
                      <div>
                        <p className="font-display text-xl text-midnight">{b.title}</p>
                        <p className="text-midnight/70 text-sm leading-relaxed mt-1">
                          {b.body}
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

      {/* SEED STRIP */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <Sprout className="mx-auto text-gold" size={30} />
          <p className="font-display italic text-3xl md:text-4xl leading-snug mt-6">
            &ldquo;Give, and it shall be given unto you; good measure, pressed
            down, and shaken together, and running over.&rdquo;
          </p>
          <p className="mt-4 text-[11px] tracking-[0.32em] uppercase text-gold">
            Luke 6:38
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-ivory-dark">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 lg:py-28">
          <Reveal>
            <p className="eyebrow text-gold-deep text-center justify-center flex">
              <span className="gold-rule mr-3" />
              How partnership works
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 text-center leading-tight">
              Three simple steps.
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
              href="https://give.vogimprayerland.org/"
              className="btn-ghost text-midnight border-midnight/30"
              target="_blank"
              rel="noreferrer"
            >
              Give Now
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* SIGN UP FORM */}
      <section id="sign-up" className="bg-ivory paper-grain scroll-mt-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-20 lg:py-28">
          <RequestForm
            intent="Partnership Sign-Up"
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
            For questions or enquiries
          </p>
          <h2 className="font-display text-3xl md:text-4xl mt-4">
            We would love to hear from you.
          </h2>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://wa.me/2348150743998"
              target="_blank"
              rel="noreferrer"
              className="btn-gold justify-center"
            >
              WhatsApp +234 815 074 3998
            </Link>
            <a
              href="mailto:hello@vogimprayerland.org"
              className="btn-ghost text-ivory border-gold/40 justify-center"
            >
              hello@vogimprayerland.org
            </a>
          </div>
          <p className="mt-6 text-white/60 text-sm">
            18 Association Avenue, Owutu-Agric, Ikorodu · Lagos, Nigeria
          </p>
        </div>
      </section>
    </>
  );
}
