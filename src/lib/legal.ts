import type { Metadata } from "next";

/**
 * Content for the site's legal pages (refund, terms, privacy).
 *
 * These pages are deliberately *not* part of the field-level CMS in
 * `page-content.ts` — legal copy is long-form prose that reads and reviews far
 * better as a single structured document than as fifty separate admin fields.
 * Edit the text here and redeploy.
 *
 * Body copy may use these tokens; they are substituted at render time from the
 * live site settings so contact details never drift out of sync:
 *   {ministry} {email} {phone} {address} {site} {giveUrl}
 * Headings/titles additionally support the <RichText/> markup (_gold italic_).
 */

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.vogimprayerland.org"
).replace(/\/$/, "");

export const GIVE_URL = "https://give.vogimprayerland.org/";

/** Shown as "Last updated" on every legal page. Bump when the copy changes. */
export const LEGAL_UPDATED = "30 July 2026";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "note"; text: string };

export type LegalSection = {
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  slug: string;
  eyebrow: string;
  /** _wrapped_ text renders as the gold italic accent. */
  title: string;
  intro: string;
  heroImage: string;
  seoTitle: string;
  seoDescription: string;
  sections: LegalSection[];
};

const HERO_WORSHIP = "https://img.vogimprayerland.org/1780648526688-worship.jpg";
const HERO_SLIDER2 = "https://img.vogimprayerland.org/1780648526009-slider2.webp";
const HERO_SLIDER3 = "https://img.vogimprayerland.org/1780648526061-slider3.webp";

/* --------------------------- Refund Policy --------------------------- */

