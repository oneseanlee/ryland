import { motion } from "framer-motion";
import { CheckCircle2, Shield, TrendingUp, FileSearch, Scale, Clock, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import HlsVideoBackground from "@/components/HlsVideoBackground";
import Footer from "@/components/Footer";
import InfiniteGrid from "@/components/ui/infinite-grid";
import Navbar from "@/components/Navbar";
import PageMeta from "@/components/PageMeta";
import JsonLd, { breadcrumbSchema, serviceSchema } from "@/components/JsonLd";


const WHAT_WE_REMOVE = [
  "Late payments & missed payments",
  "Collections & charge-offs",
  "Bankruptcies & public records",
  "Hard inquiries (excessive)",
  "Repossessions",
  "Judgments & tax liens",
];

const PROCESS_STEPS = [
  { icon: FileSearch, title: "Credit Audit", desc: "We pull your reports from all three bureaus and identify every disputable negative item." },
  { icon: Scale, title: "Legal Disputes", desc: "Our team files strategic disputes using FCRA, FDCPA, and CROA-compliant methods." },
  { icon: TrendingUp, title: "Score Optimization", desc: "Beyond removals — we optimize utilization, account mix, and age for maximum impact." },
  { icon: BadgeCheck, title: "Results Delivered", desc: "Track removals in real-time. Most clients see 50–150 point improvements." },
];

const STATS = [
  { value: "35–90", unit: "Days", desc: "Average timeline for results" },
  { value: "85%", unit: "", desc: "Negative item removal rate" },
  { value: "10K+", unit: "", desc: "Clients restored" },
];

export default function CreditRepair() {
  return (
    <div className="min-h-screen selection:bg-blue-500/30 selection:text-white antialiased text-slate-900">
      <PageMeta
        title="Credit Restoration & Optimization | Ryland Partners"
        description="Professional credit restoration and optimization. We dispute negative items across all three bureaus and coach clients toward lender-ready profiles. Results vary."
        canonical="/credit-repair"
      />
      <JsonLd
        id="credit-repair-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Credit Restoration", path: "/credit-repair" },
        ])}
      />
      <JsonLd
        id="credit-repair-service"
        data={serviceSchema({
          name: "Credit Restoration & Optimization",
          description: "Dispute-based credit restoration and credit profile optimization for consumers and business owners.",
          path: "/credit-repair",
          serviceType: "Credit Restoration",
        })}
      />

      <div className="fixed inset-0 -z-10 overflow-hidden bg-white pointer-events-none">
        <InfiniteGrid baseGridColor="rgba(148, 163, 184, 0.5)" activeGridColor="rgba(59, 130, 246, 0.8)" />
      </div>

      <Navbar />

      {/* Hero */}
      <section className="relative max-w-7xl mx-4 sm:mx-6 lg:mx-auto mt-4 sm:mt-8 pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 sm:px-8 lg:px-20 overflow-hidden rounded-2xl border border-[#004E8C]">
        <HlsVideoBackground overlay="bg-gradient-to-r from-[#003A70]/95 via-[#003A70]/85 to-[#004E8C]/60" className="rounded-2xl" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs sm:text-sm text-blue-300 uppercase tracking-widest mb-4 font-[Inter,sans-serif]">Credit Restoration</p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tighter text-white font-[Geist,sans-serif] leading-[0.95]">
              Professional Credit <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">Restoration</span> That Delivers
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 mt-6 max-w-2xl mx-auto leading-relaxed">
              Done-for-you credit repair with CROA-compliant dispute methods. Most clients see significant improvements within 35–90 days.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/assessment" className="shiny-cta !py-4 !px-10 !text-base"><span>Get Your Free Credit Audit</span></Link>
              <Link to="/consultation" className="hover:bg-white/10 transition-colors text-sm font-medium text-white border border-white/20 rounded-full py-3.5 px-8 inline-flex items-center justify-center">Book a Strategy Call</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-3 gap-6">
          {STATS.map((s, i) => (
            <motion.div key={s.desc} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <p className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tighter font-[Geist,sans-serif]">{s.value}<span className="text-lg text-slate-400 ml-1">{s.unit}</span></p>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What We Remove */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest mb-3">What We Remove</p>
            <h2 className="text-2xl sm:text-4xl font-medium text-slate-900 tracking-tighter font-[Manrope,sans-serif] mb-6">Negative Items Holding You Back</h2>
            <p className="text-slate-500 leading-relaxed mb-8">Our team uses legally compliant dispute strategies under the Fair Credit Reporting Act (FCRA) and Fair Debt Collection Practices Act (FDCPA) to challenge inaccurate, unverifiable, and outdated information on your credit reports.</p>
            <Link to="/assessment" className="inline-flex items-center justify-center rounded-full py-3.5 px-8 text-sm font-medium text-white bg-gradient-to-r from-[#003A70] to-[#0060A9] hover:opacity-90 transition-opacity">Start My Restoration</Link>
          </div>
          <div className="space-y-3">
            {WHAT_WE_REMOVE.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="max-w-7xl mx-4 sm:mx-6 lg:mx-auto rounded-2xl border border-[#004E8C] overflow-hidden relative py-16 sm:py-24 px-4 sm:px-8 lg:px-20">
        <HlsVideoBackground overlay="bg-[#003A70]/92" className="rounded-2xl" />
        <div className="relative z-10">
          <div className="text-center mb-14">
            <p className="text-xs sm:text-sm text-blue-300 uppercase tracking-widest mb-3">Our Process</p>
            <h2 className="text-2xl sm:text-5xl font-medium text-white tracking-tighter font-[Manrope,sans-serif]">How Credit Restoration Works</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-blue-400 bg-blue-400/10 rounded-full w-7 h-7 flex items-center justify-center">{i + 1}</span>
                  <step.icon className="w-5 h-5 text-white/70" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-[Geist,sans-serif]">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 sm:p-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
            <Shield className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-semibold text-slate-900 font-[Geist,sans-serif]">Fully Compliant & Transparent</h3>
          </div>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed mb-4">We operate in full compliance with the Credit Repair Organizations Act (CROA) and the FTC Telemarketing Sales Rule (TSR). No fees are charged until services are fully performed. You have the right to cancel within 3 business days.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 uppercase tracking-wider">CROA Compliant</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 uppercase tracking-wider">TSR Compliant</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-700 uppercase tracking-wider">FCRA Certified</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-4 sm:mx-6 lg:mx-auto mb-10 rounded-3xl border border-[#004E8C] overflow-hidden relative">
        <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-3xl" />
        <div className="relative z-10 text-center max-w-3xl mx-auto py-16 px-6 md:py-24 md:px-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent font-[Geist,sans-serif]">Your Credit Comeback Starts Here</h2>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">Take the first step toward a stronger credit profile. Our team is ready to fight for your financial future.</p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/assessment" className="shiny-cta !py-4 !px-10 !text-lg"><span>Get Started Today</span></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
