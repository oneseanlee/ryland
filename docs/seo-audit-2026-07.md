# Ryland Partners — SEO & Content Audit (July 2026)

This document is the source of truth for the phased SEO/content overhaul.
It captures what exists today, what changed in each phase, and what remains
blocked on the owner (Gene / info@rylandpartners.com) or on external platforms.

Canonical domain: `https://rylandpartners.com`

---

## Route inventory (from `src/App.tsx`)

Legend:
- **Index** = should appear in Google/Bing
- **Noindex** = private/transactional/paid-funnel — must not appear in organic
- **Redirect** = permanently consolidates to another URL

| Route | Purpose | Status after Phase 1 |
| --- | --- | --- |
| `/` | Homepage | Index (canonical) |
| `/homepage` | Legacy duplicate | **Redirect → `/`** + robots Disallow |
| `/about` | Founder / company | Index |
| `/partners` | Partner program public page | Index |
| `/store` | Shopify-backed store | Index |
| `/product/:handle` | Product detail | Index (per-product metadata) |
| `/funding` | Business funding overview | Index (canonical for funding topic) |
| `/credit-repair` | Credit repair service | Index |
| `/community` | Community | Index |
| `/assessment` | Funding readiness assessment | Index |
| `/consultation` | Free consultation booking | Index |
| `/contact` | Contact | Index |
| `/privacy-policy`, `/terms-of-service`, `/ccpa`, `/tsr-compliance`, `/disclaimers`, `/cookie-policy` | Legal | Index (low priority) |
| `/booking-confirmed` | Post-booking | **Noindex** |
| `/my-orders` | Customer order lookup | **Noindex** |
| `/credit-intake` | PII intake form | **Noindex** |
| `/reset-password` | Auth utility | **Noindex** |
| `/unsubscribe` | Email unsubscribe | **Noindex** |
| `/thank-you` | Post-conversion | **Noindex** |
| `/download/:token` | Signed download redirect | **Noindex** |
| `/r/:ref`, `/affiliate-referral`, `/affiliate-booking` | Redirect utilities | **Noindex** |
| `/partner-onboarding`, `/opt-in` | Utility flows | **Noindex** |
| `/funnel`, `/funnel/offer`, `/funnel/founders`, `/funnel/consultation` | Paid-traffic funnel | **Noindex** (robots Disallow + meta) |
| `/portal/*` (all subroutes) | Partner portal | **Noindex** (via `PortalLayout`) |
| `/portal/admin/*` | Admin | **Noindex** (via `AdminLayout`) |
| `/:slug` | Vanity affiliate slug redirect | **Noindex** |
| `*` (NotFound) | 404 | **Noindex** |

## Phase 1 changes (shipped this turn)

1. `public/robots.txt` — added Disallow for portal, admin, funnel, transactional, and `/homepage` routes. Kept Sitemap directive.
2. `public/sitemap.xml` — removed funnel URLs, `/booking-confirmed`, `/my-orders`, `/credit-intake`. Left only genuinely indexable public URLs.
3. `src/components/PageMeta.tsx` — added `noindex` prop that emits `<meta name="robots" content="noindex, follow">`. Default remains indexable.
4. Added `noindex` on: BookingConfirmation, CreditIntake, ResetPassword, Unsubscribe, ThankYou, DownloadRedirect, MyOrders, AffiliateReferral, AffiliateBooking, PortalLogin, AdminLogin, NotFound, PartnerOnboarding, OptIn.
5. `src/components/funnel/FunnelLayout.tsx` — injected `<PageMeta noindex />` so all four funnel routes are noindexed.
6. `src/components/portal/PortalLayout.tsx` and `src/components/admin/AdminLayout.tsx` — injected `<PageMeta noindex />` so every portal + admin subroute is noindexed.
7. `src/pages/HomepageRedirect.tsx` — client-side `<Navigate to="/" replace />`. Google respects immediate JS redirects; robots Disallow + no sitemap entry reinforce consolidation.

## Known limitations / not shipped this turn

- **True 301 redirects**: Lovable hosting serves the SPA fallback for `/homepage`; the redirect is client-side. If organic traffic to `/homepage` grows, we would need edge-level redirects (not currently available on this stack).
- **`go.rylandpartners.com`**: separate platform (GHL/HighLevel). Cannot be edited from this repo. See "External platform checklist" below.
- **Search Console / Bing Webmaster verification**: requires owner login. Placeholders left in `index.html` — not touched this turn to avoid breaking the current site.
- **New service/resource routes** (`/business-funding`, `/funding-readiness`, etc.): scaffolding deferred to Phase 3. They will only be published once copy is approved.

## External platform checklist (owner action required)

**On `go.rylandpartners.com` (GHL / HighLevel)**
- [ ] Add `<meta name="robots" content="noindex, follow">` to every funnel step.
- [ ] Remove `go.rylandpartners.com/*` from any XML sitemap.
- [ ] Confirm no funnel page canonicalizes to `rylandpartners.com` (or vice-versa).
- [ ] Update any duplicated financial claims to the "results vary" wording once we finalize approved copy (Phase 4).

**In Google Search Console**
- [ ] Add `rylandpartners.com` domain property (if not already).
- [ ] Submit `https://rylandpartners.com/sitemap.xml`.
- [ ] Request removal of any old `/homepage` URL.
- [ ] Verify `go.rylandpartners.com` as a separate property so its data doesn't mix with the main site.

## Claim verification queue

See `docs/claims-to-verify.md`. Every numeric or absolute claim on the current site has been flagged there. Phase 4 will rewrite unverified claims to conditional wording ("results vary…") until you mark them verified.

## Follow-up phases

- **Phase 2** — per-route metadata (`Funding`, `CreditRepair`, `About`, etc.) via `PageMeta` + Service / BreadcrumbList JSON-LD.
- **Phase 3** — new service pages (`/business-funding`, `/funding-readiness`, `/business-credit`, `/credit-optimization`, `/business-compliance`, `/how-it-works`, `/results`, `/case-studies`, `/resources`).
- **Phase 4** — claim verification, "Results vary" disclosures, footer legal role disclosure.
- **Phase 5** — performance (LCP/CLS/INP), image WebP sweep, internal linking, heading audit, `<a href>` audit.
