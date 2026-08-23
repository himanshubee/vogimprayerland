import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock, Download, Share2, Ticket, Video } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { RegisterForm } from "./RegisterForm";

/**
 * Crusade landing page.
 *
 * Inside the (site) group, so it carries the ministry's own navbar and footer
 * and reads as part of the site rather than a detached campaign page.
 * Registrations go to /api/submissions and appear in /admin like every other
 * form on the site.
 */

const PAGE_URL = "https://www.vogimprayerland.org/war-against-marine-kingdom/";

/**
 * The awareness flyer, as handed out and forwarded.
 *
 * Both files sit in public/ beside the .ics: the PDF is the original artwork
 * (one page, print or forward as it is), the JPEG is a 288dpi render of it,
 * used for the on-page frame and as the share card everywhere the link is
 * posted — the flyer is the face of this crusade, so it should be the image
 * WhatsApp and X show rather than the site icon.
 */
const FLYER_PDF = "/war-against-marine-kingdom-flyer.pdf";
const FLYER_IMAGE = "/war-against-marine-kingdom-flyer.jpg";
const FLYER_W = 1016;
const FLYER_H = 1364;
const FLYER_ALT =
  "War Against the Marine Kingdom flyer — live on Zoom, 25–27 September, 7:00 PM WAT nightly, Zoom meeting ID 788 5810 191, entry 100% free. Prophet Olaofe Oladele Emmanuel.";

const SHARE_URL = `https://wa.me/?text=${encodeURIComponent(
  `War Against the Marine Kingdom — three nights of prophetic deliverance, live on Zoom. 25–27 September, 7:00 PM WAT nightly. Free to attend. ${PAGE_URL}`
)}`;

const TITLE = "War Against the Marine Kingdom — Prophetic Deliverance Crusade";
const DESCRIPTION =
  "Three nights of prophetic warfare to break covenants with water spirits, dissolve spiritual marriages and reclaim destinies. 25–27 September 2026, 7PM WAT, live on Zoom. Free to attend.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      { url: FLYER_IMAGE, width: FLYER_W, height: FLYER_H, alt: FLYER_ALT },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [FLYER_IMAGE],
  },
};

const NIGHTS = [
  {
    num: "01",
    title: "Exposing the Marine Covenant",
    date: "Friday, 25 September 2026",
    iso: "2026-09-25",
    body: "What was agreed in secret is brought into the light — every covenant named for what it is.",
  },
  {
    num: "02",
    title: "Breaking Spiritual Marriage & Altars",
    date: "Saturday, 26 September 2026",
    iso: "2026-09-26",
    body: "Spiritual marriages dissolved and marine altars pulled down, by the authority of Christ alone.",
  },
  {
    num: "03",
    title: "Total Deliverance & Restoration",
    date: "Sunday, 27 September 2026",
    iso: "2026-09-27",
    body: "Destinies held captive are reclaimed, and what the waters swallowed is restored.",
  },
];

const ZOOM_ID = "788 5810 191";

const FACTS = [
  { icon: Clock, label: "Time", value: "7:00 PM WAT nightly" },
  { icon: Video, label: "Zoom ID", value: ZOOM_ID },
  { icon: Ticket, label: "Entry", value: "Free to attend" },
];

/** One Event per night, so each shows up as its own result and calendar entry. */
const EVENTS_JSONLD = {
  "@context": "https://schema.org",
  "@graph": NIGHTS.map((night) => ({
    "@type": "Event",
    name: `War Against the Marine Kingdom — Night ${night.num}: ${night.title}`,
    description: DESCRIPTION,
    image: [`https://www.vogimprayerland.org${FLYER_IMAGE}`],
    // 7PM West Africa Time (UTC+1).
    startDate: `${night.iso}T19:00:00+01:00`,
    endDate: `${night.iso}T22:00:00+01:00`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: PAGE_URL,
    },
    organizer: {
      "@type": "Organization",
      name: "Voice of God International Ministry (VOGIM)",
      url: "https://www.vogimprayerland.org",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
      url: PAGE_URL,
    },
  })),
};

