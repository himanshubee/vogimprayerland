import type { NextConfig } from "next";
import { CONSOLIDATED_REDIRECTS, LEGACY_REDIRECTS } from "./src/lib/legacy-redirects";

const REDIRECT_MAP = new Map<string, string>([...LEGACY_REDIRECTS, ...CONSOLIDATED_REDIRECTS]);

/** Follow a slug through the redirect lists to the page that actually serves. */
function resolveRedirect(from: string): string {
  let to = REDIRECT_MAP.get(from) ?? "";
  for (let hops = 0; REDIRECT_MAP.has(to) && hops < 10; hops++) to = REDIRECT_MAP.get(to)!;
  return to ? `/${to}/` : "/";
}

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdn.chatway.app",
              // Chatway loads its own stylesheet and fonts; without them the widget renders unstyled in the page flow.
              "style-src 'self' 'unsafe-inline' https://cdn.chatway.app",
              "font-src 'self' data: https://cdn.chatway.app https://*.chatway.app",
              "img-src 'self' data: blob: https://img.vogimprayerland.org https://www.google-analytics.com https://www.googletagmanager.com https://*.chatway.app",
              // Chatway looks up the visitor's region through Cloudflare's trace endpoint.
              "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.chatway.app wss://*.chatway.app https://www.cloudflare.com",
              "frame-src 'self' https://www.youtube.com https://www.facebook.com https://*.chatway.app",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Send the bare host to the canonical www host before content is served.
      // Next normalises the trailing slash off a redirect destination, so a
      // deep URL lands on www and then takes one more hop to get its slash
      // back. Moving this to Cloudflare would make it a single hop.
      {
        source: "/:path*",
        has: [{ type: "host", value: "vogimprayerland.org" }],
        destination: "https://www.vogimprayerland.org/:path*",
        statusCode: 301,
      },

      // The basket and checkout used to live under /books; they now serve
      // the store as well. Query strings carry over, so an old gateway return
      // URL still lands on the receipt.
      { source: "/books/cart", destination: "/cart/", statusCode: 301 },
      { source: "/books/checkout", destination: "/checkout/", statusCode: 301 },
      { source: "/books/thank-you", destination: "/checkout/thank-you/", statusCode: 301 },

      // Individual posts that the WordPress import left behind, plus the
      // leftovers and duplicates consolidated into stronger pages. Each one
      // is resolved to its final page so Google never walks a chain.
      ...[...LEGACY_REDIRECTS, ...CONSOLIDATED_REDIRECTS].map(([from]) => ({
        source: `/${from}`,
        destination: resolveRedirect(from),
        statusCode: 301,
      })),

      // WordPress archive and feed shapes. None of these exist here, and
      // Google still crawls them — /category/vogim/page/25, /blogs/page/51 and
      // friends all appear in Search Console, each spending crawl budget to
      // reach a 404. The articles themselves are in the sitemap, so the
      // archives only need to land somewhere sensible.
      { source: "/category/:path*", destination: "/blog/", statusCode: 301 },
      { source: "/tag/:path*", destination: "/blog/", statusCode: 301 },
      // WordPress author archives. The one real author profile lives under
      // /author/ too, so it is excluded, and /author/ itself goes to it.
      { source: "/author", destination: "/author/prophet-olaofe-oladele/", statusCode: 301 },
      { source: "/author/:path((?!prophet-olaofe-oladele(?:/|$)).*)", destination: "/blog/", statusCode: 301 },
      { source: "/blogs/page/:path*", destination: "/blog/", statusCode: 301 },
      { source: "/feed", destination: "/blog/", statusCode: 301 },
      { source: "/:path*/feed", destination: "/blog/", statusCode: 301 },
    ];
  },
};

export default nextConfig;
