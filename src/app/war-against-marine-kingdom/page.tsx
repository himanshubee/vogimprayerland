import type { Metadata } from "next";
import Link from "next/link";
import { Bebas_Neue, Inter, JetBrains_Mono } from "next/font/google";
import styles from "./crusade.module.css";
import { RegisterForm } from "./RegisterForm";

/**
 * Crusade landing page.
 *
 * Deliberately outside the (site) route group: no navbar, no site footer. The
 * link goes out on its own through WhatsApp, flyers and the Zoom invite, and
 * the page has exactly one job — get a visitor registered. A link back to the
 * main site sits in the footer for anyone who wants it.
 */

// Self-hosted by next/font rather than an @import, so the display face cannot
// block first paint on the phones most of this audience will arrive on.
const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-crusade",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const TITLE = "War Against Marine Kingdom — Prophetic Deliverance Crusade";
const DESCRIPTION =
  "Three nights of prophetic warfare to break covenants with water spirits, dissolve spiritual marriages and reclaim destinies. 25–27 September 2026, 7PM WAT, live on Zoom. Free to attend.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    // The page is shared as a link far more than it is found by search, so the
    // card preview matters more than the ranking.
    images: [{ url: "/icon.png" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const NIGHTS = [
  {
    num: "01",
    title: "Exposing the Marine Covenant",
    date: "Fri, 25 Sep 2026",
    iso: "2026-09-25",
  },
  {
    num: "02",
    title: "Breaking Spiritual Marriage & Altars",
    date: "Sat, 26 Sep 2026",
    iso: "2026-09-26",
  },
  {
    num: "03",
    title: "Total Deliverance & Restoration",
    date: "Sun, 27 Sep 2026",
    iso: "2026-09-27",
  },
];

const ZOOM_ID = "788 5810 191";

/** One Event per night, so each shows up as its own result and calendar entry. */
const EVENTS_JSONLD = {
  "@context": "https://schema.org",
  "@graph": NIGHTS.map((night) => ({
    "@type": "Event",
    name: `War Against Marine Kingdom — Night ${night.num}: ${night.title}`,
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
    <div className={`${styles.page} ${bebas.variable} ${inter.variable} ${mono.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(EVENTS_JSONLD) }}
      />

      <div className={styles.depthRail} aria-hidden="true" />

      <div className={styles.wrap}>
        <p className={styles.eyebrow}>Prophetic Deliverance Crusade · Live on Zoom</p>

        <h1 className={styles.title}>
          WAR<span className={styles.against}>AGAINST</span>MARINE KINGDOM
        </h1>

        <p className={styles.sub}>
          Three nights of prophetic warfare to <b>break covenants</b> with water
          spirits, <b>dissolve spiritual marriages</b>, and <b>reclaim destinies</b>{" "}
          held captive under marine altars.
        </p>

        <ul className={styles.nights}>
          {NIGHTS.map((night) => (
            <li key={night.num} className={styles.night}>
              <div className={styles.nightNum}>{night.num}</div>
              <div>
                <div className={styles.nightTitle}>{night.title}</div>
                <time className={styles.nightDate} dateTime={night.iso}>
                  {night.date}
                </time>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.metaStrip}>
          <span>
            TIME <b>7:00 PM WAT Nightly</b>
          </span>
          <span>
            ZOOM ID <b>{ZOOM_ID}</b>
          </span>
          <span>
            ENTRY <b>Free</b>
          </span>
        </div>

        <div className={styles.card}>
          <RegisterForm />
        </div>

        <p className={styles.footer}>
          VOGIM · VOICE OF GOD INTERNATIONAL MINISTRY ·{" "}
          <Link href="/">VOGIMPRAYERLAND.ORG</Link>
        </p>
      </div>
    </div>
  );
}