export default function MarineKingdomCrusadePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(EVENTS_JSONLD) }}
      />

      <PageHeader
        eyebrow="Prophetic Deliverance Crusade · Live on Zoom"
        title={
          <>
            War against the{" "}
            <span className="italic text-gold">marine kingdom</span>
          </>
        }
        intro="Three nights of prophetic warfare to break covenants with water spirits, dissolve spiritual marriages, and reclaim destinies held captive under marine altars."
        scripture={{
          ref: "Isaiah 27:1",
          text: "He shall slay the dragon that is in the sea.",
        }}
        image="https://img.vogimprayerland.org/1780648526688-worship.jpg"
      />

      {/* THE FLYER */}
      <section className="bg-cream paper-grain border-b border-midnight/10">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-14 sm:py-20 grid md:grid-cols-[minmax(0,340px)_1fr] gap-10 md:gap-16 items-center">
          <Reveal>
            <div className="relative mx-auto w-full max-w-[340px]">
              {/* Print-mount hairline, offset behind the flyer */}
              <span
                aria-hidden
                className="absolute -inset-2.5 border border-gold/40"
              />
              <a
                href={FLYER_PDF}
                target="_blank"
                rel="noopener"
                className="relative block bg-white p-2 shadow-[0_24px_60px_-32px_rgba(58,6,16,0.6)] transition-transform duration-300 hover:-translate-y-1"
              >
                <Image
                  src={FLYER_IMAGE}
                  alt={FLYER_ALT}
                  width={FLYER_W}
                  height={FLYER_H}
                  sizes="(min-width: 768px) 340px, 90vw"
                  className="h-auto w-full"
                />
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              The flyer
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              Send this to someone{" "}
              <span className="italic">the waters are holding</span>
            </h2>
            <p className="mt-5 max-w-xl text-midnight/70 leading-relaxed">
              One page, ready to print or forward. Post it in your church
              WhatsApp group, pin it on a notice board, hand it to a neighbour.
              Every copy that travels is a seat someone did not know was free.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href={FLYER_PDF}
                download="war-against-marine-kingdom-flyer.pdf"
                className="btn-gold justify-center"
              >
                <Download size={16} /> Download the flyer
              </a>
              <a
                href={SHARE_URL}
                target="_blank"
                rel="noopener"
                className="btn-ghost text-midnight border-midnight/30 justify-center"
              >
                <Share2 size={15} /> Share on WhatsApp
              </a>
            </div>

            <p className="mt-5 text-xs text-midnight/50">
              PDF · one page · tap the flyer to open it full size
            </p>
          </Reveal>
        </div>
      </section>

      {/* THE THREE NIGHTS */}
      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-20 items-start">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              Three nights
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              The altar descends <span className="italic">night by night</span>
            </h2>

            <ol className="mt-10 border-t border-midnight/12">
              {NIGHTS.map((night) => (
                <li
                  key={night.num}
                  className="grid grid-cols-[2.5rem_1fr] gap-5 py-6 border-b border-midnight/12"
                >
                  <span className="font-display text-2xl text-gold-deep leading-none pt-1">
                    {night.num}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl text-midnight leading-tight">
                      {night.title}
                    </h3>
                    <time
                      dateTime={night.iso}
                      className="mt-1.5 block text-[11px] tracking-[0.24em] uppercase text-gold-deep"
                    >
                      {night.date}
                    </time>
                    <p className="mt-3 text-sm text-midnight/70 leading-relaxed">
                      {night.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <dl className="mt-10 grid sm:grid-cols-3 gap-6">
              {FACTS.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label}>
                    <dt className="flex items-center gap-2 text-[11px] tracking-[0.24em] uppercase text-midnight/50">
                      <Icon size={14} className="text-gold-deep" />
                      {f.label}
                    </dt>
                    <dd className="mt-1.5 font-display text-xl text-midnight">
                      {f.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="lg:sticky lg:top-28">
              <RegisterForm />
            </div>
          </Reveal>
        </div>
      </section>

      {/* CLOSING STRIP */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-display italic text-3xl md:text-4xl leading-snug">
            &ldquo;Fought from victory — never against a human being.&rdquo;
          </p>
          <p className="mt-4 text-[11px] tracking-[0.32em] uppercase text-gold">
            Ephesians 6:12
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/deliverance-request/" className="btn-gold justify-center">
              Send a deliverance request <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/books/"
              className="btn-ghost text-ivory border-ivory/40 justify-center"
            >
              Books on marine deliverance
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
