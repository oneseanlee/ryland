import { motion } from "framer-motion";
import { CheckCircle2, Users, BookOpen, TrendingUp, Laptop, MessageSquare, Video, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import HlsVideoBackground from "@/components/HlsVideoBackground";
import Footer from "@/components/Footer";
import InfiniteGrid from "@/components/ui/infinite-grid";
import Navbar from "@/components/Navbar";
import PageMeta from "@/components/PageMeta";
import JsonLd, { breadcrumbSchema } from "@/components/JsonLd";


const FEATURES = [
  { icon: BookOpen, title: "Digital Business Training", desc: "Step-by-step courses on building high-ROI Shopify stores, dropshipping, and digital product businesses." },
  { icon: TrendingUp, title: "Funding Strategy Workshops", desc: "Live training on maximizing your business credit lines and deploying capital into profitable ventures." },
  { icon: MessageSquare, title: "Private Discussion Forum", desc: "Connect with funded entrepreneurs, share wins, and get real-time advice from the community." },
  { icon: Video, title: "Weekly Live Q&A", desc: "Direct access to Gene Ryland and our funding team for personalized strategy sessions." },
  { icon: Laptop, title: "Done-With-You Builds", desc: "We help you build your digital business alongside your funding — from store setup to first sale." },
  { icon: Zap, title: "Early Access & Deals", desc: "Members get priority access to new programs, exclusive discounts, and partnership opportunities." },
];

const WHAT_YOU_LEARN = [
  "How to invest your 0% APR funding into high-ROI digital businesses",
  "Shopify store setup, product research, and launch strategy",
  "Scaling with paid ads — Facebook, Google, and TikTok",
  "Building recurring revenue through digital products and services",
  "Credit stacking strategies for continued growth capital",
  "Networking with other funded founders for deals and partnerships",
];

export default function Community() {
  return (
    <div className="min-h-screen selection:bg-blue-500/30 selection:text-white antialiased text-slate-900">
      <PageMeta title="Private Community | Ryland Partners" description="Join the Ryland Partners private community — digital business training, funding strategy workshops, and weekly live Q&A sessions." />

      <div className="fixed inset-0 -z-10 overflow-hidden bg-white pointer-events-none">
        <InfiniteGrid baseGridColor="rgba(148, 163, 184, 0.5)" activeGridColor="rgba(59, 130, 246, 0.8)" />
      </div>

      <Navbar />

      {/* Hero */}
      <section className="relative max-w-7xl mx-4 sm:mx-6 lg:mx-auto mt-4 sm:mt-8 pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 sm:px-8 lg:px-20 overflow-hidden rounded-2xl border border-[#004E8C]">
        <HlsVideoBackground overlay="bg-gradient-to-r from-[#003A70]/95 via-[#003A70]/85 to-[#004E8C]/60" className="rounded-2xl" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs sm:text-sm text-blue-300 uppercase tracking-widest mb-4 font-[Inter,sans-serif]">Private Community</p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tighter text-white font-[Geist,sans-serif] leading-[0.95]">
              Join the <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">Funded Founders</span> Community
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 mt-6 max-w-2xl mx-auto leading-relaxed">
              A private Skool network where funded entrepreneurs learn to invest their capital into high-ROI digital businesses — with direct access to Gene Ryland and our expert team.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/consultation" className="shiny-cta !py-4 !px-10 !text-base"><span className="flex items-center gap-2">Apply to Join <ArrowRight className="w-4 h-4" /></span></Link>
              <Link to="/assessment" className="hover:bg-white/10 transition-colors text-sm font-medium text-white border border-white/20 rounded-full py-3.5 px-8 inline-flex items-center justify-center">Take the Assessment First</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest mb-3">What's Inside</p>
          <h2 className="text-2xl sm:text-5xl font-medium text-slate-900 tracking-tighter font-[Manrope,sans-serif]">Everything You Need to Win</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl border border-[#004E8C] p-8 text-white">
              <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-2xl" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 mb-5">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2 font-[Geist,sans-serif]">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest mb-3">The Curriculum</p>
            <h2 className="text-2xl sm:text-4xl font-medium text-slate-900 tracking-tighter font-[Manrope,sans-serif] mb-6">Turn Funding Into Freedom</h2>
            <p className="text-slate-500 leading-relaxed mb-8">Most entrepreneurs get funded but don't know what to do next. Our community teaches you how to deploy your capital into digital businesses that generate real, recurring revenue — so your funding works for you.</p>
            <Link to="/consultation" className="shiny-cta !py-3.5 !px-8 !text-sm"><span className="flex items-center gap-2">Apply Now <ArrowRight className="w-4 h-4" /></span></Link>
          </div>
          <div className="space-y-3">
            {WHAT_YOU_LEARN.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-4 sm:mx-6 lg:mx-auto mb-10 rounded-3xl border border-[#004E8C] overflow-hidden relative">
        <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-3xl" />
        <div className="relative z-10 text-center max-w-3xl mx-auto py-16 px-6 md:py-24 md:px-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent font-[Geist,sans-serif]">Build Your Empire with Us</h2>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">Join a community of funded founders who are turning business credit into real, revenue-generating digital businesses.</p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/consultation" className="shiny-cta !py-4 !px-10 !text-lg"><span>Apply to Join</span></Link>
            <Link to="/assessment" className="hover:bg-white/10 transition-colors text-base text-white border-white/20 border rounded-full py-3 px-6">Take the Assessment</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
