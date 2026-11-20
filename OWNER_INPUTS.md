# Owner inputs: VOGIM Prayer Land

Items below are blocked, not skipped. No claim, policy protection, price or pastoral wording should be published until the relevant answer is approved.

## Content and assets

- [ ] Statement of faith, written or approved by leadership.
- [ ] Ministry-written glossary definitions and doctrinal FAQ answers.
- [ ] Ministry descriptions of deliverance sessions, healing prayer, dream interpretation and marital settlement.
- [ ] Approval of the founder's full name and the About narrative; founder photo and approved biography.
- [ ] Whether only the founder should appear on the Leaders page; otherwise names, roles, photos and biographies.
- [ ] Written consent records for every testimony and identifiable photograph, including each person's chosen display name.
- [ ] Real service and outreach photographs with consent. No identifiable child without written guardian or institution consent.
- [ ] Widows and orphans outreach activities, places and frequency.
- [ ] Book titles, author, formats, visible prices and buying method.
- [ ] Store prices by currency, shipping regions, fees, delivery times, returns policy and order-status email behaviour.
- [ ] Owner-written descriptions for Deliverance Ministry, Widows & Orphans, and Building the Sanctuary gifts.
- [ ] Visit information: what to expect, parking and transport.
- [ ] Dated evidence for “50+ nations reached”, or approval to keep it removed.
- [ ] Any verified replacement statistics. “1000s lives restored” and “24/7 intercession” remain removed.
- [ ] FAQ answers held back in `content/faq.json` (`owner_supplied: true`): what online deliverance is, what marital settlement is, what Seed / Covenant / Kingdom mean, whether people can request prayer for someone else, reply times (after D4), joining by phone, and recordings (after D16). Each one publishes as soon as its `short_answer` is filled.
- [ ] Glossary definitions in `content/glossary.json` (11 ministry terms). The `/glossary/` hub publishes once three terms have approved definitions; only the factual WAT entry is filled.
- [ ] Owner-written pages in `content/owner-pages.json`: What we believe, Safeguarding, Where gifts go, Accessibility statement. Each publishes only when `approvedBy`, `approvedOn` and its sections are filled.
- [ ] Testimony entries in `content/testimonies.json` need `displayName`, `text`, `consentDate`, `consentForm` and `approvedBy`; incomplete entries never render.

## Identity and contacts

- [ ] D1: Primary public name and legal/registered name.
- [ ] D2: Founder name form (Oladele, Emmanuel, or an approved full form).
- [ ] L2: Registration name/number and gateway paperwork, including SCUML where required.
- [ ] L3: Named privacy contact and email; complaints contact; security contact; notice contact.
- [ ] Approved official channels list, including whether stablecoin wallets are official.
- [ ] Support hours (WAT) and the people responsible for WhatsApp and Chatway.
- [ ] Refund/returns owner able to acknowledge within 3 business days and decide within 7.
- [ ] L4: Verified emergency and crisis numbers. None are published yet.

## Decisions

- [ ] D3: Approve the public “Our commitments” wording and its daily operation.
- [ ] D4: Confirm every request receives a reply within 24 hours. Until then, the website does not repeat that promise.
- [ ] D5: Confirm who reads requests and whether “every request is read” is true in practice.
- [ ] D6 detail: the Malachi 3:10 strip was removed from `/give/` pending approval; Luke 6:38 remains on `/partnership/` (live wording). If the CMS has a saved value for partnership step 3, update it to "Send us your payment notification on WhatsApp so we can confirm your partnership."
- [ ] Review older CMS wording for outcome language: `/online-deliverance/` ("break those chains" beside anxiety and depression) and `/marital-settlement/` ("watch the Lord restore", "walk out your breakthrough"). Keep, soften or remove (rule 4, D10).
- [ ] `/give/` says "To cancel a monthly gift, email the team". Confirm whether monthly gifts exist (V6); if not, remove the line.
- [ ] D6: Approve giving wording. Financial-return wording is removed; giving remains voluntary and separate from prayer.
- [ ] D7: AdSense decision. Ads are currently removed from the application.
- [ ] D8: Supply and approve dated stewardship information before `/where-gifts-go/` is published.
- [ ] D9: Decide whether to build an opt-in service reminder.
- [ ] D10: Approve the medical, mental-health and emergency care-note wording. The existing healing-page doctor wording remains.
- [ ] D11: Decide whether a “Save data” control is wanted.
- [ ] D12: The code currently uses `https://www.vogimprayerland.org` and redirects the bare host to it. Confirm this canonical host.
- [ ] D13: Decide whether training crawlers GPTBot and Google-Extended are allowed. Search and AI-answer crawlers are allowed; training crawlers remain blocked.
- [ ] D14: Decide whether live Zoom captions will be provided.
- [ ] D15: Decide whether any ad pixels or heatmaps may be used. None are enabled.
- [ ] D16: State whether public services or private sessions are recorded, where recordings are kept and for how long.

## Access and external operations

