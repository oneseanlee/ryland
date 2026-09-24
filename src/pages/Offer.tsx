import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  BadgeCheck,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import PageMeta from "@/components/PageMeta";
import InfiniteGrid from "@/components/ui/infinite-grid";

const CTA_DISCLAIMER =
  "Ryland Partners provides business education and credit optimization services. Results vary by individual and are not guaranteed.";

interface ValueItem {
  name: string;
  detail?: string;
  price: string;
  isBonus?: boolean;
}

const VALUE_STACK: ValueItem[] = [
  { name: "The Fundability Program", detail: "Done-for-you, 12 months", price: "$2,500" },
  { name: "Bonus #1: The Ryland Partners Community", detail: "12 months", price: "$1,188", isBonus: true },
  { name: "Bonus #2: Business Compliance Presence Package", price: "$1,997", isBonus: true },
  { name: "Bonus #3: Your Custom Profit Blueprint", price: "$4,997", isBonus: true },
  { name: "Bonus #4: Done-For-You 9-Benchmark Scorecard", price: "$497", isBonus: true },
  { name: "Bonus #5: Personal Card Offload Plan", price: "$497", isBonus: true },
  { name: "Bonus #6: Banker Call & Reconsideration Scripts", price: "$297", isBonus: true },
  { name: "Bonus #7: 0% Deployment & Payoff Playbook", price: "$497", isBonus: true },
];

const GUARANTEE_PILLS = [
  "100% Money-Back Guarantee",
  "Lifetime Membership: 72 Hours",
  "Accelerated: First 3",
];

const GOLD = "#E8BE5D";

export default function Offer() {
  return (
    <div className="min-h-screen bg-white antialiased text-slate-900 selection:bg-blue-500/30 selection:text-white">
      <PageMeta
        title="Webinar Special — Today Only | Ryland Partners"
        description="Complete Business Funding Program — everything included: full credit optimization, funding readiness, and all bonus offerings for $1,500 or 3 payments of $500. Webinar special, today only. Results vary and are not guaranteed."
        canonical="/offer"
        noindex
      />

      {/* Background Grid */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-white pointer-events-none">
        <InfiniteGrid baseGridColor="rgba(148, 163, 184, 0.5)" activeGridColor="rgba(59, 130, 246, 0.8)" />
      </div>

      {/* Compact hero */}
      <section className="relative mx-4 sm:mx-6 lg:mx-auto mt-4 sm:mt-6 max-w-7xl pt-6 sm:pt-8 pb-8 px-4 sm:px-8 rounded-2xl border border-[#004E8C] overflow-hidden bg-gradient-to-br from-[#003A70] via-[#004E8C] to-[#0060A9]">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-start mb-4 sm:mb-5">
              <Link to="/" aria-label="Ryland Partners home">
                <img src={logoWhite} alt="Ryland Partners" className="h-8 sm:h-9 w-auto" />
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8BE5D] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E8BE5D]" />
              </span>
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-white">
                Webinar Special — Today Only
              </span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tighter text-white font-[Manrope,sans-serif] leading-[1.02]">
              Choose Your Program
            </h1>
            <p className="text-sm sm:text-base text-blue-100 mt-2.5 max-w-2xl mx-auto leading-relaxed">
              One program with everything included — full credit optimization, funding readiness,
              and every bonus below. This special pricing is available today only.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Value stack + enroll panel */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-[#003A70] bg-gradient-to-br from-[#002A54] via-[#003A70] to-[#004E8C] shadow-[0_32px_90px_-30px_rgba(0,42,84,0.55)]"
        >
          <div className="grid lg:grid-cols-[1.25fr_1fr]">
            {/* Value stack */}
            <div className="p-6 sm:p-10 lg:border-r lg:border-white/10">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#E8BE5D]">
                <Sparkles className="w-3.5 h-3.5" />
                Everything Included
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-white font-[Manrope,sans-serif] tracking-tight">
                Complete Business Funding Program
              </h2>

              <ul className="mt-6 divide-y divide-white/10">
                {VALUE_STACK.map((item, i) => (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                    className="flex items-center justify-between gap-4 py-3.5"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <CheckCircle2
                        className="w-[18px] h-[18px] mt-0.5 shrink-0 text-[#E8BE5D]"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-sm sm:text-[15px] leading-snug ${
                            item.isBonus ? "font-medium text-white" : "font-semibold text-white"
                          }`}
                        >
                          {item.name}
                          {item.detail && (
                            <span className="text-blue-200 font-normal"> ({item.detail})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className="shrink-0 text-sm sm:text-base font-semibold tabular-nums"
                      style={{ color: GOLD }}
                    >
                      {item.price}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <span className="text-sm text-blue-200">Total value</span>
                <span className="text-lg sm:text-xl font-semibold line-through decoration-red-400/70 decoration-2" style={{ color: "rgba(232,190,93,0.75)" }}>
                  $12,470
                </span>
              </div>
            </div>

            {/* Enroll panel */}
            <div className="p-6 sm:p-10 flex flex-col justify-center bg-white/[0.03]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200">
                  Webinar Special — Today Only
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-semibold tracking-tight" style={{ color: GOLD }}>
                    $1,500
                  </span>
                </div>
                <p className="mt-1.5 text-base sm:text-lg text-white font-medium">
                  or 3 payments of $500
                </p>

                <div className="mt-7 space-y-3">
                  <a
                    href="https://link.rylandpartners.com/payment-link/6aa937cc9f7ff2c808a75ad2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shiny-cta !py-3.5 !px-6 !text-base w-full flex items-center justify-center"
                  >
                    <span>Pay $1,500 in Full</span>
                  </a>
                  <p className="text-center text-xs text-blue-200">One payment today</p>

                  <a
                    href="https://link.rylandpartners.com/payment-link/6aa938699f7ff2c808a75ad7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/15 transition-colors"
                  >
                    <span>3 Monthly Payments of $500</span>
                  </a>
                  <p className="text-center text-xs text-blue-200">$1,500 total — first payment today</p>
                </div>

                <div className="mt-7 flex flex-wrap gap-2">
                  {GUARANTEE_PILLS.map((pill) => (
                    <span
                      key={pill}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E8BE5D]/40 bg-[#E8BE5D]/10 px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-[#E8BE5D]"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      {pill}
                    </span>
                  ))}
                </div>

                <p className="mt-6 text-[11px] leading-relaxed text-blue-200/80">
                  {CTA_DISCLAIMER}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How payments work */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8"
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
        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: ShieldCheck, label: "Secure checkout", desc: "Processed on our secure payment page" },
            { icon: CalendarDays, label: "Starts today", desc: "Your program begins the moment you enroll" },
            { icon: Clock, label: "Today only", desc: "This webinar special pricing ends tonight" },
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
          <p className="text-sm text-slate-600">Have questions about the program?</p>
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
