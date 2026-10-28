import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Gauge, FileText, Eye, AlertTriangle, ListChecks, CircleCheck, TrendingUp, Lock, Download } from "lucide-react";
import logo from "@/assets/logo-dark.png";

import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import gene from "@/assets/gene-ryland-fundability-clean.png.asset.json";
import guide from "@/assets/fundability-12-benchmarks.pdf.asset.json";
import { CLIENT_WINS } from "@/data/clientWins";
import { BENCHMARKS, DISCLOSURE, captureUtm, track, type Answer } from "@/lib/fundability";

const STORE = "fundability_progress_v1";
const accent = "text-fs-gold";

const Cta = ({ label = "Get my Fundability Score", place, className = "" }: { label?: string; place: string; className?: string }) => (
  <Button asChild size="lg" className={`min-h-[52px] px-8 text-base font-bold bg-fs-gold text-fs-navy hover:bg-fs-gold/90 ${className}`}>
    <Link to="/fundability/score" onClick={() => track("cta_clicked", { place })}>
      {label} <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
    </Link>
  </Button>
);

const FirstQuestion = () => {
  const nav = useNavigate();
  const q = BENCHMARKS[0];
  const answer = (v: Answer) => {
    track("question_answered", { question: q.id, answer: v, place: "landing" });
    localStorage.setItem(STORE, JSON.stringify({ answers: { [q.id]: v }, step: 1, stage: "quiz", startedAt: new Date().toISOString() }));
    nav("/fundability/score");
  };
  return (
    <div className="rounded-2xl bg-background text-foreground p-6 sm:p-7 shadow-2xl">
      <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground border-b pb-2">FUNDING FILE</p>
      <p className="mt-3 text-sm text-muted-foreground">Check 1 of 12</p>
      <h2 className="mt-1 text-xl sm:text-2xl font-bold font-heading leading-snug">{q.question}</h2>
      {q.helper && <p className="mt-2 text-sm text-muted-foreground">{q.helper}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="outline" className="min-h-[48px] text-base font-semibold" onClick={() => answer("yes")}>Yes</Button>
        <Button variant="outline" className="min-h-[48px] text-base font-semibold" onClick={() => answer("no")}>No</Button>
        <Button variant="outline" className="col-span-2 min-h-[48px] text-base font-semibold" onClick={() => answer("unsure")}>Not sure</Button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Tap an answer to start. 11 more after this. Nothing is pulled, and we don't ask for contact details until you finish.</p>
    </div>
  );
};

const LEARN = [
  [Gauge, "Why owners with a 720 score still get denied"],
  [FileText, "The one check that can sink an application"],
  [Eye, "Why your credit app score may not be what the bank sees"],
  [AlertTriangle, "How “just trying” another application can hurt you"],
  [ListChecks, "Which of your 12 checks to fix first"],
] as const;

const WALK = [
  [CircleCheck, "Your score out of 12", "Your side and your business side, scored separately."],
  [ListChecks, "Your top 3 fixes, in order", "The ones most likely to get you declined right now."],
  [TrendingUp, "Your funding track", "Whether you're ready to apply now or need to build first."],
  [FileText, "Your 12-Benchmark Scorecard", "The target for every check, yours to keep."],
] as const;

const STORIES = ["win-26", "win-4", "win-80", "win-13", "win-3"].map((id) => CLIENT_WINS.find((w) => w.id === id)!).filter(Boolean);

const FAQ = [
  ["Does this check my credit?", "No. It's 12 yes-or-no questions you answer yourself. Nothing is pulled and nothing touches your credit."],
  ["What if I don't know an answer?", "Pick “Not sure.” We'll mark that check as unverified and show you how to check it."],
  ["What's the catch?", "There isn't one. You get your score and scorecard free. If you want help, you can book a free Funding Review — no pressure."],
];

const FundabilityScore = () => {
  useEffect(() => { captureUtm(); track("landing_viewed"); }, []);
  return (
    <>
      <PageMeta
        title="What's Your Fundability Score? | Ryland Partners"
        description="Banks run 12 checks before they fund you. Find out how many you pass in 3 minutes. Free, and nothing touches your credit."
        canonical="/fundability"
      />
      <header className="bg-background border-b"><div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center"><img src={logo} alt="Ryland Partners" className="h-8 w-auto" /></div></header>
      <main className="bg-background text-foreground">
        {/* Hero */}
        <section className="bg-fs-navy text-brand-foreground pt-10 sm:pt-14 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
            <div>
              <p className={`text-sm sm:text-base font-bold tracking-wide ${accent} [text-wrap:balance]`}>BUSINESS OWNERS: CHECK IF YOU QUALIFY BEFORE YOU APPLY</p>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading leading-[1.05]">
                Banks run 12 checks before they fund you. <span className={accent}>How many do you pass?</span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl opacity-90">Find out in 3 minutes. Free, and nothing touches your credit.</p>
              <div className="mt-7"><Cta place="hero" className="w-full sm:w-auto" /></div>
              <p className="mt-3 text-sm opacity-80">12 yes-or-no questions. No credit pull.</p>
            </div>
            <FirstQuestion />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 grid sm:grid-cols-[auto_auto_1fr] gap-6 sm:gap-10 items-center">
            <div><p className="text-3xl font-extrabold font-heading">250+</p><p className="text-xs tracking-wider opacity-80">FEATURED CLIENT OUTCOMES</p></div>
            <div className="sm:border-l sm:pl-10 border-brand-foreground/20"><p className="text-3xl font-extrabold font-heading">$23M+</p><p className="text-xs tracking-wider opacity-80">IN FUNDING REPRESENTED</p></div>
            <p className="sm:border-l sm:pl-10 border-brand-foreground/20 text-xs opacity-80">Individual results, not typical or guaranteed. Funding depends on your profile and lender approval.</p>
          </div>
        </section>

        {/* What you'll find out */}
        <section aria-labelledby="learn-heading" className="max-w-7xl mx-auto px-5 sm:px-6 py-12 sm:py-16 grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:gap-x-16 lg:gap-y-6">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <p className="text-xs font-bold tracking-widest text-fs-navy">YOUR NEXT 3 MINUTES</p>
            <h2 id="learn-heading" className="mt-3 max-w-md text-3xl sm:text-4xl font-bold font-heading leading-tight text-fs-navy [text-wrap:balance]">Know where you stand before you apply.</h2>
            <div className="mt-5 h-1 w-12 bg-fs-gold" aria-hidden="true" />
          </div>
          <ul className="divide-y divide-fs-navy/10 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            {LEARN.map(([I, t]) => (
              <li key={t} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 lg:first:pt-4 lg:last:pb-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fs-navy">
                  <I className="h-5 w-5 text-fs-gold" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <p className="text-base font-medium leading-relaxed text-fs-navy">{t}</p>
              </li>
            ))}
          </ul>
          <div className="text-center lg:col-start-1 lg:row-start-2 lg:self-start lg:text-left">
            <Cta place="learn" className="w-full sm:w-auto px-5" />
            <p className="mt-3 text-sm text-muted-foreground">Free. About 3 minutes. Nothing is pulled.</p>
          </div>
        </section>

        {/* Walk away with */}
        <section className="bg-fs-navy text-brand-foreground py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading">Here's what you'll walk away with.</h2>
              <ul className="mt-8 space-y-6">
                {WALK.map(([I, t, d]) => (
                  <li key={t} className="flex gap-4">
                    <I className={`h-7 w-7 shrink-0 ${accent}`} aria-hidden="true" />
                    <div><p className="text-lg font-bold">{t}</p><p className="opacity-85">{d}</p></div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-background text-foreground p-6 shadow-2xl text-center" aria-label="Preview of your results">
              <p className="text-xs font-bold tracking-[0.2em] text-fs-gold">YOUR FUNDABILITY SCORE</p>
              <svg viewBox="0 0 120 66" className="mx-auto mt-3 w-40" aria-hidden="true">
                <path d="M10 60 A50 50 0 0 1 110 60" fill="none" className="stroke-muted" strokeWidth="10" strokeLinecap="round" />
                <path d="M10 60 A50 50 0 0 1 85 17" fill="none" className="stroke-brand" strokeWidth="10" strokeLinecap="round" />
                <text x="60" y="58" textAnchor="middle" className="fill-foreground font-bold" fontSize="20">7/12</text>
              </svg>
              <p className="mt-2 text-sm font-semibold">Close. Fix these before you apply.</p>
              <div className="mt-4 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground"><Lock className="h-4 w-4" aria-hidden="true" /> Unlocks with your score</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Gene story */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid md:grid-cols-[260px_1fr] gap-8 items-center">
          <img src={gene.url} alt="Gene Ryland, Founder of Ryland Partners" className="w-full max-w-[260px] aspect-[4/5] rounded-2xl object-cover object-top mx-auto" loading="lazy" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading">I got denied again and again before I finally figured this out.</h2>
            <div className="mt-5 space-y-5 text-foreground/80 leading-relaxed">
              <p>I needed money for my business, so I walked into the big banks and applied. Denial after denial.</p>
              <p>I didn't have huge revenue yet. I didn't qualify for traditional business loans, and I had zero strategy. I was just applying blind and hoping for the best.</p>
              <p>Then it hit me: the banks weren't rejecting me. They were rejecting my file.</p>
              <p>My profile had red flags I didn't even know existed. Once I learned the rules, fixed my file, and applied the right way, everything changed. Same guy. Same business. But this time, approved.</p>
              <p>Today, my business holds over $800,000 in credit limits. This 3-minute quiz runs the exact checks I wish I had before my first application.</p>
            </div>

            <div className="mt-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="font-bold">Gene Ryland</p><p className="text-sm text-muted-foreground">Founder</p></div>
              <Cta label="Score my file now" place="story" className="w-full sm:w-auto" />
            </div>

          </div>
        </section>

        {/* Stories + FAQ */}
        <section className="bg-secondary py-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-center">Same story. Different files.</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-5">
              {STORIES.map((w) => (
                <div key={w.id} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] rounded-xl bg-background p-5 shadow-sm flex gap-4 items-center">
                  <img src={w.portrait} alt={w.name} className="w-16 h-16 rounded-full object-cover object-top" loading="lazy" />
                  <div className="min-w-0">
                    <p className="font-bold">{w.name}</p>
                    <p className="text-sm text-muted-foreground">{w.scoreFrom ? `Score ${w.scoreFrom} → ${w.scoreTo}` : w.industry}</p>
                    <p className="mt-1 text-2xl font-extrabold font-heading">${w.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      via{" "}
                      {w.banks.split(" + ").map((bank, i) => (
                        <span key={bank}>{i > 0 && " + "}<span className="whitespace-nowrap">{bank}</span></span>
                      ))}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-muted-foreground text-center">Individual results, shared with permission. Not typical and not guaranteed. Funding depends on your credit profile and lender approval.</p>

            <h2 className="mt-14 text-2xl sm:text-3xl font-bold font-heading text-center">Common questions.</h2>
            <Accordion type="single" collapsible className="mt-6 space-y-2">
              {FAQ.map(([q, a]) => (
                <AccordionItem key={q} value={q} className="rounded-lg border bg-background px-4">
                  <AccordionTrigger className="font-semibold text-left min-h-[44px]">{q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Two ways */}
        <section className="bg-fs-navy text-brand-foreground py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">You've got two ways to do this.</h2>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-brand-foreground/10 p-5"><p className="font-bold">Apply and hope.</p><p className="mt-1 text-sm opacity-80">Find out what's wrong from the denial letter, with one more inquiry on your report.</p></div>
              <div className="rounded-xl border-2 border-fs-gold p-5 bg-fs-gold/10"><p className={`font-bold ${accent}`}>Take 3 minutes and know.</p><p className="mt-1 text-sm opacity-90">See what the bank sees, fix what needs fixing, then apply.</p></div>
            </div>
            <div className="mt-8"><Cta place="final" className="w-full sm:w-auto sm:px-16" /></div>
            <div className="mt-6 text-sm flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
              <a href={guide.url} download="Ryland_Partners_12_Fundability_Benchmarks.pdf" className="underline inline-flex items-center gap-1 min-h-[44px] whitespace-nowrap" onClick={() => track("checklist_downloaded")}>
                <Download className="h-4 w-4" aria-hidden="true" /> Download the 12 Benchmarks PDF
              </a>
              <span className="hidden sm:inline text-muted-foreground">·</span>
              <Link to="/fundability/benchmarks" className="underline inline-flex items-center min-h-[44px] whitespace-nowrap">Read the benchmarks</Link>
            </div>

          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-xs text-muted-foreground">{DISCLOSURE} This is a self-reported assessment, not a credit report, credit pull, or lending decision.</p>
        </section>
      </main>
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 flex flex-wrap items-center justify-between gap-4"><img src={logo} alt="Ryland Partners" className="h-7 w-auto" /><p className="text-xs text-muted-foreground">Not a lender. We do not make credit decisions.</p></footer>
      <Link to="/fundability/score" onClick={() => track("cta_clicked", { place: "sticky" })} className="fixed bottom-0 inset-x-0 z-40 bg-fs-gold text-fs-navy font-bold text-center py-4 min-h-[52px] flex items-center justify-center gap-2">Get my Fundability Score <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
    </>
  );
};

export default FundabilityScore;
