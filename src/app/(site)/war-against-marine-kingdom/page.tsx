import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock, Ticket, Video } from "lucide-react";
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
    images: [{ url: "/icon.png" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
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
    // 7PM West Africa Time (UTC+1).
    startDate: `${night.iso}T19:00:00+01:00`,
    endDate: `${night.iso}T22:00:00+01:00`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: "https://www.vogimprayerland.org/war-against-marine-kingdom/",
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
      url: "https://www.vogimprayerland.org/war-against-marine-kingdom/",
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
