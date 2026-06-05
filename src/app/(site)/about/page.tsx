import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Cross } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal"; 

export const metadata = {
  alternates: { canonical: "/about/" },
  title: "About — VOGIM Prayer Land",
  description:
    "Voice of God International Ministry (VOGIM) — a deliverance ministry rooted in Lagos, Nigeria, founded May 2021 by Prophet Olaofe Oladele.",
};

const PILLARS = [
  {
    no: "I",
    title: "Deliverance",
    body: "Setting captives free from demonic oppression, generational chains, and spiritual bondage through the power of the Holy Ghost.",
  },
  {
    no: "II",
    title: "Healing",
    body: "Jesus is the Healer. We pray for the sick, the brokenhearted, and the tormented — by the stripes of Christ they are healed.",
  },
  {
    no: "III",
    title: "Restoration",
    body: "Marriages restored, homes rebuilt, destinies reclaimed. We labor for the full restoration of every soul that comes our way.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        image="https://img.vogimprayerland.org/1780648526688-worship.jpg"
        eyebrow="About the Ministry"
        title={
          <>
            A church that believes
            <br />
            in God. <span className="italic text-gold">Everyone is welcome.</span>
          </>
        }
        intro="VOGIM Deliverance Ministries is a church that operates under the anointing of the Holy Spirit. Jesus is the Healer."
      />

      {/* INTRO + IMAGE */}
      <section className="relative bg-ivory">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-16 sm:py-24 lg:py-32 grid lg:grid-cols-[1.1fr_1fr] gap-12 sm:gap-16 items-start">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              Our Story
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-midnight mt-5 leading-[1.05]">
              From a village in Porto Novo
              <br />
              <span className="italic">to the ends of the earth.</span>
            </h2>
            <div className="mt-6 sm:mt-8 space-y-5 text-midnight/80 leading-relaxed text-base sm:text-lg">
              <p className="drop-cap">
                Vogim Deliverance Ministries Church began in May 2021 as a
                village evangelism ministry — preaching the gospel to Porto
                Novo and the surrounding communities. From those humble
                beginnings, the Lord has opened doors across nations.
              </p>
              <p>
                We have been able to deliver people from the captivity of
                Satan, heal the sick, and set the captives free by the power
                of Jesus Christ of Nazareth.
              </p>
              <p>
                We are also committed to standing with widows, orphans, and
                orphanage homes — financially, physically, and spiritually.
                Because love that does not feed, does not move, does not
                visit — is not love at all.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative aspect-[4/5] max-w-[18rem] sm:max-w-sm mx-auto lg:sticky lg:top-32">
              <div className="absolute -inset-3 sm:-inset-4 border border-gold/50" />
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src="https://img.vogimprayerland.org/1780648525156-prophet.webp"
                  alt="Prophet Olaofe Oladele"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 70vw, (max-width: 1024px) 50vw, 380px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 text-white">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-gold">
                    Founder &amp; General Overseer
                  </p>
                  <p className="font-display text-2xl sm:text-3xl mt-2 leading-tight">
                    Prophet Olaofe Oladele
                  </p>
                  <p className="mt-2 sm:mt-3 text-white/80 text-xs sm:text-sm italic font-display">
                    A man of God, a father to the nation, a giver, and a
                    philanthropist.
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
                By the power of the Holy Ghost — deliverance, healing &amp;
                restoration to families oppressed by the devil.
              </h3>
              <p className="mt-5 sm:mt-6 text-midnight/80 leading-relaxed text-sm sm:text-base">
                Chains of bondage are broken by the power in the blood of
                Jesus Christ of Nazareth. We demonstrate the power of God by
                breaking generational chains — poverty, ancestral curses,
                generational sins — through teaching and the raw display of
                God&apos;s power, grace, love, and forgiveness in the Lord
                Jesus Christ.
              </p>
              <p className="mt-4 text-midnight/80 leading-relaxed text-sm sm:text-base">
                In every aspect of the ministry, we will exemplify integrity,
                excellence, compassion, and a commitment to Christian
                character and values.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="bg-midnight text-ivory p-7 sm:p-10 lg:p-14 h-full">
              <p className="eyebrow text-gold">Our Vision</p>
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl mt-4 leading-tight">
                Loving God, loving others —
                <span className="italic text-gold"> in the world.</span>
              </h3>
              <p className="mt-5 sm:mt-6 text-ivory/80 leading-relaxed text-sm sm:text-base">
                Souls saved. Lives restored. Families transformed — through
                the raw word of God and Spirit-led counseling. We see a
                generation that loves the Lord with all its heart, and loves
                its neighbor as itself.
              </p>
              <figure className="mt-8 sm:mt-10 border-l-2 border-gold pl-4 sm:pl-5">
                <blockquote className="font-display italic text-lg sm:text-xl text-ivory/95 leading-snug">
                  &ldquo;The Spirit of the Lord is upon me, because he hath
                  anointed me to preach the gospel to the poor; to heal the
                  brokenhearted, to preach deliverance to the captives, and
                  recovering of sight to the blind, to set at liberty them
                  that are bruised — and to preach the acceptable year of the
                  Lord.&rdquo;
                </blockquote>
                <figcaption className="mt-3 text-[10px] tracking-[0.32em] uppercase text-gold">
                  Luke 4:18–19
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
            {PILLARS.map((p, i) => (
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
            Step into the place where
            <br />
            <span className="italic text-gold">heaven meets your story.</span>
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
