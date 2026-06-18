import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { GalleryClient } from "./GalleryClient";
import { listMedia } from "@/lib/media";

export const metadata = {
  alternates: { canonical: "/gallery/" },
  title: "Gallery — VOGIM Prayer Land",
  description:
    "Photographs from VOGIM Deliverance Ministries — prophetic services, worship nights, deliverance encounters, and moments of restoration.",
};

// Refresh the gallery shortly after media is edited in the admin panel.
export const revalidate = 300;

export default async function GalleryPage() {
  const photos = await listMedia();
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

      <GalleryClient photos={photos} />

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
