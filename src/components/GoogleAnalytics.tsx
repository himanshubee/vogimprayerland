import Script from "next/script";

// GA4 measurement ID. Carried over from the previous WordPress site
// (old.vogimprayerland.org). Override per-environment via NEXT_PUBLIC_GA_ID.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-8H8Z3K4M1B";

export default function GoogleAnalytics() {
  // Don't pollute the GA property with local-dev traffic.
  if (process.env.NODE_ENV !== "production") return null;
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
