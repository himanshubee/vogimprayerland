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

const MINISTRIES = [
  {
    icon: Flame,
    title: "Online Deliverance",
    body: "Break free from spiritual oppression, generational chains, and demonic strongholds — wherever you are in the world.",
    href: "/online-deliverance",
  },
  {
    icon: HeartHandshake,
    title: "Marital Settlement",
    body: "Targeted prayer and prophetic counsel for singles, couples, and families seeking divine direction in marriage.",
    href: "/marital-settlement",
  },
  {
    icon: Sparkles,
    title: "Healing Ministry",
    body: "Receive a touch from the Healer. Jesus is still healing the sick — body, soul, and spirit.",
    href: "/healing-request",
  },
  {
    icon: MoonStar,
    title: "Dream Interpretation",
    body: "Discern the voice of God in your dreams. Submit your dream for Spirit-led interpretation.",
    href: "/dream-interpretation",
  },
];

const TESTIMONIES = [
  {
    name: "Karim Mouinath",
    place: "Benin Republic",
    text: "Received an international opening door to KUWAIT after I had an encounter with the man of God, Prophet Olaofe Oladele. Praise Master Jesus!",
  },
  {
    name: "Adaeze O.",
    place: "Port Harcourt, Nigeria",
    text: "After years of unexplained sickness and torment, one online session brought freedom and peace to my home. Glory to Jesus.",
  },
  {
    name: "Brother Samuel",
    place: "London, UK",
    text: "I joined the Monday service from another continent. The word came alive. My business broke open the following week.",
  },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative bg-midnight text-white overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/slider3.jpg"
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
                  Voice of God International Ministry · est. 2021
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <h1 className="font-display mt-7 text-6xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight">
                  Where the captive
                  <br />
                  <span className="italic text-gold">walks free</span>
                  <br />
                  in Jesus&apos; name.
                </h1>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/85">
                  VOGIM Prayer Land is an online deliverance ministry rooted in
                  Lagos, Nigeria — preaching the gospel, healing the
                  brokenhearted, and setting the captives free by the power of
                  the Holy Ghost.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <Link href="/deliverance-request" className="btn-gold">
                    Submit a request
                    <ArrowUpRight size={16} />
                  </Link>
                  <Link
                    href="/about"
                    className="text-sm tracking-widest uppercase text-white/90 u-link"
                  >
                    Discover our story
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
                    The Spirit of the Lord is upon me, because he hath anointed
                    me to preach the gospel to the poor; he hath sent me to
                    heal the brokenhearted, to preach deliverance to the
                    captives.
                  </p>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-xs tracking-[0.3em] uppercase text-gold">
                      Luke 4:18
                    </span>
                    <span className="text-xs text-white/40 font-mono">
                      Daily Word
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="border border-white/15 bg-midnight-dark/60 backdrop-blur p-5">
                    <Clock className="text-gold mb-3" size={16} />
                    <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">Monday</p>
                    <p className="font-display text-xl mt-1 text-white">10:00 PM <span className="text-gold text-sm">WAT</span></p>
                  </div>
                  <div className="border border-gold/40 bg-gold/15 backdrop-blur p-5">
                    <Clock className="text-gold mb-3" size={16} />
                    <p className="text-[11px] uppercase tracking-[0.25em] text-gold">Saturday</p>
                    <p className="font-display text-xl mt-1 text-white">10:00 PM <span className="text-gold text-sm">WAT</span></p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-midnight-dark/70 backdrop-blur">
          <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap gap-x-10 gap-y-2 text-[11px] tracking-[0.3em] uppercase text-white/70">
            <span className="text-gold">— A church for everyone</span>
            <span>Deliverance</span>
            <span>Healing</span>
            <span>Restoration</span>
            <span>Marital Settlement</span>
            <span>Dream Interpretation</span>
            <span className="text-gold">Prophetic Service</span>
          </div>
        </div>
      </section>

      {/* MISSION STRIP — with imagery */}
      <section className="relative bg-white paper-grain">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32 grid lg:grid-cols-12 gap-14 items-start">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              The Mission
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-midnight leading-[1.03] mt-5">
              Loving God,
              <br />
              <span className="italic text-gold-deep">loving others</span>,
              <br />
              in the world.
            </h2>

            <div className="mt-10 relative aspect-[4/5] max-w-sm">
              <div className="absolute -inset-3 border border-gold/40" />
              <Image
                src="/images/worship.jpg"
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
                By the power of the Holy Ghost, VOGIM Deliverance Ministries
                brings deliverance, healing and restoration to individuals and
                families oppressed and tormented by the devil. Chains of bondage
                are broken in the blood of Jesus Christ of Nazareth.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 text-ink/70 leading-relaxed">
                We demonstrate the power of God by breaking generational
                poverty, ancestral curses, and generational sins — through
                teaching, prophetic ministry, and the raw display of God&apos;s
                love, grace, and the forgiveness found only in the Lord Jesus
                Christ.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-10 grid sm:grid-cols-3 gap-6">
                {[
                  ["50+", "Nations reached online"],
                  ["1000s", "Lives restored"],
                  ["24/7", "Intercession upheld"],
                ].map(([num, label]) => (
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
                Our Ministries
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-midnight mt-4 leading-tight">
                Spirit-led pathways
                <br />
                <span className="italic">to your breakthrough.</span>
              </h2>
            </div>
            <Link href="/online-deliverance" className="btn-ghost text-midnight self-start md:self-end">
              See all ministries
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-midnight/15">
            {MINISTRIES.map((m, i) => {
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
            src="/images/slider1.jpg"
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
                What the Lord
                <br /> has done.
              </h2>
              <p className="mt-6 text-white/75 max-w-sm">
                Real stories from those who came seeking and left transformed
                by the power of Jesus Christ.
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-6">
              {TESTIMONIES.map((t, i) => (
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
                  src="/images/prophet.jpg"
                  alt="Prophet Olaofe Oladele — a man of God"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 80vw, 480px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-gold">
                    Founder &amp; General Overseer
                  </p>
                  <p className="font-display text-4xl mt-2">
                    Prophet Olaofe
                    <br />
                    <span className="italic">Oladele</span>
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
              The Watchman
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-[1.05]">
              A man of God, a father to the nation,
              <br />
              <span className="italic">a giver, a philanthropist.</span>
            </h2>
            <p className="mt-6 text-ink/75 leading-relaxed">
              Prophet Olaofe Oladele founded VOGIM Deliverance Ministries in
              May 2021 as a village evangelism work in Porto Novo and the
              surrounding communities. Today his ministry reaches across the
              world — delivering captives, healing the sick, and restoring
              families by the power of the name of Jesus Christ of Nazareth.
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
            src="/images/slider2.jpg"
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
            Need Prayer?
            <span className="gold-rule ml-3" />
          </p>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl mt-6 leading-[1.05]">
            We would love to
            <br />
            <span className="italic text-gold">pray for you.</span>
          </h2>
          <p className="mt-8 text-lg text-white/80 max-w-2xl mx-auto">
            Wherever you are, whatever the burden — there is a place at this
            altar for you. Send us a message and our intercessors will stand
            with you.
          </p>
          <div className="mt-10 flex flex-wrap gap-5 justify-center">
            <Link href="/prayer-request" className="btn-gold">
              Send a prayer request
            </Link>
            <Link href="/contact" className="btn-ghost text-white border-white/40 hover:text-midnight">
              Contact the church
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
