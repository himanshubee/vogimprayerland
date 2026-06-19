import type { Metadata } from "next";
import { getDb } from "@/lib/mongodb";
import { EMPTY_SEO, type PostSeo } from "@/lib/seo-analysis";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.vogimprayerland.org"
).replace(/\/$/, "");

/**
 * Field-level CMS for the bespoke marketing pages. Each page declares a set of
 * named fields with the current copy as the default. Pages render
 * `getPageContent(key)` and fall back to the default for any field that hasn't
 * been edited, so the live site is unchanged until something is saved.
 *
 * Title/heading fields support a tiny markup so they stay plain-text editable:
 *   - a newline becomes a line break
 *   - text wrapped in _underscores_ renders as the italic-gold accent
 * (see <RichText/> in src/components/RichText.tsx)
 */

export type FieldType = "text" | "textarea" | "image" | "url";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  default: string;
  group?: string;
  hint?: string;
};

export type PageSchema = {
  key: string; // stable id + mongo _id
  label: string; // admin label
  path: string; // public path (for "view" link + revalidation)
  fields: FieldDef[];
  // Default SEO title/description (the page's current metadata), used as the
  // fallback until overridden in the SEO panel.
  seoTitle?: string;
  seoDescription?: string;
};

/* ----------------------------- Schemas ----------------------------- */

const heroFields = (
  eyebrow: string,
  title: string,
  intro: string,
  image: string
): FieldDef[] => [
  { key: "heroEyebrow", label: "Hero eyebrow", type: "text", default: eyebrow, group: "Hero" },
  { key: "heroTitle", label: "Hero title", type: "textarea", default: title, group: "Hero", hint: "New line = line break · _wrap_ for gold italic" },
  { key: "heroIntro", label: "Hero intro", type: "textarea", default: intro, group: "Hero" },
  { key: "heroImage", label: "Hero background image", type: "image", default: image, group: "Hero" },
];

