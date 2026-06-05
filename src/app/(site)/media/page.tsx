import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { Play, Headphones, ImageIcon, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Media — VOGIM Prayer Land",
  description:
    "Sermons, prophetic words, worship moments and gallery from VOGIM Deliverance Ministries.",
};

const SERMONS = [
  {
    title: "Breaking generational chains",
    speaker: "Prophet Olaofe Oladele",
    length: "47 min",
    series: "Deliverance Series · Vol I",
  },
  {
    title: "The altar that cannot be denied",
    speaker: "Prophet Olaofe Oladele",
    length: "53 min",
    series: "Prophetic Service",
  },
  {
    title: "When God speaks in the night",
    speaker: "Prophet Olaofe Oladele",
    length: "38 min",
    series: "Dreams & Visions",
  },
  {
    title: "Marital settlement by fire",
    speaker: "Prophet Olaofe Oladele",
    length: "59 min",
    series: "Family Restored",
  },
];

const GALLERY = [
  { id: 1, title: "Prophetic Service", src: "https://img.vogimprayerland.org/1780648526061-slider3.webp" },
  { id: 2, title: "Worship Night", src: "https://img.vogimprayerland.org/1780648526009-slider2.webp" },
  { id: 3, title: "Children at the Altar", src: "https://img.vogimprayerland.org/1780648525318-slider1.jpg" },
  { id: 4, title: "Believe — Sunset Vigil", src: "https://img.vogimprayerland.org/1780648526688-worship.jpg" },
  { id: 5, title: "Marital Settlement Service", src: "https://img.vogimprayerland.org/1780648524880-marital-large.jpg" },
  { id: 6, title: "Online Deliverance Session", src: "https://img.vogimprayerland.org/1780648546756-deliverance.webp" },
];

export default function MediaPage() {
  return (
    <>
      <PageHeader
        image="https://img.vogimprayerland.org/1780648526009-slider2.webp"
        eyebrow="Media"
        title={
          <>
            Sermons, sounds
            <br />
            &amp; <span className="italic text-gold">moments of glory.</span>
          </>
        }
        intro="Catch up on prophetic services, watch worship moments, and walk through what God has done."
      />

      {/* TABS / TYPE STRIP */}
      <section className="bg-ivory border-b border-midnight/10">
        <div className="mx-auto max-w-7xl px-6 py-10 grid sm:grid-cols-3 gap-px bg-midnight/15">
          {[
            { icon: Play, title: "Video", desc: "Sermons & livestream replays" },
            { icon: Headphones, title: "Audio", desc: "Messages to listen on the go" },
            { icon: ImageIcon, title: "Gallery", desc: "Photos from the altar and the field" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-ivory p-8 flex items-center gap-5">
              <Icon className="text-gold-deep" size={28} />
              <div>
                <p className="font-display text-2xl text-midnight">{title}</p>
                <p className="text-midnight/65 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERMON LIST */}
      <section className="bg-ivory-dark">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              Latest sermons
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              The Word, <span className="italic">on demand.</span>
            </h2>
          </Reveal>

          <div className="mt-12 divide-y divide-midnight/15 border-y border-midnight/15">
            {SERMONS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.05}>
                <article className="group grid md:grid-cols-[80px_1fr_auto_auto] gap-6 items-center py-6">
                  <span className="font-display text-3xl text-gold-deep">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl text-midnight leading-tight group-hover:text-gold-deep transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-midnight/65 text-sm mt-1">
                      {s.speaker} · {s.series}
                    </p>
                  </div>
                  <span className="text-xs tracking-[0.28em] uppercase text-midnight/55">
                    {s.length}
                  </span>
                  <button className="flex items-center gap-2 text-xs tracking-[0.28em] uppercase text-midnight border border-midnight/30 px-4 py-2 hover:bg-midnight hover:text-gold transition-colors">
                    <Play size={12} />
                    Play
                  </button>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="bg-ivory">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              From the altar
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              Glory captured in <span className="italic">a moment.</span>
            </h2>
          </Reveal>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-midnight/15">
            {GALLERY.map((g, i) => (
              <Reveal key={g.id} delay={i * 0.04}>
                <div className="relative aspect-[4/5] overflow-hidden group bg-midnight">
                  <Image
                    src={g.src}
                    alt={g.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-7 text-white">
                    <span className="text-[10px] tracking-[0.32em] uppercase text-gold">
                      Photo {String(g.id).padStart(2, "0")}
                    </span>
                    <p className="font-display text-2xl mt-2">{g.title}</p>
                  </div>
                  <div className="absolute top-5 right-5 w-10 h-10 border border-gold/70 bg-midnight/60 backdrop-blur flex items-center justify-center text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link href="/contact" className="btn-ghost text-midnight">
              Request a custom recording
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
