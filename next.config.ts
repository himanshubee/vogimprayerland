import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./src/lib/legacy-redirects";

const nextConfig: NextConfig = {
  // Match the old WordPress permalinks exactly: /slug/ with a trailing slash.
  trailingSlash: true,
  images: {
    // Images are served from the S3-backed CDN (img.vogimprayerland.org).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.vogimprayerland.org",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      // The site answers on both hosts, so every page exists twice. The
      // canonical tags all point at www, which mostly holds the index
      // together, but the bare host should never have served a 200 in the
      // first place — send it on before Google has to decide.
      // Next normalises the trailing slash off a redirect destination, so a
      // deep URL lands on www and then takes one more hop to get its slash
      // back. Harmless, but if this is ever moved up to a Cloudflare rule it
      // becomes a single hop.
      {
        source: "/:path*",
        has: [{ type: "host", value: "vogimprayerland.org" }],
        destination: "https://www.vogimprayerland.org/:path*",
        permanent: true,
      },

      // The basket and checkout used to live under /books; they now serve
      // the store as well. Query strings carry over, so an old gateway return
      // URL still lands on the receipt.
      { source: "/books/cart", destination: "/cart/", permanent: true },
      { source: "/books/checkout", destination: "/checkout/", permanent: true },
      { source: "/books/thank-you", destination: "/checkout/thank-you/", permanent: true },

      // Individual posts that the WordPress import left behind.
      ...LEGACY_REDIRECTS.map(([from, to]) => ({
        source: `/${from}`,
        destination: `/${to}/`,
        permanent: true,
      })),

      // WordPress archive and feed shapes. None of these exist here, and
      // Google still crawls them — /category/vogim/page/25, /blogs/page/51 and
      // friends all appear in Search Console, each spending crawl budget to
      // reach a 404. The articles themselves are in the sitemap, so the
      // archives only need to land somewhere sensible.
      { source: "/category/:path*", destination: "/blog/", permanent: true },
      { source: "/tag/:path*", destination: "/blog/", permanent: true },
      { source: "/author/:path*", destination: "/blog/", permanent: true },
      { source: "/blogs/page/:path*", destination: "/blog/", permanent: true },
      { source: "/feed", destination: "/blog/", permanent: true },
      { source: "/:path*/feed", destination: "/blog/", permanent: true },
    ];
  },
};

export default nextConfig;