export const PAGE_SCHEMAS: PageSchema[] = [
  {
    key: "home",
    label: "Home",
    path: "/",
    seoTitle: "VOGIM Prayer Land — Online Deliverance Ministry",
    seoDescription:
      "Voice of God International Ministry (VOGIM) — Online deliverance, healing, and restoration through the power of Jesus Christ. Lagos, Nigeria.",
    fields: [
      // Hero
      { key: "heroEyebrow", label: "Hero eyebrow", type: "text", default: "Voice of God International Ministry · est. 2021", group: "Hero" },
      { key: "heroTitle", label: "Hero title", type: "textarea", default: "Where the captive\n_walks free_\nin Jesus' name.", group: "Hero", hint: "New line = line break · _wrap_ for gold italic" },
      { key: "heroIntro", label: "Hero intro", type: "textarea", default: "VOGIM Prayer Land is an online deliverance ministry rooted in Lagos, Nigeria — preaching the gospel, healing the brokenhearted, and setting the captives free by the power of the Holy Ghost.", group: "Hero" },
      { key: "heroImage", label: "Hero background image", type: "image", default: "https://img.vogimprayerland.org/1780648526061-slider3.webp", group: "Hero" },
      { key: "heroPrimaryCta", label: "Primary button label", type: "text", default: "Submit a request", group: "Hero" },
      { key: "heroPrimaryHref", label: "Primary button link", type: "url", default: "/deliverance-request", group: "Hero" },
      { key: "heroSecondaryCta", label: "Secondary link label", type: "text", default: "Discover our story", group: "Hero" },
      { key: "heroSecondaryHref", label: "Secondary link", type: "url", default: "/about", group: "Hero" },
      { key: "heroScripture", label: "Scripture card text", type: "textarea", default: "The Spirit of the Lord is upon me, because he hath anointed me to preach the gospel to the poor; he hath sent me to heal the brokenhearted, to preach deliverance to the captives.", group: "Hero" },
      { key: "heroScriptureRef", label: "Scripture reference", type: "text", default: "Luke 4:18", group: "Hero" },
      { key: "schedule1Day", label: "Schedule 1 — day", type: "text", default: "Monday", group: "Hero" },
      { key: "schedule1Time", label: "Schedule 1 — time", type: "text", default: "10:00 PM", group: "Hero" },
      { key: "schedule2Day", label: "Schedule 2 — day", type: "text", default: "Saturday", group: "Hero" },
      { key: "schedule2Time", label: "Schedule 2 — time", type: "text", default: "10:00 PM", group: "Hero" },
      { key: "scheduleZone", label: "Schedule timezone", type: "text", default: "WAT", group: "Hero" },
      { key: "keywordLead", label: "Keyword strip — lead (gold)", type: "text", default: "— A church for everyone", group: "Hero" },
      { key: "keywords", label: "Keyword strip — items (comma-separated)", type: "text", default: "Deliverance, Healing, Restoration, Marital Settlement, Dream Interpretation", group: "Hero" },
      { key: "keywordLast", label: "Keyword strip — last (gold)", type: "text", default: "Prophetic Service", group: "Hero" },
      // Mission
      { key: "missionEyebrow", label: "Eyebrow", type: "text", default: "The Mission", group: "Mission" },
      { key: "missionTitle", label: "Title", type: "textarea", default: "Loving God,\n_loving others_,\nin the world.", group: "Mission" },
      { key: "missionImage", label: "Image", type: "image", default: "https://img.vogimprayerland.org/1780648526688-worship.jpg", group: "Mission" },
      { key: "missionPara1", label: "Paragraph 1", type: "textarea", default: "By the power of the Holy Ghost, VOGIM Deliverance Ministries brings deliverance, healing and restoration to individuals and families oppressed and tormented by the devil. Chains of bondage are broken in the blood of Jesus Christ of Nazareth.", group: "Mission" },
      { key: "missionPara2", label: "Paragraph 2", type: "textarea", default: "We demonstrate the power of God by breaking generational poverty, ancestral curses, and generational sins — through teaching, prophetic ministry, and the raw display of God's love, grace, and the forgiveness found only in the Lord Jesus Christ.", group: "Mission" },
      { key: "stat1Num", label: "Stat 1 number", type: "text", default: "50+", group: "Mission" },
      { key: "stat1Label", label: "Stat 1 label", type: "text", default: "Nations reached online", group: "Mission" },
      { key: "stat2Num", label: "Stat 2 number", type: "text", default: "1000s", group: "Mission" },
      { key: "stat2Label", label: "Stat 2 label", type: "text", default: "Lives restored", group: "Mission" },
      { key: "stat3Num", label: "Stat 3 number", type: "text", default: "24/7", group: "Mission" },
      { key: "stat3Label", label: "Stat 3 label", type: "text", default: "Intercession upheld", group: "Mission" },
      // Ministries
      { key: "ministriesEyebrow", label: "Eyebrow", type: "text", default: "Our Ministries", group: "Ministries" },
      { key: "ministriesTitle", label: "Title", type: "textarea", default: "Spirit-led pathways\n_to your breakthrough._", group: "Ministries" },
      { key: "ministry1Title", label: "Card 1 title", type: "text", default: "Online Deliverance", group: "Ministries" },
      { key: "ministry1Body", label: "Card 1 body", type: "textarea", default: "Break free from spiritual oppression, generational chains, and demonic strongholds — wherever you are in the world.", group: "Ministries" },
      { key: "ministry1Href", label: "Card 1 link", type: "url", default: "/online-deliverance", group: "Ministries" },
      { key: "ministry2Title", label: "Card 2 title", type: "text", default: "Marital Settlement", group: "Ministries" },
      { key: "ministry2Body", label: "Card 2 body", type: "textarea", default: "Targeted prayer and prophetic counsel for singles, couples, and families seeking divine direction in marriage.", group: "Ministries" },
      { key: "ministry2Href", label: "Card 2 link", type: "url", default: "/marital-settlement", group: "Ministries" },
      { key: "ministry3Title", label: "Card 3 title", type: "text", default: "Healing Ministry", group: "Ministries" },
      { key: "ministry3Body", label: "Card 3 body", type: "textarea", default: "Receive a touch from the Healer. Jesus is still healing the sick — body, soul, and spirit.", group: "Ministries" },
      { key: "ministry3Href", label: "Card 3 link", type: "url", default: "/healing-request", group: "Ministries" },
      { key: "ministry4Title", label: "Card 4 title", type: "text", default: "Dream Interpretation", group: "Ministries" },
      { key: "ministry4Body", label: "Card 4 body", type: "textarea", default: "Discern the voice of God in your dreams. Submit your dream for Spirit-led interpretation.", group: "Ministries" },
      { key: "ministry4Href", label: "Card 4 link", type: "url", default: "/dream-interpretation", group: "Ministries" },
      // Testimonies
      { key: "testimoniesTitle", label: "Title", type: "textarea", default: "What the Lord\nhas done.", group: "Testimonies" },
      { key: "testimoniesIntro", label: "Intro", type: "textarea", default: "Real stories from those who came seeking and left transformed by the power of Jesus Christ.", group: "Testimonies" },
      { key: "testimony1Text", label: "Quote 1", type: "textarea", default: "Received an international opening door to KUWAIT after I had an encounter with the man of God, Prophet Olaofe Oladele. Praise Master Jesus!", group: "Testimonies" },
      { key: "testimony1Name", label: "Quote 1 name", type: "text", default: "Karim Mouinath", group: "Testimonies" },
      { key: "testimony1Place", label: "Quote 1 place", type: "text", default: "Benin Republic", group: "Testimonies" },
      { key: "testimony2Text", label: "Quote 2", type: "textarea", default: "After years of unexplained sickness and torment, one online session brought freedom and peace to my home. Glory to Jesus.", group: "Testimonies" },
      { key: "testimony2Name", label: "Quote 2 name", type: "text", default: "Adaeze O.", group: "Testimonies" },
      { key: "testimony2Place", label: "Quote 2 place", type: "text", default: "Port Harcourt, Nigeria", group: "Testimonies" },
      { key: "testimony3Text", label: "Quote 3", type: "textarea", default: "I joined the Monday service from another continent. The word came alive. My business broke open the following week.", group: "Testimonies" },
      { key: "testimony3Name", label: "Quote 3 name", type: "text", default: "Brother Samuel", group: "Testimonies" },
      { key: "testimony3Place", label: "Quote 3 place", type: "text", default: "London, UK", group: "Testimonies" },
      // Founder
      { key: "founderEyebrow", label: "Eyebrow", type: "text", default: "The Watchman", group: "Founder" },
      { key: "founderTitle", label: "Title", type: "textarea", default: "A man of God, a father to the nation,\n_a giver, a philanthropist._", group: "Founder" },
      { key: "founderImage", label: "Image", type: "image", default: "/past.jpeg", group: "Founder" },
      { key: "founderName", label: "Name caption", type: "textarea", default: "Prophet Olaofe\n_Oladele_", group: "Founder" },
      { key: "founderRole", label: "Role caption", type: "text", default: "Founder & General Overseer", group: "Founder" },
      { key: "founderBody", label: "Body", type: "textarea", default: "Prophet Olaofe Oladele founded VOGIM Deliverance Ministries in May 2021 as a village evangelism work in Porto Novo and the surrounding communities. Today his ministry reaches across the world — delivering captives, healing the sick, and restoring families by the power of the name of Jesus Christ of Nazareth.", group: "Founder" },
      // Final CTA
      { key: "ctaEyebrow", label: "Eyebrow", type: "text", default: "Need Prayer?", group: "Closing CTA" },
      { key: "ctaTitle", label: "Title", type: "textarea", default: "We would love to\n_pray for you._", group: "Closing CTA" },
      { key: "ctaIntro", label: "Intro", type: "textarea", default: "Wherever you are, whatever the burden — there is a place at this altar for you. Send us a message and our intercessors will stand with you.", group: "Closing CTA" },
      { key: "ctaPrimary", label: "Primary button label", type: "text", default: "Send a prayer request", group: "Closing CTA" },
      { key: "ctaPrimaryHref", label: "Primary button link", type: "url", default: "/prayer-request", group: "Closing CTA" },
      { key: "ctaSecondary", label: "Secondary button label", type: "text", default: "Contact the church", group: "Closing CTA" },
      { key: "ctaSecondaryHref", label: "Secondary button link", type: "url", default: "/contact", group: "Closing CTA" },
    ],
  },
  {
    key: "about",
    label: "About",
    path: "/about",
    seoTitle: "About — VOGIM Prayer Land",
    seoDescription:
      "Voice of God International Ministry (VOGIM) — a deliverance ministry rooted in Lagos, Nigeria, founded May 2021 by Prophet Olaofe Oladele.",
    fields: [
      ...heroFields(
        "About the Ministry",
        "A church that believes\nin God. _Everyone is welcome._",
        "VOGIM Deliverance Ministries is a church that operates under the anointing of the Holy Spirit. Jesus is the Healer.",
        "https://img.vogimprayerland.org/1780648526688-worship.jpg"
      ),
      { key: "storyEyebrow", label: "Eyebrow", type: "text", default: "Our Story", group: "Story" },
      { key: "storyTitle", label: "Title", type: "textarea", default: "From a village in Porto Novo\n_to the ends of the earth._", group: "Story" },
      { key: "storyPara1", label: "Paragraph 1", type: "textarea", default: "Vogim Deliverance Ministries Church began in May 2021 as a village evangelism ministry — preaching the gospel to Porto Novo and the surrounding communities. From those humble beginnings, the Lord has opened doors across nations.", group: "Story" },
      { key: "storyPara2", label: "Paragraph 2", type: "textarea", default: "We have been able to deliver people from the captivity of Satan, heal the sick, and set the captives free by the power of Jesus Christ of Nazareth.", group: "Story" },
      { key: "storyPara3", label: "Paragraph 3", type: "textarea", default: "We are also committed to standing with widows, orphans, and orphanage homes — financially, physically, and spiritually. Because love that does not feed, does not move, does not visit — is not love at all.", group: "Story" },
      { key: "storyImage", label: "Founder image", type: "image", default: "https://img.vogimprayerland.org/1780648525156-prophet.webp", group: "Story" },
      { key: "founderRole", label: "Founder role caption", type: "text", default: "Founder & General Overseer", group: "Story" },
      { key: "founderName", label: "Founder name caption", type: "text", default: "Prophet Olaofe Oladele", group: "Story" },
      { key: "founderTagline", label: "Founder tagline", type: "textarea", default: "A man of God, a father to the nation, a giver, and a philanthropist.", group: "Story" },
      { key: "missionTitle", label: "Mission title", type: "textarea", default: "By the power of the Holy Ghost — deliverance, healing & restoration to families oppressed by the devil.", group: "Mission & Vision" },
      { key: "missionPara1", label: "Mission paragraph 1", type: "textarea", default: "Chains of bondage are broken by the power in the blood of Jesus Christ of Nazareth. We demonstrate the power of God by breaking generational chains — poverty, ancestral curses, generational sins — through teaching and the raw display of God's power, grace, love, and forgiveness in the Lord Jesus Christ.", group: "Mission & Vision" },
      { key: "missionPara2", label: "Mission paragraph 2", type: "textarea", default: "In every aspect of the ministry, we will exemplify integrity, excellence, compassion, and a commitment to Christian character and values.", group: "Mission & Vision" },
      { key: "visionTitle", label: "Vision title", type: "textarea", default: "Loving God, loving others —\n_in the world._", group: "Mission & Vision" },
      { key: "visionPara", label: "Vision paragraph", type: "textarea", default: "Souls saved. Lives restored. Families transformed — through the raw word of God and Spirit-led counseling. We see a generation that loves the Lord with all its heart, and loves its neighbor as itself.", group: "Mission & Vision" },
      { key: "visionScripture", label: "Vision scripture", type: "textarea", default: "The Spirit of the Lord is upon me, because he hath anointed me to preach the gospel to the poor; to heal the brokenhearted, to preach deliverance to the captives, and recovering of sight to the blind, to set at liberty them that are bruised — and to preach the acceptable year of the Lord.", group: "Mission & Vision" },
      { key: "visionScriptureRef", label: "Vision scripture reference", type: "text", default: "Luke 4:18–19", group: "Mission & Vision" },
      { key: "pillar1Title", label: "Pillar 1 title", type: "text", default: "Deliverance", group: "Pillars" },
      { key: "pillar1Body", label: "Pillar 1 body", type: "textarea", default: "Setting captives free from demonic oppression, generational chains, and spiritual bondage through the power of the Holy Ghost.", group: "Pillars" },
      { key: "pillar2Title", label: "Pillar 2 title", type: "text", default: "Healing", group: "Pillars" },
      { key: "pillar2Body", label: "Pillar 2 body", type: "textarea", default: "Jesus is the Healer. We pray for the sick, the brokenhearted, and the tormented — by the stripes of Christ they are healed.", group: "Pillars" },
      { key: "pillar3Title", label: "Pillar 3 title", type: "text", default: "Restoration", group: "Pillars" },
      { key: "pillar3Body", label: "Pillar 3 body", type: "textarea", default: "Marriages restored, homes rebuilt, destinies reclaimed. We labor for the full restoration of every soul that comes our way.", group: "Pillars" },
      { key: "ctaTitle", label: "Closing title", type: "textarea", default: "Step into the place where\n_heaven meets your story._", group: "Closing CTA" },
    ],
  },
  {
    key: "online-deliverance",
    label: "Online Deliverance",
    path: "/online-deliverance",
    seoTitle: "Online Deliverance Ministry — VOGIM",
    seoDescription:
      "Embracing freedom through Christ at VOGIM. Online deliverance sessions with Prophet Olaofe Emmanuel — wherever you are.",
    fields: [
      ...heroFields(
        "Online Deliverance Ministry",
        "Embrace freedom\nthrough _Christ._",
        "In a world filled with spiritual challenges, many seek freedom from bondage and oppression. At VOGIM, we believe in the power of God to set people free from the clutches of the enemy.",
        "https://img.vogimprayerland.org/1780648526061-slider3.webp"
      ),
      { key: "introParagraph", label: "Intro paragraph", type: "textarea", default: "Whether you are battling spiritual attacks, anxiety, depression, or feel a dark cloud hovering over your life — _online deliverance ministry can help you break those chains._ Through a deliverance request, you can connect with Prophet Olaofe Emmanuel and experience the transforming power of God.", group: "Intro" },
      { key: "introImage", label: "Intro image", type: "image", default: "https://img.vogimprayerland.org/1780648546756-deliverance.webp", group: "Intro" },
      { key: "whyEyebrow", label: "Why eyebrow", type: "text", default: "Why VOGIM", group: "Why VOGIM" },
      { key: "whyTitle", label: "Why title", type: "textarea", default: "The same power, in your home — _no different than in person._", group: "Why VOGIM" },
      { key: "why1Title", label: "Why card 1 title", type: "text", default: "Without distance", group: "Why VOGIM" },
      { key: "why1Body", label: "Why card 1 body", type: "textarea", default: "Receive ministry from anywhere in the world. The Spirit is not limited by geography.", group: "Why VOGIM" },
      { key: "why2Title", label: "Why card 2 title", type: "text", default: "Privately, confidentially", group: "Why VOGIM" },
      { key: "why2Body", label: "Why card 2 body", type: "textarea", default: "Sessions held in the safety of your home, with discretion and pastoral care.", group: "Why VOGIM" },
      { key: "why3Title", label: "Why card 3 title", type: "text", default: "Immediate help", group: "Why VOGIM" },
      { key: "why3Body", label: "Why card 3 body", type: "textarea", default: "Spiritual attacks don't wait. Submit a request and receive prompt intervention.", group: "Why VOGIM" },
      { key: "why4Title", label: "Why card 4 title", type: "text", default: "Rooted in scripture", group: "Why VOGIM" },
      { key: "why4Body", label: "Why card 4 body", type: "textarea", default: "Centered on the Word of God, the name of Jesus, and the leading of the Holy Spirit — nothing else.", group: "Why VOGIM" },
      { key: "processEyebrow", label: "Process eyebrow", type: "text", default: "How it works", group: "How It Works" },
      { key: "processTitle", label: "Process title", type: "textarea", default: "A simple and profound _process._", group: "How It Works" },
      { key: "step1Num", label: "Step 1 number", type: "text", default: "01", group: "How It Works" },
      { key: "step1Title", label: "Step 1 title", type: "text", default: "Submit your request", group: "How It Works" },
      { key: "step1Body", label: "Step 1 body", type: "textarea", default: "Fill the deliverance form with your concerns and contact details.", group: "How It Works" },
      { key: "step2Num", label: "Step 2 number", type: "text", default: "02", group: "How It Works" },
      { key: "step2Title", label: "Step 2 title", type: "text", default: "Confirmation & scheduling", group: "How It Works" },
      { key: "step2Body", label: "Step 2 body", type: "textarea", default: "Our team reviews and schedules a one-on-one session.", group: "How It Works" },
      { key: "step3Num", label: "Step 3 number", type: "text", default: "03", group: "How It Works" },
      { key: "step3Title", label: "Step 3 title", type: "text", default: "The session", group: "How It Works" },
      { key: "step3Body", label: "Step 3 body", type: "textarea", default: "Prophet Olaofe leads through scripture, prayer, and commands in Jesus' name.", group: "How It Works" },
      { key: "step4Num", label: "Step 4 number", type: "text", default: "04", group: "How It Works" },
      { key: "step4Title", label: "Step 4 title", type: "text", default: "Walk it out", group: "How It Works" },
      { key: "step4Body", label: "Step 4 body", type: "textarea", default: "Receive aftercare scripture, prayer plan, and follow-up support.", group: "How It Works" },
      { key: "expectEyebrow", label: "Expect eyebrow", type: "text", default: "What to expect", group: "What To Expect" },
      { key: "expectTitle", label: "Expect title", type: "textarea", default: "Every session is _Spirit-led._", group: "What To Expect" },
      { key: "expectBody", label: "Expect body", type: "textarea", default: "No two sessions look the same. The Holy Spirit customizes the approach to the specific needs of the individual. What stays constant is the centrality of the Word, the authority of the name of Jesus, and the love of the Father.", group: "What To Expect" },
      { key: "expectButtonLabel", label: "Expect button label", type: "text", default: "Submit a deliverance request", group: "What To Expect" },
      { key: "expectButtonHref", label: "Expect button link", type: "url", default: "/deliverance-request", group: "What To Expect" },
      { key: "signsLabel", label: "Signs box label", type: "text", default: "Signs you may need deliverance", group: "What To Expect" },
      { key: "sign1", label: "Sign 1", type: "text", default: "Persistent, unexplained sickness or torment", group: "What To Expect" },
      { key: "sign2", label: "Sign 2", type: "text", default: "Cycles of poverty, failure, or addiction", group: "What To Expect" },
      { key: "sign3", label: "Sign 3", type: "text", default: "Nightmares, dream attacks, or sleep disturbances", group: "What To Expect" },
      { key: "sign4", label: "Sign 4", type: "text", default: "Marital and family conflict you cannot resolve", group: "What To Expect" },
      { key: "sign5", label: "Sign 5", type: "text", default: "Sudden depression, fear, or oppression", group: "What To Expect" },
      { key: "sign6", label: "Sign 6", type: "text", default: "A sense of being followed, watched, or held back", group: "What To Expect" },
      { key: "sign7", label: "Sign 7", type: "text", default: "Generational patterns repeating in your life", group: "What To Expect" },
      { key: "sign8", label: "Sign 8", type: "text", default: "Brokenness from occult exposure or curses", group: "What To Expect" },
      { key: "signsFootnote", label: "Signs footnote", type: "textarea", default: "If any of these resonate, don't delay. Reach out today.", group: "What To Expect" },
      { key: "ctaTitle", label: "CTA title", type: "textarea", default: "Freedom is\n_a click away._", group: "Closing CTA" },
      { key: "ctaBody", label: "CTA body", type: "textarea", default: "Take the first step toward healing and restoration. Your deliverance is at hand.", group: "Closing CTA" },
      { key: "ctaButtonLabel", label: "CTA button label", type: "text", default: "Submit deliverance request", group: "Closing CTA" },
      { key: "ctaButtonHref", label: "CTA button link", type: "url", default: "/deliverance-request", group: "Closing CTA" },
    ],
  },
  {
    key: "marital-settlement",
    label: "Marital Settlement",
    path: "/marital-settlement",
    seoTitle: "Prayer for Marital Settlement — VOGIM",
    seoDescription:
      "A guide to finding divine guidance and peace in your marital journey. Through prayer and spiritual counsel, VOGIM helps individuals navigate the complexities of marriage.",
    fields: [
      ...heroFields(
        "Prayer for Marital Settlement",
        "Divine guidance\nfor your _marital journey._",
        "Marriage is sacred — but the road can be hard. When you turn to prayer, you invite God's wisdom, patience, and love to steer your path toward happiness and fulfillment.",
        "https://img.vogimprayerland.org/1780648524880-marital-large.jpg"
      ),
      { key: "introImage", label: "Intro Image", type: "image", default: "https://img.vogimprayerland.org/1780648527627-marital.webp", group: "Intro" },
      { key: "introBody", label: "Intro Paragraph", type: "textarea", default: "When we speak of _prayer for marital settlement_, we mean the sacred act of seeking divine intervention to resolve issues, discern the right partner, or strengthen an existing relationship — inviting God to steer your marital path toward happiness and fulfillment.", group: "Intro" },
      { key: "howEyebrow", label: "How Prayer Helps Eyebrow", type: "text", default: "How prayer helps", group: "How Prayer Helps" },
      { key: "howTitle", label: "How Prayer Helps Title", type: "textarea", default: "Four ways God moves on\n_behalf of your marriage._", group: "How Prayer Helps" },
      { key: "point1Title", label: "Point 1 Title", type: "text", default: "Spiritual Alignment", group: "How Prayer Helps" },
      { key: "point1Body", label: "Point 1 Body", type: "textarea", default: "Align your intentions with God's will so His direction is unmistakable in your marital affairs.", group: "How Prayer Helps" },
      { key: "point2Title", label: "Point 2 Title", type: "text", default: "Healing of Wounds", group: "How Prayer Helps" },
      { key: "point2Body", label: "Point 2 Body", type: "textarea", default: "Pray over generational hurts, broken vows, and seasons of disappointment — and watch the Lord restore.", group: "How Prayer Helps" },
      { key: "point3Title", label: "Point 3 Title", type: "text", default: "Patience & Faith", group: "How Prayer Helps" },
      { key: "point3Body", label: "Point 3 Body", type: "textarea", default: "Cultivate trust in God's perfect timing while remaining tender, available, and prayerful.", group: "How Prayer Helps" },
      { key: "point4Title", label: "Point 4 Title", type: "text", default: "Breakthrough Prayer", group: "How Prayer Helps" },
      { key: "point4Body", label: "Point 4 Body", type: "textarea", default: "Stand on the prayers of an intercessor as you wait for divine settlement and lasting peace.", group: "How Prayer Helps" },
      { key: "prayersEyebrow", label: "Prayer Points Eyebrow", type: "text", default: "Pray these words", group: "Prayer Points" },
      { key: "prayersTitle", label: "Prayer Points Title", type: "textarea", default: "Detailed prayer points for _marital settlement._", group: "Prayer Points" },
      { key: "prayer1Title", label: "Prayer 1 Title", type: "text", default: "For the right partner", group: "Prayer Points" },
      { key: "prayer1Body", label: "Prayer 1 Body", type: "textarea", default: "Father, by your Spirit, lead me to the partner ordained for me — one who fears you, loves me, and will walk in covenant with me all the days of our lives. In Jesus' name, amen.", group: "Prayer Points" },
      { key: "prayer2Title", label: "Prayer 2 Title", type: "text", default: "For the restoration of a marriage", group: "Prayer Points" },
      { key: "prayer2Body", label: "Prayer 2 Body", type: "textarea", default: "Lord, I bring my marriage before your throne. Heal what is broken, expose every hidden thing, and rebuild us in the strength of your love. In Jesus' name, amen.", group: "Prayer Points" },
      { key: "prayer3Title", label: "Prayer 3 Title", type: "text", default: "For peace in the home", group: "Prayer Points" },
      { key: "prayer3Body", label: "Prayer 3 Body", type: "textarea", default: "King of glory, let your peace rule in our home. Silence every voice that is not yours and let our home be a sanctuary of joy. In Jesus' name, amen.", group: "Prayer Points" },
      { key: "helpEyebrow", label: "How VOGIM Helps Eyebrow", type: "text", default: "How VOGIM helps", group: "How VOGIM Helps" },
      { key: "helpTitle", label: "How VOGIM Helps Title", type: "textarea", default: "Walk with an intercessor who has _walked this path._", group: "How VOGIM Helps" },
      { key: "helpBody", label: "How VOGIM Helps Body", type: "textarea", default: "VOGIM specializes in spiritual guidance for individuals seeking marital settlement. Through prayer, prophetic counsel, and one-on-one ministry, we help you navigate the complexities of your marital journey — offering support and encouragement at every step.", group: "How VOGIM Helps" },
      { key: "helpButtonLabel", label: "How VOGIM Helps Button Label", type: "text", default: "Request a prayer partner", group: "How VOGIM Helps" },
      { key: "helpButtonHref", label: "How VOGIM Helps Button Link", type: "url", default: "/prayer-request", group: "How VOGIM Helps" },
      { key: "feature1Title", label: "Feature 1 Title", type: "text", default: "Personalized prayer", group: "How VOGIM Helps" },
      { key: "feature1Body", label: "Feature 1 Body", type: "text", default: "Tailored to your unique situation and season.", group: "How VOGIM Helps" },
      { key: "feature2Title", label: "Feature 2 Title", type: "text", default: "Spirit-led counsel", group: "How VOGIM Helps" },
      { key: "feature2Body", label: "Feature 2 Body", type: "text", default: "Wisdom from the Word, applied with compassion.", group: "How VOGIM Helps" },
      { key: "feature3Title", label: "Feature 3 Title", type: "text", default: "Confidential ministry", group: "How VOGIM Helps" },
      { key: "feature3Body", label: "Feature 3 Body", type: "text", default: "Your story is held with reverence and care.", group: "How VOGIM Helps" },
      { key: "feature4Title", label: "Feature 4 Title", type: "text", default: "Ongoing follow-up", group: "How VOGIM Helps" },
      { key: "feature4Body", label: "Feature 4 Body", type: "text", default: "Aftercare so you walk out your breakthrough.", group: "How VOGIM Helps" },
      { key: "ctaTitle", label: "CTA Title", type: "textarea", default: "Don't walk this path\n_alone._", group: "CTA" },
      { key: "ctaBody", label: "CTA Body", type: "textarea", default: "Reach out to VOGIM and begin your journey toward divine marital settlement today.", group: "CTA" },
      { key: "ctaButtonLabel", label: "CTA Button Label", type: "text", default: "Contact the ministry", group: "CTA" },
      { key: "ctaButtonHref", label: "CTA Button Link", type: "url", default: "/contact", group: "CTA" },
    ],
  },
  {
    key: "dream-interpretation",
    label: "Dream Interpretation",
    path: "/dream-interpretation",
    seoTitle: "Dream Interpretation — VOGIM",
    seoDescription:
      "Submit your dream for Spirit-led interpretation by Prophet Olaofe and the VOGIM team.",
    fields: heroFields(
      "Dream Interpretation",
      "God still speaks\nin _the night._",
      "From Joseph to Daniel, God has revealed mysteries through dreams. Submit your dream and our team will seek the mind of the Spirit on your behalf.",
      "https://img.vogimprayerland.org/1780648525834-main-height.jpg"
    ),
  },
  {
    key: "give",
    label: "Give",
    path: "/give",
    seoTitle: "Give — VOGIM Prayer Land",
    seoDescription:
      "Partner with VOGIM. Give to support the work of deliverance, healing, and care for widows and orphans.",
    fields: [
      ...heroFields(
        "Give",
        "Sow into the\nwork of the _Lord._",
        "Every gift becomes a meal, a Bible, a deliverance session, a roof over a widow's head. Thank you for partnering with us.",
        "https://img.vogimprayerland.org/1780648526688-worship.jpg"
      ),
      { key: "giveEyebrow", label: "Eyebrow", type: "text", default: "Online Giving", group: "Online Giving" },
      { key: "giveTitle", label: "Title", type: "textarea", default: "The only authorized giving channel for _VOGIM Prayer Land._", group: "Online Giving" },
      { key: "giveIntro", label: "Intro", type: "textarea", default: "Please give securely through our official partner — your gift goes directly to the work of the ministry, the support of the vulnerable, and the spread of the gospel.", group: "Online Giving" },
      { key: "amount1", label: "Amount 1", type: "text", default: "10", group: "Online Giving" },
      { key: "amount2", label: "Amount 2", type: "text", default: "25", group: "Online Giving" },
      { key: "amount3", label: "Amount 3", type: "text", default: "50", group: "Online Giving" },
      { key: "amount4", label: "Amount 4", type: "text", default: "100", group: "Online Giving" },
      { key: "amount5", label: "Amount 5", type: "text", default: "250", group: "Online Giving" },
      { key: "amountOther", label: "Other Amount Label", type: "text", default: "Other", group: "Online Giving" },
      { key: "giveButtonLabel", label: "Button Label", type: "text", default: "Give Now", group: "Online Giving" },
      { key: "giveButtonHref", label: "Button Link", type: "url", default: "https://give.vogimprayerland.org/", group: "Online Giving" },
      { key: "pledgeEyebrow", label: "Pledge Eyebrow", type: "text", default: "Pledge", group: "Where Every Gift Goes" },
      { key: "pledgeTitle", label: "Pledge Title", type: "text", default: "Where every gift goes.", group: "Where Every Gift Goes" },
      { key: "area1Title", label: "Area 1 Title", type: "text", default: "Deliverance Ministry", group: "Where Every Gift Goes" },
      { key: "area1Body", label: "Area 1 Body", type: "textarea", default: "Resource the online sessions, prophetic services, and pastoral care for those reaching out from around the world.", group: "Where Every Gift Goes" },
      { key: "area2Title", label: "Area 2 Title", type: "text", default: "Widows & Orphans", group: "Where Every Gift Goes" },
      { key: "area2Body", label: "Area 2 Body", type: "textarea", default: "Support our ongoing care for widows, orphans, and orphanage homes — financially, physically, and spiritually.", group: "Where Every Gift Goes" },
      { key: "area3Title", label: "Area 3 Title", type: "text", default: "Building the Sanctuary", group: "Where Every Gift Goes" },
      { key: "area3Body", label: "Area 3 Body", type: "textarea", default: "Help us expand the Ikorodu sanctuary so more souls can be welcomed, taught, and discipled.", group: "Where Every Gift Goes" },
      { key: "thankQuote", label: "Quote", type: "textarea", default: "“Bring ye all the tithes into the storehouse… and prove me now herewith, saith the Lord of hosts, if I will not open you the windows of heaven.”", group: "Thank You Strip" },
      { key: "thankRef", label: "Quote Reference", type: "text", default: "Malachi 3:10", group: "Thank You Strip" },
    ],
  },
  {
    key: "partnership",
    label: "Partnership",
    path: "/partnership",
    seoTitle: "Partnership — VOGIM Prayer Land",
    seoDescription:
      "Become a covenant partner of VOGIM and help carry deliverance, healing, and the gospel to the nations.",
    fields: [
      ...heroFields(
        "Partnership",
        "Become a covenant\n_partner._",
        "Partners of VOGIM commit themselves to the cause of the gospel — reaching a generation without faith and hope with the sweet story of our Lord Jesus Christ, deliverance, and healing.",
        "https://img.vogimprayerland.org/1780648526688-worship.jpg"
      ),
      { key: "whyEyebrow", label: "Eyebrow", type: "text", default: "Why become a partner?", group: "Why Partner" },
      { key: "whyTitle", label: "Heading", type: "textarea", default: "When you give, you _plant a seed_ that is multiplied back to you.", group: "Why Partner" },
      { key: "whyPara1", label: "Paragraph 1", type: "textarea", default: "We always want the best from God, therefore when you give, give the best seed you have. Partnership is a decision of the heart — to stand with the work of God so that more captives are set free, more bodies are healed, and more homes are restored.", group: "Why Partner" },
      { key: "whyPara2", label: "Paragraph 2", type: "textarea", default: "As you sow into this ministry, you sow into every soul it reaches. Your seed becomes a deliverance session, a meal for a widow, a Bible in a seeking hand, and the gospel carried farther than before.", group: "Why Partner" },
      { key: "whyButtonLabel", label: "Button Label", type: "text", default: "Become a Partner", group: "Why Partner" },
      { key: "whyButtonHref", label: "Button Link", type: "url", default: "#sign-up", group: "Why Partner" },
      { key: "benefitsEyebrow", label: "Eyebrow", type: "text", default: "As a VOGIM Partner", group: "Partner Benefits" },
      { key: "benefitsTitle", label: "Heading", type: "text", default: "You will receive.", group: "Partner Benefits" },
      { key: "benefit1Title", label: "Benefit 1 Title", type: "text", default: "A personal partner number", group: "Partner Benefits" },
      { key: "benefit1Body", label: "Benefit 1 Body", type: "textarea", default: "You are enrolled into the covenant register and assigned a partner number that identifies you with the ministry.", group: "Partner Benefits" },
      { key: "benefit2Title", label: "Benefit 2 Title", type: "text", default: "News & ministry updates", group: "Partner Benefits" },
      { key: "benefit2Body", label: "Benefit 2 Body", type: "textarea", default: "Regular updates from the VOGIM team — what the Lord is doing, and how your seed is bearing fruit.", group: "Partner Benefits" },
      { key: "benefit3Title", label: "Benefit 3 Title", type: "text", default: "Notice of crusades & events", group: "Partner Benefits" },
      { key: "benefit3Body", label: "Benefit 3 Body", type: "textarea", default: "Be the first to know about upcoming online services, prophetic nights, crusades, and special programmes.", group: "Partner Benefits" },
      { key: "benefit4Title", label: "Benefit 4 Title", type: "text", default: "A dedicated prayer line", group: "Partner Benefits" },
      { key: "benefit4Body", label: "Benefit 4 Body", type: "textarea", default: "Priority access to a prayer and counselling line — our intercessors stand with you whenever you call.", group: "Partner Benefits" },
      { key: "benefit5Title", label: "Benefit 5 Title", type: "text", default: "Expanding our reach", group: "Partner Benefits" },
      { key: "benefit5Body", label: "Benefit 5 Body", type: "textarea", default: "Your partnership widens our coverage online and on air, so more souls in more nations can be reached.", group: "Partner Benefits" },
      { key: "benefit6Title", label: "Benefit 6 Title", type: "text", default: "Growing humanitarian work", group: "Partner Benefits" },
      { key: "benefit6Body", label: "Benefit 6 Body", type: "textarea", default: "More care for widows, orphans, and the vulnerable — locally in Ikorodu and internationally.", group: "Partner Benefits" },
      { key: "seedQuote", label: "Quote", type: "textarea", default: "“Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over.”", group: "Seed Strip" },
      { key: "seedRef", label: "Scripture Reference", type: "text", default: "Luke 6:38", group: "Seed Strip" },
      { key: "howEyebrow", label: "Eyebrow", type: "text", default: "How partnership works", group: "How It Works" },
      { key: "howTitle", label: "Heading", type: "text", default: "Three simple steps.", group: "How It Works" },
      { key: "step1Title", label: "Step 1 Title", type: "text", default: "Sign Up", group: "How It Works" },
      { key: "step1Body", label: "Step 1 Body", type: "textarea", default: "Complete the partnership form below. We enrol you and send your partner number and welcome details.", group: "How It Works" },
      { key: "step2Title", label: "Step 2 Title", type: "text", default: "Give", group: "How It Works" },
      { key: "step2Body", label: "Step 2 Body", type: "textarea", default: "Sow your partnership seed through our official giving channel — monthly, or as the Lord leads your heart.", group: "How It Works" },
      { key: "step3Title", label: "Step 3 Title", type: "text", default: "Notify Us", group: "How It Works" },
      { key: "step3Body", label: "Step 3 Body", type: "textarea", default: "Send us your payment notification on WhatsApp so we can confirm your seed and stand with you in prayer.", group: "How It Works" },
      { key: "howButtonLabel", label: "Button Label", type: "text", default: "Give Now", group: "How It Works" },
      { key: "howButtonHref", label: "Button Link", type: "url", default: "https://give.vogimprayerland.org/", group: "How It Works" },
      { key: "enquiriesEyebrow", label: "Eyebrow", type: "text", default: "For questions or enquiries", group: "Enquiries" },
      { key: "enquiriesTitle", label: "Heading", type: "text", default: "We would love to hear from you.", group: "Enquiries" },
      { key: "enquiriesWhatsappLabel", label: "WhatsApp Button Label", type: "text", default: "WhatsApp +234 815 074 3998", group: "Enquiries" },
      { key: "enquiriesWhatsappHref", label: "WhatsApp Button Link", type: "url", default: "https://wa.me/2348150743998", group: "Enquiries" },
      { key: "enquiriesEmailLabel", label: "Email Button Label", type: "text", default: "hello@vogimprayerland.org", group: "Enquiries" },
      { key: "enquiriesEmailHref", label: "Email Button Link", type: "url", default: "mailto:hello@vogimprayerland.org", group: "Enquiries" },
      { key: "enquiriesAddress", label: "Address", type: "text", default: "18 Association Avenue, Owutu-Agric, Ikorodu · Lagos, Nigeria", group: "Enquiries" },
    ],
  },
  {
    key: "zoom",
    label: "Zoom Service",
    path: "/zoom",
    seoTitle: "Join Us on Zoom — VOGIM Prayer Land",
    seoDescription:
      "Join Voice of God International Ministry (VOGIM) live on Zoom for prayer, deliverance, and the Word. Connect from anywhere in the world.",
    fields: [
      { key: "heroEyebrow", label: "Hero eyebrow", type: "text", default: "Live on Zoom", group: "Hero" },
      { key: "heroTitle", label: "Hero title", type: "textarea", default: "Pray with us,\n_wherever you are._", group: "Hero", hint: "New line = line break · _wrap_ for gold italic" },
      { key: "heroIntro", label: "Hero intro", type: "textarea", default: "Step into the presence of God with us in real time. Join our live Zoom gatherings for prayer, deliverance, and the preaching of the Word — from any corner of the earth.", group: "Hero" },
      { key: "joinCardTitle", label: "Join Card Title", type: "text", default: "Join the live meeting", group: "Join Card" },
      { key: "joinCardBody", label: "Join Card Body", type: "textarea", default: "Tap the button below to enter the Zoom room. The meeting passcode is built into the link — no extra steps.", group: "Join Card" },
      { key: "joinCardButtonHref", label: "Join Card Button Link", type: "url", default: "https://us06web.zoom.us/j/7885810191?pwd=7RhsFPIzCcnZuKkwos0r7bhhmyS9ec.1", group: "Join Card" },
      { key: "joinCardButtonLabel", label: "Join Card Button Label", type: "text", default: "Join the meeting", group: "Join Card" },
      { key: "meetingIdLabel", label: "Meeting ID Label", type: "text", default: "Meeting ID:", group: "Join Card" },
      { key: "meetingId", label: "Meeting ID", type: "text", default: "788 5810 191", group: "Join Card" },
      { key: "serviceTimesNote", label: "Service Times Note", type: "text", default: "Open at service times", group: "Join Card" },
      { key: "howToJoinEyebrow", label: "How To Join Eyebrow", type: "text", default: "How to join", group: "How To Join" },
      { key: "howToJoinTitle", label: "How To Join Title", type: "textarea", default: "Three simple ways to _be in the room._", group: "How To Join" },
      { key: "step1Title", label: "Step 1 Title", type: "text", default: "On your phone", group: "How To Join" },
      { key: "step1Body", label: "Step 1 Body", type: "textarea", default: "Install the free Zoom app, then tap “Join” above — the meeting opens automatically.", group: "How To Join" },
      { key: "step2Title", label: "Step 2 Title", type: "text", default: "On your computer", group: "How To Join" },
      { key: "step2Body", label: "Step 2 Body", type: "textarea", default: "Click “Join the meeting” and Zoom opens in your browser or desktop app. No account needed.", group: "How To Join" },
      { key: "step3Title", label: "Step 3 Title", type: "text", default: "By Meeting ID", group: "How To Join" },
      { key: "step3Body", label: "Step 3 Body", type: "textarea", default: "In the Zoom app choose “Join a Meeting” and enter the Meeting ID 788 5810 191.", group: "How To Join" },
      { key: "ctaTitle", label: "CTA Title", type: "textarea", default: "Heaven is\n_one click away._", group: "CTA" },
      { key: "ctaBody", label: "CTA Body", type: "textarea", default: "Don't miss your appointment with God. Join the live gathering and receive your breakthrough.", group: "CTA" },
      { key: "ctaButtonHref", label: "CTA Button Link", type: "url", default: "https://us06web.zoom.us/j/7885810191?pwd=7RhsFPIzCcnZuKkwos0r7bhhmyS9ec.1", group: "CTA" },
      { key: "ctaButtonLabel", label: "CTA Button Label", type: "text", default: "Join on Zoom now", group: "CTA" },
    ],
  },
  {
    key: "prayer-request",
    label: "Prayer Request",
    path: "/prayer-request",
    seoTitle: "Prayer Request — VOGIM",
    seoDescription:
      "Send your prayer request to VOGIM. Our intercessors will stand with you.",
    fields: heroFields(
      "Prayer Request",
      "We would love\nto _pray for you._",
      "Wherever you are, whatever the burden — write it down and we will stand with you before the throne of grace.",
      "https://img.vogimprayerland.org/1780648526009-slider2.webp"
    ),
  },
  {
    key: "healing-request",
    label: "Healing Request",
    path: "/healing-request",
    seoTitle: "Healing Request — VOGIM",
    seoDescription: "Submit a healing request to VOGIM. Jesus is still the Healer.",
    fields: heroFields(
      "Healing Request",
      "Jesus is still\n_the Healer._",
      "Body, soul, or spirit — He is touched by your pain. Send your request and join an army of intercessors believing with you for total healing.",
      "https://img.vogimprayerland.org/1780648525156-prophet.webp"
    ),
  },
  {
    key: "deliverance-request",
    label: "Deliverance Request",
    path: "/deliverance-request",
    seoTitle: "Deliverance Request — VOGIM",
    seoDescription:
      "Submit your deliverance request to VOGIM. Schedule a one-on-one online session with Prophet Olaofe Emmanuel.",
    fields: heroFields(
      "Deliverance Request",
      "Schedule your\n_deliverance session._",
      "One form, one click — and a Spirit-led prophet steps into the gap for you. Sessions are conducted online, privately, and powerfully.",
      "https://img.vogimprayerland.org/1780648546756-deliverance.webp"
    ),
  },
  {
    key: "media",
    label: "Media",
    path: "/media",
    seoTitle: "Media — VOGIM Prayer Land",
    seoDescription:
      "Sermons, prophetic words, worship moments and gallery from VOGIM Deliverance Ministries.",
    fields: [
      { key: "heroEyebrow", label: "Hero eyebrow", type: "text", default: "Media", group: "Hero" },
      { key: "heroTitle", label: "Hero title", type: "textarea", default: "Sermons, sounds\n& _moments of glory._", group: "Hero" },
      { key: "heroIntro", label: "Hero intro", type: "textarea", default: "Catch up on prophetic services, watch worship moments, and walk through what God has done.", group: "Hero" },
      { key: "heroImage", label: "Hero background image", type: "image", default: "https://img.vogimprayerland.org/1780648526009-slider2.webp", group: "Hero" },
      { key: "type1Title", label: "Type 1 title", type: "text", default: "Video", group: "Type strip" },
      { key: "type1Desc", label: "Type 1 description", type: "text", default: "Sermons & livestream replays", group: "Type strip" },
      { key: "type2Title", label: "Type 2 title", type: "text", default: "Audio", group: "Type strip" },
      { key: "type2Desc", label: "Type 2 description", type: "text", default: "Messages to listen on the go", group: "Type strip" },
      { key: "type3Title", label: "Type 3 title", type: "text", default: "Gallery", group: "Type strip" },
      { key: "type3Desc", label: "Type 3 description", type: "text", default: "Photos from the altar and the field", group: "Type strip" },
      { key: "sermonsEyebrow", label: "Sermons eyebrow", type: "text", default: "Latest sermons", group: "Sermons" },
      { key: "sermonsTitle", label: "Sermons title", type: "textarea", default: "The Word, _on demand._", group: "Sermons" },
      { key: "sermon1Title", label: "Sermon 1 title", type: "text", default: "Breaking generational chains", group: "Sermons" },
      { key: "sermon1Speaker", label: "Sermon 1 speaker", type: "text", default: "Prophet Olaofe Oladele", group: "Sermons" },
      { key: "sermon1Length", label: "Sermon 1 length", type: "text", default: "47 min", group: "Sermons" },
      { key: "sermon1Series", label: "Sermon 1 series", type: "text", default: "Deliverance Series · Vol I", group: "Sermons" },
      { key: "sermon2Title", label: "Sermon 2 title", type: "text", default: "The altar that cannot be denied", group: "Sermons" },
      { key: "sermon2Speaker", label: "Sermon 2 speaker", type: "text", default: "Prophet Olaofe Oladele", group: "Sermons" },
      { key: "sermon2Length", label: "Sermon 2 length", type: "text", default: "53 min", group: "Sermons" },
      { key: "sermon2Series", label: "Sermon 2 series", type: "text", default: "Prophetic Service", group: "Sermons" },
      { key: "sermon3Title", label: "Sermon 3 title", type: "text", default: "When God speaks in the night", group: "Sermons" },
      { key: "sermon3Speaker", label: "Sermon 3 speaker", type: "text", default: "Prophet Olaofe Oladele", group: "Sermons" },
      { key: "sermon3Length", label: "Sermon 3 length", type: "text", default: "38 min", group: "Sermons" },
      { key: "sermon3Series", label: "Sermon 3 series", type: "text", default: "Dreams & Visions", group: "Sermons" },
      { key: "sermon4Title", label: "Sermon 4 title", type: "text", default: "Marital settlement by fire", group: "Sermons" },
      { key: "sermon4Speaker", label: "Sermon 4 speaker", type: "text", default: "Prophet Olaofe Oladele", group: "Sermons" },
      { key: "sermon4Length", label: "Sermon 4 length", type: "text", default: "59 min", group: "Sermons" },
      { key: "sermon4Series", label: "Sermon 4 series", type: "text", default: "Family Restored", group: "Sermons" },
      { key: "galleryEyebrow", label: "Gallery eyebrow", type: "text", default: "From the altar", group: "Gallery" },
      { key: "galleryTitle", label: "Gallery title", type: "textarea", default: "Glory captured in _a moment._", group: "Gallery" },
      { key: "galleryCtaLabel", label: "Gallery CTA label", type: "text", default: "Request a custom recording", group: "Gallery" },
    ],
  },
];

