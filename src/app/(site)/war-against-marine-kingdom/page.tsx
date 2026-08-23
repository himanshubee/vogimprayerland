import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  Download,
  Quote,
  Radio,
  Share2,
  Ticket,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { RichText } from "@/components/RichText";
import { audioSource, videoSource } from "@/lib/embed";
import { getPageContent, getPageMeta, getPageSeo } from "@/lib/page-content";
import { NightReplay, VideoFrame } from "./Replay";
import { RegisterForm } from "./RegisterForm";

/**
 * Crusade page — written to outlive the crusade.
 *
 * Inside the (site) group, so it carries the ministry's own navbar and footer
 * and reads as part of the site rather than a detached campaign page.
 * Registrations go to /api/submissions and appear in /admin like every other
 * form on the site.
 *
 * The page has three lives, and moves between them on its own:
 *   before — the flyer, the three nights, and the registration form
 *   live   — a strip at the top with the Zoom door open
 *   after  — the recordings and the testimonies rise to the top, the form
 *            becomes "tell me about the next one"
 *
 * The recordings and testimonies are typed into /admin/pages after the event
 * (see the "war-against-marine-kingdom" schema in lib/page-content.ts). They
 * default to empty and each section stays hidden until there is something real
 * to put in it, so the page never promises a recording that does not exist.
 */

const PAGE_KEY = "war-against-marine-kingdom";
const PAGE_URL = "https://www.vogimprayerland.org/war-against-marine-kingdom/";

/** ISR window — also how quickly the page notices it has changed phase. */
export const revalidate = 300;

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

const DESCRIPTION =
  "Three nights of prophetic warfare to break covenants with water spirits, dissolve spiritual marriages and reclaim destinies. 25–27 September 2026, 7PM WAT, live on Zoom. Free to attend.";

/**
 * Title/description/canonical come from the CMS like every other page; the
 * share image is forced to the flyer unless someone has deliberately chosen
 * another one in the SEO panel.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [meta, seo] = await Promise.all([getPageMeta(PAGE_KEY), getPageSeo(PAGE_KEY)]);
  if (seo.ogImage) return meta;
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      images: [{ url: FLYER_IMAGE, width: FLYER_W, height: FLYER_H, alt: FLYER_ALT }],
    },
    twitter: {
      ...meta.twitter,
      card: "summary_large_image",
      images: [FLYER_IMAGE],
    },
  };
}

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

/** 7PM WAT (UTC+1) on the first night, to the close of the last. */
const CRUSADE_START = Date.parse("2026-09-25T19:00:00+01:00");
const CRUSADE_END = Date.parse("2026-09-27T22:30:00+01:00");

type Phase = "before" | "live" | "after";

/**
 * Where the crusade is, right now. Read once per render on the server and
 * held for the ISR window above — the page turns itself over from "register"
 * to "watch it again" within five minutes of the last night ending, with
 * nobody having to publish anything.
 */
function currentPhase(): Phase {
  const now = Date.now();
  if (now < CRUSADE_START) return "before";
  if (now <= CRUSADE_END) return "live";
  return "after";
}

/**
 * One Event per night, so each shows up as its own result and calendar entry —
 * plus a VideoObject for every night that has been published, which is what
 * keeps the page findable long after the crusade itself.
 */
function buildJsonLd(nights: { num: string; title: string; iso: string; video: string }[]) {
  const image = [`https://www.vogimprayerland.org${FLYER_IMAGE}`];

  const events = nights.map((night) => ({
    "@type": "Event",
    name: `War Against the Marine Kingdom — Night ${night.num}: ${night.title}`,
    description: DESCRIPTION,
    image,
    // 7PM West Africa Time (UTC+1).
    startDate: `${night.iso}T19:00:00+01:00`,
    endDate: `${night.iso}T22:00:00+01:00`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: { "@type": "VirtualLocation", url: PAGE_URL },
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
  }));

  const videos = nights
    .filter((night) => videoSource(night.video))
    .map((night) => ({
      "@type": "VideoObject",
      name: `War Against the Marine Kingdom — Night ${night.num}: ${night.title}`,
      description: DESCRIPTION,
      thumbnailUrl: image,
      uploadDate: `${night.iso}T22:00:00+01:00`,
      contentUrl: night.video,
      url: PAGE_URL,
    }));

  return { "@context": "https://schema.org", "@graph": [...events, ...videos] };
}

