import { useState } from "react";
import { ChevronDown, Download, RotateCcw, CheckCircle2, XCircle, HelpCircle, SearchCheck, ListChecks, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BENCHMARKS, benchmarkById, track, type Answer, type ScoreResult } from "@/lib/fundability";
import { RESULT_HEADLINE, resultBand, resultPlan } from "@/lib/fundabilityResults";

const statusOf = (answer: Answer) => answer === "yes"
  ? { label: "Pass", cls: "bg-status-pass", Icon: CheckCircle2 }
  : answer === "no" ? { label: "Fix", cls: "bg-status-fail", Icon: XCircle }
  : { label: "Not sure", cls: "bg-status-unverified", Icon: HelpCircle };

const CTA_DISCLOSURE = "Terms apply. We provide financial education; specific funding amounts are not guaranteed.";

const PRIORITY_COPY: Record<string, { title: string; impact: string }> = {
  "01": { title: "Your credit score is too low", impact: "At least one score is below the 700 benchmark. That can limit your options even when another bureau shows a stronger score." },
  "02": { title: "Negative items need attention", impact: "Late payments, collections or other negative history can be a serious obstacle to approval. We need to understand what's on your reports before you apply." },
  "03": { title: "You have too many credit inquiries", impact: "Repeated applications can make your file look riskier. Applying again without a plan can add to the problem." },
  "04": { title: "Your credit profile needs more depth", impact: "Your answers indicate fewer than four open primary accounts. A strong score alone may not demonstrate the credit history a lender wants to see." },
  "05": { title: "Your credit card utilization is too high", impact: "At least one card is at or above the 28% benchmark. High balances can weigh on your scores and make lenders hesitate—even if your total utilization looks better." },
  "06": { title: "Your credit history needs more time", impact: "Your average account age is below the two-year benchmark. Newer accounts can make a lender view your profile as less established." },
  "07": { title: "Your business isn't set up correctly yet", impact: "Your entity's active status or age doesn't meet the benchmark. These basics can stop a funding application before your credit is even reviewed." },
  "08": { title: "Your business credit file isn't ready", impact: "A missing D-U-N-S number or inconsistent business details can make it harder for a lender to verify your business." },
  "09": { title: "Your online presence isn't funding-ready", impact: "A missing website or business-domain email can undermine your business's credibility. Lenders need to be able to verify a consistent, established presence." },
  "10": { title: "Your business contact setup needs work", impact: "Your phone or address doesn't meet the benchmark. Inconsistent or personal contact details can raise questions during business verification." },
  "11": { title: "Your business negatives need attention", impact: "Liens, judgments or unpaid business debts can create serious barriers. Review the records and understand what needs resolution before applying." },
  "12": { title: "Your industry classification needs review", impact: "An inaccurate or higher-risk industry code can restrict your lender options. We need to verify your classification before building an application plan." },
};

