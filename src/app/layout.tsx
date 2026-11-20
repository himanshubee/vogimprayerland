import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import "./globals.css";
import { DEFAULT_OG_IMAGE, MINISTRY, SITE_NAME, SITE_URL } from "@/lib/ministry";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const DEFAULT_TITLE = "VOGIM Prayer Land | Online Deliverance Ministry, Lagos";
const DEFAULT_DESCRIPTION =
  "VOGIM Prayer Land in Ikorodu, Lagos offers free online prayer, deliverance, healing prayer, marital guidance and dream interpretation. Send a private request.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: "%s" },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: {
    google: ["p3zMtdgse25dnwQksgqNy3BV5w7kL4CF7xhmdJ9_fFk", "v-EZmIPBsPuWYP_O9UnRJVBglFVwuGg8fAvZnad9k1g"],
    yandex: "4fbdd97331c78d4e",
    other: {
      "msvalidate.01": "EC93E391DA3A3C520BA7E94F01CEF220",
      "p:domain_verify": "3f5c42cb99045d55aff099905b5b9999",
      "google-adsense-account": "ca-pub-7788632056034755",
    },
  },
  openGraph: { type: "website", siteName: SITE_NAME, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, url: SITE_URL, locale: "en_NG", images: [{ url: DEFAULT_OG_IMAGE }] },
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, images: [DEFAULT_OG_IMAGE] },
};

const ORG_AND_SITE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Church",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: MINISTRY.alternateName,
      url: SITE_URL,
      logo: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
      description: MINISTRY.description,
      telephone: MINISTRY.phone,
      foundingDate: MINISTRY.foundingDate,
      founder: { "@type": "Person", name: MINISTRY.founder.name, jobTitle: MINISTRY.founder.role },
      address: { "@type": "PostalAddress", ...MINISTRY.address },
      sameAs: [MINISTRY.social.facebook, MINISTRY.social.youtube],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-NG",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG" className={`${cormorant.variable} ${geistSans.variable} h-full antialiased`}>
      <head>
        <script id="consent-defaults" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};window.gtag=window.gtag||gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});` }} />
      </head>
      <body className="flex min-h-full flex-col bg-white text-ink">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_AND_SITE_JSONLD) }} />
        {children}
      </body>
    </html>
  );
}
