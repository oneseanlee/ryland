import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Lock, RotateCcw, CheckCircle2, XCircle, HelpCircle, Download, CalendarCheck } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-dark.png";
import guide from "@/assets/fundability-12-benchmarks.pdf.asset.json";
import {
  BENCHMARKS, DISCLOSURE, FUNDING_REVIEW_URL, DENIAL_DECODER_ENABLED, TRACK_LABEL, TRACK_MESSAGE,
  benchmarkById, captureUtm, scoreAssessment, track, type Answer,
} from "@/lib/fundability";

const STORE = "fundability_progress_v1";
type Stage = "quiz" | "transition" | "contact" | "results";
interface Saved { answers: Record<string, Answer>; step: number; stage: Stage; startedAt: string; firstName?: string; crm?: string; id?: string | null }

const load = (): Saved | null => { try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch { return null; } };
const OPTIONS: { v: Answer; label: string; sub: string }[] = [
  { v: "yes", label: "YES", sub: "I meet this benchmark" },
  { v: "no", label: "NO", sub: "I don't meet this benchmark" },
  { v: "unsure", label: "NOT SURE", sub: "I need to verify" },
];
const statusOf = (a: Answer) =>
  a === "yes" ? { label: "PASS", cls: "bg-status-pass", Icon: CheckCircle2 }
  : a === "no" ? { label: "NEEDS ATTENTION", cls: "bg-status-fail", Icon: XCircle }
  : { label: "NOT VERIFIED", cls: "bg-status-unverified", Icon: HelpCircle };

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b"><div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/fundability" aria-label="Ryland Partners home for Fundability Score"><img src={logo} alt="Ryland Partners" className="h-8 w-auto" /></Link>
      <span className="text-xs font-semibold tracking-widest text-muted-foreground">FUNDABILITY SCORE</span>
    </div></header>
    <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    <footer className="max-w-3xl mx-auto px-4 pb-10 text-xs text-muted-foreground space-y-2">
      <p>{DISCLOSURE}</p>
      <p><Link to="/privacy-policy" className="underline">Privacy Policy</Link> · <Link to="/terms-of-service" className="underline">Terms</Link> · <Link to="/contact" className="underline">Contact</Link></p>
    </footer>
  </div>
);

