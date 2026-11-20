import facts from "../../content/ministry-facts.json";

export const MINISTRY = facts;
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.vogimprayerland.org"
).replace(/\/$/, "");
export const SITE_NAME = MINISTRY.name;
export const DEFAULT_OG_IMAGE = "/icon.png";
export const CONSENT_POLICY_VERSION = "2026-11-20";

export type Service = (typeof MINISTRY.services)[number];

export const PAGE_TITLES: Record<string, string> = {
  about: "About",
  blog: "Articles",
  books: "Books",
  complaints: "Complaints",
  contact: "Contact",
  "cookie-policy": "Cookie policy",
  "deliverance-request": "Deliverance request",
  "dream-interpretation": "Dream interpretation",
  faq: "FAQs",
  "first-time-here": "First time here",
  "online-services": "Online services",
  "prayer-requests": "Prayer requests",
  deliverance: "Deliverance",
  "marriage-and-family": "Marriage and family",
  dreams: "Dreams",
  "giving-and-partnership": "Giving and partnership",
  "store-and-books": "Store and books",
  "privacy-and-safety": "Privacy and safety",
  search: "Search",
  outreach: "Outreach",
  safeguarding: "Safeguarding",
  accessibility: "Accessibility",
  "what-we-believe": "What we believe",
  "where-gifts-go": "Where gifts go",
  glossary: "Glossary",
  gallery: "Gallery",
  give: "Give",
  healing: "Healing ministry",
  "healing-request": "Healing request",
  "how-requests-work": "How requests work",
  leaders: "Leaders",
  "marital-settlement": "Marital settlement",
  media: "Media",
  notice: "Official channels",
  "online-deliverance": "Online deliverance",
  partnership: "Partnership",
  "prayer-request": "Prayer request",
  "privacy-policy": "Privacy policy",
  "privacy-requests": "Privacy requests",
  "refund-policy": "Giving and refund policy",
  services: "Services and Zoom",
  store: "Store",
  "terms-and-conditions": "Terms and conditions",
  testimonies: "Testimonies",
  visit: "Plan your visit",
  zoom: "Zoom",
};

export function absoluteUrl(path = "/") {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalised === "/" ? "/" : `${normalised.replace(/\/$/, "")}/`}`;
}
