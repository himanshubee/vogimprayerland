import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { GalleryClient, type Photo } from "./GalleryClient";

export const metadata = {
  title: "Gallery — VOGIM Prayer Land",
  description:
    "Photographs from VOGIM Deliverance Ministries — prophetic services, worship nights, deliverance encounters, and moments of restoration.",
};

const PHOTOS: Photo[] = [
  {
    id: 1,
    title: "Prophetic Service",
    caption: "The Word goes forth, the altar burns.",
    src: "https://img.vogimprayerland.org/1780648526061-slider3.webp",
    category: "Services",
    width: 1920,
    height: 1000,
  },
  {
    id: 2,
    title: "Worship Night",
    caption: "Hearts lifted, heaven opened.",
    src: "https://img.vogimprayerland.org/1780648526009-slider2.webp",
    category: "Worship",
    width: 1920,
    height: 1000,
  },
  {
    id: 3,
    title: "Children at the Altar",
    caption: "The next generation, hands lifted high.",
    src: "https://img.vogimprayerland.org/1780648525318-slider1.jpg",
    category: "Services",
    width: 1920,
    height: 1000,
  },
  {
    id: 4,
    title: "Sunset Vigil",
    caption: "All-night prayer until the breakthrough.",
    src: "https://img.vogimprayerland.org/1780648526688-worship.jpg",
    category: "Worship",
    width: 1600,
    height: 970,
  },
  {
    id: 5,
    title: "Marital Settlement",
    caption: "Homes rebuilt by the power of God.",
    src: "https://img.vogimprayerland.org/1780648524880-marital-large.jpg",
    category: "Family",
    width: 1024,
    height: 606,
  },
  {
    id: 6,
    title: "Online Deliverance",
    caption: "Captives set free across nations.",
    src: "https://img.vogimprayerland.org/1780648546756-deliverance.webp",
    category: "Deliverance",
    width: 1024,
    height: 1024,
  },
  {
    id: 7,
    title: "Family Restored",
    caption: "What God has joined together.",
    src: "https://img.vogimprayerland.org/1780648527627-marital.webp",
    category: "Family",
    width: 768,
    height: 512,
  },
  {
    id: 8,
    title: "The Anointing Flows",
    caption: "Prophet Olaofe ministering by the Spirit.",
    src: "https://img.vogimprayerland.org/1780648525156-prophet.webp",
    category: "Services",
    width: 2400,
    height: 1658,
  },
  {
    id: 9,
    title: "Sunday Gathering",
    caption: "Where the saints come together.",
    src: "https://img.vogimprayerland.org/1780648525834-main-height.jpg",
    category: "Services",
    width: 1778,
    height: 1000,
  },
];

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        image="https://img.vogimprayerland.org/1780648525318-slider1.jpg"
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

      <GalleryClient photos={PHOTOS} />

      {/* CTA */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-6 py-16 sm:py-20 lg:py-28 text-center">
          <Reveal>
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
          </Reveal>
        </div>
      </section>
    </>
  );
}
