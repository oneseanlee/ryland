import { motion } from "framer-motion";
import { Handshake, DollarSign, Megaphone, LayoutDashboard, Mail, Star } from "lucide-react";
import HlsVideoBackground from "@/components/HlsVideoBackground";
import PartnerOnboardingCalendar from "@/components/funnel/PartnerOnboardingCalendar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import PageMeta from "@/components/PageMeta";
import brittanyW from "@/assets/brittany-w-partner.png";

const ONBOARDING_ITEMS = [
  { icon: LayoutDashboard, text: "Partner portal walkthrough & login setup" },
  { icon: Handshake, text: "Referral link activation & tracking overview" },
  { icon: DollarSign, text: "Commission structure & payout schedule" },
  { icon: Megaphone, text: "Marketing assets, scripts & co-branded materials" },
];

export default function PartnerOnboarding() {
  return (
    <div className="min-h-screen selection:bg-blue-500/30 selection:text-white antialiased">
      
      <PageMeta
        title="Partner Onboarding | Ryland Partners"
        description="Schedule your 1-on-1 partner onboarding call. Get set up with your portal, referral link, and marketing assets."
        noindex
      />
      <Navbar />

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
              <Handshake className="w-3.5 h-3.5" />
              Partner Onboarding
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5 font-[Geist,sans-serif]">
              Let's Get You{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Set Up for Success
              </span>
            </h1>
            <p className="text-blue-100/60 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Book a quick 30-minute onboarding call and we'll walk you through everything —
              your portal, referral link, commissions, and marketing assets.
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
              {/* What we'll cover */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-[Geist,sans-serif]">
                  What We'll Cover
                </h3>
                <ul className="space-y-3">
                  {ONBOARDING_ITEMS.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-blue-100/60">
                      <item.icon className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Why partner */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-[Geist,sans-serif]">
                  Why Partners Love Working With Us
                </h3>
                <ul className="space-y-3">
                  {[
                    "Competitive commissions on every closed deal",
                    "Done-for-you marketing materials & scripts",
                    "Real-time tracking dashboard for all referrals",
                    "Dedicated partner support from our team",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-blue-100/60">
                      <Star className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gene card */}
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
              <img
                src={brittanyW}
                alt="Brittany W."
                width={80}
                height={80}
                loading="lazy"
                className="w-20 h-20 rounded-2xl object-cover object-top ring-2 ring-cyan-400/20"
              />
              <div>
                <p className="text-white font-semibold font-[Geist,sans-serif]">Brittany W.</p>
                <p className="text-blue-200/50 text-sm">Director of Partner Success</p>
                <p className="text-blue-200/30 text-xs mt-0.5">Personally onboards every new partner</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-blue-200/40">
                <span>Questions before the call?</span>
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
              <PartnerOnboardingCalendar />
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
