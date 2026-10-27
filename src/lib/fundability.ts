export * from "../../supabase/functions/_shared/fundability";

/** Booking destination for the Funding Review. Override with VITE_FUNDING_REVIEW_URL. */
export const FUNDING_REVIEW_URL: string = import.meta.env.VITE_FUNDING_REVIEW_URL || "/consultation";

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
export function captureUtm(): Record<string, string> {
  const p = new URLSearchParams(window.location.search);
  const fresh: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"]) {
    const v = p.get(k);
    if (v) fresh[k] = v.slice(0, 200);
  }
  if (Object.keys(fresh).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(fresh));
  try { return JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}"); } catch { return {}; }
}
