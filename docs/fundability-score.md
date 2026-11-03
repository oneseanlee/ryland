# Fundability Score — integration notes

Routes: `/fundability` (landing), `/fundability/score` (quiz → contact → results), `/fundability/benchmarks` (original benchmarks page + PDF).

## Submission
`fundability-submit` validates input (zod, honeypot), recomputes the score server-side and saves to `fundability_assessments` (service-role only). It returns immediately with a 15-minute assessment-bound HMAC completion receipt. The quiz invokes `ghl-fundability-quiz` fire-and-forget using only the ID and receipt, not browser-supplied contact data or scores. A server-side `EdgeRuntime.waitUntil` fallback and the browser endpoint compete for an atomic `pending` → `syncing` claim, so one completion sync runs even if the browser closes. Failed/stalled rows remain visible in the existing admin retry page. CRM failures are stored in `crm_status`/`crm_error`; results remain visible. The receipt is not a user JWT or exposed service key.

The shared sync retains email-first/phone-second contact matching, source/UTM tags and the detailed note. It additionally writes the supplied score, track, red-checks, JSON answers and original completion-date custom fields, and the `fundability quiz completed` / `fundability-track-<track>` tags. It reads GHL appointments and prefixes notes only on upcoming events whose title/calendar title contains “funding review”; existing prefixes are not duplicated, and appointment failures are non-fatal. No extra SMS, email or booking CTA is added. Admin retry uses this same helper; retries after partial contact sync may still recreate the existing results note.

## GoHighLevel tags applied
- Always: `Fundability Quiz Started`, `Fundability Quiz Completed`
- Track: `Funding Ready`, `Business Setup First`, `Credit Optimization First` (+ `Both Personal and Business Gaps`). Existing track tags are not removed by this public flow.
- Consent: `Marketing Consent`, `SMS Consent` (only when checked)
- `Funding Review Booked` is NOT set by the site — apply it from the GHL calendar "appointment booked" trigger so only verified bookings count.

The note carries: total/personal/business score, track, provisional flag, top priorities, all 12 answers (PASS / NEEDS ATTENTION / NOT VERIFIED), consent, UTM, landing URL, assessment id.

## GHL workflows to build (in GoHighLevel)
Trigger: tag added `Fundability Quiz Completed`.
1. Email 1 (immediate): "Your Fundability Score: [X]/12 — Here's Your Next Step" — transactional, send to all.
2. Day 1 "The First Thing to Fix Before Applying"; Day 3 "Why a Good Credit Score Doesn't Always Mean Funding Approval"; Day 5 "Still Planning to Apply for Business Funding?" — only if `Marketing Consent`; branch on track tags; stop when `Funding Review Booked`.
3. SMS only if `SMS Consent`.
The supplied custom field IDs are mapped in `_shared/fundability-quiz-fields.ts` for score, track, red checks, answers and completion date.

## Config
- `VITE_FUNDING_REVIEW_URL` — booking link (defaults to the site's `/consultation` calendar).
- `VITE_DENIAL_DECODER_ENABLED=true` — shows the Denial Letter Decoder line once the real PDF and delivery exist.
- Analytics: events pushed to `dataLayer` as `fundability_*` (landing_viewed, quiz_started, question_answered, personal_completed, business_completed, quiz_completed, lead_submitted, results_viewed, report_downloaded, funding_review_clicked).
