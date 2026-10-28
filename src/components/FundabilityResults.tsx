import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, RotateCcw, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BENCHMARKS, benchmarkById, track, type Answer, type ScoreResult } from "@/lib/fundability";
import { ATTENTION_COPY, RESULT_HEADLINE, attentionItems, resultBand, resultPlan } from "@/lib/fundabilityResults";

const statusOf = (answer: Answer) => answer === "yes"
  ? { label: "You passed", cls: "bg-status-pass", pill: "bg-status-pass/15", Icon: CheckCircle2 }
  : answer === "no" ? { label: "Fix", cls: "bg-status-fail", pill: "bg-status-fail/15", Icon: XCircle }
  : { label: "Not sure", cls: "bg-status-unverified", pill: "bg-status-unverified/20", Icon: HelpCircle };

const CTA_DISCLOSURE = "Terms apply. We provide financial education; specific funding amounts are not guaranteed.";

export default function FundabilityResults({ answers, result, firstName, crm, bookUrl, restart }: {
  answers: Record<string, Answer>; result: ScoreResult; firstName: string; crm?: string; bookUrl: string; restart: () => void;
}) {
  const [filter, setFilter] = useState<Answer | null>(null);
  const attention = attentionItems(answers);
  const firstCtaRef = useRef<HTMLDivElement>(null);
  const finalCtaRef = useRef<HTMLElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const update = () => {
      const first = firstCtaRef.current; if (!first) return;
      const above = first.getBoundingClientRect().bottom < 0;
      const last = finalCtaRef.current;
      const lr = last ? last.getBoundingClientRect() : null;
      const finalVisible = !!lr && lr.bottom > 0 && lr.top < window.innerHeight * 0.75;
      setShowSticky(above && !finalVisible);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  const [openTile, setOpenTile] = useState<string | null>(null);
  const bookingButton = (
    <Button asChild size="lg" className="shiny-cta mt-5 w-full h-auto min-h-[52px] !px-4 sm:!px-10 !py-3.5 !text-base sm:!text-lg text-center whitespace-normal [text-wrap:balance] font-bold bg-brand text-brand-foreground hover:bg-brand/90">
      <a href={bookUrl} onClick={() => track("funding_review_clicked", { track: result.track, score: result.total })}>Book my free Funding Review</a>
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
      <h2 className="text-sm font-bold text-brand">{attention.length ? "THESE THINGS NEED YOUR ATTENTION" : "YOUR NEXT STEP"}</h2>
      {attention.length ? <ol className="mt-4 space-y-3">{attention.map((id, i) => {
        const c = ATTENTION_COPY[id];
        return <li key={id} className="rounded-xl border bg-card p-4 flex items-start gap-3">
          <span className="text-xl font-extrabold text-status-fail shrink-0 leading-tight">{i + 1}</span>
          <div className="min-w-0"><h3 className="font-bold leading-snug">{c.title}</h3><p className="mt-0.5 text-sm text-muted-foreground">{c.hint}</p></div>
        </li>;
      })}</ol> : <p className="mt-3 text-muted-foreground">All 12 self-reported benchmarks pass. Let's verify your real files and map your next steps.</p>}
      <div ref={firstCtaRef} className="mt-5 rounded-xl border-2 border-foreground bg-card p-5">
        <h2 className="text-2xl font-bold font-heading">{attention.length ? "Want help fixing these?" : "Want to confirm you're ready?"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">A funding manager reads your real file with you and maps the order to fix it.</p>
        {bookingButton}
        <p className="mt-3 text-xs text-center text-muted-foreground">Free · about 30 minutes</p>
      </div>
    </section>

    <section id="results-benchmarks" className="mt-10">
      <p className="text-xs font-bold text-brand">YOUR 12 BENCHMARKS</p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-heading">What banks check, and where you stand</h2>
      <p className="mt-2 text-sm text-muted-foreground">Tap any line to see the goal and how to fix it.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter benchmarks">
        {([['no', `Fix · ${result.failed.length}`], ['unsure', `Not sure · ${result.unverified.length}`], ['yes', `Pass · ${result.total}`]] as const).map(([k, label]) =>
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} aria-pressed={filter === k} className="rounded-full min-h-[44px]" onClick={() => setFilter(filter === k ? null : k)}>{label}</Button>)}
      </div>
      {(['personal', 'business'] as const).map((section) => {
        const items = BENCHMARKS.filter((b) => b.section === section && (!filter || answers[b.id] === filter));
        return <div key={section} className="mt-6">
        <h3 className="flex justify-between font-bold text-lg"><span>{section === 'personal' ? 'You' : 'Your business'}</span><span className="text-sm text-muted-foreground">{section === 'personal' ? result.personal : result.business} of 6</span></h3>
        {items.length ? <div className="mt-3 rounded-xl border bg-card divide-y">{items.map((b) => {
          const s = statusOf(answers[b.id]); const open = openTile === b.id;
          return <div key={b.id}>
            <Button variant="ghost" className="w-full h-auto min-h-[52px] rounded-none px-4 py-3 flex items-center gap-2 whitespace-normal text-left" aria-expanded={open} aria-controls={`benchmark-${b.id}`} onClick={() => setOpenTile(open ? null : b.id)}>
              <span className="flex-1 font-semibold">{b.title}</span><span className={`text-[11px] font-bold uppercase rounded px-2 py-0.5 shrink-0 ${s.pill}`}>{s.label}</span><ChevronDown className={`h-4 w-4 shrink-0 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </Button>
            {open && <div id={`benchmark-${b.id}`} className="px-4 pb-5 text-sm space-y-4">
              <div className="grid grid-cols-2 gap-3"><div className={`rounded-lg p-3 ${s.pill}`}><p className="text-xs font-bold">YOUR ANSWER</p><p className="mt-1 font-semibold">{answers[b.id] === 'yes' ? 'Yes' : answers[b.id] === 'no' ? 'No' : 'Not sure'}</p></div><div className="rounded-lg p-3 bg-status-pass/15"><p className="text-xs font-bold">GOAL</p><p className="mt-1 font-semibold">{b.target}</p></div></div>
              <div><p className="text-xs font-bold text-muted-foreground">WHY IT MATTERS</p><p className="mt-1">{b.why}</p></div>
              <div><p className="text-xs font-bold text-muted-foreground">HOW TO FIX</p><p className="mt-1">{b.fix}</p></div>
            </div>}
          </div>;
        })}</div> : <p className="mt-3 text-sm text-muted-foreground">Nothing in this filter.</p>}
      </div>; })}
      <p className="mt-4 text-sm text-muted-foreground">“Not sure” counts as not passed. We check it for real on your review.</p>
    </section>

    <section ref={finalCtaRef} className="mt-10 rounded-2xl bg-brand-navy text-brand-foreground p-6 sm:p-9 shadow-xl">
      <p className="text-xs font-bold tracking-widest opacity-80">YOUR FREE FUNDING REVIEW</p>
      <h2 className="mt-3 text-3xl sm:text-4xl leading-tight font-bold font-heading">Let's read your real file together.</h2>
      <p className="mt-3 opacity-90">Your quiz shows where to look. The review shows exactly what to fix, and in what order.</p>
      <ol className="mt-6 space-y-5 border-t border-brand-foreground/20 pt-6">
        {[['Book a time', 'Pick a slot that works. About 30 minutes.'], ['Pull your 3 reports', 'So we can see the real numbers, not guesses.'], ['Read it together', 'A funding manager walks your file and maps your next steps.']].map(([title, body], i) =>
          <li key={title} className="flex gap-4"><span className="h-9 w-9 shrink-0 rounded-full bg-brand text-brand-foreground ring-2 ring-brand-foreground/30 font-bold flex items-center justify-center">{i + 1}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm opacity-90">{body}</p></div></li>)}
      </ol>
      {bookingButton}
      <p className="mt-3 text-sm text-center">Free call · no pressure</p>
    </section>
    <Button variant="link" className="mt-4 w-full h-auto min-h-[48px] whitespace-normal" onClick={async () => { const { downloadScorecard } = await import("@/lib/fundabilityReport"); await downloadScorecard(firstName || "You", answers, result); track("report_downloaded"); }}><Download className="h-4 w-4" aria-hidden="true" />Download my scorecard</Button>
    <div className="mt-4 rounded-xl border bg-card p-5"><p className="text-xs font-bold text-brand">NOT READY TO BOOK?</p><p className="mt-1 text-sm">Start with fix #1 on your own. Your scorecard lists every step.</p></div>
    <p className="mt-6 text-xs text-muted-foreground leading-relaxed">This score is an estimate based on your answers. It is not a credit decision or an offer of funding. {CTA_DISCLOSURE}</p>

    {showSticky && <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"><div className="max-w-xl mx-auto">
      <Button asChild size="lg" className="w-full min-h-[52px] rounded-full !px-5 !text-base font-bold bg-brand text-brand-foreground hover:bg-brand/90"><a href={bookUrl} onClick={() => track("funding_review_clicked", { track: result.track, score: result.total, sticky: true })}>Book my free Funding Review</a></Button>
    </div></div>}
    <Button variant="ghost" onClick={restart} className="mt-6 min-h-[44px] text-sm text-muted-foreground"><RotateCcw className="h-4 w-4" aria-hidden="true" />Retake the assessment</Button>
    <div className="h-20" aria-hidden="true" />
  </>;
}
