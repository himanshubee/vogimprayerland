import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Camera } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";

export const metadata = {
  title: "Gallery — VOGIM Prayer Land",
  description:
    "Photographs from VOGIM Deliverance Ministries — prophetic services, worship nights, deliverance encounters, and moments of restoration.",
};

type Photo = {
  id: number;
  title: string;
  caption: string;
  src: string;
  category: "Services" | "Worship" | "Deliverance" | "Family";
  span?: "tall" | "wide" | "square";
};

const PHOTOS: Photo[] = [
  {
    id: 1,
    title: "Prophetic Service",
    caption: "The Word goes forth, the altar burns.",
    src: "/images/slider3.jpg",
    category: "Services",
    span: "tall",
  },
  {
    id: 2,
    title: "Worship Night",
    caption: "Hearts lifted, heaven opened.",
    src: "/images/slider2.jpg",
    category: "Worship",
    span: "square",
  },
  {
    id: 3,
    title: "Children at the Altar",
    caption: "The next generation, hands lifted high.",
    src: "/images/slider1.jpg",
    category: "Services",
    span: "wide",
  },
  {
    id: 4,
    title: "Sunset Vigil",
    caption: "All-night prayer until the breakthrough.",
    src: "/images/worship.jpg",
    category: "Worship",
    span: "square",
  },
  {
    id: 5,
    title: "Marital Settlement",
    caption: "Homes rebuilt by the power of God.",
    src: "/images/marital-large.jpg",
    category: "Family",
    span: "tall",
  },
  {
    id: 6,
    title: "Online Deliverance",
    caption: "Captives set free across nations.",
    src: "/images/deliverance.png",
    category: "Deliverance",
    span: "wide",
  },
  {
    id: 7,
    title: "Family Restored",
    caption: "What God has joined together.",
    src: "/images/marital.png",
    category: "Family",
    span: "square",
  },
  {
    id: 8,
    title: "The Anointing Flows",
    caption: "Prophet Olaofe ministering by the Spirit.",
    src: "/images/prophet.jpg",
    category: "Services",
    span: "tall",
  },
  {
    id: 9,
    title: "Sunday Gathering",
    caption: "Where the saints come together.",
    src: "/images/main-height.jpg",
    category: "Services",
    span: "square",
  },
];

const CATEGORIES = ["All", "Services", "Worship", "Deliverance", "Family"] as const;

function spanClasses(span?: Photo["span"]) {
  switch (span) {
    case "tall":
      return "aspect-[3/4] md:row-span-2 md:aspect-auto";
    case "wide":
      return "aspect-[4/3] md:col-span-2 md:aspect-[16/9]";
    default:
      return "aspect-square";
  }
}

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        image="/images/slider1.jpg"
        eyebrow="Gallery"
        title={
          <>
            Moments where heaven
            <br />
            <span className="italic text-gold">touched earth.</span>
          </>
        }
        intro="A walk through services, worship nights, deliverance encounters, and the families God has restored at VOGIM Deliverance Ministries."
      />

      {/* CATEGORY STRIP */}
      <section className="bg-ivory border-b border-midnight/10 sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-ivory/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-5 flex items-center gap-4 overflow-x-auto">
          <span className="hidden sm:inline-flex items-center text-gold-deep shrink-0">
            <Camera size={16} className="mr-2" />
            <span className="eyebrow">Filter</span>
          </span>
          <div className="flex gap-2 sm:gap-3 flex-nowrap">
            {CATEGORIES.map((c, i) => (
              <span
                key={c}
                className={`shrink-0 text-[11px] tracking-[0.28em] uppercase px-4 py-2 border transition-colors ${
                  i === 0
                    ? "bg-midnight text-gold border-midnight"
                    : "border-midnight/25 text-midnight/70 hover:bg-midnight hover:text-gold"
                }`}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* MOSAIC GRID */}
      <section className="relative bg-ivory paper-grain">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-16 sm:py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              From the altar
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-midnight mt-5 leading-[1.05] max-w-2xl">
              Glory, frame by <span className="italic">frame.</span>
            </h2>
          </Reveal>

          <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:auto-rows-[16rem] lg:auto-rows-[18rem] gap-px bg-midnight/15">
            {PHOTOS.map((p, i) => (
              <Reveal
                key={p.id}
                delay={i * 0.04}
                className={spanClasses(p.span)}
              >
                <figure className="relative w-full h-full overflow-hidden group bg-midnight">
                  <Image
                    src={p.src}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/30 to-transparent opacity-90" />
                  <figcaption className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7 text-white">
                    <span className="text-[10px] tracking-[0.32em] uppercase text-gold">
                      {p.category} · {String(p.id).padStart(2, "0")}
                    </span>
                    <p className="font-display text-xl sm:text-2xl mt-2 leading-tight">
                      {p.title}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-white/75 italic font-display">
                      {p.caption}
                    </p>
                  </figcaption>
                  <div className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 sm:w-10 sm:h-10 border border-gold/70 bg-midnight/60 backdrop-blur flex items-center justify-center text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={16} />
                  </div>
                </figure>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p className="mt-12 text-center text-midnight/65 text-sm max-w-xl mx-auto leading-relaxed">
              These are only fragments. The real testimonies live in the hearts
              of those Jesus has set free.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-6 py-16 sm:py-20 lg:py-28 text-center">
          <p className="eyebrow text-gold">
            <span className="gold-rule mr-3" />
            Be in the next frame
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight mt-5">
            Your story belongs
            <br />
            <span className="italic text-gold">on this wall.</span>
          </h2>
          <p className="mt-6 max-w-xl mx-auto text-ivory/80 leading-relaxed">
            Come to a service, send in a request, or step into online
            deliverance. The Lord is still doing miracles.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-5 justify-center items-center">
            <Link
              href="/deliverance-request"
              className="btn-gold w-full sm:w-auto justify-center"
            >
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
