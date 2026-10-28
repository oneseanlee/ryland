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

/**
 * Personal "you passed" lines shown when a benchmark is met. Display only —
 * never used for scoring, tracks or CRM tags. Each line names what they have
 * and how to keep it.
 */
export const PASS_COPY: Record<string, string> = {
  "01": "All three of your scores are 700 or higher. That's the first number a bank screens — keep it there by not opening new credit before you apply.",
  "02": "You have no late payments, collections or bankruptcies on your report. That's the hardest habit to hold, and it's worth real money to a lender. Keep every payment on time and this one stays in your column.",
  "03": "You've kept your credit checks to 2 or fewer a year. Don't apply for anything new while we build your file — this one only moves one way.",
  "04": "You have 4 or more open accounts in your own name. That's real depth a lender can verify. Keep them open and active, even the ones you rarely use.",
  "05": "Every card is under 28% of its limit. Keep it that way through your statement dates — this is the benchmark that moves fastest, both ways.",
  "06": "Your accounts average 2 years or older. Keep your oldest accounts open; age is the one thing you can't buy.",
  "07": "Your business is active with the state and past 2 months old. File your annual report on time so nothing stalls the application.",
  "08": "You have a D-U-N-S number and your business details match everywhere. Keep them identical on every form you fill out.",
  "09": "You have a live website and an email on your own domain. Most owners don't have this yet — keep both live and current.",
  "10": "Your business has its own phone number and address. Use that same pair on every application so verification matches.",
  "11": "Your business shows no liens, judgments or unpaid debts. Keep it clean — close out any old vendor or merchant cash advance account properly.",
  "12": "You know your industry code and it isn't flagged high-risk. Keep that same code on every record so your files match.",
};

/** Personalized line for a passed benchmark, with a safe fallback. */
export function passLine(id: string): string {
  return PASS_COPY[id] ?? "You meet this benchmark. Keep it the way it is and we'll confirm it on your review.";
}
