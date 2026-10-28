// Pure Fundability Score model shared by the app and the submit function. No imports.

export type Answer = "yes" | "no" | "unsure";
export type Section = "personal" | "business";
export type Track = "funding_ready" | "business_setup" | "credit_optimization" | "both";

export interface Benchmark {
  id: string; // "01".."12"
  section: Section;
  title: string;
  question: string;
  target: string;
  why: string;
  fix: string;
  helper?: string;
}

export const BENCHMARKS: Benchmark[] = [
  { id: "01", section: "personal", title: "Credit Scores", question: "Are all three of your credit scores 700 or higher?", target: "700+ on all three bureaus", why: "Banks pull different bureaus. A 720 on one and a 660 on another gets declined wherever they pull the 660, and most free score apps only show one.", fix: "Pull all three reports (Equifax, Experian, TransUnion) before you apply. Know the lowest number, not the best one.", helper: "Check Equifax, Experian and TransUnion. Your lowest one counts." },
  { id: "02", section: "personal", title: "Late Payments and Marks", question: "Is your credit report clean, with no late payments, collections or bankruptcies?", target: "No lates, collections, charge-offs, repos or bankruptcies on any bureau", why: "In the 0% business-credit lane a single derogatory item is often a decline on its own, no matter how good the rest of the file looks.", fix: "Review negative items, dispute inaccuracies, and develop a plan for valid negative history before applying.", helper: "Look at all three reports." },
  { id: "03", section: "personal", title: "Credit Checks (Inquiries)", question: "Have you applied for credit 2 times or less each year for the last 2 years?", target: "2 or fewer hard inquiries per bureau, per year, over the last 24 months", why: "Every application you 'just tried' is still on the report. Stacked inquiries tell the next bank that other banks already looked.", fix: "Avoid unnecessary new applications while preparing the funding file, and learn which bureau each bank pulls.", helper: "Each application can add a \"hard inquiry.\"" },
  { id: "04", section: "personal", title: "Your Own Accounts", question: "Do you have at least 4 open accounts in your own name?", target: "4+ open accounts, revolving + installment, opened by you", why: "Depth proves you can manage credit, but underwriters discount authorized-user and purchased tradelines. The depth has to be yours.", fix: "Build real primary accounts. Authorized-user accounts may help a score but do not count as depth.", helper: "Cards and loans both count. Cards where you're only an \"authorized user\" don't." },
  { id: "05", section: "personal", title: "Card Balances", question: "Is every credit card you have under 28% of its limit?", target: "Every personal card below 28% of its limit, each card, not just overall", why: "One heavily used card reads as risk even when overall utilization looks fine. This is the check owner-operators fail most often.", fix: "Review each card individually and identify where balances need to be reduced before statement dates.", helper: "Example: a $10,000 card should owe less than $2,800. Check each card, not the total." },
  { id: "06", section: "personal", title: "Credit Age", question: "Are your accounts 2 years old or more, on average?", target: "Average age of accounts 2+ years on every bureau", why: "New accounts look untested. Opening several cards at once drags the average down.", fix: "Keep old accounts open and avoid opening new personal accounts in the run-up to funding." },
  { id: "07", section: "business", title: "Business in Good Standing", question: "Is your business (LLC or corporation) active with the state, and at least 2 months old?", target: "LLC active with the Secretary of State, 2+ months old (2+ years is ideal)", why: "The bank verifies the entity before anything else. An inactive status or lapsed annual report ends the file before it starts.", fix: "Look up your status on the Secretary of State site and file anything that is overdue.", helper: "You can check on your state's Secretary of State website." },
  { id: "08", section: "business", title: "Business Credit File", question: "Does your business have a D-U-N-S number, with the same name, address and phone everywhere?", target: "DUNS issued; name, address, phone and entity details match everywhere", why: "Automated verification compares records across sources. A mismatch can look like a different business.", fix: "Verify that the same legal business information appears across the Secretary of State, Dun & Bradstreet, Experian Business and Equifax Business." },
  { id: "09", section: "business", title: "Website and Email", question: "Does your business have a website and an email like you@yourbusiness.com?", target: "Live business website + email on your own domain", why: "A free email address and no website can read as a side project to a reviewer.", fix: "Register the domain, publish a basic site, and move to an address like you@yourbusiness.com.", helper: "A Gmail or Yahoo address counts as No." },
  { id: "10", section: "business", title: "Business Phone and Address", question: "Does your business have its own phone number and a real business address?", target: "Dedicated business phone number + business address", why: "The phone and address on the application are checked against listings. A cell number and home address can raise flags.", fix: "Get a business line (VoIP works) and use one consistent address everywhere it is listed.", helper: "Not your cell phone and not your home address." },
  { id: "11", section: "business", title: "Clean Business Record", question: "Is your business free of liens, judgments and unpaid business debts?", target: "No negative borrowing history, liens or judgments against the business", why: "An old merchant-cash-advance UCC filing, tax lien or judgment shows up in business bureaus and public records.", fix: "Pull your business credit reports and a UCC search. Resolve or terminate stale items before you apply.", helper: "If you've had a merchant cash advance (MCA), pick Not sure. We'll check it." },
  { id: "12", section: "business", title: "Industry Type", question: "Do you know your business's industry code, and is it one lenders see as low-risk?", target: "Accurate SIC / NAICS code that is not flagged as high-risk", why: "Some industry codes are declined by many lenders regardless of credit, and a wrong code chosen at formation follows you everywhere.", fix: "Verify the code on Secretary of State, IRS, D&B and bank records, and correct it if it is wrong or mismatched.", helper: "Not sure? Pick Not sure. Many owners don't know theirs." },
];

