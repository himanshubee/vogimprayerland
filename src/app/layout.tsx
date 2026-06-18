import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.vogimprayerland.org"
).replace(/\/$/, "");

const SITE_NAME = "VOGIM Prayer Land";
const DEFAULT_TITLE = "VOGIM Prayer Land — Online Deliverance Ministry";
const DEFAULT_DESCRIPTION =
  "Voice of God International Ministry (VOGIM) — Online deliverance, healing, and restoration through the power of Jesus Christ. Lagos, Nigeria.";
const DEFAULT_OG_IMAGE = "/icon.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "VOGIM",
    "Online Deliverance Ministry",
    "Prayer Request",
    "Healing",
    "Prophet Olaofe",
    "Lagos Nigeria church",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Webmaster-tool site verifications carried over from the previous
  // WordPress site (old.vogimprayerland.org).
  verification: {
    google: "p3zMtdgse25dnwQksgqNy3BV5w7kL4CF7xhmdJ9_fFk",
    yandex: "4fbdd97331c78d4e",
    other: {
      "msvalidate.01": "EC93E391DA3A3C520BA7E94F01CEF220",
      "p:domain_verify": "3f5c42cb99045d55aff099905b5b9999",
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

// Sitewide structured data, mirroring what Rank Math emits on every page:
// the publishing Organization and the WebSite entity (with a search action).
const ORG_AND_SITE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Voice of God International Ministry (VOGIM)",
      alternateName: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      description: DEFAULT_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORG_AND_SITE_JSONLD),
          }}
        />
        {children}
        <Script
          id="google-adsense"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7788632056034755"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