export default function FundabilityQuiz() {
  const saved = useMemo(load, []);
  const [answers, setAnswers] = useState<Record<string, Answer>>(saved?.answers ?? {});
  const [step, setStep] = useState(saved?.step ?? 0);
  const [stage, setStage] = useState<Stage>(saved?.stage ?? "quiz");
  const [startedAt] = useState(saved?.startedAt ?? new Date().toISOString());
  const [firstName, setFirstName] = useState(saved?.firstName ?? "");
  const [crm, setCrm] = useState(saved?.crm);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [sms, setSms] = useState(false);
  const [hp, setHp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openWhy, setOpenWhy] = useState(false);
  const [openTile, setOpenTile] = useState<string | null>(null);

  useEffect(() => { captureUtm(); if (!saved) track("quiz_started"); }, [saved]);
  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify({ answers, step, stage, startedAt, firstName: stage === "results" ? firstName : undefined, crm }));
  }, [answers, step, stage, startedAt, firstName, crm]);
  useEffect(() => { window.scrollTo(0, 0); setOpenWhy(false); }, [step, stage]);

  const restart = () => { localStorage.removeItem(STORE); setAnswers({}); setStep(0); setStage("quiz"); setFirstName(""); setCrm(undefined); track("quiz_restarted"); };
  const b = BENCHMARKS[step];
  const result = useMemo(() => (Object.keys(answers).length === 12 ? scoreAssessment(answers) : null), [answers]);

  const choose = (v: Answer) => {
    setAnswers((a) => ({ ...a, [b.id]: v }));
    track("question_answered", { question: b.id, answer: v });
    setTimeout(() => {
      if (step === 5) { track("personal_completed"); setStage("transition"); }
      else if (step === 11) { track("business_completed"); track("quiz_completed"); setStage("contact"); }
      else setStep(step + 1);
    }, 180);
  };
  const back = () => {
    if (stage === "transition") return setStage("quiz");
    if (stage === "contact") { setStage("quiz"); setStep(11); return; }
    if (step > 0) setStep(step - 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) { setError("Please enter your first name and a valid email."); return; }
    setSubmitting(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("fundability-submit", {
        body: { first_name: firstName.trim(), email: email.trim(), phone: phone.trim(), marketing_consent: marketing, sms_consent: sms && !!phone.trim(), answers, started_at: startedAt, utm: captureUtm(), landing_url: window.location.href.slice(0, 500), website: hp },
      });
      if (fnErr || !data?.ok) throw new Error(data?.error || "save failed");
      setCrm(data.crm);
      track("lead_submitted", { crm: data.crm, score: result?.total, track: result?.track });
    } catch {
      // Answers stay on the device; still show the result, but never claim delivery.
      setCrm("failed");
      track("lead_submit_failed");
    } finally {
      setSubmitting(false);
      setStage("results");
      track("results_viewed");
    }
  };

  if (stage === "results" && result) {
    const bookUrl = (() => {
      if (!FUNDING_REVIEW_URL.startsWith("http")) return FUNDING_REVIEW_URL;
      const u = new URL(FUNDING_REVIEW_URL); u.searchParams.set("first_name", firstName); return u.toString();
    })();
    return (
      <Shell>
        <PageMeta title="Your Fundability Score | Ryland Partners" description="Your personalized Fundability Score results." noindex />
        <section className="rounded-2xl bg-brand-navy text-brand-foreground p-6 sm:p-10">
          <p className="text-xs font-bold tracking-[0.2em] opacity-75">YOUR FUNDABILITY SCORE</p>
          <h1 className="mt-2 text-6xl sm:text-7xl font-extrabold font-heading" aria-label={`${result.total} out of 12`}>{result.total} <span className="text-3xl opacity-70">/ 12</span></h1>
          <p className="mt-3 text-xl font-bold">{TRACK_LABEL[result.track]}</p>
          <p className="mt-2 opacity-90">{TRACK_MESSAGE[result.track]}</p>
          {result.provisional && <p className="mt-3 text-sm rounded-md bg-brand-foreground/10 p-3">This score is provisional. {result.unverified.length} benchmark{result.unverified.length > 1 ? "s are" : " is"} not yet verified.</p>}
          <div className="mt-6 space-y-4">
            {([["PERSONAL CREDIT", result.personal, 0], ["BUSINESS STRUCTURE", result.business, 6]] as const).map(([label, n, off]) => (
              <div key={label}>
                <div className="flex justify-between text-xs font-semibold tracking-wider"><span>{label}</span><span>{n}/6</span></div>
                <div className="mt-1.5 grid grid-cols-6 gap-1.5" aria-hidden="true">
                  {BENCHMARKS.slice(off, off + 6).map((x) => <div key={x.id} className={`h-2.5 rounded-full ${statusOf(answers[x.id]).cls}`} />)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-4 text-sm text-muted-foreground" role="status">
          {crm === "synced" ? `Thanks, ${firstName}. Your results are saved and our team has your scorecard. Follow-up resources are on their way to your email.`
            : crm === "failed" ? "Your results are shown below, but we couldn't send them to our team just now. Download your scorecard to keep a copy."
            : "Your results are shown below."}
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-bold font-heading">Your 12-Benchmark Board</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {BENCHMARKS.map((x) => {
              const s = statusOf(answers[x.id]); const open = openTile === x.id;
              return (
                <div key={x.id} className="rounded-xl border">
                  <button className="w-full min-h-[56px] p-4 flex items-center gap-3 text-left" aria-expanded={open} onClick={() => setOpenTile(open ? null : x.id)}>
                    <span className={`h-8 w-8 shrink-0 rounded-md ${s.cls} text-brand-foreground flex items-center justify-center`}><s.Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <span className="flex-1"><span className="block text-xs text-muted-foreground">{x.id} · {x.section === "personal" ? "Personal" : "Business"}</span><span className="font-semibold">{x.title}</span></span>
                    <span className="text-[11px] font-bold">{s.label}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                  {open && (
                    <div className="px-4 pb-4 text-sm space-y-1.5">
                      <p><b>Your answer:</b> {OPTIONS.find((o) => o.v === answers[x.id])?.label}</p>
                      <p><b>Target:</b> {x.target}</p>
                      <p><b>Why it matters:</b> {x.why}</p>
                      <p><b>Next step:</b> {x.fix}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold font-heading">{result.priorities.length ? "Your Top Priorities" : "Your Next Steps"}</h2>
          {result.priorities.length ? (
            <ol className="mt-4 space-y-3">
              {result.priorities.map((id, i) => { const x = benchmarkById(id); return (
                <li key={id} className="rounded-xl border p-4">
                  <p className="font-bold">{i + 1}. {x.title} {answers[id] === "unsure" && <span className="text-xs font-semibold text-status-unverified">· verify first</span>}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{x.fix}</p>
                </li>); })}
            </ol>
          ) : (
            <p className="mt-3 text-muted-foreground">All 12 self-reported benchmarks pass. Next: verify your actual three-bureau and business files, review lender-specific requirements, and plan your application sequence.</p>
          )}
        </section>

        <section className="mt-10 rounded-2xl border-2 border-brand p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading">Want Someone on Your Side of the Desk?</h2>
          <p className="mt-3 text-foreground/80">Your score shows where you stand. A Funding Review helps you understand what your actual file says and what should happen before your next application.</p>
          <ol className="mt-5 space-y-3 text-sm">
            <li><b>STEP 1 — Book Your Free Funding Review.</b> Choose an available appointment with a funding manager.</li>
            <li><b>STEP 2 — Review Your Actual File.</b> For the detailed review you may be asked to set up a separate three-bureau report through MyFreeScoreNow ($1 introductory cost, soft pull). This is separate from this free quiz.</li>
            <li><b>STEP 3 — Understand Your Next Move.</b> Review which benchmarks are met, which need attention, and the appropriate next steps.</li>
          </ol>
          <Button asChild size="lg" className="mt-6 w-full sm:w-auto min-h-[52px] font-bold bg-brand text-brand-foreground hover:bg-brand/90">
            <a href={bookUrl} onClick={() => track("funding_review_clicked", { track: result.track, score: result.total })}><CalendarCheck className="mr-2 h-5 w-5" aria-hidden="true" /> BOOK MY FREE FUNDING REVIEW</a>
          </Button>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="min-h-[48px]" onClick={async () => { const { downloadScorecard } = await import("@/lib/fundabilityReport"); await downloadScorecard(firstName || "You", answers, result); track("report_downloaded"); }}>
              <Download className="mr-2 h-4 w-4" aria-hidden="true" /> DOWNLOAD MY FUNDABILITY SCORECARD
            </Button>
            <Button asChild variant="ghost" className="min-h-[48px]"><a href={guide.url} download="Ryland_Partners_12_Fundability_Benchmarks.pdf">Original 12 Benchmarks PDF</a></Button>
          </div>
          {DENIAL_DECODER_ENABLED && <p className="mt-4 text-sm">Eligible Fundability Score participants also receive The Denial Letter Decoder.</p>}
        </section>

        <button onClick={restart} className="mt-8 min-h-[44px] text-sm text-muted-foreground underline inline-flex items-center gap-1"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Retake the assessment</button>
      </Shell>
    );
  }

  if (stage === "contact") {
    return (
      <Shell>
        <PageMeta title="Your Fundability Score Is Ready | Ryland Partners" description="Get your Fundability Score results." noindex />
        <button onClick={back} className="min-h-[44px] inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold font-heading">Your Fundability Score Is Ready.</h1>
        <p className="mt-3 text-muted-foreground">Where should we send your score, benchmark results, and personalized next steps?</p>
        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
          <div><Label htmlFor="fn">First Name *</Label><Input id="fn" autoComplete="given-name" required maxLength={60} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5 h-12 text-base" /></div>
          <div><Label htmlFor="em">Email Address *</Label><Input id="em" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-12 text-base" /></div>
          <div><Label htmlFor="ph">Mobile Phone (optional)</Label><Input id="ph" type="tel" autoComplete="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 h-12 text-base" /><p className="mt-1 text-xs text-muted-foreground">Receive your score and follow-up resources by text.</p></div>
          <input type="text" name="website" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <label className="flex gap-3 items-start text-sm min-h-[44px]"><Checkbox checked={marketing} onCheckedChange={(v) => setMarketing(v === true)} className="mt-0.5" /><span>Yes, send me educational emails and offers from Ryland Partners. Optional; you can unsubscribe at any time.</span></label>
          {phone.trim() && (
            <label className="flex gap-3 items-start text-sm min-h-[44px]"><Checkbox checked={sms} onCheckedChange={(v) => setSms(v === true)} className="mt-0.5" /><span>I agree to receive recurring text messages from Ryland Partners at the number above. Consent is not a condition of purchase. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.</span></label>
          )}
          <p className="text-xs text-muted-foreground">You'll see your results whether or not you opt in. See our <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.</p>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" disabled={submitting} size="lg" className="w-full min-h-[52px] font-bold bg-brand text-brand-foreground hover:bg-brand/90">{submitting ? "Calculating…" : "SHOW MY FUNDABILITY SCORE"}</Button>
        </form>
      </Shell>
    );
  }

  if (stage === "transition") {
    return (
      <Shell>
        <PageMeta title="Fundability Score: Part B | Ryland Partners" description="Business structure benchmarks." noindex />
        <button onClick={back} className="min-h-[44px] inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button>
        <div className="mt-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading">That's your personal side. Now let's look at your business.</h1>
          <Button size="lg" className="mt-8 w-full sm:w-auto min-h-[52px] font-bold bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => { setStage("quiz"); setStep(6); }}>Continue to My Business</Button>
        </div>
      </Shell>
    );
  }

  const progress = Math.round((step / 12) * 100);
  return (
    <Shell>
      <PageMeta title="Fundability Score Assessment | Ryland Partners" description="Answer 12 questions about your personal credit and business structure." noindex />
      <div className="flex items-center justify-between">
        <button onClick={back} disabled={step === 0} className="min-h-[44px] inline-flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-40"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button>
        {Object.keys(answers).length > 0 && <button onClick={restart} className="min-h-[44px] text-sm text-muted-foreground inline-flex items-center gap-1"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Start over</button>}
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs font-semibold tracking-wider text-muted-foreground">
          <span>{b.section === "personal" ? "PART A · PERSONAL CREDIT" : "PART B · BUSINESS STRUCTURE"}</span><span>QUESTION {step + 1} OF 12</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-secondary" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={12} aria-label="Assessment progress">
          <div className="h-2 rounded-full bg-brand transition-all motion-reduce:transition-none" style={{ width: `${Math.max(progress, 4)}%` }} />
        </div>
      </div>
      <p className="mt-8 text-xs font-bold tracking-widest text-brand">CHECK {b.id} · {b.title.toUpperCase()}</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold font-heading leading-snug">{b.question}</h1>
      {b.helper && <p className="mt-3 text-sm text-muted-foreground">{b.helper}</p>}
      <div className="mt-6 space-y-3" role="radiogroup" aria-label="Your answer">
        {OPTIONS.map((o) => {
          const sel = answers[b.id] === o.v;
          return (
            <button key={o.v} role="radio" aria-checked={sel} onClick={() => choose(o.v)}
              className={`w-full min-h-[64px] rounded-xl border-2 px-5 py-3 text-left transition-colors motion-reduce:transition-none ${sel ? "border-brand bg-brand/10" : "border-border hover:border-brand/60"}`}>
              <span className="block font-bold">{o.label}</span><span className="block text-sm text-muted-foreground">{o.sub}</span>
            </button>
          );
        })}
      </div>
      {answers[b.id] && step < 11 && step !== 5 && (
        <Button variant="outline" className="mt-4 min-h-[44px]" onClick={() => setStep(step + 1)}>Next question</Button>
      )}
      <div className="mt-6 rounded-xl bg-secondary">
        <button className="w-full min-h-[48px] px-4 flex items-center justify-between text-sm font-semibold" aria-expanded={openWhy} onClick={() => setOpenWhy(!openWhy)}>
          Why this matters <ChevronDown className={`h-4 w-4 transition-transform ${openWhy ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {openWhy && <div className="px-4 pb-4 text-sm space-y-1.5"><p><b>Target:</b> {b.target}</p><p>{b.why}</p></div>}
      </div>
      <p className="mt-6 text-xs text-muted-foreground inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" aria-hidden="true" /> No credit check. Nothing is pulled. Your answers are saved on this device.</p>
    </Shell>
  );
}