export const PRIORITY_ORDER = ["02", "05", "03", "07", "08", "09", "10", "12", "01", "04", "06", "11"];

export const TRACK_LABEL: Record<Track, string> = {
  funding_ready: "Funding Ready",
  business_setup: "Business Setup First",
  credit_optimization: "Credit Optimization First",
  both: "Credit Optimization + Business Setup",
};

export const TRACK_MESSAGE: Record<Track, string> = {
  funding_ready: "Your self-reported profile meets all 12 benchmarks. The next step is verifying your actual file, reviewing lender-specific requirements, and developing the right application sequence.",
  business_setup: "Your personal side meets the benchmark targets, but your business profile has items to address before applying.",
  credit_optimization: "Your personal profile has benchmarks that need attention or verification. Start by reviewing those items before developing your funding sequence.",
  both: "Your personal profile has benchmarks that need attention or verification. Start by reviewing those items before developing your funding sequence. Your plan includes both Credit Optimization and Business Setup.",
};

export const TRACK_TAG: Record<Track, string[]> = {
  funding_ready: ["Funding Ready"],
  business_setup: ["Business Setup First"],
  credit_optimization: ["Credit Optimization First"],
  both: ["Credit Optimization First", "Both Personal and Business Gaps"],
};
export const ALL_TRACK_TAGS = ["Funding Ready", "Business Setup First", "Credit Optimization First", "Both Personal and Business Gaps"];

export interface ScoreResult {
  personal: number;
  business: number;
  total: number;
  track: Track;
  provisional: boolean;
  failed: string[];
  unverified: string[];
  priorities: string[];
}

export function isCompleteAnswers(a: Record<string, unknown>): a is Record<string, Answer> {
  return BENCHMARKS.every((b) => a[b.id] === "yes" || a[b.id] === "no" || a[b.id] === "unsure");
}

export function scoreAssessment(answers: Record<string, Answer>): ScoreResult {
  const pass = (id: string) => answers[id] === "yes";
  const personal = BENCHMARKS.filter((b) => b.section === "personal" && pass(b.id)).length;
  const business = BENCHMARKS.filter((b) => b.section === "business" && pass(b.id)).length;
  const failed = BENCHMARKS.filter((b) => answers[b.id] === "no").map((b) => b.id);
  const unverified = BENCHMARKS.filter((b) => answers[b.id] === "unsure").map((b) => b.id);
  let track: Track;
  if (personal === 6 && business === 6) track = "funding_ready";
  else if (personal === 6) track = "business_setup";
  else if (business === 6) track = "credit_optimization";
  else track = "both";
  const gaps = new Set([...failed, ...unverified]);
  const priorities = PRIORITY_ORDER.filter((id) => gaps.has(id)).slice(0, 3);
  return { personal, business, total: personal + business, track, provisional: unverified.length > 0, failed, unverified, priorities };
}

export function benchmarkById(id: string): Benchmark {
  return BENCHMARKS.find((b) => b.id === id)!;
}
