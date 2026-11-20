# QC report

Brief: *VOGIM Prayer Land: Website and Platform Upgrade Brief* (20 Nov 2026), section 16.

Pass 1 (builder's check) and Pass 2 (independent reviewer) both ran on 20 November 2026 against the source tree and a production build served locally (`next build` + `next start`, MongoDB unreachable from the build machine, so database-backed lists rendered their empty states).

Status words: **Done** = built and checked here. **Blocked** = waits on a named item in `OWNER_INPUTS.md`. **Not run** = needs access or tooling this machine does not have; listed so nobody mistakes it for a pass.

## Tooling results (Pass 1)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass, 0 errors |
| `npx eslint src tests` | Pass, 0 errors, 0 warnings (`public/tinymce` vendor bundle ignored) |
| `npm test` (new, Node test runner) | 9 of 9 pass (after Pass 2 fixes): staff login, TOTP MFA (RFC 6238 vector), signed/expiring sessions, role read rules, inbox rows carry no request text, 24-hour reply measure, `care_refresh_v1` stages and rollback |
| `next build` | Pass. 90 static pages generated. MongoDB TLS errors logged (Atlas IP allowlist), static fallbacks rendered |
| Copy lint regex (1.7) over `src/`, `content/`, `llms.txt` | 9 hits, all justified: negations or disclaimers ("we cannot guarantee", "not a substitute for … diagnosis", "if anyone asks you to pay for prayer … do not pay") |
| Crawl of all 73 sitemap URLs + linked pages (80 pages) | 0 broken internal links, 0 non-200 pages in the sitemap, no `noindex` page in the sitemap, one H1 on every page. Findings below |
| Staff sign-in on the built server | Wrong password refused; MFA account asks for a code; valid TOTP code signs in; pastor reaches the inbox; pastor is refused `/admin/privacy/` (admin only); unauthenticated API calls get 401 |
| Owner-gated routes | `/what-we-believe/`, `/safeguarding/`, `/where-gifts-go/`, `/accessibility/`, `/glossary/`, `/.well-known/security.txt` return 404 until their owner input exists. Unanswered FAQ questions return 404 |

## Pass 1 findings and fixes

| # | Finding | Priority | Fix |
|---|---|---|---|
| Q1 | `Crusade Registration` and `Crusade Interest` sign-ups on `/war-against-marine-kingdom/` were rejected ("Unknown form type") after the submissions whitelist was added. A live form was broken | P1 | Fixed. Both intents added with name, email and phone required; they carry a notice line instead of the sensitive-data consent box |
| Q2 | `/testimonies/` and the home page rendered an empty `<div>` once `content/testimonies.json` had entries; consented testimonies would never show | P2 | Fixed. `TestimonyList` renders only entries with a full consent record (consent date, form, approver, display name) and the standing line. No Review markup |
| Q3 | Session secret fell back to the literal `change-me` when `ADMIN_SECRET` and `ADMIN_PASSWORD` were both unset, so sessions could be forged | P1 | Fixed. No fallback; sign-in is refused until a secret exists |
| Q4 | Admin list endpoint returned every request's full text, and opening a request left no trace | P1 | Fixed. List returns summaries only (first name, type, status, timer). Full text comes from `GET /api/submissions/{id}/`, which writes an `open` entry to the audit log |
| Q5 | FAQ question and category meta descriptions outside 140–160 characters | P3 | Fixed with a fitter that only appends fixed, true lines |
| Q6 | `/books/` and `/store/` had no canonical | P2 | Fixed (self-canonical on `www`) |
| Q7 | Meta descriptions over 160 characters on `/healing/`, `/healing-request/`, `/give/`, `/notice/`, `/privacy-requests/`, and under 140 on `/store/`, `/books/` | P3 | Fixed |
| Q8 | CMS-driven descriptions outside 140–160 on `/about/`, `/zoom/`, `/refund-policy/`, `/partnership/`, `/media/`, `/blog/`, `/gallery/` | P3 | Fixed in code defaults (re-crawl: 0 out of range). A value saved in the admin SEO editor still overrides the default |
| Q9 | `/war-against-marine-kingdom/` title 62 characters; no page links to the past event | P3 | Title fixed (50). Linking or retiring the event page is an owner decision |
| Q10 | `/zoom/` and some FAQ answer pages had 2 inbound internal links | P3 | Fixed: Zoom room in the footer, FAQ deep links kept on ministry pages, store FAQ links, every topic linked from each topic page. Re-crawl: only the single published marriage answer has 2 (it gains more once "What is marital settlement?" is supplied) |

## Coverage map (16.1)

| Area | Section | Status |
|---|---|---|
| Ground rules, no invented facts, ministry owns the message | 0 | **Done.** Facts live in `content/ministry-facts.json`; doctrine, beliefs, glossary definitions, safeguarding, stewardship and accessibility text are owner-gated and render nothing until approved |
| Brand idea, pillars, narrative, voice and lint | 1 | **Done** for copy built from facts. About narrative approval: **Blocked (D2)** |
| Facts Register, verification list, audit findings A1–A20 | 2 | **Done** in code: A2, A3, A4, A5, A7, A8, A12, A13, A16, A17, A18, A19. **Blocked:** A1/A6 (D1, D2), A9–A11 (V6 gateway tests, store prices), A14 (L2, statement of faith), A15 (Seed/Covenant/Kingdom), A20 (Zoom admin access) |
| Colour, fonts, buttons, icons | 3 | **Done** (tokens in `globals.css`, Phosphor icons, button sizes). Photos: **Blocked** (consented images) |
| Care-first conversion: CTAs, service bar, sticky bar, no exit popup | 4 | **Done.** No exit popup exists. Reminder panel: **Blocked (D9)** |
| Mobile and low-data experience | 5 | **Done** in code. Device testing: **Not run**. "Save data": **Blocked (D11)** |
| New URLs, navigation, footer, services page, local time | 6 | **Done:** services, visit, leaders, healing, testimonies, FAQ (hub, 10 categories, 32 answers, search), how-requests-work, outreach (`noindex`), notice, cookie policy, complaints, privacy requests, llms.txt. **Blocked:** what-we-believe, where-gifts-go, safeguarding, accessibility, glossary, security.txt (templates built, publish on approval) |
| SEO, AEO, GEO, schema, entity and monitoring | 7 | **Done:** canonicals, breadcrumbs + BreadcrumbList, Church/WebSite, Event schedule, FAQPage, ItemList, DefinedTerm template, robots, sitemap, llms.txt. **Not run:** Rich Results/Schema validator, Search Console, Bing, IndexNow (need access). GBP, directories and monthly AI-answer checks are owner tasks (7.6) |
| Speed and Core Web Vitals | 8 | Code: static hero, consent-gated tags, click-to-load chat, `web-vitals` reporting after consent. **Not run:** Lighthouse CI and field CWV (no Chrome on the build machine; needs the deployed site) |
| Accessibility and NDPA privacy UX | 9 | **Done:** consent banner, notice lines, optional sensitive fields, adults-only line, privacy-requests form, retention job with logged runs, staff sign-in allows paste and has a show-password toggle (3.3.8). **Not run:** axe/Pa11y, NVDA, VoiceOver, TalkBack. Accessibility statement: **Blocked** until that audit |
| Home, ministry, about, testimonies, FAQ, glossary, giving, store, articles | 10 | **Done** for structure and fact-based copy. **Blocked:** testimonies (consent), ministry descriptions, glossary definitions, store prices/shipping, book details, article bylines and refresh (owner-approved authors) |
| Policies, cookies and ad consent, notice, safeguarding, security, commitments | 11 | **Done:** privacy, cookie, giving/refund, terms, notice, complaints drafts dated and footer-linked; AdSense removed (D7 default). **Blocked:** legal review, safeguarding (L5), commitments (D3), security.txt contact (L3) |
| Analytics and server-side events | 12 | **Done** in code (`docs/tracking-plan.md`): consent-gated dataLayer, no personal data in events, FAQ expand/helpful events with fixed ids only. **Not run:** GTM Preview / GA4 DebugView, gateway test-mode gift/refund/order |
| Forms, admin inbox, giving, store, Zoom | 13 | **Done:** inbox workflow (new → read → in prayer → session scheduled → follow-up → closed), reply timer with near/over-24-hour highlighting, weekly within-24-hours share, filters by type/status/age, roles (intercessor, pastor, finance, admin), per-person accounts with TOTP MFA, audit log of sign-in/open/status/assign/flag/export/delete/retention, manual urgent flag, rights export/delete by email, scheduled retention endpoint, notification emails without request text, all behind `care_refresh_v1` with tested rollback. **Blocked:** encryption at rest and backups (Atlas settings, V1/V2), Zoom waiting rooms and private links (A20/V9), receipts and recurring-cancel tests (V6) |
| Benchmarks and peer review | 14 | **Done** (`docs/peer-review.md`) |

## Feature flag and rollback (13)

`CARE_REFRESH_V1` controls the platform release: `off` (or unset) → previous dashboard; `staff` → new inbox for signed-in staff; `10`/`50`/`100` → staff plus that share of visitors, bucketed by a stable id. Rollback was tested in `tests/platform.test.mjs` (stage `off` and unset both return the old path) and on the built server. Role checks apply in both paths. After Pass 2 finding R3, the old dashboard also writes audit entries for its page load (one `open` for the list) and for CSV exports; it still loads full request text with the page, which is why the new inbox is the target state.

Public-site changes from earlier phases are not behind the flag; they are already in the working tree and were reviewed as one release.

## Follow-up after merge (20 November 2026)

Merged to `main`. Re-crawl of 73 sitemap URLs on a fresh build: no description or title out of range, no broken links, no error pages. Lighthouse could not be run on this machine (fetching the tool was not permitted), so speed and automated accessibility scores are still **Not run**.

## Pass 2 (independent reviewer)

A separate reviewer agent that did not build the work ran a fresh review: 29 pages fetched from the built server, the platform, tracking and mail code read line by line, `npm test` and `tsc` re-run. It changed no files.

**Confirmed clean:** no 24-hour promise anywhere; one H1 and a self-canonical on every page fetched; no Review or aggregateRating markup; notice and under-18 lines on request forms; healing condition optional; no giving prompt on request or confirmation states; facts match F2, F3 and F5; content complete without JavaScript; no Google, chat or ad script before consent; events carry only fixed ids; notification and confirmation emails carry no request text; role rules hold for finance, intercessor, pastor and admin; sessions signed with no fallback secret; regex input escaped.

| # | Finding | Priority | Resolution |
|---|---|---|---|
| R1 | Every request form stamped its start time at submit, so the server's 1.5-second bot check discarded real prayer, healing, deliverance, dream, contact, partnership, complaint, privacy and refund requests while showing "received". Pass 1 missed this | P1 | Fixed. The form starts timing when it appears and sends elapsed milliseconds (immune to a wrong phone clock). Verified on the built server: 0.3 s returns a quiet success without saving; 45 s reaches the database. Verified in Chrome: the real form sent 9,396 ms and reached the save step |
| R2 | CRM copied the first 140 characters of request text into its timeline, unaudited, never deleted by retention, and left behind when a request was deleted | P2 | Fixed. The timeline now records only "{type}: received". Retention removes contacts with no activity for 5 years and scrubs older timeline text. Deleting a request removes its CRM entry. Contact views, edits and deletes are audited |
| R3 | Rollback dashboard loaded all request text with no audit entry; CSV export unaudited. Pass 1's rollback statement was wrong | P2 | Fixed (page load and CSV export are audited). Statement above corrected |
| R4 | Data-rights tool put the person's email in the URL | P2 | Fixed. POST body only |
| R5 | Form rate limit keyed on the client-controlled first `X-Forwarded-For` value | P2 | Fixed. Uses `cf-connecting-ip`, then `x-real-ip`, then the last forwarded hop |
| R6 | No staff-login throttle; failed sign-ins unaudited; TOTP codes reusable inside their window; logout did not revoke the token | P2 | Fixed. 5 failures per username and address lock that pair for 15 minutes; failures and sign-outs are audited; each TOTP step works once; signed-out tokens are refused (fails closed if the list cannot be read) |
| R7 | `/give/` showed Malachi 3:10 (added in this upgrade, not on the live page); `/partnership/` step 3 tied confirming a gift to prayer | P2 | Fixed: Malachi strip held back for D6; step 3 now reads "…so we can confirm your partnership." Luke 6:38 on `/partnership/` is live ministry wording and is logged for D6. Saved CMS values may still hold the old step text (see OWNER_INPUTS) |
| R8 | "The team reads your request" (home, `/healing/`) states what D5 has not confirmed. Older CMS copy on `/online-deliverance/` and `/marital-settlement/` uses outcome language ("break those chains", "watch the Lord restore", "walk out your breakthrough") | P2 | First part fixed with Facts Register wording. The CMS wording is the ministry's own and is logged for owner review under rule 4 / D10. The `/outreach/` holding line is the exact text brief 10.11 specifies, on a `noindex` page, so it stays |
| R9 | `/give/` mentions cancelling a monthly gift though no recurring flow was found; rights tool missed refund requests; `findVisible` returned anonymised records | P3 | Last two fixed. The monthly-gift line is logged with V6 |

**Verdict after fixes:** no open P1. The open P2 items are owner wording decisions (Luke 6:38, legacy outcome phrases in the CMS), which ground rule 2 reserves for leadership. They are listed in `OWNER_INPUTS.md`. Measurements that need the deployed site or tool access (Lighthouse, axe, screen readers, devices, GTM/GA4 debug, gateway test mode, Rich Results) remain **Not run** and are required before final sign-off.
