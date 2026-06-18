import { cache } from "react";
import { getDb } from "@/lib/mongodb";
import { NAV_LINKS, type NavLink } from "@/lib/nav";

export type { NavLink } from "@/lib/nav";

/** Site-wide editable settings. Everything here is surfaced in /admin/settings
 *  and consumed by the site chrome (navbar, footer) and the contact page. */
export type SiteSettings = {
  // Contact details
  email: string;
  phone: string;
  /** Digits only, for building wa.me links (e.g. "2348150743998"). */
  whatsapp: string;
  /** Address lines, rendered one per line. */
  address: string[];

  // Social profiles (full URLs; empty string hides the icon).
  social: {
    facebook: string;
    youtube: string;
    instagram: string;
    whatsapp: string;
  };

  // Top announcement strip (desktop).
  announcement: {
    enabled: boolean;
    left: string;
    right: string;
  };

  // Footer
  footerQuote: string;
  footerQuoteRef: string;
  footerTagline: string;
  copyrightName: string;

  // Service schedule (contact page strip).
  serviceTimes: { title: string; when: string; mode: string }[];

  // Primary navigation menu.
  nav: NavLink[];

  // Footer link columns.
  footerCol1Title: string;
  footerCol1: { label: string; href: string }[];
  footerCol2Title: string;
  footerCol2: { label: string; href: string }[];
};

/** Defaults mirror the values that were previously hardcoded in the site
 *  chrome, so the live site looks identical until something is edited. */
export const DEFAULT_SETTINGS: SiteSettings = {
  email: "hello@vogimprayerland.org",
  phone: "+234 815 074 3998",
  whatsapp: "2348150743998",
  address: ["18 Association Avenue,", "Owutu-Agric, Ikorodu,", "Lagos State, Nigeria"],
  social: {
    facebook: "",
    youtube: "",
    instagram: "",
    whatsapp: "https://wa.me/2348150743998",
  },
  announcement: {
    enabled: true,
    left: "Online Prophetic Service · Mon & Sat · 10pm WAT",
    right: "18 Association Avenue, Owutu-Agric, Ikorodu · Lagos",
  },
  footerQuote:
    "The Spirit of the Lord is upon me, because he hath anointed me to preach the gospel to the poor; he hath sent me to heal the brokenhearted, to preach deliverance to the captives.",
  footerQuoteRef: "Luke 4:18",
  footerTagline: "Loving God · Loving Others · In the World",
  copyrightName: "Vogim Deliverance Ministries Church",
  serviceTimes: [
    { title: "Worship", when: "Sundays · 9am WAT", mode: "In person & livestream" },
    { title: "Bible Study", when: "Wednesdays · 7pm WAT", mode: "Online via Zoom" },
    {
      title: "Prophetic Service",
      when: "Mon & Sat · 10pm WAT",
      mode: "Online — global audience",
    },
  ],
  nav: NAV_LINKS,
  footerCol1Title: "Ministries",
  footerCol1: [
    { label: "Online Deliverance", href: "/online-deliverance" },
    { label: "Marital Settlement", href: "/marital-settlement" },
    { label: "Healing", href: "/healing-request" },
    { label: "Dream Interpretation", href: "/dream-interpretation" },
    { label: "Prayer Request", href: "/prayer-request" },
  ],
  footerCol2Title: "Visit",
  footerCol2: [
    { label: "About Us", href: "/about" },
    { label: "Blog & Articles", href: "/blog" },
    { label: "Media Gallery", href: "/media" },
    { label: "Give", href: "/give" },
    { label: "Contact", href: "/contact" },
  ],
};

const COLLECTION = "settings";
const DOC_ID = "site";

type SettingsDoc = Partial<SiteSettings> & { _id: string };

/** Shallow-merge a stored doc over the defaults so any field that was never
 *  edited falls back to its default rather than coming back undefined. */
