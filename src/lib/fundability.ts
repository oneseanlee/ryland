export * from "../../supabase/functions/_shared/fundability";

/** Direct branded calendar: the meeting-domain redirect drops prefill query parameters. */
export const FUNDING_REVIEW_URL: string = import.meta.env.VITE_FUNDING_REVIEW_URL || "https://link.rylandpartners.com/widget/booking/PSQjJW46GofsIEfpoHUA";

/** Denial Letter Decoder bonus stays hidden until a real PDF + delivery workflow are configured. */
export const DENIAL_DECODER_ENABLED = import.meta.env.VITE_DENIAL_DECODER_ENABLED === "true";

export const DISCLOSURE =
  "Ryland Partners is not a lender. This assessment is for educational purposes only and is based on information you provide. Each lender establishes its own underwriting requirements. Meeting these benchmarks does not guarantee approval, funding amount, rate, or timing.";

export function track(event: string, params: Record<string, unknown> = {}) {
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event: `fundability_${event}`, ...params });
}

const UTM_KEY = "fundability_utm";
const UTM_TTL = 30 * 24 * 60 * 60 * 1000;
/** Reads UTMs from the current URL (newest wins) and keeps them in localStorage for 30 days, so they survive /fundability -> /fundability/score, new tabs and reloads. */
export function captureUtm(): Record<string, string> {
  const p = new URLSearchParams(window.location.search);
  const fresh: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"]) {
    const v = p.get(k);
    if (v) fresh[k] = v.slice(0, 200);
  }
  try {
    if (Object.keys(fresh).length) {
      localStorage.setItem(UTM_KEY, JSON.stringify({ utm: fresh, landing: window.location.href.slice(0, 500), at: Date.now() }));
      return fresh;
    }
    const s = JSON.parse(localStorage.getItem(UTM_KEY) || "null");
    if (s && Date.now() - s.at < UTM_TTL) return s.utm ?? {};
  } catch { /* storage blocked */ }
  return {};
}
/** The original landing URL that carried the UTMs, if any. */
export function landingUrl(): string {
  try { const s = JSON.parse(localStorage.getItem(UTM_KEY) || "null"); if (s?.landing) return s.landing; } catch { /* ignore */ }
  return window.location.href.slice(0, 500);
}
/** Appends stored UTMs to an internal path, so they also show in the URL. */
export function withUtm(path: string): string {
  const u = captureUtm(); const q = new URLSearchParams(u).toString();
  return q ? `${path}?${q}` : path;
}
/** Funding Review link with first name and email prefilled. */
export function bookingUrl(firstName: string, email: string): string {
  if (!FUNDING_REVIEW_URL.startsWith("http")) return FUNDING_REVIEW_URL;
  const u = new URL(FUNDING_REVIEW_URL);
  if (firstName) u.searchParams.set("first_name", firstName);
  if (email) u.searchParams.set("email", email);
  return u.toString();
}
