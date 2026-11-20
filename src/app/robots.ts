import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/ministry";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Claude-SearchBot", "Applebot"],
        allow: "/",
      },
      { userAgent: ["GPTBot", "Google-Extended"], disallow: "/" },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout/", "/cart/", "/faq/search/", "/give/thank-you/", "/checkout/thank-you/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
