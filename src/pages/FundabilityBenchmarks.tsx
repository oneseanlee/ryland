import { Link } from "react-router-dom";
import { Download, CheckCircle2, User, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import guide from "@/assets/fundability-benchmarks.pdf.asset.json";

const BENCHMARKS = [
  { n: 1, group: "Personal", title: "Score: All Three Bureaus", target: "700+ on Equifax, Experian, and TransUnion", why: "You don't choose which bureau a lender pulls — every bureau has to be strong." },
  { n: 2, group: "Personal", title: "Utilization", target: "Under 18% overall — under 10% is where the big limits are", why: "Maxed cards signal risk. Low usage signals control." },
  { n: 3, group: "Personal", title: "Derogatories", target: "Zero negative items reporting", why: "Automated underwriting screens for lates, collections, charge-offs, repos, and bankruptcies first." },
  { n: 4, group: "Personal", title: "Inquiries", target: "Fewer than 2 hard inquiries per bureau in the last 24 months", why: "Too many recent applications look like credit-seeking behavior." },
  { n: 5, group: "Personal", title: "High-Limit Revolving Account", target: "At least one open card with a $10,000+ limit", why: "Lenders look for proof another lender already trusted you with real money." },
  { n: 6, group: "Business", title: "Real Entity, Real Address", target: "A registered entity in good standing that looks like a business", why: "Professional address, phone, domain email, and website all matter." },
  { n: 7, group: "Business", title: "Industry Code", target: "An accurate, lower-risk NAICS/SIC classification", why: "Lenders assign risk by industry — some codes are auto-declines." },
  { n: 8, group: "Business", title: "Record Alignment", target: "Identical business information everywhere a lender looks", why: "Name, address, phone, and EIN are cross-checked across state, IRS, bank, and bureaus." },
  { n: 9, group: "Business", title: "Business Credit File", target: "An established business credit file reporting under your EIN", why: "Your business can build its own history, separate from you." },
];

const RESULTS = [
  { when: "Box 3 is unchecked", means: "Damaged file. Negatives come first — don't apply until they're addressed." },
  { when: "Box 3 checked, but any of 1, 2, 4, or 5 are not", means: "Thin or unoptimized file. Your history is clean — the profile needs to be built and tuned." },
  { when: "Boxes 1–5 checked, but any of 6–9 are not", means: "Funding-ready personal file. The business side needs structure before you apply." },
  { when: "All nine boxes are checked", means: "You're ready for the Banking Sequence — the order you apply in decides how much you walk away with." },
];

const DownloadButton = () => (
  <Button asChild size="lg" className="min-h-[44px]">
    <a href={guide.url} download="The_9_Fundability_Benchmarks_Ryland_Partners.pdf" target="_blank" rel="noopener noreferrer">
      <Download className="mr-2 h-5 w-5" aria-hidden="true" /> Download the Free Guide (PDF)
    </a>
  </Button>
);

const FundabilityBenchmarks = () => (
  <>
    <PageMeta
      title="The 9 Fundability Benchmarks | Ryland Partners"
      description="The checklist lenders use to score business credit applications. Learn the 9 fundability benchmarks and download the free guide."
      canonical="/fundability"
    />
    <Navbar />
    <main className="min-h-screen bg-background pt-28 pb-20">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase">A Fundability Blueprint Guide</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-foreground">The 9 Fundability Benchmarks</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          The checklist lenders score you on for 0% interest business funding — and never show you. Hit every box before you apply.
        </p>
        <div className="mt-8"><DownloadButton /></div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16" aria-labelledby="bench-heading">
        <h2 id="bench-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Your Fundability Scorecard</h2>
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
              </article>
            );
          })}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-16" aria-labelledby="result-heading">
        <h2 id="result-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Reading Your Result</h2>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {RESULTS.map((r) => (
            <div key={r.when} className="grid sm:grid-cols-2 gap-2 p-5">
              <p className="font-semibold text-foreground">{r.when}</p>
              <p className="text-muted-foreground">{r.means}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-16 text-center rounded-2xl bg-secondary p-10">
        <h2 className="text-2xl font-bold text-foreground">Get the full 26-page guide</h2>
        <p className="mt-3 text-muted-foreground">Case files, the seven costly mistakes, and the Banking Sequence strategy — plus a printable scorecard.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <DownloadButton />
          <Button asChild size="lg" variant="outline" className="min-h-[44px]"><Link to="/consultation">Get Your File Scored</Link></Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Terms apply. We provide financial education; specific funding amounts are not guaranteed. Not legal, tax, or investment advice.</p>
      </section>
    </main>
    <Footer />
  </>
);

export default FundabilityBenchmarks;
