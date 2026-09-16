import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import PageMeta from "@/components/PageMeta";
import InfiniteGrid from "@/components/ui/infinite-grid";

/**
 * Fixed campaign deadline: Friday, September 18, 2026 at midnight Eastern Time (EDT, UTC-4).
 * 2026-09-19T00:00:00-04:00 === 2026-09-19T04:00:00Z
 * Every visitor sees the same real deadline — the counter reflects genuine time remaining.
 */
function getDeadline(): number {
  return new Date("2026-09-19T04:00:00Z").getTime();
}

function useCountdown(deadline: number, initialNow: number) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, deadline - now);
  const expired = remaining <= 0;
  // Show total remaining hours (not days) — a single ticking clock reads as more urgent.
  const totalHours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return { totalHours, minutes, seconds, expired };
}

const pad = (n: number) => String(n).padStart(2, "0");

const CTA_DISCLAIMER =
  "Ryland Partners provides business education and credit optimization services. Results vary by individual and are not guaranteed.";

interface PaymentOption {
  label: string;
  sublabel: string;
  href: string;
  featured?: boolean;
}

interface Program {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  price: string;
  successFee: string;
  tagline: string;
  bestFor: string;
  features: string[];
  options: PaymentOption[];
  highlight?: boolean;
}

const PROGRAMS: Program[] = [
  {
    id: "funding-ready",
    icon: TrendingUp,
    name: "Funding Ready",
    price: "$999",
    successFee: "+ 7% success fee",
    tagline: "Your credit is in good shape — let's position you for business funding.",
    bestFor: "Best if your credit score is already 680+",
    features: [
      "Full credit & funding readiness review",
      "Personalized funding roadmap",
      "Lender positioning & application strategy",
      "1-on-1 guidance from our funding team",
    ],
    options: [
      {
        label: "Pay $999 in Full",
        sublabel: "One payment today",
        href: "https://link.rylandpartners.com/payment-link/6aa936eaceb12d9fc1a8cf96",
        featured: true,
      },
      {
        label: "3 Monthly Payments of $333",
        sublabel: "$999 total — first payment today",
        href: "https://link.rylandpartners.com/payment-link/6aa93740ceb12d9fc1a8cf97",
      },
    ],
    highlight: true,
  },
  {
    id: "credit-work-needed",
    icon: CreditCard,
    name: "Credit Work Needed",
    price: "$1,500",
    successFee: "+ 7% success fee",
    tagline: "We'll do the credit work first, then position you for funding.",
    bestFor: "Best if your credit needs repair or optimization first",
    features: [
      "Everything in Funding Ready",
      "Done-for-you credit repair & optimization",
      "Dispute & bureau correspondence handled for you",
      "Ongoing credit monitoring & progress reviews",
    ],
    options: [
      {
        label: "Pay $1,500 in Full",
        sublabel: "One payment today",
        href: "https://link.rylandpartners.com/payment-link/6aa937cc9f7ff2c808a75ad2",
        featured: true,
      },
      {
        label: "3 Monthly Payments of $500",
        sublabel: "$1,500 total — first payment today",
        href: "https://link.rylandpartners.com/payment-link/6aa938699f7ff2c808a75ad7",
      },
    ],
  },
];

const TimerBox = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
      <span className="text-2xl sm:text-4xl font-semibold text-white tabular-nums font-[Manrope,sans-serif]">
        {value}
      </span>
    </div>
    <span className="mt-2 text-[11px] uppercase tracking-widest text-blue-200">{label}</span>
  </div>
);

