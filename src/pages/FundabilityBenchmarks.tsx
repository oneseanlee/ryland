import { Link } from "react-router-dom";
import { Download, CheckCircle2, User, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import guide from "@/assets/fundability-12-benchmarks.pdf.asset.json";

const BENCHMARKS = [
  { n: 1, group: "Personal", title: "Credit Scores", target: "700+ on all three bureaus", why: "Banks pull different bureaus. Know your lowest score, not just your best one.", fix: "Pull Equifax, Experian, and TransUnion reports before you apply." },
  { n: 2, group: "Personal", title: "Clean Payment History", target: "No lates, collections, charge-offs, repos or bankruptcies on any bureau", why: "A derogatory can lead to a decline in the 0% business-credit lane, even when the rest of the file looks strong.", fix: "Dispute inaccurate items and address valid negatives before application #1. If this check is unmet, start with Credit Optimization." },
  { n: 3, group: "Personal", title: "Inquiries", target: "2 or fewer hard inquiries per bureau, per year, over the last 24 months", why: "Repeated applications remain on your reports and can signal credit-seeking behavior.", fix: "Stop applying until your file is ready. Know which bureau each bank pulls before planning your sequence." },
  { n: 4, group: "Personal", title: "Account Mix & Ownership", target: "4+ open accounts, revolving + installment, opened by you", why: "Underwriters look for depth in your own accounts and may discount authorized-user or purchased tradelines.", fix: "Build real primary accounts. Authorized-user accounts may help the score, but do not count toward this depth target." },
  { n: 5, group: "Personal", title: "Utilization", target: "Every personal card below 28% of its limit — each card, not just overall", why: "One heavily used card can signal risk even when overall utilization looks low.", fix: "Pay each card down before its statement date and review every individual balance-to-limit ratio." },
  { n: 6, group: "Personal", title: "Credit Age", target: "Average age of accounts 2+ years on every bureau", why: "New accounts are untested, and opening several at once lowers your average account age.", fix: "Keep old accounts open. Avoid opening new personal accounts in the run-up to funding." },
  { n: 7, group: "Business", title: "Entity in Good Standing", target: "LLC active with the Secretary of State · 2+ months old (2+ years is ideal)", why: "The bank verifies your entity status. An inactive entity or lapsed annual report can stop an application.", fix: "Check your Secretary of State record and file anything overdue." },
  { n: 8, group: "Business", title: "Business Credit Profile & Data Match", target: "DUNS issued · name, address, phone and entity details match everywhere", why: "Automated verification compares records across sources. A mismatch can make your business difficult to verify.", fix: "Use one legal name, address and phone number across the Secretary of State, Dun & Bradstreet, Experian Business and Equifax Business. Every item must match." },
  { n: 9, group: "Business", title: "Online Presence", target: "Live business website + email on your own domain", why: "A business website and domain email help establish a professional, verifiable presence.", fix: "Register your domain, publish a business website and use an address such as you@yourbusiness.com." },
  { n: 10, group: "Business", title: "Business Contact Footprint", target: "Dedicated business phone number + business address", why: "Application details are checked against listings. A personal cell number or home address can raise verification concerns.", fix: "Get a business line (VoIP works) and use one consistent business address wherever it is listed." },
  { n: 11, group: "Business", title: "Clean Business Record", target: "No negative borrowing history, liens or judgments against the business", why: "Old merchant cash advance UCC filings, tax liens and judgments can appear in business reports and public records.", fix: "Pull business credit reports and run a UCC search. Resolve or terminate stale items before you apply." },
  { n: 12, group: "Business", title: "Industry Classification", target: "Accurate SIC / NAICS code that is not flagged as high-risk", why: "Some industry classifications face lender restrictions, and an incorrect formation code can carry across records.", fix: "Verify your code across Secretary of State, IRS, D&B and bank records. Correct any inaccurate or mismatched classification." },
];

const RESULTS = [
  { when: "12 / 12 — Funding Ready", means: "Your file is positioned. Next comes bank matching and the application sequence — not just applying. Lender requirements vary; meeting the benchmarks does not guarantee approval." },
  { when: "6 / 6 personal, short on business — Business Setup first", means: "Focus on Part B: entity status, consistent records and a verifiable business presence before applying." },
  { when: "Short on personal — Credit Optimization first", means: "Fix the personal file, then complete Part B, then apply. Applying prematurely uses inquiries you may need later." },
];

const DownloadButton = () => (
  <Button asChild size="lg" className="min-h-[44px]">
    <a href={guide.url} download="Ryland_Partners_12_Fundability_Benchmarks.pdf" target="_blank" rel="noopener noreferrer">
      <Download className="mr-2 h-5 w-5" aria-hidden="true" /> Download the Free Guide (PDF)
    </a>
  </Button>
);

const FundabilityBenchmarks = () => (
  <>
    <PageMeta
      title="The 12 Fundability Benchmarks | Ryland Partners"
      description="Review six personal credit checks and six business structure checks, identify your next steps, and download the free 12 Fundability Benchmarks scorecard."
      canonical="/fundability/benchmarks"
    />
    <Navbar />
    <main className="min-h-screen bg-background pt-28 pb-20">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-sm font-semibold text-primary uppercase">The Fundability Scorecard · Free</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-foreground">The 12 Fundability Benchmarks</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Twelve checks our underwriting team reviews — six on you, six on your business — before application #1. Grade your file beyond the credit score and identify what needs attention before you apply.
        </p>
        <div className="mt-8"><DownloadButton /></div>
        <p className="mt-4 text-xs text-muted-foreground">Terms apply. We provide financial education; specific funding amounts are not guaranteed.</p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16" aria-labelledby="bench-heading">
        <h2 id="bench-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Your Fundability Scorecard</h2>
        <p className="mb-6 text-muted-foreground">Part A: Personal Credit (checks 1–6). Part B: Business Structure (checks 7–12). Mark Pass on the printable scorecard only when you fully meet the target; anything unmet belongs on your fix list.</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENCHMARKS.map((b) => {
            const Icon = b.group === "Personal" ? User : Building2;
            return (
              <article key={b.n} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-primary">{b.n}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden="true" /> {b.group === "Personal" ? "Personal Credit" : "Business Structure"}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 flex gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" /> {b.target}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{b.why}</p>
                <p className="mt-3 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Fix it: </span>{b.fix}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-16" aria-labelledby="result-heading">
        <h2 id="result-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Reading Your Result</h2>
        <p className="mb-6 text-muted-foreground">Add your Personal Credit score out of 6 and Business Structure score out of 6 for a total out of 12.</p>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {RESULTS.map((r) => (
            <div key={r.when} className="grid sm:grid-cols-2 gap-2 p-5">
              <p className="font-semibold text-foreground">{r.when}</p>
              <p className="text-muted-foreground">{r.means}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-16" aria-labelledby="fix-heading">
        <h2 id="fix-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Fix in This Order</h2>
        <ol className="list-decimal pl-6 space-y-4 text-muted-foreground">
          <li><span className="font-semibold text-foreground">Check 2: Payment history.</span> Address derogatories first through Credit Optimization.</li>
          <li><span className="font-semibold text-foreground">Checks 5 and 3: Utilization and inquiries.</span> Pay every personal card below 28% and stop applying until the file is ready.</li>
          <li><span className="font-semibold text-foreground">Checks 7, 8, 9, 10 and 12: Business setup.</span> Review entity status, matching records, website, business phone, address and industry classification.</li>
          <li><span className="font-semibold text-foreground">Checks 1, 4, 6 and 11: Time-based or record-based items.</span> Strengthen scores, build primary accounts, let credit age accrue and clear stale business liens or UCC filings.</li>
        </ol>
      </section>

      <section className="mt-16 bg-secondary py-10 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-foreground">Download the Free 4-Page Scorecard</h2>
        <p className="mt-3 text-muted-foreground">All twelve targets, why lenders care, what to fix and a printable Pass / Fix checklist — plus your score and next-step track.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <DownloadButton />
          <Button asChild size="lg" variant="outline" className="min-h-[44px]"><Link to="/consultation">Get Your File Scored</Link></Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Terms apply. We provide financial education; specific funding amounts are not guaranteed. Not legal, tax, or investment advice.</p>
        </div>
      </section>
    </main>
    <Footer />
  </>
);

export default FundabilityBenchmarks;
