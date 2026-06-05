import type { NextConfig } from "next";

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
};

export default nextConfig;
