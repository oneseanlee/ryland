import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import proofSouthstate from "@/assets/proof-southstate.webp";
import proofTruist from "@/assets/proof-truist.webp";
import proofUsbank from "@/assets/proof-usbank.webp";
import proofBoa from "@/assets/proof-boa.webp";
import proofAmex from "@/assets/proof-amex.webp";
import proofIbc from "@/assets/proof-ibc.webp";
import proofBoa12k from "@/assets/proof-boa-12k.webp";
import proofBoa24k from "@/assets/proof-boa-24k.webp";
import proofCitizens7k from "@/assets/proof-citizens-7k.webp";
import proofBankUnited16k from "@/assets/proof-bankunited-16k.webp";
import proofNihfcu38k from "@/assets/proof-nihfcu-38k.webp";
import proofFnbo15k from "@/assets/proof-fnbo-15k.webp";
import proofFnbo45k from "@/assets/proof-fnbo-45k.webp";
import profileBradley from "@/assets/profile-bradley.jpg";
import profileMichael from "@/assets/profile-michael.jpg";
import proofAmexBbc from "@/assets/proof-amex-bbc.webp";
import InfiniteGrid from "@/components/ui/infinite-grid";
import HlsVideoBackground from "@/components/HlsVideoBackground";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

import PageMeta from "@/components/PageMeta";
import PartnerSignupForm from "@/components/PartnerSignupForm";
import {
  DollarSign, ShieldCheck, Users, Handshake,
  Link2, Share2, Wallet, Megaphone, GraduationCap,
  Briefcase, Calculator, LineChart, UserCheck,
  Building2, ChevronDown, CheckCircle2, FileText,
  Video, CreditCard, MessagesSquare, Check
} from "lucide-react";

/* ── Shared animation variants ── */
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: EASE },
};

const stagger = (delay: number) => ({
  ...fadeUp,
  transition: { duration: 0.6, ease: EASE, delay },
});