const REFUND: LegalDoc = {
  slug: "refund-policy",
  eyebrow: "Refund Policy",
  title: "Every gift is held\nin _trust and honour._",
  intro:
    "Offerings, seeds, and partnership gifts to VOGIM are freewill donations to the work of the gospel. This policy explains when a gift can be returned, how to ask, and how long it takes.",
  heroImage: HERO_WORSHIP,
  seoTitle: "Refund Policy — VOGIM Prayer Land",
  seoDescription:
    "How VOGIM Deliverance Ministries handles refunds on donations, offerings, partnership seeds, and recurring giving — including how to request one and how long it takes.",
  sections: [
    {
      id: "overview",
      heading: "1. Overview",
      blocks: [
        {
          type: "p",
          text: "{ministry} (“VOGIM”, “the ministry”, “we”, “us”) receives donations, offerings, partnership seeds, and other freewill gifts through the giving page on this website, at {site}/give, and through our partner giving channel at {giveUrl}. Card and bank payments made on this website are processed securely by Flutterwave; we never see or store your card details.",
        },
        {
          type: "p",
          text: "We take stewardship seriously. Every gift is applied to the work of the ministry — online deliverance and prayer, the care of widows, orphans and orphanage homes, and the spread of the gospel. This policy sets out the limited circumstances in which a gift may be refunded, and the process for requesting it.",
        },
      ],
    },
    {
      id: "ministry-is-free",
      heading: "2. Our ministry is free of charge",
      blocks: [
        {
          type: "p",
          text: "Prayer requests, healing requests, deliverance sessions, dream interpretation, and pastoral counsel at VOGIM are offered free of charge. We do not sell deliverance, we do not price prayer, and we never make ministry conditional on a payment.",
        },
        {
          type: "note",
          text: "No pastor, prophet, intercessor, or staff member of VOGIM will ever demand a private payment, a “deliverance fee”, gift cards, or cryptocurrency in exchange for prayer. If anyone contacts you claiming to represent this ministry and asks for such a payment, do not pay — report it to us immediately at {email} or {phone}. The only authorised giving channels are the giving page at {site}/give and {giveUrl}.",
        },
      ],
    },
    {
      id: "nature-of-gifts",
      heading: "3. Donations are ordinarily final",
      blocks: [
        {
          type: "p",
          text: "A donation is a voluntary, unconditional gift. Because gifts are committed to ministry work — often within days of receipt — donations are ordinarily non-refundable once processed.",
        },
        {
          type: "p",
          text: "Please give prayerfully, and only what you have purposed in your heart to give. If you are unsure about an amount, give the smaller amount first; you can always give again.",
        },
      ],
    },
    {
      id: "when-refunds",
      heading: "4. When we will refund a gift",
      blocks: [
        {
          type: "p",
          text: "Notwithstanding the above, we will review and, where the facts support it, refund a gift in the following circumstances:",
        },
        {
          type: "list",
          items: [
            "Duplicate transaction — the same gift was charged more than once for the same intended donation.",
            "Incorrect amount — a clear data-entry error, for example ₦500,000 entered where ₦50,000 was intended.",
            "Unauthorised or fraudulent use — your card, bank account, or wallet was used to give without your permission.",
            "Technical or processing error — the payment gateway charged you in error, charged the wrong currency, or a failed transaction was still debited.",
            "Recurring gift taken after cancellation — a scheduled debit was collected after you asked us to stop it.",
            "Change of circumstance — where a gift was given in genuine error or hardship, and you contact us promptly, we will consider the request compassionately and in good faith.",
          ],
        },
      ],
    },
    {
      id: "time-limit",
      heading: "5. Time limits",
      blocks: [
        {
          type: "list",
          items: [
            "Duplicate charges, incorrect amounts, technical errors, and hardship requests: within 30 days of the transaction date.",
            "Unauthorised or fraudulent transactions: as soon as you become aware, and in any event within 90 days. Please also notify your bank or card issuer.",
          ],
        },
        {
          type: "p",
          text: "Requests received after these periods will still be read and answered, but we may be unable to reverse the transaction because the payment processor's own reversal window will usually have closed.",
        },
      ],
    },
    {
      id: "how-to-request",
      heading: "6. How to request a refund",
      blocks: [
        {
          type: "p",
          text: "Write to {email} with the subject line “Refund Request”, or send us a message on WhatsApp at {phone}. To help us find your transaction quickly, please include:",
        },
        {
          type: "list",
          items: [
            "Your full name and the email address or phone number used when giving.",
            "The date of the gift and the amount and currency.",
            "The payment method (card, bank transfer, wallet) and the transaction or reference number.",
            "The last four digits of the card, if you gave by card. Never send us your full card number, CVV, PIN, or online banking password.",
            "A short explanation of what went wrong.",
          ],
        },
      ],
    },
    {
      id: "processing",
      heading: "7. How refunds are processed",
      blocks: [
        {
          type: "list",
          items: [
            "We acknowledge every refund request within 3 business days.",
            "We aim to decide on the request within 7 business days of receiving the details above.",
            "Approved refunds are returned through the payment provider that processed the gift — Flutterwave for gifts made on this website — and to the original payment method. We cannot refund to a different card, account, or person.",
            "Once issued, funds typically appear within 5–10 business days for cards and 3–7 business days for bank transfers, depending on your bank and country.",
            "Where the gift was made in a currency other than our settlement currency, the refunded amount may differ slightly because of exchange-rate movement between the date of the gift and the date of the refund.",
            "Payment processor or gateway fees, and any bank charges applied at your end, may not be recoverable. Where that is the case, we will tell you before processing.",
          ],
        },
      ],
    },
    {
      id: "recurring",
      heading: "8. Recurring and partnership giving",
      blocks: [
        {
          type: "p",
          text: "Covenant partnership and monthly giving can be stopped at any time, for any reason, with no explanation required and no effect on your standing with this ministry.",
        },
        {
          type: "list",
          items: [
            "Cancel from within your account on the giving platform, or write to {email} — we will action it and confirm in writing.",
            "Please allow up to 5 business days before your next scheduled date so the instruction reaches the processor in time.",
            "Cancellation stops future debits. Gifts already collected are treated under sections 3 and 4 above.",
          ],
        },
      ],
    },
    {
      id: "chargebacks",
      heading: "9. Chargebacks and disputes",
      blocks: [
        {
          type: "p",
          text: "If you believe a charge is wrong, please contact us before raising a chargeback with your bank. We can almost always resolve it faster and at no cost to either side. Where a chargeback is raised, we will cooperate fully with your bank and provide the transaction records requested.",
        },
      ],
    },
    {
      id: "receipts",
      heading: "10. Receipts and acknowledgements",
      blocks: [
        {
          type: "p",
          text: "You will receive an electronic acknowledgement for gifts made through our official giving channel. If you need a written acknowledgement for your records, ask us at {email} and we will provide one. VOGIM does not give tax advice — whether a gift is deductible depends on the law of the country in which you are resident, and you should confirm the position with your own adviser.",
        },
      ],
    },
    {
      id: "changes",
      heading: "11. Changes to this policy",
      blocks: [
        {
          type: "p",
          text: "We may update this policy from time to time. The version published on this page, with the “last updated” date shown above, is the version that applies. The policy in force on the date of your gift is the policy that governs that gift.",
        },
      ],
    },
    {
      id: "contact",
      heading: "12. Contact us",
      blocks: [
        {
          type: "p",
          text: "Questions about giving or refunds are welcome and are handled personally and confidentially. Reach us by email at {email}, by phone or WhatsApp at {phone}, or by post at {address}.",
        },
      ],
    },
  ],
};

