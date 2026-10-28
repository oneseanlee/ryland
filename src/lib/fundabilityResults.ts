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