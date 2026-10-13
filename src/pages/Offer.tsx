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
  "Ryland Partners provides business education, Credit Optimization, and funding readiness services. Results vary and are not guaranteed.";

interface ValueItem {
  name: string;
  detail?: string;
  price: string;
  highlight?: boolean;
}

const CORE_STACK: ValueItem[] = [
  { name: "12-Benchmark File Review", detail: "your file read against all 12, in writing, within 3 business days", price: "$497" },
  { name: "Personal Credit Optimization", detail: "payment history, utilization, inquiries, depth", price: "$2,500" },
  { name: "Business Fundability Setup", detail: "entity, D&B file, website, domain email, business phone and address, industry code", price: "$3,500" },
  { name: "Banking Sequence + Funding Rounds", detail: "where you apply, in what order, and when", price: "$1,500" },
  { name: "Your Specialist", detail: "one person who knows your file by name, weekly updates", price: "Included" },
];

const GUARANTEE_PILLS = [
  "File Fit Promise",
  "90-Day Movement Guarantee",
  "Never-Quit Promise",
];

const GOLD = "#E8BE5D";

export default function Offer() {
  return (
    <div className="min-h-screen bg-white antialiased text-slate-900 selection:bg-blue-500/30 selection:text-white">
      <PageMeta
        title="The Fundability Program — Webinar Price | Ryland Partners"
        description="Get your file read against all 12 Fundability Benchmarks with The Fundability Program. Webinar price: $1,500 or 3 payments of $500, good for 72 hours after your session. Results vary and are not guaranteed."
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
                 Webinar Price · Good for 72 Hours
              </span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tighter text-white font-[Manrope,sans-serif] leading-[1.02]">
               Get Your File Read Before the Bank Reads It
            </h1>
            <p className="text-sm sm:text-base text-blue-100 mt-2.5 max-w-2xl mx-auto leading-relaxed">
               One program. We read your file against all 12 Fundability Benchmarks, fix
               what's red on the personal side, the business side, or both, and then map
               the order you apply in. Webinar price is good for 72 hours after your session.
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
                 What You Get
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-white font-[Manrope,sans-serif] tracking-tight">
                 The Fundability Program
              </h2>

              <ul className="mt-6 divide-y divide-white/10">
                {CORE_STACK.map((item, i) => (
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
                          className={`text-sm sm:text-[15px] leading-snug font-medium text-white`}
                        >
                          {item.name}
                          {item.detail && (
                            <span className="text-blue-200 font-normal"> ({item.detail})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className="shrink-0 text-sm sm:text-base font-semibold tabular-nums text-white"
                    >
                      {item.price}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm font-semibold uppercase tracking-widest text-white">
                  Total Value
                </span>
                <span className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: GOLD }}>
                   $7,997
                </span>
              </div>
            </div>

            {/* Enroll panel */}
            <div className="p-6 sm:p-10 flex flex-col justify-center bg-white/[0.03]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200">
                   Webinar Price
                </p>
                 <p className="mt-3 text-lg text-blue-200"><span className="sr-only">Original price: </span><s>$2,500</s></p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-semibold tracking-tight" style={{ color: GOLD }}>
                    $1,500
                  </span>
                </div>
                <p className="mt-1.5 text-base sm:text-lg text-white font-medium">
                  or 3 payments of $500
                </p>
                 <p className="mt-3 text-sm text-blue-200 leading-relaxed">
                   Webinar price. Save $1,000. Good for 72 hours, then $2,500.
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

                 <section className="mt-7 border-t border-white/10 pt-6" aria-labelledby="offer-promises">
                   <h2 id="offer-promises" className="text-lg font-semibold text-white font-[Manrope,sans-serif]">Your Three Promises</h2>
                   <div className="mt-4 space-y-4 text-sm leading-relaxed text-blue-200">
                     <p><strong className="text-white">File Fit Promise.</strong> We read your file within 3 business days. If we don't believe we can help, you get a full refund before any work starts.</p>
                     <p><strong className="text-white">90-Day Movement Guarantee.</strong> If your file doesn't move in 90 days, you get 100% of your money back. “Move” means at least one negative item removed from your credit report, or, if you have no negative items, at least one red business benchmark turned green.</p>
                     <p><strong className="text-white">Never-Quit Promise.</strong> Once your file is funding-ready, we keep working it through the funding process until you're funded or you tell us to stop.</p>
                     <p className="italic">None of this is a guarantee of funding approval. Lenders make the final decision based on your profile and underwriting.</p>
                   </div>
                 </section>

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
        </motion.div>

        {/* Reassurance strip */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: ShieldCheck, label: "Secure checkout", desc: "Processed on our secure payment page" },
             { icon: CalendarDays, label: "Starts this week", desc: "Your file review comes back within 3 business days" },
             { icon: Clock, label: "72 hours only", desc: "Webinar price, then it goes back to $2,500" },
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
           <p className="text-sm text-slate-600">Questions before you enroll? Reply to your webinar email or text, or ask in the live Q&A.</p>
          <Link
            to="/consultation"
             className="mt-3 inline-flex min-h-11 items-center justify-center text-sm text-[#003A70] underline underline-offset-4"
          >
            Book a free consultation
          </Link>
        </div>
      </section>

      {/* Compliance footer */}
      <footer className="border-t border-slate-200 py-10 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">
             Ryland Partners provides business education, Credit Optimization, and funding
             readiness services. We do not lend money. Results, including credit
             changes and funding amounts, vary by individual and are not guaranteed. A
             separate success fee applies only if funding is secured. Exact terms are in
             your agreement before you pay.
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
