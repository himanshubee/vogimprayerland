// GA4 measurement ID ("vogimprayerland.org - GA4" stream).
// Override per-environment via NEXT_PUBLIC_GA_ID.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-LQF04TNC6V";

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