export function getSchema(key: string): PageSchema | null {
  return PAGE_SCHEMAS.find((s) => s.key === key) ?? null;
}

/** The full default content map for a page (every field → its default). */
export function defaultsFor(key: string): Record<string, string> {
  const schema = getSchema(key);
  if (!schema) return {};
  const out: Record<string, string> = {};
  for (const f of schema.fields) out[f.key] = f.default;
  return out;
}

/* ----------------------------- Storage ----------------------------- */

const COLLECTION = "pagecontent";
type PageDoc = {
  _id: string;
  values?: Record<string, string>;
  draft?: Record<string, string>; // legacy; cleared on next save
  seo?: Partial<PostSeo>;
  modifiedAt?: Date | string;
};

const seoStr = (v: unknown, max = 320) => String(v ?? "").slice(0, max).trim();

/** Normalize an SEO payload into a complete PostSeo object. */
export function cleanPageSeo(s?: Partial<PostSeo> | null): PostSeo {
  if (!s) return { ...EMPTY_SEO };
  return {
    focusKeyword: seoStr(s.focusKeyword, 120),
    keywords: seoStr(s.keywords, 300),
    title: seoStr(s.title, 160),
    description: seoStr(s.description, 320),
    canonical: seoStr(s.canonical, 500),
    noindex: Boolean(s.noindex),
    nofollow: Boolean(s.nofollow),
    ogTitle: seoStr(s.ogTitle, 160),
    ogDescription: seoStr(s.ogDescription, 320),
    ogImage: s.ogImage ? seoStr(s.ogImage, 500) : null,
    score: Math.max(0, Math.min(100, Math.round(Number(s.score) || 0))),
  };
}

