# Baseline audit

Date: 20 November 2026

## Method

- Read the developer brief and all application route, component and API inventories.
- Inspected global layout, CMS defaults, request forms, submission storage, mail, admin, giving, store, policies, sitemap and robots.
- Fetched the live `robots.txt` and `sitemap.xml` on the canonical `www` host.
- Ran the existing production build and ESLint before changes.

## Baseline results

- `next build`: passed. MongoDB TLS/network errors were logged while fetching books and merchandise; static fallbacks rendered. This needs an Atlas network/TLS check.
- `npm run lint`: failed with 304 errors and 3,531 warnings. Most output came from the generated `public/tinymce` vendor bundle. The configuration needs to ignore that generated directory; application errors still need fixing.
- Live robots: Cloudflare emits managed content-signal and AI crawler rules before the Next.js rules. Training crawlers are blocked there; the application now explicitly allows search/answer crawlers and disallows admin, API, checkout and search URLs.
- Live sitemap: returned static, article, book and product URLs on the canonical `www` host. New public routes must be added when created.
- Canonical: source configuration redirects the bare host to `https://www.vogimprayerland.org`; CMS metadata defaults to the same host.

## High-priority findings confirmed in code

1. GA4, GTM, AdSense and Chatway loaded without a consent choice.
2. The healing condition was mandatory and a second free-text health field was requested.
3. Admin notification emails included the full request, name and contact details, including through FormSubmit.
4. The global Request Prayer button targeted the deliverance form.
5. CMS defaults included conflicting founder names, unverified statistics, unconsented testimonies and a financial-return claim. Saved CMS values could override safer defaults, so rendering must not rely on default edits alone.
6. Giving and partnership forms accepted prayer content alongside giving.
7. No rate limit or honeypot protected public submissions.
8. The current admin has one shared password and no roles, MFA or audit log.
9. No retention jobs or verified 24-hour reply measurement were found.
10. `.env.example` contained credentials and keys. These are removed from the example and require rotation by the owner.

## Measurements still required

Production Lighthouse/CrUX, axe, screen readers, physical Android/iOS, gateway test-mode purchases/refunds, webhook reconciliation, email delivery and DNS checks cannot be certified from source alone. They remain in `docs/qc-report.md` until executed against the deployed site.
