import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Gauge, Target, Route as RouteIcon, FileCheck2, User, Building2, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import gene from "@/assets/gene-hero-headshot.jpg";
import guide from "@/assets/fundability-12-benchmarks.pdf.asset.json";
import { DISCLOSURE, captureUtm, track } from "@/lib/fundability";

const Cta = ({ label, place }: { label: string; place: string }) => (
  <div>
    <Button asChild size="lg" className="w-full sm:w-auto min-h-[52px] px-8 text-base font-bold bg-brand text-brand-foreground hover:bg-brand/90">
      <Link to="/fundability/score" onClick={() => track("cta_clicked", { place })}>
        {label} <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
      </Link>
    </Button>
    <p className="mt-3 text-sm opacity-80">No credit check. Nothing is pulled. No cost.</p>
  </div>
);

const ScorePreview = () => (
  <div className="rounded-2xl bg-brand-navy text-brand-foreground p-6 sm:p-8 shadow-2xl" aria-label="Preview of the 12-check scorecard">
    <p className="text-xs font-bold tracking-[0.2em] opacity-75">YOUR FUNDABILITY SCORE</p>
    <p className="mt-2 text-6xl font-extrabold font-heading">-- <span className="text-3xl opacity-70">/12</span></p>
    <div className="mt-6 space-y-3">
      {[["PERSONAL CREDIT", 0], ["BUSINESS STRUCTURE", 6]].map(([label, offset]) => (
        <div key={label as string}>
          <p className="text-[11px] font-semibold tracking-wider opacity-75">{label}</p>
          <div className="mt-1.5 grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md border border-brand-foreground/30 bg-brand-foreground/10 flex items-center justify-center text-xs font-bold opacity-80">
                {String(i + 1 + (offset as number)).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    <p className="mt-5 text-sm opacity-80">Find out which checks pass and which need attention.</p>
  </div>
);

const FundabilityScore = () => {
  useEffect(() => { captureUtm(); track("landing_viewed"); }, []);
  return (
    <>
      <PageMeta
        title="What's Your Fundability Score? | Ryland Partners"
        description="Free 3-minute assessment: measure your personal credit and business profile against the 12 benchmarks we review before application #1. No credit check."
        canonical="/fundability"
      />
      <Navbar />
      <main className="bg-background text-foreground">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-brand">THE FUNDABILITY BLUEPRINT · FREE ASSESSMENT</p>
            <h1 className="mt-4 text-4xl sm:text-6xl font-extrabold font-heading leading-[1.05]">What's Your Fundability Score?</h1>
            <p className="mt-5 text-lg text-foreground/80">Before you apply for business funding, find out how your personal credit and business profile measure against the 12 benchmarks we review before application #1.</p>
            <p className="mt-3 text-base text-muted-foreground">Six checks on you. Six checks on your business. Get your score, identify your gaps, and discover your next step in about three minutes.</p>
            <div className="mt-8"><Cta label="GET MY FREE FUNDABILITY SCORE" place="hero" /></div>
          </div>
          <ScorePreview />
        </section>

        <section className="bg-brand-navy text-brand-foreground py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">Know What the Bank Sees Before You Apply.</h2>
            <div className="mt-8 grid md:grid-cols-3 gap-5">
              {[
                [Gauge, "Your Fundability Score", "Discover how many of the 12 benchmarks your current profile meets."],
                [Target, "Your Biggest Gaps", "Identify which personal-credit or business-structure checks may require attention."],
                [RouteIcon, "Your Next Step", "Find out whether your starting point is Funding Ready, Business Setup, or Credit Optimization."],
              ].map(([Icon, t, d], i) => {
                const I = Icon as typeof Gauge;
                return (
                  <div key={i} className="rounded-xl border border-brand-foreground/15 bg-brand-foreground/5 p-6">
                    <I className="h-7 w-7" aria-hidden="true" />
                    <h3 className="mt-4 text-lg font-bold">{i + 1}. {t as string}</h3>
                    <p className="mt-2 opacity-85">{d as string}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 flex items-center gap-2 opacity-90"><FileCheck2 className="h-5 w-5" aria-hidden="true" /> Receive the complete 12-Benchmark Scorecard and your personalized fix list.</p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading">Your Credit Score Is Only Half the Picture.</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <div className="rounded-xl border p-6"><User className="h-7 w-7 text-brand" aria-hidden="true" /><p className="mt-3 text-xs font-bold tracking-widest text-brand">FILE 1 — YOU</p><h3 className="text-xl font-bold mt-1">Personal Credit</h3><p className="mt-2 text-muted-foreground">Six checks covering your credit scores, payment history, inquiries, account ownership, utilization, and credit age.</p></div>
            <div className="rounded-xl border p-6"><Building2 className="h-7 w-7 text-brand" aria-hidden="true" /><p className="mt-3 text-xs font-bold tracking-widest text-brand">FILE 2 — YOUR BUSINESS</p><h3 className="text-xl font-bold mt-1">Business Structure</h3><p className="mt-2 text-muted-foreground">Six checks covering entity status, business credit records, online presence, business contact information, borrowing history, and industry classification.</p></div>
          </div>
          <p className="mt-6 text-foreground/80">Both sides matter. The Fundability Score shows you where to focus before your next application.</p>
        </section>

        <section className="bg-secondary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-[200px_1fr] gap-8 items-center">
            <img src={gene} alt="Gene Ryland, Founder of Ryland Partners" className="w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover object-top" loading="lazy" />
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading">The Approval Is Won Before the Application.</h2>
              <p className="mt-4 text-foreground/80">At Ryland Partners, we focus on understanding the file before approaching the banks. Our goal is to help business owners identify potential problems, improve their funding readiness, and approach applications with a strategy instead of guessing.</p>
              <p className="mt-4 font-semibold">Gene Ryland <span className="font-normal text-muted-foreground">· Founder, Ryland Partners</span></p>
              <div className="mt-6 flex gap-10">
                <div><p className="text-3xl font-extrabold text-brand">250+</p><p className="text-sm text-muted-foreground">featured client outcomes</p></div>
                <div><p className="text-3xl font-extrabold text-brand">$23M+</p><p className="text-sm text-muted-foreground">in funding represented</p></div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Featured outcomes are individual results, not typical or guaranteed. Funding depends on the applicant's profile and lender approval.</p>
            </div>
          </div>
        </section>

        <section className="bg-brand-navy text-brand-foreground py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">Stop Guessing. Find Out Where You Stand.</h2>
            <p className="mt-4 opacity-85">Answer 12 questions and discover your next step before applying for business funding.</p>
            <div className="mt-8 flex justify-center"><Cta label="GET MY FUNDABILITY SCORE — FREE" place="final" /></div>
            <p className="mt-8 text-sm">
              Prefer the printable checklist?{" "}
              <a href={guide.url} download="Ryland_Partners_12_Fundability_Benchmarks.pdf" className="underline font-semibold inline-flex items-center gap-1" onClick={() => track("checklist_downloaded")}>
                <Download className="h-4 w-4" aria-hidden="true" /> Download the 12 Benchmarks PDF
              </a>{" "}· <Link to="/fundability/benchmarks" className="underline">Read the benchmarks</Link>
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-xs text-muted-foreground">{DISCLOSURE} This is a self-reported assessment, not a credit report, credit pull, or lending decision.</p>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default FundabilityScore;