/* ── Timeline step sub-component ── */
const TimelineStep = ({ step, icon: Icon, title, desc, index, total }: {
  step: string; icon: React.ElementType; title: string; desc: string; index: number; total: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="relative flex flex-col items-center text-center md:flex-1">
      {/* Connecting line (desktop only, not on last) */}
      {index < total - 1 && (
        <div className="hidden md:block absolute top-8 left-[calc(50%+32px)] right-0 h-[2px] bg-slate-200 overflow-hidden">
          <motion.div
            className="h-full bg-[#3b82f6]"
            initial={{ width: "0%" }}
            animate={inView ? { width: "100%" } : {}}
            transition={{ duration: 0.8, delay: 0.3 + index * 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      )}

      {/* Large background number */}
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[80px] font-bold text-slate-100 font-manrope leading-none select-none pointer-events-none">
        {step}
      </span>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: index * 0.15 }}
      >
        {/* Icon circle */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#003A70] to-[#0060A9] shadow-lg shadow-blue-500/20">
          <Icon className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2 font-manrope">{title}</h3>
        <p className="text-[15px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">{desc}</p>
      </motion.div>
    </div>
  );
};

const Partners = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const faqs = [
    { q: "Do I get paid even if the business owner doesn't take the funding?", a: "Yes! As long as the business owner you refer qualifies for our funding, you get paid — even if they decide not to take the funding. You're rewarded for the introduction, not the close." },
    { q: "How much can I earn per qualified referral?", a: "Earnings vary based on the funding amount and product type. Our partner team will walk you through the commission structure during onboarding. There's no cap on what you can earn." },
    { q: "How do I know if someone qualifies?", a: "Generally, a business owner qualifies if they have an active business with consistent revenue. Once they complete a short questionnaire, we handle the rest and let you know." },
    { q: "Is this program only for professional affiliates?", a: "Not at all. Whether you're a credit repair business owner, consultant, coach, or just someone who knows business owners — you're welcome to apply." },
    { q: "What tools and support do I get?", a: "You'll receive done-for-you marketing assets, email templates, ad creatives, live monthly trainings, and access to our private partner community." },
    { q: "How and when do I get paid?", a: "Commissions are paid on a regular schedule. Most partners see their first commission within days of their referral qualifying." },
    { q: "Is there any cost to join?", a: "No. The Ryland Partners program is completely free to join. There are no hidden fees or upfront costs." },
    { q: "How do I contact the partner team?", a: "Once you're approved, you'll have direct access to our partner support team. You can also reach us through the partner portal or community." },
  ];

  const personas = [
    { icon: ShieldCheck, label: "Credit Repair Business Owners" },
    { icon: Megaphone, label: "Marketing Agency Owners" },
    { icon: Calculator, label: "Accountants" },
    { icon: Briefcase, label: "Consultants" },
    { icon: LineChart, label: "Financial Advisors" },
    { icon: GraduationCap, label: "Business Coaches" },
    { icon: Users, label: "Community Builders" },
    { icon: Building2, label: "Real Estate Agents" },
  ];

  const processSteps = [
    { step: "01", icon: Link2, title: "Get Your Partner Link", desc: "Apply and get approved. You'll receive your unique referral link — the engine of your money-making machine." },
    { step: "02", icon: Share2, title: "Refer Business Owners", desc: "Follow our proven step-by-step strategy. Our trainings, live calls, and done-for-you marketing assets guide you to maximize profits." },
    { step: "03", icon: Wallet, title: "Get Paid", desc: "You get paid for every client you refer who qualifies. Even if they don't take the funding — you still keep your share." },
  ];

  const serviceSteps = [
    { step: "01", icon: UserCheck, title: "Get Approved", desc: "The businesses you refer fill out a quick questionnaire and get approved in less than 2 minutes." },
    { step: "02", icon: LineChart, title: "Find The Best Terms", desc: "They choose terms tailored to their budget so they can comfortably manage their funding." },
    { step: "03", icon: DollarSign, title: "Ready To Scale", desc: "They can immediately access funds up to $250,000 after linking their business checking account." },
  ];

  return (
    <div className="min-h-screen selection:bg-blue-500/30 selection:text-white antialiased text-slate-900">
      <PageMeta
        title="Become A Partner | Ryland Partners"
        description="Join the Ryland Partners program and earn uncapped commissions by referring business owners to our funding services. 100% free to join."
      />
      

      {/* Background grid — only visible behind light sections */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-white pointer-events-none">
        <InfiniteGrid baseGridColor="rgba(148, 163, 184, 0.20)" activeGridColor="rgba(59, 130, 246, 0.45)" />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scrollUp { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @keyframes scrollDown { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
        [data-scroll-column="1"] { animation: scrollUp 25s linear infinite; }
        [data-scroll-column="2"] { animation: scrollDown 25s linear infinite; }
        [data-scroll-column="3"] { animation: scrollUp 25s linear infinite; }
        [data-scroll-column]:hover { animation-play-state: paused; }
      `}} />

      <Navbar />

      {/* ═══════════════════════ 1. HERO ═══════════════════════ */}
      <section className="relative mx-4 sm:mx-6 lg:mx-auto max-w-7xl min-h-[85vh] flex items-center justify-center overflow-hidden rounded-2xl border border-[#004E8C]">
        <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-2xl" />

        <div className="relative z-10 max-w-3xl mx-auto text-center px-6 py-24 md:py-32">
          {/* Floating badge */}
          <motion.div {...stagger(0)} className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/20 px-5 py-2 text-[13px] font-medium tracking-[0.05em] uppercase text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              Free To Join — No Selling Required
            </span>
          </motion.div>

          <motion.h1
            {...stagger(0.1)}
            className="text-[42px] leading-[0.95] sm:text-[60px] lg:text-[76px] font-medium tracking-[-0.04em] font-geist bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500"
          >
            Get Paid To Help Business Owners Access Capital
          </motion.h1>

          <motion.p {...stagger(0.2)} className="mt-6 text-lg md:text-xl text-blue-300/90 font-medium italic">
            even if they don't take the funding
          </motion.p>

          <motion.p {...stagger(0.25)} className="mt-5 text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Welcome to the Ryland Partners Program. You help business owners access capital — and we also offer full-service credit repair and optimization options so you can serve them end-to-end. Ready to start earning?
          </motion.p>

          {/* CTA */}
          <motion.div {...stagger(0.35)} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => setFormOpen(true)} className="shiny-cta !py-4 !px-10 !text-lg">
              <span>Apply To Become A Partner</span>
            </button>
            <a
              href="/portal/login"
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 backdrop-blur-sm px-8 py-4 text-base font-medium text-white hover:bg-white/10 hover:border-white/40 transition-all"
            >
              Partner Portal Login →
            </a>
          </motion.div>

          {/* Trust strip */}
          <motion.div {...stagger(0.45)} className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[13px] tracking-[0.04em] uppercase text-slate-400">
            {["100% Free", "Get Paid on Qualification", "No Cap on Earnings"].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-blue-400" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ 2. VALUE PILLARS — Asymmetric Grid ═══════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-[120px] md:py-[140px]">
        <motion.div {...fadeUp} className="text-center mb-16">
          <p className="text-[13px] font-medium tracking-[0.08em] uppercase text-[#3b82f6] mb-3">Why Partner With Us</p>
          <h2 className="font-manrope text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-slate-900">
            Three Reasons To Join Today
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Featured large card */}
          <motion.div
            {...stagger(0.1)}
            className="md:row-span-2 bg-slate-50 border-l-4 border-l-[#3b82f6] rounded-2xl p-10 md:p-12 flex flex-col justify-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#003A70] to-[#0060A9] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3 font-manrope">Get Paid For Introductions</h3>
            <p className="text-[16px] text-slate-500 leading-[1.7]">
              You don't need to close the deal. Just refer a business that qualifies for funding — and you get paid. It's fast, easy, and completely hands-off.
            </p>
          </motion.div>

          {/* Stacked right cards */}
          {[
            { icon: LineChart, title: "$10M+ Funded And Counting", desc: "Backed by real results and proven infrastructure. You'll get full support, access to our marketing system, and earn unlimited commissions." },
            { icon: Handshake, title: "Strengthen Your Network", desc: "Help people in your network get the capital they need — and profit while doing it. Position yourself as the go-to person for business funding." },
          ].map((item, i) => (
            <motion.div
              key={i}
              {...stagger(0.2 + i * 0.1)}
              className="bg-slate-50 border-l-4 border-l-[#3b82f6] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#003A70] to-[#0060A9] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 font-manrope">{item.title}</h3>
              <p className="text-[15px] text-slate-500 leading-[1.7]">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════ 3. COPY BLOCK — Editorial ═══════════════════════ */}
      <section className="pb-[120px]" id="how-it-works">
        <div className="max-w-6xl mx-auto px-6">
          {/* Gradient divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#3b82f6]/30 to-transparent mb-[120px]" />
        </div>

        <div className="max-w-3xl mx-auto px-6 md:px-0">
          <motion.h2
            {...fadeUp}
            className="font-manrope text-[32px] md:text-[40px] font-bold tracking-[-0.03em] text-slate-900 mb-8"
          >
            Here's How Ryland Partners Turns Your Connections Into Commissions
          </motion.h2>

          <div className="space-y-5 text-[17px] text-slate-600 leading-[1.8]">
            <motion.p {...stagger(0.1)}>
              Most affiliate programs only pay you if someone buys. If a deal closes. If they say yes.
            </motion.p>
            <motion.p {...stagger(0.15)} className="text-[32px] font-bold text-[#3b82f6] leading-tight">
              Not us.
            </motion.p>
            <motion.p {...stagger(0.2)}>
              We'll put money in your pocket as soon as your referral qualifies — not when they fund.
            </motion.p>
            <motion.p {...stagger(0.25)}>
              If you want to bring in extra cash without:
            </motion.p>

            <ul className="space-y-3 pl-1">
              {["Hard selling anyone", "Spending time on funnels, sales, or tech", "Chasing commissions"].map((item, i) => (
                <motion.li
                  key={i}
                  {...stagger(0.3 + i * 0.1)}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-[#3b82f6] shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </motion.li>
              ))}
            </ul>

            <motion.p {...stagger(0.6)} className="text-slate-900 font-semibold text-xl pt-2">
              The Ryland Partners Program Is Perfect For You…
            </motion.p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-[#3b82f6]/30 to-transparent mt-[120px]" />
        </div>
      </section>

      {/* ═══════════════════════ 4. 3-STEP PROCESS — Timeline ═══════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 pb-[120px]">
        <motion.div {...fadeUp} className="text-center mb-16">
          <p className="text-[13px] font-medium tracking-[0.08em] uppercase text-[#3b82f6] mb-3">How It Works</p>
          <h2 className="font-manrope text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-slate-900 mb-4">
            Monetize Your Network In 3 Simple Steps
          </h2>
          <p className="text-slate-500 text-[17px] max-w-xl mx-auto leading-relaxed">
            Follow our proven system and start earning commissions with zero selling.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-12 md:gap-0">
          {processSteps.map((s, i) => (
            <TimelineStep key={i} {...s} index={i} total={processSteps.length} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════ 5. PERFECT FOR — Pill Tags ═══════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-[120px]">
        <motion.div {...fadeUp} className="text-center mb-12">
          <p className="text-[13px] font-medium tracking-[0.08em] uppercase text-[#3b82f6] mb-3">Who It's For</p>
          <h2 className="font-manrope text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-slate-900">
            The Ryland Partners Program Is Perfect For
          </h2>
        </motion.div>

        <motion.div {...stagger(0.1)} className="flex flex-wrap justify-center gap-3 md:gap-4">
          {personas.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="inline-flex items-center gap-2.5 rounded-full bg-slate-100 px-5 py-3 text-[15px] font-medium text-slate-800 border border-slate-200 hover:border-[#3b82f6]/40 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 cursor-default"
            >
              <p.icon className="h-4.5 w-4.5 text-[#3b82f6]" />
              {p.label}
            </motion.div>
          ))}
        </motion.div>

        <motion.p {...stagger(0.5)} className="text-center text-slate-500 mt-10 text-[15px] font-medium italic">
          OR anyone who knows business owners!
        </motion.p>

        <motion.div {...stagger(0.6)} className="text-center mt-12">
          <button onClick={() => setFormOpen(true)} className="shiny-cta !py-4 !px-10 !text-lg">
            <span>Become A Partner Now</span>
          </button>
        </motion.div>
      </section>

      {/* ═══════════════════════ 6. SUPPORT & RESOURCES — Icon Grid ═══════════════════════ */}
      <section className="pb-[120px]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-[13px] font-medium tracking-[0.08em] uppercase text-[#3b82f6] mb-3">Your Success Toolkit</p>
            <h2 className="font-manrope text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-slate-900 mb-4">
              Everything You Need To Succeed
            </h2>
            <p className="text-slate-500 text-[17px] max-w-xl mx-auto leading-relaxed">
              We provide all the direction, guidance, and support you need.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: FileText, title: "Done-For-You Marketing", desc: "Ad creatives, email swipes, templates, and PDFs. Just plug, play, and start earning." },
              { icon: Video, title: "Live Monthly Trainings", desc: "Join monthly trainings with ongoing support. Never feel stuck — we'll guide you step-by-step." },
              { icon: CreditCard, title: "Get Paid Fast", desc: "Most partners start seeing commissions within just a few days — not weeks." },
              { icon: MessagesSquare, title: "Community Support", desc: "Join our members-only community to share wins, ask questions, and stay connected." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center pt-8 border-t border-slate-200 group"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#003A70] to-[#0060A9] shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 font-manrope">{item.title}</h3>
                <p className="text-[15px] text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 7. EASIEST MONEY CTA — Full-Bleed Dark ═══════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#001228] via-[#002040] to-[#001228] py-[120px]">
        {/* Radial glow behind CTA */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#3b82f6]/8 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <motion.h2
            {...fadeUp}
            className="font-manrope text-[36px] md:text-[52px] font-bold tracking-[-0.03em] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500 mb-8"
          >
            This Is The Easiest Money You've Never Made
          </motion.h2>

          <div className="space-y-4 text-[17px] text-slate-400 leading-relaxed">
            <motion.p {...stagger(0.1)}>
              And the business owners you know? <span className="text-white font-medium">They already need this!</span>
            </motion.p>
            <motion.p {...stagger(0.2)}>You already know the business owners.</motion.p>
            <motion.p {...stagger(0.3)}>They already trust you.</motion.p>
            <motion.p {...stagger(0.4)}>You just need a partner link to send over to them.</motion.p>
          </div>

          <motion.div {...stagger(0.5)} className="mt-12">
            <button onClick={() => setFormOpen(true)} className="shiny-cta !py-4 !px-10 !text-lg">
              <span>Become A Partner Now</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ 8. HOW WE SERVICE REFERRALS — Timeline ═══════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-[120px]">
        <motion.div {...fadeUp} className="text-center mb-16">
          <p className="text-[13px] font-medium tracking-[0.08em] uppercase text-[#3b82f6] mb-3">The Client Experience</p>
          <h2 className="font-manrope text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-slate-900 mb-4">
            How We Service The Business Owners You Refer
          </h2>
          <p className="text-slate-500 text-[17px] max-w-xl mx-auto leading-relaxed">
            A seamless experience for your referrals — from application to funded.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-12 md:gap-0">
          {serviceSteps.map((s, i) => (
            <TimelineStep key={i} {...s} index={i} total={serviceSteps.length} />
          ))}
        </div>

        {/* Full-service banner */}
        <motion.div
          {...stagger(0.3)}
          className="mt-12 rounded-xl bg-gradient-to-r from-[#003A70]/5 to-blue-50 border border-blue-200 p-6 text-center"
        >
          <p className="text-blue-700 font-medium text-[15px] leading-relaxed">
            <span className="text-blue-900 font-semibold">Full-service option:</span>{" "}
            In addition to capital, the business owners you refer can also access our{" "}
            <span className="text-blue-900 font-semibold">Credit Repair &amp; Credit Optimization</span>{" "}
            services — so you can offer them a complete path to stronger credit and better funding.
          </p>
        </motion.div>

        {/* Info banner */}
        <motion.div
          {...stagger(0.4)}
          className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-5 text-center"
        >
          <p className="text-blue-700 font-medium text-[15px]">
            And remember, as long as they qualify (even if they don't take the funding),{" "}
            <span className="text-blue-900 font-semibold">you get paid!</span>
          </p>
        </motion.div>
      </section>

      {/* ═══════════════════════ 9. REAL RESULTS — Scrolling Wall of Love ═══════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 pb-[120px]">
        <motion.div {...fadeUp} className="text-center mb-12">
          <p className="text-[13px] font-medium tracking-[0.08em] uppercase text-[#3b82f6] mb-3">Real Proof. Real Clients.</p>
          <h2 className="font-manrope text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-slate-900 mb-4">
            These Are The Results Your Referrals Get
          </h2>
          <p className="text-slate-500 text-[17px] max-w-xl mx-auto leading-relaxed">
            When you refer a business owner to Ryland Partners, this is what happens next.
          </p>
        </motion.div>

        {/* 3-column vertical scroll wall */}
        <div className="relative overflow-hidden h-[420px] md:h-[600px] rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {/* Column 1 — scrolls up */}
            <div data-scroll-column="1" className="flex flex-col gap-4">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex flex-col gap-4">
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofBoa12k} alt="Bank of America $12K Business Credit Approval" className="w-full object-cover" loading="lazy" />
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] bg-gradient-to-br from-[#0060A9] to-[#003A70] p-6 text-white">
                    <div className="flex items-center gap-3">
                      <img src={profileBradley} alt="Bradley A." className="size-9 object-cover rounded-full" />
                      <div>
                        <span className="text-base font-semibold text-zinc-100">Bradley A.</span>
                        <p className="text-sm text-zinc-400">Business Owner</p>
                      </div>
                    </div>
                    <p className="mt-4 text-base text-zinc-300 leading-relaxed">"The funding process was seamless. I got $24k at 0% interest for 12 months. Changed my entire business trajectory."</p>
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofCitizens7k} alt="Citizens Bank $7K Business Card Approval" className="w-full object-cover" loading="lazy" />
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofSouthstate} alt="SouthState Visa Business Card — $9,000 approved" className="w-full object-cover" loading="lazy" />
                  </article>
                </div>
              ))}
            </div>

            {/* Column 2 — scrolls down */}
            <div data-scroll-column="2" className="hidden md:flex flex-col gap-4">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex flex-col gap-4">
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofFnbo45k} alt="FNBO $45K 0% Business Credit in 3 Days" className="w-full object-cover" loading="lazy" />
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] bg-gradient-to-br from-[#0060A9] to-[#003A70] p-6 text-white">
                    <div className="flex items-center gap-3">
                      <img src={profileMichael} alt="Michael G." className="size-9 object-cover rounded-full" />
                      <div>
                        <span className="text-base font-semibold text-zinc-100">Michael G.</span>
                        <p className="text-sm text-zinc-400">Real Estate Investor</p>
                      </div>
                    </div>
                    <p className="mt-4 text-base text-zinc-300 leading-relaxed">"Ryland Partners fixed my credit when no one else could. My score is up 115 points and I just closed on my first investment property."</p>
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofBankUnited16k} alt="BankUnited $16K Visa Business Card Approval" className="w-full object-cover" loading="lazy" />
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofTruist} alt="Truist Business credit card approved" className="w-full object-cover" loading="lazy" />
                  </article>
                </div>
              ))}
            </div>

            {/* Column 3 — scrolls up */}
            <div data-scroll-column="3" className="hidden md:flex flex-col gap-4">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex flex-col gap-4">
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofNihfcu38k} alt="NIHFCU $38K Total CC Funding" className="w-full object-cover" loading="lazy" />
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] bg-gradient-to-br from-[#0060A9] to-[#003A70] p-6 text-white">
                    <div className="flex items-center gap-3">
                      <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces" alt="Carlos R." className="size-9 object-cover rounded-full" />
                      <div>
                        <span className="text-base font-semibold text-zinc-100">Carlos R.</span>
                        <p className="text-sm text-zinc-400">CEO, Rivera Ventures</p>
                      </div>
                    </div>
                    <p className="mt-4 text-base text-zinc-300 leading-relaxed">"Switching to Ryland was the best decision this year. Fully transparent, and measurable results from day one."</p>
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofAmexBbc} alt="American Express Blue Business Cash Card Approval" className="w-full object-cover" loading="lazy" />
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofFnbo15k} alt="FNBO $15K 0% Business Credit Approval" className="w-full object-cover" loading="lazy" />
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key stat strip */}
        <motion.div
          {...stagger(0.3)}
          className="mt-10 grid grid-cols-3 gap-4 text-center"
        >
          {[
            { stat: "$150M+", label: "Funding Secured" },
            { stat: "10K+", label: "Entrepreneurs Helped" },
            { stat: "0%", label: "Intro APR" },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl bg-slate-50 border border-slate-200 py-6 px-4">
              <p className="text-3xl md:text-4xl font-bold text-[#0060A9] font-manrope tracking-tight">{item.stat}</p>
              <p className="text-sm text-slate-500 mt-1 font-medium">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════ 10. FAQ — Clean Accordion ═══════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 pb-[120px]" id="faq">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="font-manrope text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-slate-900">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="text-[15px] font-semibold text-slate-900 pr-6 group-hover:text-[#0060A9] transition-colors">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-[15px] text-slate-500 leading-[1.7]">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════ 10. FINAL CTA — Full-Bleed Hero ═══════════════════════ */}
      <section className="relative overflow-hidden" id="cta">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="border border-[#004E8C] rounded-3xl shadow-2xl text-white relative overflow-hidden">
            <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-3xl" staticOnly />

            {/* Radial glow */}
            <div className="absolute inset-0 pointer-events-none z-[1]">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-[#3b82f6]/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 text-center mx-auto max-w-3xl py-20 px-6 md:py-28 md:px-16">
              <motion.h2
                {...fadeUp}
                className="text-[36px] md:text-[52px] lg:text-[60px] font-bold tracking-[-0.03em] bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent font-manrope"
              >
                Click Below. Become A Partner. Get Paid To Be A Connector.
              </motion.h2>

              <motion.p
                {...stagger(0.15)}
                className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
              >
                Join thousands of partners already earning commissions with Ryland Partners. No cost to join. No selling required.
              </motion.p>

              <motion.div {...stagger(0.3)} className="mt-10">
                <button onClick={() => setFormOpen(true)} className="shiny-cta !py-4 !px-10 !text-lg">
                  <span>Start Earning Now</span>
                </button>
              </motion.div>

              {/* Trust chips */}
              <motion.div
                {...stagger(0.4)}
                className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[13px] tracking-[0.04em] uppercase text-slate-400"
              >
                {["100% free to join", "Get paid even if they don't fund", "No cap on earnings"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-400" />
                    {t}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <PartnerSignupForm open={formOpen} onOpenChange={setFormOpen} />
      <Footer />
    </div>
  );
};

export default Partners;