export default function Offer() {
  const startTime = useMemo(() => Date.now(), []);
  const deadline = useMemo(() => getDeadline(), []);
  const { totalHours, minutes, seconds, expired } = useCountdown(deadline, startTime);

  return (
    <div className="min-h-screen bg-white antialiased text-slate-900 selection:bg-blue-500/30 selection:text-white">
      <PageMeta
        title="Limited-Time Program Offer | Ryland Partners"
        description="Choose your program — Funding Ready or Credit Work Needed. This limited-time offer ends Friday, September 18 at midnight and includes flexible payment plans. Results vary and are not guaranteed."
        canonical="/offer"
        noindex
      />

      {/* Background Grid */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-white pointer-events-none">
        <InfiniteGrid baseGridColor="rgba(148, 163, 184, 0.5)" activeGridColor="rgba(59, 130, 246, 0.8)" />
      </div>

      {/* Hero with countdown */}
      <section className="relative mx-4 sm:mx-6 lg:mx-auto mt-4 sm:mt-8 max-w-7xl pt-14 sm:pt-20 pb-16 px-4 sm:px-8 rounded-2xl border border-[#004E8C] overflow-hidden bg-gradient-to-br from-[#003A70] via-[#004E8C] to-[#0060A9]">
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex justify-start mb-10">
              <Link to="/" aria-label="Ryland Partners home">
                <img src={logoWhite} alt="Ryland Partners" className="h-10 sm:h-12 w-auto" />
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs uppercase tracking-widest text-blue-100 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Webinar Exclusive — Ends Friday at Midnight
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tighter text-white font-[Manrope,sans-serif] leading-[1.02]">
              Choose Your Program
            </h1>
            <p className="text-base sm:text-lg text-blue-100 mt-5 max-w-2xl mx-auto leading-relaxed">
              This special enrollment closes Friday, September 18 at midnight. Pick the program that
              fits where you are today — pay in full or split it into three monthly payments.
            </p>
          </motion.div>

          {/* Countdown — hours-first for urgency */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 text-center"
          >
            {expired ? (
              <div className="inline-flex flex-col items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-8 py-6">
                <span className="inline-flex items-center gap-2 text-white font-medium font-[Manrope,sans-serif]">
                  <Clock className="w-5 h-5" /> This 72-hour window has closed
                </span>
                <Link
                  to="/consultation"
                  className="text-sm text-blue-200 underline underline-offset-4 hover:text-white transition-colors"
                >
                  Book a free consultation to see current options →
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium uppercase tracking-widest text-blue-200 mb-4">
                  {totalHours > 0 ? `Only ${totalHours} hour${totalHours === 1 ? "" : "s"} left` : "Final minutes"}
                </p>
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <TimerBox value={pad(totalHours)} label="Hours" />
                  <span className="text-3xl sm:text-4xl font-semibold text-blue-300 font-[Manrope,sans-serif] pb-6" aria-hidden="true">:</span>
                  <TimerBox value={pad(minutes)} label="Minutes" />
                  <span className="text-3xl sm:text-4xl font-semibold text-blue-300 font-[Manrope,sans-serif] pb-6" aria-hidden="true">:</span>
                  <TimerBox value={pad(seconds)} label="Seconds" />
                </div>
                <p className="mt-4 text-xs text-blue-200/90">
                  Offer ends Friday night, September 18 at midnight (Eastern Time)
                </p>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Programs */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {PROGRAMS.map((program, idx) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative flex flex-col rounded-3xl border p-6 sm:p-8 ${
                program.highlight
                  ? "border-[#0060A9] bg-white shadow-[0_24px_70px_-24px_rgba(0,58,112,0.35)] ring-1 ring-[#0060A9]/20"
                  : "border-slate-200 bg-white shadow-[0_16px_50px_-24px_rgba(0,58,112,0.2)]"
              }`}
            >
              {program.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#003A70] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white">
                  Most Popular
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-[#0060A9]/10 border border-[#0060A9]/20 flex items-center justify-center">
                  <program.icon className="w-6 h-6 text-[#0060A9]" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 font-[Manrope,sans-serif]">
                    {program.name}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{program.tagline}</p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-slate-900 font-[Manrope,sans-serif]">
                  {program.price}
                </span>
                <span className="text-sm font-medium text-slate-500">{program.successFee}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{program.bestFor}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {program.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#0060A9]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 space-y-3">
                {program.options.map((option) => (
                  <div key={option.href}>
                    <a
                      href={option.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        option.featured
                          ? "shiny-cta !py-3.5 !px-6 !text-base w-full flex items-center justify-center"
                          : "w-full inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3.5 text-base font-medium text-[#003A70] hover:bg-slate-50 hover:border-[#0060A9]/50 transition-colors"
                      }
                    >
                      <span>{option.label}</span>
                    </a>
                    <p className="mt-1.5 text-center text-xs text-slate-500">{option.sublabel}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-[11px] leading-relaxed text-slate-500 text-center">
                {CTA_DISCLAIMER}
              </p>
            </motion.div>
          ))}
        </div>

        {/* How payments work */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8"
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 font-[Manrope,sans-serif]">
            <CalendarDays className="w-5 h-5 text-[#0060A9]" />
            How payment plans work
          </h3>
          <div className="mt-4 grid sm:grid-cols-3 gap-4">
            {[
              { step: "Payment 1", desc: "Charged today when you enroll" },
              { step: "Payment 2", desc: "One month from today" },
              { step: "Payment 3", desc: "Two months from today" },
            ].map((item) => (
              <div key={item.step} className="rounded-xl bg-white border border-slate-200 p-4">
                <p className="text-sm font-semibold text-[#003A70]">{item.step}</p>
                <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-600 leading-relaxed">
            The 7% success fee is separate and only applies when funding is secured. It is not
            charged with your program payments.
          </p>
        </motion.div>

        {/* Reassurance strip */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: ShieldCheck, label: "Secure checkout", desc: "Processed on our secure payment page" },
            { icon: CalendarDays, label: "Starts today", desc: "Your program begins the moment you enroll" },
            { icon: Clock, label: "Ends Friday at midnight", desc: "Pricing returns to standard after the deadline" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <item.icon className="w-5 h-5 mx-auto text-[#0060A9]" />
              <p className="mt-2 text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Questions */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600">
            Not sure which program is right for you?
          </p>
          <Link
            to="/consultation"
            className="mt-3 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-medium text-[#003A70] hover:bg-slate-50 hover:border-[#0060A9]/50 transition-colors"
          >
            Book a free consultation
          </Link>
        </div>
      </section>

      {/* Compliance footer */}
      <footer className="border-t border-slate-200 py-10 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Ryland Partners provides business education, credit optimization, and funding
            readiness services. We do not lend money, and results — including credit score
            changes and funding amounts — vary by individual and are not guaranteed. The 7%
            success fee applies only to funding successfully secured through the program.
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <Link to="/privacy-policy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms-of-service" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link to="/disclaimers" className="hover:text-slate-600 transition-colors">Disclaimers</Link>
          </div>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Ryland Partners · St. Petersburg, Florida
          </p>
        </div>
      </footer>
    </div>
  );
}