/** Stored SEO for a page (defaults merged). */
export async function getPageSeo(key: string): Promise<PostSeo> {
  try {
    const db = await getDb();
    const doc = await db.collection<PageDoc>(COLLECTION).findOne({ _id: key });
    return { ...EMPTY_SEO, ...(doc?.seo ?? {}) };
  } catch {
    return { ...EMPTY_SEO };
  }
}

const plainText = (s: string) =>
  s.replace(/_/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();

/** Build the Next.js Metadata for a CMS page from its content + SEO settings. */
export async function getPageMeta(key: string): Promise<Metadata> {
  const schema = getSchema(key);
  const path = schema?.path ?? "/";
  const [content, seo] = await Promise.all([getPageContent(key), getPageSeo(key)]);

  const heroTitle = plainText(content.heroTitle || "");
  const baseTitle =
    schema?.seoTitle ||
    (heroTitle ? `${heroTitle} — VOGIM Prayer Land` : "VOGIM Prayer Land");
  const title = seo.title || baseTitle;
  const description =
    seo.description || schema?.seoDescription || content.heroIntro || undefined;

  const url = `${SITE_URL}${path === "/" ? "/" : `${path}/`}`;
  const canonical = seo.canonical || url;
  const ogImage = seo.ogImage || content.heroImage || undefined;
  const ogTitle = seo.ogTitle || seo.title || baseTitle;
  const ogDescription = seo.ogDescription || description;

  return {
    title,
    description,
    keywords: seo.keywords
      ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : undefined,
    alternates: { canonical },
    robots: { index: !seo.noindex, follow: !seo.nofollow },
    openGraph: {
      type: "website",
      siteName: "VOGIM Prayer Land",
      title: ogTitle,
      description: ogDescription,
      url,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/** Defaults overlaid by saved edits. Safe — never throws. */
export async function getPageContent(key: string): Promise<Record<string, string>> {
  const defaults = defaultsFor(key);
  try {
    const db = await getDb();
    const doc = await db.collection<PageDoc>(COLLECTION).findOne({ _id: key });
    // Fall back to a legacy draft if a page was only ever draft-saved before,
    // so no prior edits are lost after the switch to direct saving.
    const stored = doc?.values && Object.keys(doc.values).length ? doc.values : doc?.draft ?? {};
    return { ...defaults, ...stored };
  } catch {
    return defaults;
  }
}

function cleanValues(key: string, values: Record<string, unknown>) {
  const schema = getSchema(key);
  if (!schema) throw new Error("Unknown page");
  const clean: Record<string, string> = {};
  for (const f of schema.fields) {
    if (values[f.key] !== undefined) {
      clean[f.key] = String(values[f.key] ?? "").slice(0, 5000);
    }
  }
  return clean;
}

/** Save edits (content + optional SEO) straight to the live page. */
export async function updatePageContent(
  key: string,
  values: Record<string, unknown>,
  seo?: Partial<PostSeo> | null
): Promise<Record<string, string>> {
  const clean = cleanValues(key, values);
  const set: Record<string, unknown> = { values: clean, modifiedAt: new Date() };
  if (seo !== undefined && seo !== null) set.seo = cleanPageSeo(seo);
  const db = await getDb();
  await db
    .collection<PageDoc>(COLLECTION)
    .updateOne({ _id: key }, { $set: set, $unset: { draft: "" } }, { upsert: true });
  return { ...defaultsFor(key), ...clean };
}

/** Map of pageKey → last-modified ISO string, for the sitemap. */
export async function getPageModifiedMap(): Promise<Record<string, string>> {
  try {
    const db = await getDb();
    const docs = await db
      .collection<PageDoc>(COLLECTION)
      .find({}, { projection: { modifiedAt: 1 } })
      .toArray();
    const map: Record<string, string> = {};
    for (const d of docs) {
      if (d.modifiedAt) {
        map[d._id] = (d.modifiedAt instanceof Date
          ? d.modifiedAt
          : new Date(d.modifiedAt)
        ).toISOString();
      }
    }
    return map;
  } catch {
    return {};
  }
}