/* ------------------------ Terms and Conditions ------------------------ */

const TERMS: LegalDoc = {
  slug: "terms-and-conditions",
  eyebrow: "Terms & Conditions",
  title: "The terms on which\nwe _serve you here._",
  intro:
    "These terms govern your use of vogimprayerland.org — the requests you submit, the sessions you join, and the gifts you give. Please read them before you use the site.",
  heroImage: HERO_SLIDER3,
  seoTitle: "Terms and Conditions — VOGIM Prayer Land",
  seoDescription:
    "The terms governing use of vogimprayerland.org — prayer and deliverance requests, online Zoom sessions, giving, acceptable use, disclaimers, and governing law.",
  sections: [
    {
      id: "acceptance",
      heading: "1. Acceptance of these terms",
      blocks: [
        {
          type: "p",
          text: "This website, {site}, is operated by {ministry} (“VOGIM”, “the ministry”, “we”, “us”, “our”). By browsing this site, submitting a request, joining an online session, or giving through our channels, you agree to these Terms and Conditions and to our Privacy Policy.",
        },
        {
          type: "p",
          text: "If you do not agree with any part of these terms, please do not use the site. You remain welcome to contact us directly.",
        },
      ],
    },
    {
      id: "who-we-are",
      heading: "2. Who we are",
      blocks: [
        {
          type: "p",
          text: "VOGIM is a Christian deliverance ministry founded in May 2021 by Prophet Olaofe Oladele, with its church address at {address}. We minister in person in Lagos and online to a global congregation through prayer, deliverance, healing ministry, dream interpretation, prophetic counsel, and teaching of the Word.",
        },
      ],
    },
    {
      id: "eligibility",
      heading: "3. Who may use this site",
      blocks: [
        {
          type: "list",
          items: [
            "You must be at least 18 years old to submit a request, join a session, or give.",
            "If you are under 18, please involve a parent or legal guardian, who must submit on your behalf and remain responsible for your participation.",
            "You confirm that the information you give us is true, current, and your own — or that you have the authority of the person it concerns.",
          ],
        },
      ],
    },
    {
      id: "nature-of-ministry",
      heading: "4. The nature of what we offer",
      blocks: [
        {
          type: "p",
          text: "What VOGIM offers is spiritual and pastoral ministry — prayer, scripture, counsel, and intercession in the name of Jesus Christ. It is offered in faith and in love, and it is offered free of charge.",
        },
        {
          type: "note",
          text: "Our ministry is not a substitute for professional medical, psychiatric, legal, or financial advice, diagnosis, or treatment. Never stop taking prescribed medication, discontinue a course of treatment, or ignore the advice of a qualified professional because of something ministered, prayed, or published here. If you are in a medical emergency, or you are at risk of harming yourself or another person, contact your local emergency services immediately.",
        },
        {
          type: "p",
          text: "We pray in faith and we believe God answers. We do not, and cannot, guarantee any particular outcome, timing, healing, deliverance, financial result, or answer to a request. Outcomes rest with God alone.",
        },
      ],
    },
    {
      id: "requests",
      heading: "5. Prayer, healing, deliverance, and dream requests",
      blocks: [
        {
          type: "list",
          items: [
            "Requests are received through the forms on this website and are read by the pastoral team.",
            "We aim to respond to every request, but response times vary with volume; a request is not an appointment until we confirm one with you.",
            "Requests are treated with pastoral confidence and are shared only within the ministry team that prays and follows up. See our Privacy Policy for the full detail.",
            "By submitting a request you consent to us contacting you by email, phone, WhatsApp, or on the platform you used, in connection with that request.",
            "We may decline or discontinue a request where the content is abusive, unlawful, or where we believe another form of help is what you truly need — in which case we will say so plainly.",
          ],
        },
      ],
    },
    {
      id: "sessions",
      heading: "6. Online sessions and Zoom conduct",
      blocks: [
        {
          type: "p",
          text: "Online deliverance sessions, prophetic services, and Bible study are held over Zoom and other platforms. When you join, you agree to:",
        },
        {
          type: "list",
          items: [
            "Conduct yourself respectfully towards the ministers and other participants.",
            "Not record, screenshot, stream, or redistribute a session — particularly a one-to-one session — without our prior written consent and the consent of everyone appearing in it.",
            "Not share a private meeting link, meeting ID, or passcode with anyone who was not invited.",
            "Accept that services and group meetings may be recorded or livestreamed by the ministry for teaching and outreach; if you prefer not to appear, keep your camera off.",
            "Use of that platform is also subject to the platform's own terms and privacy policy, over which we have no control.",
          ],
        },
      ],
    },
    {
      id: "giving",
      heading: "7. Giving and donations",
      blocks: [
        {
          type: "p",
          text: "Gifts are voluntary. Our authorised online giving channels are the giving page on this website ({site}/give) and {giveUrl}; treat any other channel claiming to collect on our behalf as fraudulent and report it to us. Payments made on this website are handled by Flutterwave under their own terms and privacy policy — card details are entered on Flutterwave's checkout, and we never see or store them.",
        },
        {
          type: "p",
          text: "Refunds, cancellations of recurring gifts, and disputed charges are governed by our Refund Policy, which forms part of these terms.",
        },
      ],
    },
    {
      id: "user-content",
      heading: "8. What you submit to us",
      blocks: [
        {
          type: "list",
          items: [
            "You keep ownership of everything you send us — your request, your testimony, your dream, your message.",
            "You grant us permission to use it internally for the purpose of ministering to you, praying for you, and keeping a pastoral record.",
            "We will not publish your name, photograph, or identifying details as a testimony without your specific consent, which you may withdraw at any time.",
            "You must not submit content that is unlawful, defamatory, obscene, threatening, or that infringes another person's rights or privacy.",
          ],
        },
      ],
    },
    {
      id: "acceptable-use",
      heading: "9. Acceptable use",
      blocks: [
        { type: "p", text: "You agree not to:" },
        {
          type: "list",
          items: [
            "Impersonate this ministry, its founder, or any of its ministers, anywhere, online or offline.",
            "Solicit money from our congregation or visitors, or use our name to do so.",
            "Attempt to gain unauthorised access to the site, its admin area, its accounts, or its underlying systems.",
            "Introduce malware, scrape the site at a rate that burdens it, or interfere with its normal operation.",
            "Use the site for spam, harassment, hate speech, or any unlawful purpose.",
          ],
        },
      ],
    },
    {
      id: "intellectual-property",
      heading: "10. Intellectual property",
      blocks: [
        {
          type: "p",
          text: "The content of this site — sermons, teaching, articles, photographs, video, audio, graphics, logos, and design — belongs to VOGIM or its licensors and is protected by copyright and trade mark law.",
        },
        {
          type: "p",
          text: "You may read, download, and share our teaching for personal, non-commercial, and evangelistic use, provided you keep it unaltered and credit VOGIM Prayer Land. Any commercial use, resale, or republication as your own requires our written permission.",
        },
      ],
    },
    {
      id: "third-parties",
      heading: "11. Third-party services, links, and advertising",
      blocks: [
        {
          type: "p",
          text: "This site relies on and links to third-party services, including Zoom for meetings, a live-chat widget, Google Analytics for statistics, Google AdSense for advertising, and an external giving platform. Advertisements shown on this site are served by Google and their content is not selected, endorsed, or vetted by VOGIM.",
        },
        {
          type: "p",
          text: "We are not responsible for the content, terms, or privacy practices of any third-party site or service. Following an external link is at your own discretion.",
        },
      ],
    },
    {
      id: "availability",
      heading: "12. Availability of the site",
      blocks: [
        {
          type: "p",
          text: "We work to keep this site available, but we do not promise uninterrupted access. The site may be unavailable during maintenance, updates, or events outside our control, and we may change, suspend, or withdraw any part of it without notice.",
        },
      ],
    },
    {
      id: "disclaimers",
      heading: "13. Disclaimers and limitation of liability",
      blocks: [
        {
          type: "p",
          text: "This site and its content are provided on an “as is” and “as available” basis, without warranties of any kind, express or implied, to the fullest extent permitted by law.",
        },
        {
          type: "p",
          text: "To the fullest extent permitted by law, VOGIM, its founder, ministers, staff, and volunteers will not be liable for any indirect, incidental, special, or consequential loss, or for loss of profit, data, or goodwill, arising out of your use of this site or your reliance on its content. Nothing in these terms excludes or limits liability for death or personal injury caused by our negligence, for fraud, or for any liability that cannot lawfully be excluded.",
        },
      ],
    },
    {
      id: "indemnity",
      heading: "14. Indemnity",
      blocks: [
        {
          type: "p",
          text: "You agree to indemnify and hold harmless VOGIM, its founder, ministers, staff, and volunteers against any claim, loss, or expense arising from your breach of these terms or your misuse of this site.",
        },
      ],
    },
    {
      id: "suspension",
      heading: "15. Suspension of access",
      blocks: [
        {
          type: "p",
          text: "We may restrict or withdraw access to the site, our sessions, or our services where these terms are breached, where conduct endangers or harasses others, or where required by law. Our door remains open to genuine repentance and restoration.",
        },
      ],
    },
    {
      id: "governing-law",
      heading: "16. Governing law",
      blocks: [
        {
          type: "p",
          text: "These terms are governed by the laws of the Federal Republic of Nigeria, and the courts of Lagos State, Nigeria, have exclusive jurisdiction over any dispute — save that we ask you, as a matter of Christian conscience, to bring any grievance to us first so that it may be resolved in peace (Matthew 18:15).",
        },
      ],
    },
    {
      id: "changes",
      heading: "17. Changes to these terms",
      blocks: [
        {
          type: "p",
          text: "We may amend these terms from time to time. The version on this page, with the “last updated” date shown above, is the version in force. Continuing to use the site after a change means you accept the amended terms.",
        },
      ],
    },
    {
      id: "contact",
      heading: "18. Contact us",
      blocks: [
        {
          type: "p",
          text: "Questions about these terms can be sent to {email}, by phone or WhatsApp to {phone}, or by post to {address}.",
        },
      ],
    },
  ],
};

