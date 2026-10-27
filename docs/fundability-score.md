# Fundability Score — integration notes

Routes: `/fundability` (landing), `/fundability/score` (quiz → contact → results), `/fundability/benchmarks` (original benchmarks page + PDF).

## Submission
`fundability-submit` function: validates input (zod, honeypot), recomputes the score server-side, saves to `fundability_assessments` (service-role only), then upserts the GoHighLevel contact (deduped by email), sets tags and adds a results note. CRM failures are stored in `crm_status`/`crm_error`; the visitor still sees results and is never told an email was sent.

## GoHighLevel tags applied
- Always: `Fundability Quiz Started`, `Fundability Quiz Completed`
- Track (mutually exclusive, stale ones removed): `Funding Ready`, `Business Setup First`, `Credit Optimization First` (+ `Both Personal and Business Gaps`)
- Consent: `Marketing Consent`, `SMS Consent` (only when checked)
- `Funding Review Booked` is NOT set by the site — apply it from the GHL calendar "appointment booked" trigger so only verified bookings count.

The note carries: total/personal/business score, track, provisional flag, top priorities, all 12 answers (PASS / NEEDS ATTENTION / NOT VERIFIED), consent, UTM, landing URL, assessment id.

## GHL workflows to build (in GoHighLevel)
Trigger: tag added `Fundability Quiz Completed`.
1. Email 1 (immediate): "Your Fundability Score: [X]/12 — Here's Your Next Step" — transactional, send to all.
2. Day 1 "The First Thing to Fix Before Applying"; Day 3 "Why a Good Credit Score Doesn't Always Mean Funding Approval"; Day 5 "Still Planning to Apply for Business Funding?" — only if `Marketing Consent`; branch on track tags; stop when `Funding Review Booked`.
3. SMS only if `SMS Consent`.
To merge the score into emails, create custom fields in GHL and share their IDs; they can then be written on the contact.

## Config
- `VITE_FUNDING_REVIEW_URL` — booking link (defaults to the site's `/consultation` calendar).
- `VITE_DENIAL_DECODER_ENABLED=true` — shows the Denial Letter Decoder line once the real PDF and delivery exist.
- Analytics: events pushed to `dataLayer` as `fundability_*` (landing_viewed, quiz_started, question_answered, personal_completed, business_completed, quiz_completed, lead_submitted, results_viewed, report_downloaded, funding_review_clicked).
