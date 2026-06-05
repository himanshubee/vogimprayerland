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

export const metadata = {
  alternates: { canonical: "/online-deliverance/" },
  title: "Online Deliverance Ministry — VOGIM",
  description:
    "Embracing freedom through Christ at VOGIM. Online deliverance sessions with Prophet Olaofe Emmanuel — wherever you are.",
};

const WHY = [
  {
    icon: Globe2,
    title: "Without distance",
    body: "Receive ministry from anywhere in the world. The Spirit is not limited by geography.",
  },
  {
    icon: Shield,
    title: "Privately, confidentially",
    body: "Sessions held in the safety of your home, with discretion and pastoral care.",
  },
  {
    icon: HeartPulse,
    title: "Immediate help",
    body: "Spiritual attacks don't wait. Submit a request and receive prompt intervention.",
  },
  {
    icon: Flame,
    title: "Rooted in scripture",
    body: "Centered on the Word of God, the name of Jesus, and the leading of the Holy Spirit — nothing else.",
  },
];

const STEPS = [
  ["01", "Submit your request", "Fill the deliverance form with your concerns and contact details."],
  ["02", "Confirmation & scheduling", "Our team reviews and schedules a one-on-one session."],
  ["03", "The session", "Prophet Olaofe leads through scripture, prayer, and commands in Jesus' name."],
  ["04", "Walk it out", "Receive aftercare scripture, prayer plan, and follow-up support."],
];

const SIGNS = [
  "Persistent, unexplained sickness or torment",
  "Cycles of poverty, failure, or addiction",
  "Nightmares, dream attacks, or sleep disturbances",
  "Marital and family conflict you cannot resolve",
  "Sudden depression, fear, or oppression",
  "A sense of being followed, watched, or held back",
  "Generational patterns repeating in your life",
  "Brokenness from occult exposure or curses",
];

export default function OnlineDeliverancePage() {
  return (
    <>
      <PageHeader
        image="https://img.vogimprayerland.org/1780648526061-slider3.webp"
        eyebrow="Online Deliverance Ministry"
        title={
          <>
            Embrace freedom
            <br />
            through <span className="italic text-gold">Christ.</span>
          </>
        }
        intro="In a world filled with spiritual challenges, many seek freedom from bondage and oppression. At VOGIM, we believe in the power of God to set people free from the clutches of the enemy."
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
              Whether you are battling spiritual attacks, anxiety, depression,
              or feel a dark cloud hovering over your life —{" "}
              <span className="italic text-gold-deep">
                online deliverance ministry can help you break those chains.
              </span>{" "}
              Through a deliverance request, you can connect with Prophet
              Olaofe Emmanuel and experience the transforming power of God.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative aspect-[4/5] max-w-sm mx-auto">
              <div className="absolute -inset-3 border border-gold/40" />
              <Image
                src="https://img.vogimprayerland.org/1780648546756-deliverance.webp"
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
              Why VOGIM
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-5 leading-tight max-w-3xl">
              The same power, in your home — <span className="italic">no different than in person.</span>
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
              How it works
            </p>
            <h2 className="font-display text-4xl md:text-5xl mt-5 leading-tight max-w-3xl">
              A simple and profound <span className="italic text-gold">process.</span>
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
              What to expect
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-5 leading-tight">
              Every session is <span className="italic">Spirit-led.</span>
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              No two sessions look the same. The Holy Spirit customizes the
              approach to the specific needs of the individual. What stays
              constant is the centrality of the Word, the authority of the
              name of Jesus, and the love of the Father.
            </p>
            <Link href="/deliverance-request" className="btn-gold mt-8">
              Submit a deliverance request
              <ArrowUpRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border border-midnight/15 p-8 lg:p-10 bg-ivory">
              <p className="eyebrow text-gold-deep">
                <Eye className="inline mr-2 -mt-1" size={14} />
                Signs you may need deliverance
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
                If any of these resonate, don&apos;t delay. Reach out today.
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
            Freedom is
            <br />
            <span className="italic text-gold">a click away.</span>
          </h2>
          <p className="mt-6 text-ivory/70 max-w-xl mx-auto">
            Take the first step toward healing and restoration. Your
            deliverance is at hand.
          </p>
          <Link
            href="/deliverance-request"
            className="btn-gold mt-10 inline-flex"
          >
            Submit deliverance request
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
