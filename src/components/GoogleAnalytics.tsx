// GA4 measurement ID. Carried over from the previous WordPress site
// (old.vogimprayerland.org). Override per-environment via NEXT_PUBLIC_GA_ID.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-8H8Z3K4M1B";

// Rendered as plain <script> tags inside <head> (not next/script
// afterInteractive) so the gtag.js snippet is in the server HTML —
// Google Search Console's "Google Analytics" ownership check requires it.
export default function GoogleAnalytics() {
  // Don't pollute the GA property with local-dev traffic.
  if (process.env.NODE_ENV !== "production") return null;
  if (!GA_ID) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <script
        id="ga4-init"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `,
        }}
      />
    </>
  );
}
