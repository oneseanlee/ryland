import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HlsVideoBackground from "@/components/HlsVideoBackground";
import PageMeta from "@/components/PageMeta";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { captureReferral, getReferralAffiliateId } from "@/lib/referralTracking";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Schema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().min(7, "Phone is required").max(20),
  businessName: z.string().trim().max(150).optional().or(z.literal("")),
  fundingAmount: z.string().trim().min(1, "Please select an amount"),
  creditScore: z.string().trim().min(1, "Please select a credit range"),
});

const FUNDING_OPTIONS = [
  "Under $25K",
  "$25K – $50K",
  "$50K – $100K",
  "$100K – $250K",
  "$250K+",
];

const CREDIT_OPTIONS = [
  "Below 580",
  "580 – 679",
  "680 – 719",
  "720+",
  "Not sure",
];

export default function AffiliateReferral() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    fundingAmount: "",
    creditScore: "",
  });

  // Capture ?ref= so the affiliate is attributed
  useEffect(() => {
    captureReferral();
  }, []);

  const refParam = params.get("ref") || getReferralAffiliateId() || "";

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fe[String(err.path[0])] = err.message;
      });
      setErrors(fe);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-affiliate-referral`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          apikey: SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ ...parsed.data, affiliateRef: refParam }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      toast.success("Thanks! Let's get you booked.");

      // Redirect to the GHL affiliate booking widget, preserving the referring partner
      const bookingUrl = new URL("https://link.rylandpartners.com/widget/booking/rpfgxBFIjZC7pWMCYBv9");
      if (refParam) bookingUrl.searchParams.set("ref", refParam);
      window.location.href = bookingUrl.toString();
    } catch (err: unknown) {
      console.error("Referral submit failed:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen selection:bg-blue-500/30 selection:text-white antialiased">
      <PageMeta
        title="Affiliate Referral | Ryland Partners"
        description="Submit your referral details and book a funding consultation."
      />
      <Navbar />

      <section className="relative overflow-hidden">
        <HlsVideoBackground overlay="bg-[#001F3F]/94" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/20 rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold text-cyan-300 uppercase tracking-wider mb-6 font-[Inter,sans-serif]">
              <Sparkles className="w-3.5 h-3.5" />
              Affiliate Referral
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 font-[Geist,sans-serif]">
              Tell Us About Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Funding Goals
              </span>
            </h1>
            <p className="text-blue-100/60 text-base sm:text-lg max-w-xl mx-auto">
              Share a few details and we'll match you with a funding strategist for a free consultation.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            onSubmit={onSubmit}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="fullName" className="text-white/70 text-sm">Full Name *</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="John Smith"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
                {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <Label htmlFor="email" className="text-white/70 text-sm">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="john@example.com"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone" className="text-white/70 text-sm">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
                {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="businessName" className="text-white/70 text-sm">Business Name</Label>
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  placeholder="Acme LLC (optional)"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </div>
              <div>
                <Label htmlFor="fundingAmount" className="text-white/70 text-sm">Funding Amount Needed *</Label>
                <select
                  id="fundingAmount"
                  value={form.fundingAmount}
                  onChange={(e) => update("fundingAmount", e.target.value)}
                  className="mt-1 w-full h-10 rounded-md bg-white/5 border border-white/10 text-white text-sm px-3"
                >
                  <option value="" className="bg-slate-900">Select an amount…</option>
                  {FUNDING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                  ))}
                </select>
                {errors.fundingAmount && <p className="text-xs text-red-400 mt-1">{errors.fundingAmount}</p>}
              </div>
              <div>
                <Label htmlFor="creditScore" className="text-white/70 text-sm">Credit Score Range *</Label>
                <select
                  id="creditScore"
                  value={form.creditScore}
                  onChange={(e) => update("creditScore", e.target.value)}
                  className="mt-1 w-full h-10 rounded-md bg-white/5 border border-white/10 text-white text-sm px-3"
                >
                  <option value="" className="bg-slate-900">Select a range…</option>
                  {CREDIT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                  ))}
                </select>
                {errors.creditScore && <p className="text-xs text-red-400 mt-1">{errors.creditScore}</p>}
              </div>
            </div>

            {refParam && (
              <p className="text-xs text-blue-200/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Referred by partner: <span className="text-blue-200/70 font-mono">{refParam}</span>
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 border-0"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
              ) : (
                "Continue to Booking"
              )}
            </Button>

            <p className="text-[11px] text-blue-200/40 text-center leading-relaxed">
              Educational consultation only. No guarantees of funding or specific outcomes.
            </p>
          </motion.form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
