import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";
import { RichText } from "@/components/RichText";
import { Reveal } from "@/components/Reveal";
import { Play, Headphones, ImageIcon, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { listMedia } from "@/lib/media";
import { getPageContent, getPageMeta } from "@/lib/page-content";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMeta("media");
}

export const revalidate = 300;

export default async function MediaPage() {
  const c = await getPageContent("media");
  const gallery = (await listMedia()).slice(0, 6);

  const SERMONS = [
    {
      title: c.sermon1Title,
      speaker: c.sermon1Speaker,
      length: c.sermon1Length,
      series: c.sermon1Series,
    },
    {
      title: c.sermon2Title,
      speaker: c.sermon2Speaker,
      length: c.sermon2Length,
      series: c.sermon2Series,
    },
    {
      title: c.sermon3Title,
      speaker: c.sermon3Speaker,
      length: c.sermon3Length,
      series: c.sermon3Series,
    },
    {
      title: c.sermon4Title,
      speaker: c.sermon4Speaker,
      length: c.sermon4Length,
      series: c.sermon4Series,
    },
  ];
  return (
    <>
      <PageHeader
        image={c.heroImage}
        eyebrow={c.heroEyebrow}
        title={<RichText text={c.heroTitle} />}
        intro={c.heroIntro}
      />

      {/* TABS / TYPE STRIP */}
      <section className="bg-ivory border-b border-midnight/10">
        <div className="mx-auto max-w-7xl px-6 py-10 grid sm:grid-cols-3 gap-px bg-midnight/15">
          {[
            { icon: Play, title: c.type1Title, desc: c.type1Desc },
            { icon: Headphones, title: c.type2Title, desc: c.type2Desc },
            { icon: ImageIcon, title: c.type3Title, desc: c.type3Desc },
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
              {c.sermonsEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              <RichText text={c.sermonsTitle} accentClass="italic" />
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
              {c.galleryEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              <RichText text={c.galleryTitle} accentClass="italic" />
            </h2>
          </Reveal>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-midnight/15">
            {gallery.map((g, i) => (
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
                      Photo {String(i + 1).padStart(2, "0")}
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
              {c.galleryCtaLabel}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