/* --------------------------- Privacy Policy --------------------------- */

const PRIVACY: LegalDoc = {
  slug: "privacy-policy",
  eyebrow: "Privacy Policy",
  title: "What you tell us\nis _held in confidence._",
  intro:
    "People bring us the most private parts of their lives. This policy explains exactly what we collect, why we hold it, who ever sees it, and how you can have it removed.",
  heroImage: HERO_SLIDER2,
  seoTitle: "Privacy Policy — VOGIM Prayer Land",
  seoDescription:
    "How VOGIM Deliverance Ministries collects, uses, shares, and protects the personal information you provide through prayer requests, forms, and this website.",
  sections: [
    {
      id: "introduction",
      heading: "1. Introduction",
      blocks: [
        {
          type: "p",
          text: "{ministry} (“VOGIM”, “we”, “us”) is the controller of the personal information collected through {site}. This policy explains what we collect, why, how long we keep it, and the rights you have over it.",
        },
        {
          type: "p",
          text: "We handle personal information in line with the Nigeria Data Protection Act 2023 and, where it applies to visitors outside Nigeria, the principles of the UK and EU General Data Protection Regulation.",
        },
      ],
    },
    {
      id: "what-we-collect",
      heading: "2. Information we collect",
      blocks: [
        { type: "p", text: "Information you give us directly:" },
        {
          type: "list",
          items: [
            "Your name, email address, and phone or WhatsApp number.",
            "Your country or location, where you choose to tell us.",
            "The content of your prayer, healing, deliverance, dream interpretation, marital, or general enquiry request — including whatever you choose to disclose about your circumstances.",
            "Messages you send us by email, WhatsApp, or the live-chat widget.",
            "Partnership details where you enrol as a covenant partner.",
          ],
        },
        { type: "p", text: "Information collected automatically when you visit:" },
        {
          type: "list",
          items: [
            "Your IP address and browser user-agent string, recorded with each form submission as a safeguard against abuse and spam.",
            "Device, browser, approximate location, referring page, pages viewed, and time on page, through analytics cookies.",
          ],
        },
        {
          type: "p",
          text: "Payments: gifts made on this website are processed by Flutterwave on their own systems, under their privacy policy. We record your name, email, phone, the amount, currency, the fund you chose, any note you added, and the transaction reference Flutterwave returns to us. We never receive or store your full card number, CVV, PIN, or banking password.",
        },
      ],
    },
    {
      id: "sensitive",
      heading: "3. Sensitive information",
      blocks: [
        {
          type: "p",
          text: "A prayer request often contains sensitive personal information — details of your health, your family, your finances, your fears, or your faith. You are never obliged to disclose any of it. Share only what you are at peace to share; we can and do pray without knowing the details.",
        },
        {
          type: "p",
          text: "Where you do share it, you are giving us your explicit consent to hold and use that information for the sole purpose of ministering to you. You may withdraw that consent at any time.",
        },
      ],
    },
    {
      id: "how-we-use",
      heading: "4. How we use your information",
      blocks: [
        {
          type: "list",
          items: [
            "To read, pray over, and respond to your request.",
            "To schedule and conduct deliverance, counselling, or prophetic sessions with you.",
            "To follow up pastorally and provide aftercare, and to keep a record of that care so you are not asked to repeat your story each time.",
            "To send you ministry updates, service times, and partner communications — where you have asked for them or are a partner. Every such message carries a way to stop them.",
            "To acknowledge and account for gifts.",
            "To secure the site, prevent spam and abuse, and diagnose technical problems.",
            "To understand, in aggregate, which pages and ministries people find helpful.",
            "To meet a legal or regulatory obligation.",
          ],
        },
        {
          type: "note",
          text: "We do not sell, rent, or trade your personal information. We do not share your prayer request with advertisers, and we never publish it.",
        },
      ],
    },
    {
      id: "legal-basis",
      heading: "5. Our lawful basis",
      blocks: [
        {
          type: "list",
          items: [
            "Consent — for prayer requests, sensitive details, marketing emails, and non-essential cookies. You may withdraw it at any time.",
            "Legitimate interest — for site security, spam prevention, aggregate analytics, and the ordinary running of a church.",
            "Contract — to process and acknowledge a gift or partnership you have made.",
            "Legal obligation — where we must keep or disclose records under applicable law.",
          ],
        },
      ],
    },
    {
      id: "sharing",
      heading: "6. Who your information is shared with",
      blocks: [
        {
          type: "list",
          items: [
            "The VOGIM pastoral and intercessory team — limited to those who pray over and follow up your request. They are bound to confidence.",
            "Service providers who operate the systems we use: web and database hosting, our email delivery provider, the live-chat provider, our analytics provider, and Flutterwave, our payment processor. They act on our instructions and may not use your data for their own purposes.",
            "Law enforcement or regulators, where we are legally required to disclose, or where disclosure is necessary to protect someone from serious harm.",
          ],
        },
        {
          type: "p",
          text: "We will not share your identity or your request with any other person, church, ministry, or organisation without your consent.",
        },
      ],
    },
    {
      id: "cookies",
      heading: "7. Cookies and tracking",
      blocks: [
        {
          type: "p",
          text: "Cookies are small files stored by your browser. This site uses:",
        },
        {
          type: "list",
          items: [
            "Essential cookies — needed for the site and the administrator login to work.",
            "Analytics cookies — Google Analytics (GA4), which tells us in aggregate how the site is used. See Google's privacy policy for how they handle that data.",
            "Advertising cookies — Google AdSense serves advertising on parts of this site and may use cookies to show relevant ads. You can control personalised advertising in your Google Ads Settings.",
            "Live chat — our chat widget sets a cookie so a conversation continues across pages.",
          ],
        },
        {
          type: "p",
          text: "You can block or delete cookies in your browser settings at any time. Blocking analytics and advertising cookies does not affect your ability to use this site or to submit a request.",
        },
      ],
    },
    {
      id: "retention",
      heading: "8. How long we keep it",
      blocks: [
        {
          type: "list",
          items: [
            "Prayer, healing, deliverance, and dream requests, with the pastoral record attached to them: kept while the pastoral relationship is live, and reviewed thereafter — ordinarily deleted or anonymised within 5 years of the last contact.",
            "General enquiries: up to 2 years.",
            "Giving and partnership records: kept as long as required for financial and accounting purposes, ordinarily 7 years.",
            "Analytics data: retained under our analytics provider's standard retention period.",
          ],
        },
        {
          type: "p",
          text: "You can ask us to delete your information sooner — see section 10.",
        },
      ],
    },
    {
      id: "security",
      heading: "9. How we protect it",
      blocks: [
        {
          type: "p",
          text: "The site is served over HTTPS, our database is access-controlled and password-protected, and the administration area is restricted to authenticated ministry staff. Access to request content is limited to the team members who need it in order to minister to you.",
        },
        {
          type: "p",
          text: "No system is perfectly secure, and we cannot guarantee the security of information transmitted over the internet. If a breach ever affects your data and puts you at risk, we will notify you and the relevant authority as the law requires.",
        },
      ],
    },
    {
      id: "your-rights",
      heading: "10. Your rights",
      blocks: [
        { type: "p", text: "You have the right to:" },
        {
          type: "list",
          items: [
            "Ask what personal information we hold about you and receive a copy of it.",
            "Have inaccurate information corrected.",
            "Have your information deleted — including your prayer request and the pastoral record attached to it.",
            "Restrict or object to how we use it.",
            "Withdraw consent at any time, including consent to receive ministry emails.",
            "Receive your information in a portable, machine-readable form.",
            "Complain to a supervisory authority — in Nigeria, the Nigeria Data Protection Commission.",
          ],
        },
        {
          type: "p",
          text: "To exercise any of these rights, write to {email}. We will respond within 30 days. There is no charge, and asking will never affect the ministry you receive from us.",
        },
      ],
    },
    {
      id: "children",
      heading: "11. Children",
      blocks: [
        {
          type: "p",
          text: "This site is not directed at children under 18, and we do not knowingly collect their information. Where a child needs prayer, a parent or guardian should submit the request. If you believe a child has given us information, contact us and we will delete it.",
        },
      ],
    },
    {
      id: "transfers",
      heading: "12. International transfers",
      blocks: [
        {
          type: "p",
          text: "We minister to a global congregation and use hosting, email, and analytics providers whose servers may sit outside Nigeria. Where information is transferred across borders, we rely on providers that offer contractual and technical safeguards appropriate to the data.",
        },
      ],
    },
    {
      id: "links",
      heading: "13. External links",
      blocks: [
        {
          type: "p",
          text: "This site links to third-party services, including Zoom, our giving platform, and social media. Once you leave this site, this policy no longer applies — please read theirs.",
        },
      ],
    },
    {
      id: "changes",
      heading: "14. Changes to this policy",
      blocks: [
        {
          type: "p",
          text: "We may update this policy as the ministry, the site, or the law changes. The version on this page, with the “last updated” date shown above, is the current one. Material changes will be highlighted on the site.",
        },
      ],
    },
    {
      id: "contact",
      heading: "15. Contact us",
      blocks: [
        {
          type: "p",
          text: "For any question about your privacy, or to make a request under section 10, write to {email}, call or message {phone}, or write to us at {address}.",
        },
      ],
    },
  ],
};

/* ------------------------------ Registry ------------------------------ */

export const LEGAL_DOCS: LegalDoc[] = [REFUND, TERMS, PRIVACY];

/** Footer / sitemap links, in display order. */
export const LEGAL_LINKS = [
  { label: "Refund Policy", href: "/refund-policy/" },
  { label: "Terms & Conditions", href: "/terms-and-conditions/" },
  { label: "Privacy Policy", href: "/privacy-policy/" },
];

export function getLegalDoc(slug: string): LegalDoc {
  const doc = LEGAL_DOCS.find((d) => d.slug === slug);
  if (!doc) throw new Error(`Unknown legal document: ${slug}`);
  return doc;
}

/** Metadata for a legal page, mirroring the shape used by getPageMeta(). */
export function legalMetadata(slug: string): Metadata {
  const doc = getLegalDoc(slug);
  const url = `${SITE_URL}/${doc.slug}/`;
  return {
    title: doc.seoTitle,
    description: doc.seoDescription,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "VOGIM Prayer Land",
      title: doc.seoTitle,
      description: doc.seoDescription,
      url,
      images: [{ url: doc.heroImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: doc.seoTitle,
      description: doc.seoDescription,
      images: [doc.heroImage],
    },
  };
}
