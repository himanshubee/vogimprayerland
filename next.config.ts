import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Match the old WordPress permalinks exactly: /slug/ with a trailing slash.
  trailingSlash: true,
};

export default nextConfig;
