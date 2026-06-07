import Script from "next/script";

// Google AdSense publisher ID. Override per-environment via
// NEXT_PUBLIC_ADSENSE_CLIENT (e.g. "ca-pub-XXXXXXXXXXXXXXXX").
const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-7788632056034755";

/**
 * Loads the AdSense library. Drop this on any page where ads should appear
 * (blog list + individual posts). With Auto ads enabled in the AdSense
 * dashboard this is all that's needed; for manual placements add <AdUnit />
 * with a slot from your AdSense account.
 *
 * The `id` keeps next/script from injecting the loader more than once.
 */
export default function Adsense() {
  // Only run on the live site — AdSense rejects / pollutes data on localhost.
  if (process.env.NODE_ENV !== "production") return null;
  if (!ADSENSE_CLIENT) return null;

  return (
    <Script
      id="adsbygoogle-loader"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}

/**
 * A single responsive display ad unit. Pass a `slot` created in your AdSense
 * dashboard (Ads → By ad unit). Renders nothing until <Adsense /> has loaded
 * the library on the page.
 */
export function AdUnit({
  slot,
  className,
  format = "auto",
}: {
  slot: string;
  className?: string;
  format?: string;
}) {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <ins
        className={`adsbygoogle block${className ? ` ${className}` : ""}`}
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      <Script id={`adsbygoogle-push-${slot}`} strategy="afterInteractive">
        {`(adsbygoogle = window.adsbygoogle || []).push({});`}
      </Script>
    </>
  );
}
