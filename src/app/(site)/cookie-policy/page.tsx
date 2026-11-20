import type { Metadata } from "next";
import { SimplePage } from "@/components/SimplePage";
import { absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Cookie Policy | VOGIM Prayer Land",
  description: "See the cookies and browser storage used by VOGIM Prayer Land, why they are needed and how long they last. Analytics and chat run only with your permission.",
  alternates: { canonical: absoluteUrl("/cookie-policy/") },
};

const ROWS = [
  ["vogim_admin", "VOGIM Prayer Land", "Authenticated admin session", "Strictly necessary", "Browser session"],
  ["vogim_consent_v1", "VOGIM Prayer Land", "Your choices, timestamp and policy version", "Strictly necessary", "Up to 12 months"],
  ["vogim_service_bar_dismissed", "VOGIM Prayer Land", "Remember a dismissed service announcement", "Strictly necessary", "14 days"],
  ["vogim_cart_v1, vogim_cart_currency", "VOGIM Prayer Land", "Basket contents and chosen display currency", "Strictly necessary", "Until cleared in your browser"],
  ["vogim_form_draft_*", "VOGIM Prayer Land", "Optional browser-only draft while the care refresh flag is enabled", "Strictly necessary", "Until sent or cleared"],
  ["form_rate_limits", "VOGIM Prayer Land", "Short-lived hashed network identifier for anti-spam rate limiting; stored server-side", "Strictly necessary", "Up to 10 minutes"],
  ["_ga, _ga_*", "Google Analytics", "Aggregate page and performance measurement", "Analytics", "Set by Google; only after consent"],
  ["Chatway SDK storage", "Chatway", "Continue a live-chat conversation after you tap the launcher", "Functional", "Set by Chatway; only after consent and a tap"],
];

export default function CookiePolicyPage() {
  return (
    <SimplePage eyebrow="Cookie policy" title="Cookies and browser storage" intro="Necessary storage keeps the site secure and remembers your choices. Analytics and live chat are optional. This application does not currently load advertising cookies." closing={false}>
      <aside className="mb-8 rounded-2xl bg-mist p-6"><h2 className="font-display text-2xl text-maroon">In brief</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate"><li>Reject all leaves analytics and chat off.</li><li>Accept all enables analytics and allows chat to load after your tap.</li><li>Manage choices lets you enable each category separately.</li><li>Cookie settings in the footer reopens the manager.</li></ul><p className="mt-4 text-xs">Draft for legal review. Last updated 20 November 2026.</p></aside>
      <div className="overflow-x-auto"><table className="cookie-table w-full border-collapse text-left text-sm"><thead><tr className="bg-mist text-maroon"><th className="p-3">Name</th><th className="p-3">Provider</th><th className="p-3">Purpose</th><th className="p-3">Category</th><th className="p-3">Duration</th></tr></thead><tbody>{ROWS.map((row) => <tr key={row[0]} className="border-b border-soft">{row.map((cell, index) => <td key={cell} data-label={["Name", "Provider", "Purpose", "Category", "Duration"][index]} className="p-3 align-top text-slate">{cell}</td>)}</tr>)}</tbody></table></div>
      <section className="mt-10"><h2 className="font-display text-3xl text-maroon">Google Consent Mode</h2><p className="mt-3 text-slate">Analytics and advertising storage default to denied. Google Analytics loads only after analytics consent. Advertising remains off because this application does not serve ads.</p></section>
      <section className="mt-8"><h2 className="font-display text-3xl text-maroon">Review schedule</h2><p className="mt-3 text-slate">This inventory is based on the application source on 20 November 2026. Provider-set cookie names and durations require a deployed browser scan and quarterly review.</p></section>
    </SimplePage>
  );
}