export default function FundabilityResults({ answers, result, firstName, crm, bookUrl, restart }: {
  answers: Record<string, Answer>; result: ScoreResult; firstName: string; crm?: string; bookUrl: string; restart: () => void;
}) {
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [openTile, setOpenTile] = useState<string | null>(null);
  const bookingButton = (
    <Button asChild size="lg" className="shiny-cta mt-5 w-full h-auto min-h-[52px] px-4 py-3 whitespace-normal text-base font-bold bg-brand text-brand-foreground hover:bg-brand/90">
      <a href={bookUrl} onClick={() => track("funding_review_clicked", { track: result.track, score: result.total })}>Book my funding assessment review</a>
    </Button>
  );

  return <>
    <section className="bg-brand-navy text-brand-foreground p-6 sm:p-10">
      <p className="text-xs font-bold">YOUR FUNDABILITY SCORE</p>
      <p className="mt-3 text-6xl sm:text-7xl font-extrabold font-heading" aria-label={`${result.total} out of 12`}>{result.total} <span className="text-3xl opacity-70">/ 12</span></p>
      <h1 className="mt-4 text-3xl sm:text-4xl font-bold font-heading leading-tight">{RESULT_HEADLINE[resultBand(result.total)]}</h1>
      <p className="mt-3 text-base opacity-90">{resultPlan(result)}</p>
      {result.provisional && <p className="mt-4 text-sm">{result.unverified.length} answer{result.unverified.length === 1 ? " was" : "s were"} “Not sure”. Your score is provisional.</p>}
      <div className="mt-7 space-y-5">
        {([['YOU', result.personal, 0], ['YOUR BUSINESS', result.business, 6]] as const).map(([label, n, off]) => <div key={label}>
          <div className="flex justify-between text-sm font-semibold"><span>{label}</span><span>{n} / 6</span></div>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {BENCHMARKS.slice(off, off + 6).map((b) => <span key={b.id} role="img" aria-label={`${b.title}: ${statusOf(answers[b.id]).label}`} className={`h-3 rounded-full ${statusOf(answers[b.id]).cls}`} />)}
          </div>
        </div>)}
      </div>
      <div className="mt-5 flex flex-wrap gap-4 text-xs">{(['yes', 'no', 'unsure'] as const).map((a) => { const s = statusOf(a); return <span key={a} className="inline-flex items-center gap-1.5"><s.Icon className="h-4 w-4" aria-hidden="true" />{s.label}</span>; })}</div>
    </section>

    <p className="mt-4 text-sm text-muted-foreground" role="status">{crm === "synced" ? `Thanks, ${firstName}. Your results are saved and our team has your scorecard.` : crm === "failed" ? "Your results are available here, but we couldn't send them to our team just now. Download your scorecard and bring it to your review." : "Your results are based on your answers. We'll verify the details together during your review."}</p>

    <section className="mt-8">
      <h2 className="text-sm font-bold text-brand">{result.priorities.length ? "START WITH THESE PRIORITIES" : "YOUR NEXT STEP"}</h2>
      {result.priorities.length ? <>
        <p className="mt-2 text-2xl font-bold font-heading">These gaps matter. Let's address them.</p>
        <p className="mt-2 text-sm text-muted-foreground">Based on your answers, these are the first items to review before another funding application.</p>
        <ol className="mt-4 space-y-3">{result.priorities.map((id, i) => {
          const b = benchmarkById(id); const copy = PRIORITY_COPY[id]; const unverified = answers[id] === "unsure";
          return <li key={id} className="rounded-lg border border-l-4 border-l-brand p-5 flex items-start gap-4">
            <span className="text-2xl font-bold text-brand shrink-0">{i + 1}</span>
            <div className="min-w-0"><p className="text-xs font-semibold text-brand mb-1">{unverified ? "NEEDS VERIFICATION" : "NEEDS ATTENTION"}</p>
              <h3 className="font-bold text-lg leading-snug">{unverified ? `${b.title}: you need to know where you stand` : copy?.title ?? b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{unverified ? "This isn't a confirmed problem yet. Not knowing whether you meet this benchmark leaves a gap in your funding plan. We'll help you verify it during your review." : copy?.impact ?? b.why}</p>
              <p className="mt-3 text-sm font-semibold">{unverified ? "Get clarity before you apply." : "It's a gap to address—not a reason to give up."}</p>
            </div>
          </li>;
        })}</ol>
      </> : <p className="mt-3 text-muted-foreground">All 12 self-reported benchmarks pass. Let's verify your actual credit and business files, review lender-specific requirements, and map your next steps.</p>}
    </section>

    <section className="mt-8 bg-brand-navy text-brand-foreground p-6 sm:p-9">
      <p className="text-xs font-bold">YOUR FREE FUNDING ASSESSMENT REVIEW</p>
      <h2 className="mt-3 text-3xl sm:text-4xl leading-tight font-bold font-heading">{result.priorities.length ? "The gaps are real. So is a path forward." : "A strong score is the start. Let's verify your next move."}</h2>
      <p className="mt-4 leading-relaxed">{result.priorities.length ? "Don't keep applying without understanding what's holding you back. Your answers point to issues that may limit approval—but many can be addressed with the right plan." : "Before you apply, let's confirm your actual credit and business files meet the benchmarks and understand the lender-specific requirements."}</p>
      <p className="mt-4 leading-relaxed">You don't have to figure out the next steps alone. In your free review, a Ryland funding manager will:</p>
      <div className="mt-6 divide-y divide-brand-foreground/20 border-y border-brand-foreground/20">
        {[
          { Icon: SearchCheck, title: "Read your real file with you", text: "Go beyond the quiz and understand your credit and business profile." },
          { Icon: ListChecks, title: "Identify what needs attention", text: "Separate confirmed gaps from items we still need to verify." },
          { Icon: Compass, title: "Map a plan to address the gaps", text: "Set priorities and explain how our credit optimization and business education services may help." },
        ].map(({ Icon, title, text }) => <div key={title} className="flex items-start gap-4 py-5"><Icon className="h-6 w-6 shrink-0 mt-0.5" aria-hidden="true" /><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-relaxed">{text}</p></div></div>)}
      </div>
      <div className="mt-2">{bookingButton}</div>
      <p className="mt-4 text-sm text-center">Free review · clear next steps · no pressure</p>
      <p className="mt-4 text-xs leading-relaxed">{CTA_DISCLOSURE}</p>
    </section>

    <Button variant="ghost" className="mt-4 w-full min-h-[52px] h-auto whitespace-normal" aria-expanded={showBenchmarks} aria-controls="results-benchmarks" onClick={() => setShowBenchmarks(!showBenchmarks)}>
      {showBenchmarks ? "Hide all 12 benchmarks" : "See all 12 benchmarks"}<ChevronDown className={`h-4 w-4 ${showBenchmarks ? "rotate-180" : ""}`} aria-hidden="true" />
    </Button>
    {showBenchmarks && <section id="results-benchmarks" className="mt-6">
      <p className="text-xs font-bold text-brand">YOUR 12 BENCHMARKS</p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-heading">What banks check, and where you stand</h2>
      <p className="mt-4 text-sm text-muted-foreground">Fix · {result.failed.length} &nbsp; Not sure · {result.unverified.length} &nbsp; Pass · {result.total}</p>
      {(['personal', 'business'] as const).map((section) => <div key={section} className="mt-6">
        <h3 className="flex justify-between font-bold text-lg"><span>{section === 'personal' ? 'You' : 'Your business'}</span><span className="text-muted-foreground">{section === 'personal' ? result.personal : result.business} of 6</span></h3>
        <div className="mt-3 divide-y border-y">{BENCHMARKS.filter((b) => b.section === section).map((b) => {
          const s = statusOf(answers[b.id]); const open = openTile === b.id;
          return <div key={b.id}>
            <Button variant="ghost" className="w-full h-auto min-h-[64px] rounded-none px-0 py-4 flex items-center gap-2 whitespace-normal text-left" aria-expanded={open} aria-controls={`benchmark-${b.id}`} onClick={() => setOpenTile(open ? null : b.id)}>
              <span className="flex-1 font-semibold">{b.title}</span><s.Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="text-xs shrink-0">{s.label}</span><ChevronDown className={`h-4 w-4 shrink-0 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </Button>
            {open && <div id={`benchmark-${b.id}`} className="pb-5 text-sm space-y-4">
              <div className="grid grid-cols-2 gap-4"><div><p className="text-xs font-bold text-muted-foreground">YOUR ANSWER</p><p className="mt-1 font-semibold">{answers[b.id] === 'yes' ? 'Yes' : answers[b.id] === 'no' ? 'No' : 'Not sure'}</p></div><div><p className="text-xs font-bold text-muted-foreground">GOAL</p><p className="mt-1">{b.target}</p></div></div>
              <div><p className="text-xs font-bold text-muted-foreground">WHY IT MATTERS</p><p className="mt-1">{b.why}</p></div>
              <div><p className="text-xs font-bold text-muted-foreground">HOW TO ADDRESS IT</p><p className="mt-1">{b.fix}</p></div>
            </div>}
          </div>;
        })}</div>
      </div>)}
      <p className="mt-4 text-sm text-muted-foreground">“Not sure” counts as not passed. We'll help you verify those items during your funding assessment review.</p>
    </section>}

    <section className="mt-10 border-t pt-8">
      <h2 className="text-2xl sm:text-3xl font-bold font-heading">Let's read your real file together.</h2>
      <p className="mt-3 text-muted-foreground">Your quiz shows where to look. Your review helps us understand the gaps and create a plan to address them, in the right order.</p>
      <ol className="mt-6 space-y-5">
        {[['Book a time', 'Choose an available appointment for your funding assessment review.'], ['Read and analyze together', 'Bring your scorecard. A funding manager will walk through your credit and business profile with you.'], ['Build your action plan', 'Identify which benchmarks need attention and agree on the steps to address them before applying.']].map(([title, body], i) => <li key={title} className="flex gap-4"><span className="text-xl text-brand font-bold">{i + 1}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{body}</p></div></li>)}
      </ol>
      {bookingButton}
      <p className="mt-3 text-xs text-muted-foreground">{CTA_DISCLOSURE}</p>
      <Button variant="link" className="mt-4 w-full h-auto min-h-[48px] whitespace-normal" onClick={async () => { const { downloadScorecard } = await import("@/lib/fundabilityReport"); await downloadScorecard(firstName || "You", answers, result); track("report_downloaded"); }}><Download className="h-4 w-4" aria-hidden="true" />Download my scorecard</Button>
    </section>
    <Button variant="ghost" onClick={restart} className="mt-6 min-h-[44px] text-sm text-muted-foreground"><RotateCcw className="h-4 w-4" aria-hidden="true" />Retake the assessment</Button>
  </>;
}