function merge(doc: Partial<SiteSettings> | null): SiteSettings {
  if (!doc) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...doc,
    social: { ...DEFAULT_SETTINGS.social, ...(doc.social ?? {}) },
    announcement: { ...DEFAULT_SETTINGS.announcement, ...(doc.announcement ?? {}) },
    address: doc.address?.length ? doc.address : DEFAULT_SETTINGS.address,
    serviceTimes: doc.serviceTimes?.length
      ? doc.serviceTimes
      : DEFAULT_SETTINGS.serviceTimes,
    nav: doc.nav?.length ? doc.nav : DEFAULT_SETTINGS.nav,
    footerCol1: doc.footerCol1?.length ? doc.footerCol1 : DEFAULT_SETTINGS.footerCol1,
    footerCol2: doc.footerCol2?.length ? doc.footerCol2 : DEFAULT_SETTINGS.footerCol2,
  };
}

/** Cached per-request so the layout + page can both read it without two DB hits. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const db = await getDb();
    const doc = await db.collection<SettingsDoc>(COLLECTION).findOne({ _id: DOC_ID });
    return merge(doc);
  } catch {
    // Never let a settings read break the whole site — fall back to defaults.
    return DEFAULT_SETTINGS;
  }
});

const str = (v: unknown, max = 500) => String(v ?? "").slice(0, max);

function cleanNav(input: unknown): NavLink[] {
  if (!Array.isArray(input)) return DEFAULT_SETTINGS.nav;
  return input
    .map((l) => {
      const link = (l ?? {}) as Record<string, unknown>;
      const children = Array.isArray(link.children)
        ? (link.children as Record<string, unknown>[])
            .map((c) => ({ label: str(c.label, 80), href: str(c.href, 300) }))
            .filter((c) => c.label && c.href)
        : undefined;
      const out: NavLink = { label: str(link.label, 80), href: str(link.href, 300) };
      if (children && children.length) out.children = children;
      return out;
    })
    .filter((l) => l.label && l.href)
    .slice(0, 30);
}

function cleanLinks(input: unknown): { label: string; href: string }[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((l) => {
      const o = (l ?? {}) as Record<string, unknown>;
      return { label: str(o.label, 80), href: str(o.href, 300) };
    })
    .filter((l) => l.label && l.href)
    .slice(0, 12);
}

/** Normalize an arbitrary payload into a complete, typed settings object. */
export function cleanSettings(input: Partial<SiteSettings>): SiteSettings {
  const s = { ...DEFAULT_SETTINGS, ...input };
  return {
    email: str(s.email, 200),
    phone: str(s.phone, 60),
    whatsapp: str(s.whatsapp, 30).replace(/[^\d]/g, ""),
    address: (Array.isArray(s.address) ? s.address : [])
      .map((a) => str(a, 200))
      .filter(Boolean)
      .slice(0, 6),
    social: {
      facebook: str(input.social?.facebook, 300),
      youtube: str(input.social?.youtube, 300),
      instagram: str(input.social?.instagram, 300),
      whatsapp: str(input.social?.whatsapp, 300),
    },
    announcement: {
      enabled: Boolean(input.announcement?.enabled),
      left: str(input.announcement?.left, 200),
      right: str(input.announcement?.right, 200),
    },
    footerQuote: str(s.footerQuote, 1000),
    footerQuoteRef: str(s.footerQuoteRef, 120),
    footerTagline: str(s.footerTagline, 200),
    copyrightName: str(s.copyrightName, 200),
    serviceTimes: (Array.isArray(s.serviceTimes) ? s.serviceTimes : [])
      .map((t) => ({
        title: str(t?.title, 80),
        when: str(t?.when, 120),
        mode: str(t?.mode, 120),
      }))
      .filter((t) => t.title || t.when)
      .slice(0, 8),
    nav: cleanNav(s.nav),
    footerCol1Title: str(s.footerCol1Title, 60) || DEFAULT_SETTINGS.footerCol1Title,
    footerCol1: cleanLinks(s.footerCol1),
    footerCol2Title: str(s.footerCol2Title, 60) || DEFAULT_SETTINGS.footerCol2Title,
    footerCol2: cleanLinks(s.footerCol2),
  };
}

export async function updateSettings(
  input: Partial<SiteSettings>
): Promise<SiteSettings> {
  const clean = cleanSettings(input);
  const db = await getDb();
  await db
    .collection<SettingsDoc>(COLLECTION)
    .updateOne({ _id: DOC_ID }, { $set: clean }, { upsert: true });
  return clean;
}