export default async function MarineKingdomCrusadePage() {
  const c = await getPageContent(PAGE_KEY);
  const phase = currentPhase();
  const isAfter = phase === "after";

  const nights = NIGHTS.map((night, i) => ({
    ...night,
    video: c[`night${i + 1}Video`] ?? "",
    audio: c[`night${i + 1}Audio`] ?? "",
  }));
  const recorded = nights.filter(
    (night) => videoSource(night.video) || audioSource(night.audio)
  );

  const testimonies = [1, 2, 3, 4]
    .map((i) => ({
      text: (c[`testimony${i}Text`] ?? "").trim(),
      name: (c[`testimony${i}Name`] ?? "").trim(),
      place: (c[`testimony${i}Place`] ?? "").trim(),
    }))
    .filter((t) => t.text);
  const testimonyVideo = videoSource(c.testimonyVideo ?? "") ? c.testimonyVideo : "";

  /* ------------------------------ Sections ------------------------------ */

  const liveStrip = phase === "live" && (
    <section className="bg-gold text-midnight">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Radio size={22} className="shrink-0 animate-pulse" aria-hidden />
          <div>
            <p className="font-display text-2xl leading-tight">{c.liveTitle}</p>
            <p className="mt-1 text-sm text-midnight/75 leading-relaxed">
              {c.liveBody}
            </p>
          </div>
        </div>
        <a
          href={c.liveButtonHref}
          target="_blank"
          rel="noopener"
          className="shrink-0 inline-flex items-center gap-2 bg-midnight px-6 py-3.5 text-[0.78rem] font-semibold uppercase tracking-[0.05em] text-gold transition-colors hover:bg-maroon"
        >
          {c.liveButtonLabel} <ArrowUpRight size={16} />
        </a>
      </div>
    </section>
  );

  const replaySection = recorded.length > 0 && (
    <section className="bg-midnight-dark text-ivory">
      <div className="mx-auto max-w-4xl px-5 sm:px-6 py-16 sm:py-24">
        <Reveal>
          <p className="eyebrow text-gold">
            <span className="gold-rule mr-3" />
            {c.replayEyebrow}
          </p>
          <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
            <RichText text={c.replayTitle} />
          </h2>
          <p className="mt-5 max-w-xl text-ivory/70 leading-relaxed">
            {c.replayIntro}
          </p>
        </Reveal>

        <div className="mt-12 space-y-14">
          {recorded.map((night) => (
            <Reveal key={night.num}>
              <NightReplay night={night} />
            </Reveal>
          ))}
        </div>

        {c.replayNote && (
          <p className="mt-12 text-xs text-ivory/45 leading-relaxed">
            {c.replayNote}
          </p>
        )}
      </div>
    </section>
  );

  const testimoniesSection = (testimonies.length > 0 || testimonyVideo) && (
    <section className="bg-ivory paper-grain">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-24">
        <Reveal>
          <p className="eyebrow text-gold-deep">
            <span className="gold-rule mr-3" />
            {c.testimoniesEyebrow}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
            <RichText text={c.testimoniesTitle} accentClass="italic text-gold-deep" />
          </h2>
          <p className="mt-5 max-w-2xl text-midnight/70 leading-relaxed">
            {c.testimoniesIntro}
          </p>
        </Reveal>

        {testimonies.length > 0 && (
          <Reveal delay={0.1}>
            <ul className="mt-12 grid sm:grid-cols-2 gap-px border border-midnight/12 bg-midnight/12">
              {testimonies.map((t, i) => (
                <li key={i} className="bg-ivory p-8 sm:p-10">
                  <Quote size={20} className="text-gold-deep" aria-hidden />
                  <blockquote className="mt-4 font-display text-xl md:text-2xl italic text-midnight leading-snug">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                  {(t.name || t.place) && (
                    <p className="mt-6 text-[11px] tracking-[0.24em] uppercase text-midnight/50">
                      {t.name}
                      {t.name && t.place && " · "}
                      {t.place && <span className="text-gold-deep">{t.place}</span>}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        {testimonyVideo && (
          <Reveal delay={0.15}>
            <figure className="mt-12 max-w-3xl">
              <div className="bg-midnight-dark p-3">
                <VideoFrame url={testimonyVideo} title={c.testimonyVideoLabel} />
              </div>
              <figcaption className="mt-3 text-[11px] tracking-[0.24em] uppercase text-midnight/50">
                {c.testimonyVideoLabel}
              </figcaption>
            </figure>
          </Reveal>
        )}
      </div>
    </section>
  );

  const flyerSection = (
    <section className="bg-cream paper-grain border-y border-midnight/10">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-14 sm:py-20 grid md:grid-cols-[minmax(0,340px)_1fr] gap-10 md:gap-16 items-center">
        <Reveal>
          <div className="relative mx-auto w-full max-w-[340px]">
            {/* Print-mount hairline, offset behind the flyer */}
            <span aria-hidden className="absolute -inset-2.5 border border-gold/40" />
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
            {c.flyerEyebrow}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
            <RichText
              text={isAfter ? c.flyerTitleAfter : c.flyerTitle}
              accentClass="italic text-gold-deep"
            />
          </h2>
          <p className="mt-5 max-w-xl text-midnight/70 leading-relaxed">
            {isAfter ? c.flyerBodyAfter : c.flyerBody}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a
              href={FLYER_PDF}
              download="war-against-marine-kingdom-flyer.pdf"
              className="btn-gold justify-center"
            >
              <Download size={16} /> Download the flyer
            </a>
            {!isAfter && (
              <a
                href={SHARE_URL}
                target="_blank"
                rel="noopener"
                className="btn-ghost text-midnight border-midnight/30 justify-center"
              >
                <Share2 size={15} /> Share on WhatsApp
              </a>
            )}
          </div>

          <p className="mt-5 text-xs text-midnight/50">
            PDF · one page · tap the flyer to open it full size
          </p>
        </Reveal>
      </div>
    </section>
  );

  const nightsSection = (
    <section className="bg-ivory paper-grain">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-20 items-start">
        <Reveal>
          <p className="eyebrow text-gold-deep">
            <span className="gold-rule mr-3" />
            {c.nightsEyebrow}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
            <RichText
              text={isAfter ? c.nightsTitleAfter : c.nightsTitle}
              accentClass="italic text-gold-deep"
            />
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
            <RegisterForm mode={isAfter ? "notify" : "register"} />
          </div>
        </Reveal>
      </div>
    </section>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(nights)) }}
      />

      <PageHeader
        eyebrow={
          phase === "live"
            ? c.heroEyebrowLive
            : isAfter
              ? c.heroEyebrowAfter
              : c.heroEyebrow
        }
        title={<RichText text={c.heroTitle} />}
        intro={isAfter ? c.heroIntroAfter : c.heroIntro}
        scripture={{ ref: c.heroScriptureRef, text: c.heroScripture }}
        image={c.heroImage}
      />

      {liveStrip}
      {replaySection}
      {testimoniesSection}

      {/* Once the crusade is past, the three nights become the record of what
          happened and the flyer becomes an archive item — so they swap. */}
      {isAfter ? (
        <>
          {nightsSection}
          {flyerSection}
        </>
      ) : (
        <>
          {flyerSection}
          {nightsSection}
        </>
      )}

      {/* CLOSING STRIP */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-display italic text-3xl md:text-4xl leading-snug">
            &ldquo;{c.closingQuote}&rdquo;
          </p>
          <p className="mt-4 text-[11px] tracking-[0.32em] uppercase text-gold">
            {c.closingRef}
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
