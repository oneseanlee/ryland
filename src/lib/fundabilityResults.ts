import type { ScoreResult } from "@/lib/fundability";

export type ResultBand = "not_ready" | "getting_close" | "almost_there" | "ready";

/** Display bands do not change scoring, qualification tracks or CRM tags. */
export function resultBand(total: number): ResultBand {
  if (total <= 4) return "not_ready";
  if (total <= 8) return "getting_close";
  if (total < 12) return "almost_there";
  return "ready";
}

export const RESULT_HEADLINE: Record<ResultBand, string> = {
  not_ready: "Not ready yet. But it's fixable.",
  getting_close: "You're getting close.",
  almost_there: "You're almost there.",
  ready: "You've met all 12 benchmarks.",
};

export function resultPlan(result: ScoreResult): string {
  if (result.track === "funding_ready") return "Your plan: verify your real file together, then plan the right application order.";
  if (result.track === "business_setup") return "Your plan: your credit meets the targets. Review your business setup gaps first.";
  if (result.track === "credit_optimization") return "Your plan: your business meets the targets. Review your credit gaps first.";
  return "Your plan: review your credit first, then address your business setup gaps.";
}
/** Results-page "needs your attention" order: score, negatives, business standing first. Display only. */
export const ATTENTION_ORDER = ["01", "02", "07", "05", "11", "03", "08", "09", "10", "12", "04", "06"];

export function attentionItems(answers: Record<string, string>, limit = 3): string[] {
  return ATTENTION_ORDER.filter((id) => answers[id] !== "yes").slice(0, limit);
}

export const ATTENTION_COPY: Record<string, { title: string; hint: string }> = {
  "01": { title: "Your score is under 700", hint: "Pull all 3 reports. Know your lowest one." },
  "02": { title: "You have negatives on your report", hint: "Late payments or collections need a plan." },
  "07": { title: "Your business isn't compliant", hint: "Check your entity status with your state." },
  "05": { title: "Your utilization is too high", hint: "Get every card under 28% of its limit." },
  "11": { title: "Your business has negative records", hint: "Liens or judgments need to be resolved." },
  "03": { title: "Too many credit inquiries", hint: "Stop applying until you have a plan." },
  "08": { title: "Your business credit file isn't set up", hint: "Get a D-U-N-S and match your details." },
  "09": { title: "You don't have an online presence", hint: "Add a website and a business email." },
  "10": { title: "Your business contact info isn't set up", hint: "Use a business phone and address." },
  "12": { title: "Your industry code needs review", hint: "Confirm your NAICS code is accurate." },
  "04": { title: "Your credit profile is too thin", hint: "You need 4+ accounts in your own name." },
  "06": { title: "Your credit history is too new", hint: "Keep old accounts open." },
};
