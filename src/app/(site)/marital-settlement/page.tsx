import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Heart, BookOpen, HandHeart, Hourglass, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";

export const metadata = {
  title: "Prayer for Marital Settlement — VOGIM",
  description:
    "A guide to finding divine guidance and peace in your marital journey. Through prayer and spiritual counsel, VOGIM helps individuals navigate the complexities of marriage.",
};

const POINTS = [
  {
    icon: BookOpen,
    title: "Spiritual Alignment",
    body: "Align your intentions with God's will so His direction is unmistakable in your marital affairs.",
  },
  {
    icon: HandHeart,
    title: "Healing of Wounds",
    body: "Pray over generational hurts, broken vows, and seasons of disappointment — and watch the Lord restore.",
  },
  {
    icon: Hourglass,
    title: "Patience & Faith",
    body: "Cultivate trust in God's perfect timing while remaining tender, available, and prayerful.",
  },
  {
    icon: Sparkles,
    title: "Breakthrough Prayer",
    body: "Stand on the prayers of an intercessor as you wait for divine settlement and lasting peace.",
  },
];

const PRAYERS = [
  {
    title: "For the right partner",
    body: "Father, by your Spirit, lead me to the partner ordained for me — one who fears you, loves me, and will walk in covenant with me all the days of our lives. In Jesus' name, amen.",
  },
  {
    title: "For the restoration of a marriage",
    body: "Lord, I bring my marriage before your throne. Heal what is broken, expose every hidden thing, and rebuild us in the strength of your love. In Jesus' name, amen.",
  },
  {
    title: "For peace in the home",
    body: "King of glory, let your peace rule in our home. Silence every voice that is not yours and let our home be a sanctuary of joy. In Jesus' name, amen.",
  },
];

export default function MaritalSettlementPage() {
  return (
    <>
      <PageHeader
        image="/images/marital-large.jpg"
        eyebrow="Prayer for Marital Settlement"
        title={
          <>
            Divine guidance
            <br />
            for your <span className="italic text-gold">marital journey.</span>
          </>
        }
        intro="Marriage is sacred — but the road can be hard. When you turn to prayer, you invite God's wisdom, patience, and love to steer your path toward happiness and fulfillment."
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
                src="/images/marital.png"
                alt="A couple in conversation — restored and at peace"
                fill
                className="object-cover relative"
                sizes="(max-width: 1024px) 80vw, 500px"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-display text-2xl md:text-3xl text-midnight leading-snug">
              When we speak of <span className="italic text-gold-deep">prayer for marital settlement</span>,
              we mean the sacred act of seeking divine intervention to resolve
              issues, discern the right partner, or strengthen an existing
              relationship — inviting God to steer your marital path toward
              happiness and fulfillment.
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
              How prayer helps
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-5 leading-tight max-w-3xl">
              Four ways God moves on
              <br />
              <span className="italic">behalf of your marriage.</span>
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
              Pray these words
            </p>
            <h2 className="font-display text-4xl md:text-5xl mt-5 leading-tight">
              Detailed prayer points for <span className="italic text-gold">marital settlement.</span>
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
              How VOGIM helps
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-5 leading-tight">
              Walk with an intercessor who has <span className="italic">walked this path.</span>
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              VOGIM specializes in spiritual guidance for individuals seeking
              marital settlement. Through prayer, prophetic counsel, and
              one-on-one ministry, we help you navigate the complexities of
              your marital journey — offering support and encouragement at
              every step.
            </p>
            <Link href="/prayer-request" className="btn-gold mt-8">
              Request a prayer partner
              <ArrowUpRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="space-y-5">
              {[
                ["Personalized prayer", "Tailored to your unique situation and season."],
                ["Spirit-led counsel", "Wisdom from the Word, applied with compassion."],
                ["Confidential ministry", "Your story is held with reverence and care."],
                ["Ongoing follow-up", "Aftercare so you walk out your breakthrough."],
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
            Don&apos;t walk this path
            <br />
            <span className="italic text-gold">alone.</span>
          </h2>
          <p className="mt-6 text-ivory/70 max-w-xl mx-auto">
            Reach out to VOGIM and begin your journey toward divine marital
            settlement today.
          </p>
          <Link
            href="/contact"
            className="btn-gold mt-10 inline-flex"
          >
            Contact the ministry
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
