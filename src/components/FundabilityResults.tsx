import { useState } from "react";
import { ChevronDown, Download, RotateCcw, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BENCHMARKS, benchmarkById, track, type Answer, type ScoreResult } from "@/lib/fundability";
import { RESULT_HEADLINE, resultBand, resultPlan } from "@/lib/fundabilityResults";

const statusOf = (answer: Answer) => answer === "yes"
  ? { label: "Pass", cls: "bg-status-pass", Icon: CheckCircle2 }
  : answer === "no" ? { label: "Fix", cls: "bg-status-fail", Icon: XCircle }
  : { label: "Not sure", cls: "bg-status-unverified", Icon: HelpCircle };

const CTA_DISCLOSURE = "Terms apply. We provide financial education; specific funding amounts are not guaranteed.";

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
      {result.priorities.length ? <ol className="mt-4 space-y-3">{result.priorities.map((id, i) => { const b = benchmarkById(id); return <li key={id} className="rounded-lg border p-4 flex items-start gap-4">
        <span className="text-2xl font-bold text-brand shrink-0">{i + 1}</span><div><h3 className="font-bold">{b.title}{answers[id] === "unsure" && <span className="block mt-1 text-xs text-muted-foreground">Verify together during your review</span>}</h3><p className="mt-1 text-sm text-muted-foreground">{b.fix}</p></div>
      </li>; })}</ol> : <p className="mt-3 text-muted-foreground">All 12 self-reported benchmarks pass. Let's verify your actual credit and business files, review lender-specific requirements, and map your next steps.</p>}
    </section>

    <section className="mt-8 border-y border-brand py-7">
      <h2 className="text-2xl font-bold font-heading">Let's review your results together.</h2>
      <p className="mt-3 text-muted-foreground">Book a funding assessment review. A funding manager will read your real file with you, help you understand the benchmarks you aren't meeting, and build a plan for what to address first.</p>
      {bookingButton}
      <p className="mt-3 text-sm text-center text-muted-foreground">Free review · no pressure</p>
      <p className="mt-3 text-xs text-muted-foreground">{CTA_DISCLOSURE}</p>
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