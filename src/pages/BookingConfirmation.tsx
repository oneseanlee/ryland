import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, CalendarDays, Clock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import PageMeta from "@/components/PageMeta";
import geneRyland from "@/assets/gene-ryland-about.png";
import logoWhite from "@/assets/logo-white.png";

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { date, time, name } = (location.state as { date?: string; time?: string; name?: string }) || {};

  return (
    <div className="min-h-screen bg-[#001228] selection:bg-blue-500/30 selection:text-white antialiased">
      
      <PageMeta
        title="Booking Confirmed | Ryland Partners"
        description="Your consultation has been booked. We look forward to speaking with you."
        noindex
      />
      {/* Minimal dark header */}
      <header className="sticky top-0 z-20 bg-[#001228]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4 sm:px-6">
          <Link to="/">
            <img src={logoWhite} alt="Ryland Partners" className="h-8 w-auto" />
          </Link>
          <Link to="/" className="text-sm text-blue-200/50 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>
      <main className="relative pt-32 pb-24">
        {/* Subtle background accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 180, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl scale-150" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-cyan-400" />
              </div>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-[Geist,sans-serif]">
              You're All Set{name ? `, ${name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-blue-200/50 text-base sm:text-lg max-w-md mx-auto">
              Your strategy session has been confirmed. We can't wait to help you unlock your funding potential.
            </p>
          </motion.div>

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="rounded-2xl border border-white/10 overflow-hidden mb-8"
            style={{ background: "linear-gradient(180deg, hsl(210 100% 10%) 0%, hsl(210 100% 14%) 100%)" }}
          >
            {date && time && (
              <div className="p-6 border-b border-white/10">
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4 font-[Inter,sans-serif]">
                  Appointment Details
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{date}</p>
                      <p className="text-blue-200/40 text-xs">Date</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{time}</p>
                      <p className="text-blue-200/40 text-xs">Time (30 min)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* What to Prepare */}
            <div className="p-6">
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 font-[Inter,sans-serif]">
                How to Prepare
              </p>
              <ul className="space-y-3">
                {[
                  "Know your current credit score (or a rough estimate)",
                  "Have a clear idea of your funding goals and timeline",
                  "Prepare any questions about credit repair or business funding",
                  "Be in a quiet space where you can talk freely",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="flex items-start gap-3 text-sm text-blue-100/60"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] text-cyan-400 font-bold">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Confirmation Email Notice */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-4 mb-8"
          >
            <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <p className="text-sm text-blue-200/50">
              A confirmation email has been sent with all the details and a calendar invite.
            </p>
          </motion.div>

          {/* Gene Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 mb-10"
          >
            <img
              src={geneRyland}
              alt="Gene Ryland"
              className="w-20 h-20 rounded-2xl object-cover object-top ring-2 ring-cyan-400/20"
            />
            <div>
              <p className="text-white font-semibold font-[Geist,sans-serif]">Gene Ryland</p>
              <p className="text-blue-200/50 text-sm">Founder & Funding Strategist</p>
              <p className="text-blue-200/30 text-xs mt-0.5">Looking forward to our conversation!</p>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 border-0 px-6"
              onClick={() => navigate("/store")}
            >
              Browse Resources
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white px-6"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Minimal dark footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-xs text-blue-200/30">© {new Date().getFullYear()} Ryland Partners. All rights reserved.</p>
      </footer>
    </div>
  );
}
