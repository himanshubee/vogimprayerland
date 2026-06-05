"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export type Photo = {
  id: number;
  title: string;
  caption: string;
  src: string;
  category: "Services" | "Worship" | "Deliverance" | "Family";
  width: number;
  height: number;
};

const CATEGORIES = ["All", "Services", "Worship", "Deliverance", "Family"] as const;
type Category = (typeof CATEGORIES)[number];

export function GalleryClient({ photos }: { photos: Photo[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Category>("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered =
    active === "All" ? photos : photos.filter((p) => p.category === active);

  const count = useCallback(
    (c: Category) =>
      c === "All" ? photos.length : photos.filter((p) => p.category === c).length,
    [photos]
  );

  const openAt = useCallback(
    (id: number) => setLightbox(filtered.findIndex((p) => p.id === id)),
    [filtered]
  );

  const step = useCallback(
    (dir: 1 | -1) =>
      setLightbox((i) =>
        i === null ? i : (i + dir + filtered.length) % filtered.length
      ),
    [filtered.length]
  );

  // Keyboard controls + scroll lock for the lightbox
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, step]);

  const current = lightbox === null ? null : filtered[lightbox];

  return (
    <>
      {/* CATEGORY STRIP */}
      <section className="bg-ivory border-b border-midnight/10 sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-ivory/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-4 overflow-x-auto">
          <span className="hidden sm:inline-flex items-center text-gold-deep shrink-0">
            <Camera size={16} className="mr-2" />
            <span className="eyebrow">Filter</span>
          </span>
          <div className="flex gap-2 sm:gap-3 flex-nowrap">
            {CATEGORIES.map((c) => {
              const on = c === active;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActive(c)}
                  aria-pressed={on}
                  className={`group shrink-0 inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase px-4 py-2 border transition-colors duration-300 ${
                    on
                      ? "bg-midnight text-gold border-midnight"
                      : "border-midnight/25 text-midnight/70 hover:bg-midnight hover:text-gold hover:border-midnight"
                  }`}
                >
                  {c}
                  <span
                    className={`text-[9px] tabular-nums transition-colors ${
                      on ? "text-gold/70" : "text-midnight/40 group-hover:text-gold/70"
                    }`}
                  >
                    {count(c)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* MASONRY */}
      <section className="relative bg-ivory paper-grain">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-16 sm:py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              From the altar
            </p>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-midnight leading-[1.05] max-w-2xl">
                Glory, frame by <span className="italic">frame.</span>
              </h2>
              <p className="text-midnight/50 text-sm tabular-nums">
                {filtered.length} {filtered.length === 1 ? "moment" : "moments"}
                {active !== "All" && (
                  <span className="text-midnight/40"> · {active}</span>
                )}
              </p>
            </div>
          </Reveal>

          {/* CSS columns = true masonry; each photo keeps its natural ratio */}
          <div className="mt-10 sm:mt-14 columns-1 sm:columns-2 lg:columns-3 gap-3 sm:gap-4 [column-fill:_balance]">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <motion.figure
                  key={p.id}
                  initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: reduce ? 0 : Math.min(i * 0.05, 0.4),
                    ease: [0.22, 0.8, 0.3, 1],
                  }}
                  onClick={() => openAt(p.id)}
                  className="relative mb-3 sm:mb-4 break-inside-avoid overflow-hidden group bg-midnight cursor-pointer"
                >
                  <Image
                    src={p.src}
                    alt={p.title}
                    width={p.width}
                    height={p.height}
                    className="w-full h-auto block transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* gradient sits on top of the image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/15 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500" />
                  {/* inset gold frame on hover */}
                  <div className="absolute inset-2.5 border border-gold/0 group-hover:border-gold/50 transition-colors duration-500 pointer-events-none" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
                    <span className="text-[10px] tracking-[0.3em] uppercase text-gold">
                      {p.category} · {String(p.id).padStart(2, "0")}
                    </span>
                    <p className="font-display text-lg sm:text-xl mt-1 leading-tight translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                      {p.title}
                    </p>
                    <p className="text-xs sm:text-sm text-white/0 group-hover:text-white/75 italic font-display max-h-0 group-hover:max-h-12 overflow-hidden transition-all duration-500">
                      {p.caption}
                    </p>
                  </figcaption>
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 border border-gold/70 bg-midnight/60 backdrop-blur flex items-center justify-center text-gold opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-500">
                    <ArrowUpRight size={16} />
                  </div>
                </motion.figure>
              ))}
            </AnimatePresence>
          </div>

          <Reveal delay={0.1}>
            <p className="mt-12 text-center text-midnight/65 text-sm max-w-xl mx-auto leading-relaxed">
              These are only fragments. The real testimonies live in the hearts
              of those Jesus has set free.
            </p>
          </Reveal>
        </div>
      </section>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-maroon/95 backdrop-blur-sm p-4 sm:p-8"
            onClick={() => setLightbox(null)}
          >
            <div className="absolute inset-0 starfield opacity-20 pointer-events-none" />

            {/* close */}
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 border border-gold/40 text-gold hover:bg-gold hover:text-midnight transition-colors flex items-center justify-center z-10"
            >
              <X size={18} />
            </button>

            {/* counter */}
            <span className="absolute top-5 left-5 sm:top-7 sm:left-7 text-[11px] tracking-[0.3em] uppercase text-gold/80 tabular-nums z-10">
              {String(lightbox! + 1).padStart(2, "0")} /{" "}
              {String(filtered.length).padStart(2, "0")}
            </span>

            {/* prev */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous"
              className="absolute left-2 sm:left-6 w-11 h-11 sm:w-12 sm:h-12 border border-gold/30 text-gold hover:bg-gold hover:text-midnight transition-colors flex items-center justify-center z-10"
            >
              <ChevronLeft size={20} />
            </button>

            {/* next */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next"
              className="absolute right-2 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 border border-gold/30 text-gold hover:bg-gold hover:text-midnight transition-colors flex items-center justify-center z-10"
            >
              <ChevronRight size={20} />
            </button>

            {/* image + caption */}
            <motion.figure
              key={current.id}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 0.8, 0.3, 1] }}
              className="relative w-full max-w-4xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={current.src}
                alt={current.title}
                width={current.width}
                height={current.height}
                className="w-auto h-auto max-w-full max-h-[72vh] object-contain border border-gold/20"
                sizes="100vw"
                priority
              />
              <figcaption className="mt-4 sm:mt-5 text-center">
                <span className="text-[10px] tracking-[0.32em] uppercase text-gold">
                  {current.category}
                </span>
                <p className="font-display text-2xl sm:text-3xl text-white mt-1.5">
                  {current.title}
                </p>
                <p className="mt-1 text-sm text-white/70 italic font-display">
                  {current.caption}
                </p>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
