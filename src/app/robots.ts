import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/ministry";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Search, answer and AI-model crawlers may read public pages so AI assistants can describe the
        // ministry accurately (D13, decided 20 Nov 2026 following the VisibilityIQ audit).
        userAgent: [
          "Googlebot", "Bingbot", "Applebot", "Applebot-Extended",
          "OAI-SearchBot", "ChatGPT-User", "GPTBot",
          "PerplexityBot", "Perplexity-User",
          "ClaudeBot", "Claude-User", "Claude-SearchBot",
          "Google-Extended", "DuckAssistBot", "Meta-ExternalAgent",
        ],
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout/", "/cart/", "/faq/search/", "/give/thank-you/", "/checkout/thank-you/"],
      },
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
