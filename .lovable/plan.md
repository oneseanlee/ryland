This is a very large scope (25 workstreams). To avoid a sprawling, half-finished PR and to respect what's already live and working, I'll break it into 5 phases and ship one phase per turn. Please confirm the phase order — or tell me to reorder — before I start.

## Audit-first (this turn, no code changes)

I'll open a working doc at `docs/seo-audit-2026-07.md` capturing:
- Every route in `App.tsx` with current status, metadata, H1, canonical
- Duplicate/thin routes (e.g. `/homepage` existence, funnel overlap)
- Claims flagged for owner verification (10,000+ entrepreneurs, $10M+, 40+ guides, funding %s, score changes)
- Items I cannot touch from this repo (subdomain `go.rylandpartners.com`, GSC/GA submissions, Google/Bing verification)

The audit is the source of truth for later phases. Nothing goes live until you approve claims.

## Phase 1 — Canonical hygiene & indexation (safe, no content risk)

- Verify `/homepage` — there is no `/homepage` route in `App.tsx` today. If it 404s, note it; if hosting serves anything, add a 301 via `VanitySlugRedirect` pattern or a dedicated route that `<Navigate to="/" replace />`.
- `robots.txt`: add `Disallow` for `/portal`, `/portal/admin`, `/admin`, `/my-orders`, `/reset-password`, `/credit-intake`, `/unsubscribe`, `/booking-confirmed`, `/thank-you`, `/download`, `/r/`, `/affiliate-booking`, `/affiliate-referral`. Keep sitemap directive.
- `sitemap.xml`: remove `/booking-confirmed`, `/my-orders`, `/credit-intake`, funnel offer/founders/consultation (paid-only). Keep `/`, `/about`, `/funding`, `/credit-repair`, `/community`, `/store`, `/partners`, `/contact`, `/consultation`, `/assessment`, legal pages.
- Add `noindex` meta via `PageMeta` on portal, admin, checkout-adjacent, download, thank-you, unsubscribe, reset-password, credit-intake, funnel/offer, funnel/founders, funnel/consultation.
- One H1 audit on `Index.tsx`, `Funding.tsx`, `CreditRepair.tsx`, `Store.tsx`, `Partners.tsx`, `About.tsx` — fix any duplicate H1s.

## Phase 2 — Per-route metadata + structured data

- Apply the metadata framework from your brief to `About`, `Funding`, `CreditRepair`, `Community`, `Store`, `Partners`, `Contact`, `Consultation`, `Assessment` via `PageMeta`.
- `ProductDetail`: already has Product JSON-LD; verify Offer fields (priceCurrency, availability, url). Remove any hard-coded aggregate rating unless real review data exists.
- Add `BreadcrumbList` JSON-LD helper and wire into service + product + resource pages.
- Add `Service` JSON-LD to each service page.
- Confirm Organization + WebSite JSON-LD in `index.html` remains the single canonical entity.

## Phase 3 — New service & resource routes (content skeletons you approve before publish)

Only after you approve copy. I will scaffold routes and add to sitemap/nav only when content is ready:
- `/business-funding`, `/funding-readiness`, `/business-credit`, `/credit-optimization`, `/business-compliance`, `/how-it-works`, `/results`, `/case-studies`, `/resources` + 6 resource subpages.
- Each with the section template you specified (opening answer, who it's for, process, limitations, FAQs, disclaimers, related links, CTA, breadcrumbs).
- Preserves existing `/funding` and `/credit-repair` — I'll either 301 them to the new URLs or keep them as the primary URL and skip the duplicate. **Decision needed:** do you want me to rename current routes, or add new ones and 301 old ones?

## Phase 4 — Trust, claims, and legal

- Sweep every hard-coded number/testimonial across `Index.tsx`, funnel pages, `About.tsx`, `Partners.tsx`. Extract to `src/data/claims-flagged.ts` with a `verified: boolean` flag defaulting to `false`. Any claim with `verified: false` renders conditional language ("results vary") until you confirm.
- Add "Results vary" disclosure component near every testimonial/result section.
- Update all `©` years to `new Date().getFullYear()` in `Footer.tsx`.
- Add company-role disclosure paragraph on `/about` and homepage footer note: "Ryland Partners is a financial education and consulting company, not a direct lender."

## Phase 5 — Performance, a11y, internal linking

- Image audit: convert remaining JPG/PNG to WebP where used above the fold; ensure `width`/`height` on `<img>`; `loading="lazy"` below fold; `fetchpriority="high"` only on hero.
- Nav/footer: ensure every important link is `<a href>` / `<Link>`, not `onClick`. Add descriptive anchor text sweep (replace "Learn More" everywhere).
- Heading audit pass 2.
- Add related-link blocks on service + resource pages.
- Defer non-critical JS; audit GTM idle load already in place.

## What I will NOT do

- Touch `go.rylandpartners.com` — separate platform. I'll produce a checklist for it.
- Submit sitemap to GSC / add verification tokens — needs your Google account. I'll leave clearly-labeled `TODO(owner)` placeholders in `index.html`.
- Invent testimonials, numbers, credentials, dates, or press mentions.
- Publish any new service/resource page until you approve the copy.
- Rebuild the store, checkout, portal, or working GHL flows.

## Decisions I need from you

1. **Route strategy for services** — rename `/funding` → `/business-funding` (with 301) or keep both? Same for `/credit-repair` vs `/credit-optimization`.
2. **Phase order** — start with Phase 1 (safe indexation cleanup) now, or jump to a different phase?
3. **Claim verification** — do you want to answer the flagged-claims list inline in chat, or should I put them in a spreadsheet-style `.md` for you to fill in?
4. **Homepage `/homepage`** — do you know if this URL exists in production (Google may have indexed it from an old version), or is this only a hypothetical to protect against?

Reply with answers to 1–4 and I'll start Phase 1 immediately.
