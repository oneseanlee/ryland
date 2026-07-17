import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";
import FunnelProgressBar from "./FunnelProgressBar";
import PageMeta from "@/components/PageMeta";

interface Props {
  step: number;
  label: string;
  children: React.ReactNode;
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = sessionStorage.getItem("funnel_countdown");
    if (saved) return Math.max(0, parseInt(saved, 10));
    return 15 * 60; // 15 minutes
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);
        sessionStorage.setItem("funnel_countdown", String(next));
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <span className="font-mono font-bold text-white tabular-nums">
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

export default function FunnelLayout({ step, label, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-[#001228] font-[Manrope,sans-serif]">
      {/* Funnel routes are paid-traffic conversion pages — kept out of organic search so they don't compete with /funding and /credit-repair. */}
      <PageMeta title={`${label} | Ryland Partners`} description="Paid-traffic funnel page." noindex />
      {/* Shiny CTA styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .shiny-cta {
          position: relative; border-radius: 9999px; padding: 1.25rem 2.5rem; font-size: 1.125rem; line-height: 1.2; font-weight: 600; color: #ffffff;
          background: linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%);
          box-shadow: inset 0 2px 0 0 rgba(96,165,250,0.4), inset 0 -2px 0 0 rgba(30,58,138,0.6), 0 8px 30px -6px rgba(30,64,175,0.5);
          cursor: pointer; border: none; transition: box-shadow 0.3s ease, transform 0.15s ease;
        }
        .shiny-cta:hover { box-shadow: inset 0 2px 0 0 rgba(96,165,250,0.4), inset 0 -2px 0 0 rgba(30,58,138,0.6), 0 0 30px rgba(59,130,246,0.3); }
        .shiny-cta:active { transform: translateY(1px); }
        .shiny-cta span { position:relative; z-index:2; display:inline-block; }
      `}} />

      {/* Urgency sticky header */}
      <header className="sticky top-0 z-50 bg-[#001228]/95 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link to="/">
            <img src={logoWhite} alt="Ryland Partners" className="h-6 w-auto opacity-90" />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-amber-300/80 text-xs uppercase tracking-wider font-semibold">Offer expires in</span>
              <div className="bg-amber-500/15 border border-amber-400/20 rounded-md px-2.5 py-1">
                <CountdownTimer />
              </div>
            </div>
            <div className="sm:hidden flex items-center gap-1.5">
              <span className="text-amber-300/80 text-[10px] uppercase tracking-wider font-semibold">Ends</span>
              <div className="bg-amber-500/15 border border-amber-400/20 rounded px-2 py-0.5">
                <CountdownTimer />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <FunnelProgressBar currentStep={step} label={label} />

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Minimal funnel footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-200/40">
          <span>© {new Date().getFullYear()} Ryland Partners. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white/60 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