- [ ] Hosting, Cloudflare, deployment, GA4, GTM, Search Console, Bing and AdSense access.
- [ ] Flutterwave, Paystack and PayPal dashboard access in test mode.
- [ ] Zoom admin, YouTube, Facebook, WhatsApp Business, Chatway and email-provider access.
- [ ] Google Business Profile ownership.
- [ ] Rotate all credentials that were present in `.env.example`; the committed values have now been removed. Supply replacements only through the server's protected environment.
- [ ] Configure SPF, DKIM and DMARC for the sending domain and confirm the hosting/database regions.
- [ ] Create individual staff accounts with MFA: for each person run `STAFF_PASSWORD='…' node scripts/staff-user.mjs <username> <intercessor|pastor|finance|admin>`, put the JSON entries in `ADMIN_USERS`, set a long random `ADMIN_SECRET`, and have each person scan their authenticator link. Until `ADMIN_USERS` is set, the old shared password still works and the inbox shows a warning.
- [ ] Set `CARE_REFRESH_V1=staff` in production to release the new inbox to staff; set `off` to roll back.
- [ ] Set `RETENTION_TOKEN` (24+ random characters) and schedule a daily `POST https://www.vogimprayerland.org/api/admin/retention/` with `Authorization: Bearer <token>`. Runs appear under Admin → Privacy.
- [ ] Decide who is the security contact (L3) so `/.well-known/security.txt` can be served; set `publishing.securityContact` in `content/ministry-facts.json`.
- [ ] Configure unique, waiting-room-protected links for private sessions; the public service room is not used for private sessions.

## Legal and specialist review

- [ ] L1: Counsel on NDPA/GAID duties, transfers, registration, DPO needs and breach timelines.
- [ ] Legal review of Privacy, Cookie, Giving/refund, Terms, Notice and Complaints drafts.
- [ ] L5: Qualified safeguarding adviser and owner-written safeguarding policy. `/safeguarding/` is not published yet.
- [ ] Testimony and photograph consent forms.
- [ ] Confirm that published retention periods are technically enforced. Until deletion jobs exist, the policy must not imply verified enforcement.

## Verification results

| # | Verified in this repository | Evidence |
|---|---|---|
| V1 | MongoDB Atlas is used. Region, hosting provider and admin-access list require owner access. | `src/lib/mongodb.ts` |
| V2 | Requests are stored in MongoDB. Staff accounts now have roles (intercessor, pastor, finance, admin) and TOTP MFA once `ADMIN_USERS` is configured; every open, change, export and delete is audit-logged. No application-level encryption: encryption at rest depends on the Atlas cluster settings, which need owner access to confirm. | `src/lib/auth-core.ts`, `src/lib/inbox.ts`, `src/lib/audit.ts` |
| V3 | Chatway is the provider. Its storage, region, retention and answering staff require owner confirmation. Script now loads only after functional consent and a visitor tap. | `src/components/ChatwayWidget.tsx` |
| V4 | Honeypot, submission-time check and database-backed rate limiting are implemented. No puzzle CAPTCHA is used. | `src/app/api/submissions/route.ts` |
| V5 | GA4/GTM previously loaded before consent and ads loaded globally. Both are corrected; AdSense is removed. | `src/app/layout.tsx`, `src/components/ConsentManager.tsx` |
| V6 | Code supports Flutterwave, Paystack and PayPal, signed webhook handlers and per-currency presets. Receipts, cancellation and live/test account state still need gateway tests. | `src/lib/gateways.ts`, `src/app/api/give/` |
| V7 | SMTP or FormSubmit is used. Notification content now excludes names, contact details and request text. SPF/DKIM/DMARC require DNS access. | `src/lib/mailer.ts` |
| V8 | The inbox now records the first reply time ("Mark first reply sent") and shows the share of the last 7 days' requests answered within 24 hours. The public promise stays off the site until D4 and a few weeks of this measure. | `src/lib/inbox-core.ts`, `src/app/admin/InboxV2.tsx` |
| V9 | A public Zoom room is configured. Waiting-room/host settings and private-session scheduling require Zoom access. | `content/ministry-facts.json` |
| V10 | The audited stray “dfs” string is absent in source. Unverified stats/testimonies and return promises are removed from rendering. | `src/app/(site)/page.tsx` |
| V11 | `www` is canonical; bare host redirects to it. Sitemap and robots exist. Cloudflare adds its own crawler rules before application rules. | `next.config.ts`, `src/app/sitemap.ts`, `src/app/robots.ts` |
| V12 | `next/image` is used and the home page is a static hero, not an autoplay slider. Actual CDN image weights need a production Lighthouse run. | `src/app/(site)/page.tsx` |
| V13 | A retention endpoint anonymises requests after 5 years and enquiries after 2, logs each run, and accepts a scheduler token. A daily schedule still has to be set up (see Access). Giving records are kept (7-year accounting period). | `src/lib/retention.ts`, `src/app/api/admin/retention/route.ts` |
| V14 | No recording configuration was found. Owner confirmation is required before making recording claims. | `OWNER_INPUTS.md` D16 |
