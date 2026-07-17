import { motion } from "framer-motion";
import { ShieldCheck, Percent, Building2, Scale, Phone, Mail, Clock, Star } from "lucide-react";
import HlsVideoBackground from "@/components/HlsVideoBackground";
import ConsultationCalendar from "@/components/funnel/ConsultationCalendar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import PageMeta from "@/components/PageMeta";
import geneRyland from "@/assets/gene-ryland-about.png";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "No Hard Credit Pull" },
  { icon: Percent, label: "0% APR Focus" },
  { icon: Building2, label: "Trusted Banking Partners" },
  { icon: Scale, label: "100% Transparent Pricing" },
];

const STATS = [
  { value: "$50M+", label: "Funded for Clients" },
  { value: "200+", label: "Clients Served" },
  { value: "8+", label: "Years Experience" },
];

export default function Consultation() {
  return (
    <div className="min-h-screen selection:bg-blue-500/30 selection:text-white antialiased">
      
      <PageMeta
        title="Free Business Credit Consultation | Ryland Partners"
        description="Book a complimentary strategy session with our funding team. Personalized business credit and funding roadmap. Results vary."
        canonical="/consultation"
      />
      <JsonLd
        id="consultation-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Free Consultation", path: "/consultation" },
        ])}
      />
      <JsonLd
        id="consultation-service"
        data={serviceSchema({
          name: "Free Business Credit Consultation",
          description: "Complimentary strategy session covering business credit, funding readiness, and next steps.",
          path: "/consultation",
          serviceType: "Business Credit Consultation",
        })}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <HlsVideoBackground overlay="bg-[#001F3F]/94" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-20 lg:pb-28">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/20 rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold text-cyan-300 uppercase tracking-wider mb-6 font-[Inter,sans-serif]">
              <Clock className="w-3.5 h-3.5" />
              Free 30-Minute Strategy Session
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5 font-[Geist,sans-serif]">
              Let's Build Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Personalized Funding Plan
              </span>
            </h1>
            <p className="text-blue-100/60 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Whether you're looking to secure <strong className="text-white">$50K–$250K</strong> in
              business funding, repair your credit, or scale your empire — it starts with a conversation.
            </p>
          </motion.div>

          {/* Two-column layout */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            {/* Left: Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {STATS.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="text-center bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <p className="text-xl sm:text-2xl font-bold text-white font-[Geist,sans-serif]">{stat.value}</p>
                    <p className="text-blue-200/40 text-xs mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* What to expect */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-[Geist,sans-serif]">
                  What to Expect
                </h2>
                <ul className="space-y-3">
                  {[
                    "A personalized assessment of your current credit & funding profile",
                    "Custom strategy to maximize your approval odds",
                    "Clear roadmap with actionable next steps",
                    "Zero pressure — just expert guidance",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-blue-100/60">
                      <Star className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3">
                {TRUST_BADGES.map((badge, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                  >
                    <badge.icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-white/80 text-sm font-medium">{badge.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Gene card */}
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
                <img
                  src={geneRyland}
                  alt="Gene Ryland"
                  className="w-20 h-20 rounded-2xl object-cover object-top ring-2 ring-cyan-400/20"
                />
                <div>
                  <p className="text-white font-semibold font-[Geist,sans-serif]">Gene Ryland</p>
                  <p className="text-blue-200/50 text-sm">Founder & Funding Strategist</p>
                  <p className="text-blue-200/30 text-xs mt-0.5">8+ Years • 200+ Clients Served</p>
                </div>
              </div>

              {/* Alternative contact */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-blue-200/40">
                <span>Prefer to reach out directly?</span>
                <a href="mailto:info@rylandpartners.com" className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors">
                  <Mail className="w-4 h-4" />
                  info@rylandpartners.com
                </a>
              </div>
            </motion.div>

            {/* Right: Calendar */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ConsultationCalendar />
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
