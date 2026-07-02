import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { VolumeX, Volume2, Rocket, LayoutDashboard, ShieldCheck, Handshake } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import heroPortrait from "@/assets/hero-portrait.png";
import asSeenOn from "@/assets/as-seen-on.png";
import geneRylandAbout from "@/assets/gene-ryland-about.png";
import logoUsBank from "@/assets/logo-usbank.png";
import logoBoa from "@/assets/logo-boa.png";
import logoNavyFed from "@/assets/logo-navyfed.png";
import logoChase from "@/assets/logo-chase.png";
import logoTruist from "@/assets/logo-truist.png";
import profileBradley from "@/assets/profile-bradley.jpg";
import profileMichael from "@/assets/profile-michael.jpg";
import InfiniteGrid from "@/components/ui/infinite-grid";
import { lazy } from "react";
const FundingJourney = lazy(() => import("@/components/FundingJourney"));
import HlsVideoBackground from "@/components/HlsVideoBackground";
import iconFunding from "@/assets/icon-funding.png";
import iconCredit from "@/assets/icon-credit.png";
import iconCommunity from "@/assets/icon-community.png";
import iconProducts from "@/assets/icon-products.png";
import iconPartner from "@/assets/icon-partner.png";
import proofSouthstate from "@/assets/proof-southstate.webp";
import proofTruist from "@/assets/proof-truist.webp";
import proofUsbank from "@/assets/proof-usbank.webp";
import proofBoa from "@/assets/proof-boa.webp";
import proofAmex from "@/assets/proof-amex.webp";
import proofIbc from "@/assets/proof-ibc.webp";
import iconConsultation from "@/assets/icon-consultation.png";
import { motion } from "framer-motion";
import successFunding from "@/assets/success-funding.jpg";
import successCredit from "@/assets/success-credit.webp";
import successEmpire from "@/assets/success-empire.webp";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageMeta from "@/components/PageMeta";

import geneHeroHeadshot from "@/assets/gene-hero-headshot.jpg";
import geneHeroBlazer from "@/assets/gene-hero-blazer.jpg";

const DISCLAIMER_TEXT = "Terms apply. We provide financial education; specific funding amounts are not guaranteed.";

const FAQ_DATA = [
  { q: "Do I need revenue to get funded?", a: "No. We specialize in startup funding based on credit strength, not just history." },
  { q: "How long does the credit education take?", a: "Most clients see meaningful progress after implementing our strategies consistently. Results depend on your unique credit profile and how quickly you take action." },
  { q: "What is the Skool community?", a: "It is our private network where we teach you how to invest your funding into high-ROI digital businesses." },
  { q: "Is the assessment really free?", a: "Yes. It is a soft-pull only and will not impact your credit score." },
];

const Index = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen selection:bg-blue-500/30 selection:text-white antialiased text-slate-900">
      <PageMeta
        title="Ryland Partners | Business Credit Education & Financial Strategy"
        description="Discover high-limit business credit strategies with Ryland Partners. Education-first approach to business funding, credit optimization, and the digital economy."
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-blur:hover img { filter: blur(4px); }
        .hover-blur figcaption { opacity: 0; transition: opacity 0.3s; }
        .hover-blur:hover figcaption { opacity: 1; }
        .card-glow { transition: all 0.3s; }
        .card-glow:hover { transform: translateY(-2px); }
        .card-glow:hover .glow-bg { opacity: 1; }
        .glow-bg { opacity: 0; transition: opacity 0.3s; }
        .rotate-x-5 { --tw-rotate-x: 5deg; transform: translate3d(var(--tw-translate-x, 0), var(--tw-translate-y, 0), var(--tw-translate-z, 0)) rotateX(var(--tw-rotate-x, 0)) rotateY(var(--tw-rotate-y, 0)) rotateZ(var(--tw-rotate-z, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1)) !important; }
        .perspective-none { perspective: none !important; }
        .perspective-dramatic { perspective: 100px !important; }
        .perspective-near { perspective: 300px !important; }
        .perspective-normal { perspective: 500px !important; }
        .perspective-midrange { perspective: 800px !important; }
        .perspective-distant { perspective: 1200px !important; }
        .transform-style-preserve-3d { transform-style: preserve-3d !important; }
        .transform-style-flat { transform-style: flat !important; }
        .gradient-blur { position: fixed; z-index: 5; inset: 0 0 auto 0; height: 12%; pointer-events: none; }
        .gradient-blur>, .gradient-blur::before, .gradient-blur::after { position: absolute; inset: 0; }
        .gradient-blur::before { content: ""; z-index: 1; backdrop-filter: blur(0.5px); mask: linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 37.5%); }
        .gradient-blur>div:nth-of-type(1) { z-index: 2; backdrop-filter: blur(1px); mask: linear-gradient(to top, rgba(0,0,0,0) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 37.5%, rgba(0,0,0,0) 50%); }
        .gradient-blur>div:nth-of-type(2) { z-index: 3; backdrop-filter: blur(2px); mask: linear-gradient(to top, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 37.5%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 62.5%); }
        .gradient-blur>div:nth-of-type(3) { z-index: 4; backdrop-filter: blur(4px); mask: linear-gradient(to top, rgba(0,0,0,0) 37.5%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 62.5%, rgba(0,0,0,0) 75%); }
        .gradient-blur>div:nth-of-type(4) { z-index: 5; backdrop-filter: blur(8px); mask: linear-gradient(to top, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 62.5%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 87.5%); }
        .gradient-blur>div:nth-of-type(5) { z-index: 6; backdrop-filter: blur(16px); mask: linear-gradient(to top, rgba(0,0,0,0) 62.5%, rgba(0,0,0,1) 75%, rgba(0,0,0,1) 87.5%, rgba(0,0,0,0) 100%); }
        .gradient-blur>div:nth-of-type(6) { z-index: 7; backdrop-filter: blur(32px); mask: linear-gradient(to top, rgba(0,0,0,0) 75%, rgba(0,0,0,1) 87.5%, rgba(0,0,0,1) 100%); }
        .gradient-blur::after { content: ""; z-index: 8; backdrop-filter: blur(64px); mask: linear-gradient(to top, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%); }
        @keyframes smoothCarousel { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .carousel-wrapper { animation: smoothCarousel 40s linear infinite; }
        .carousel-wrapper:hover { animation-play-state: paused; }
        @keyframes scrollUp { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @keyframes scrollDown { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
        [data-scroll-column="1"] { animation: scrollUp 25s linear infinite; }
        [data-scroll-column="2"] { animation: scrollDown 25s linear infinite; }
        [data-scroll-column="3"] { animation: scrollUp 25s linear infinite; }
        [data-scroll-column]:hover { animation-play-state: paused; }
        @keyframes marquee-rtl { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marquee-ltr { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[marquee-rtl_45s_linear_infinite\\], .animate-\\[marquee-ltr_45s_linear_infinite\\] { animation: none !important; }
        }
      `}} />

      {/* Animated Background - InfiniteGrid */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-white pointer-events-none">
        <InfiniteGrid baseGridColor="rgba(148, 163, 184, 0.5)" activeGridColor="rgba(59, 130, 246, 0.8)" />
      </div>

      <Navbar />

      {/* HERO */}
      <section className="relative max-w-7xl mx-4 sm:mx-6 lg:mx-auto mt-4 sm:mt-8 pt-10 sm:pt-16 pb-12 sm:pb-36 px-4 sm:px-8 lg:px-20 overflow-hidden rounded-2xl border border-[#004E8C]">
        <HlsVideoBackground overlay="bg-gradient-to-r from-[#003A70]/95 via-[#003A70]/75 to-[#004E8C]/50" className="rounded-2xl" />
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 relative z-10">
          <div className="text-center lg:text-left lg:flex-1 max-w-3xl">
            <h1 className="text-[28px] leading-[0.95] sm:text-[42px] md:text-[52px] lg:text-[64px] font-medium tracking-tighter font-geist text-center lg:text-left mt-4 sm:mt-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500">
              The Business Credit System Most Owners Never Knew Existed
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-400 mt-4 sm:mt-6 max-w-xl text-center lg:text-left leading-relaxed mx-auto lg:mx-0">
              We help entrepreneurs discover <span className="text-white font-semibold">high-limit business credit strategies</span>, optimize their credit, and master the digital economy.
            </p>
            <div className="flex flex-col mt-6 sm:mt-8 xl:mt-10 gap-4 items-center lg:items-start">
              <Link to="/assessment" className="inline-block bg-transparent">
                <button className="shiny-cta !py-3 !px-6 sm:!py-5 sm:!px-10 !text-sm sm:!text-lg focus:outline-none">
                  <span>Take the Free Funding Assessment</span>
                </button>
              </Link>
              <p className="text-[10px] text-zinc-500 max-w-xs text-center lg:text-left">{DISCLAIMER_TEXT}</p>
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 sm:gap-3 text-[11px] sm:text-sm text-zinc-500">
                <span>Instant Assessment</span>
                <span className="text-zinc-600">•</span>
                <span>No hard credit pull</span>
                <span className="text-zinc-600">•</span>
                <span>100% Secure</span>
              </div>
            </div>
          </div>
          <div className="relative lg:flex-1 flex justify-center mt-4 lg:mt-16 w-full">
            <div className="relative flex flex-col items-center gap-4 sm:gap-6 w-full max-w-sm sm:max-w-md lg:max-w-xl">
              <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full" />
              <div className="relative z-10 w-full">
                <img
                  src="/gene-hero-beard.webp"
                  alt="Gene Ryland — Business Credit Strategist"
                  fetchPriority="high"
                  width={1280}
                  height={1600}
                  className="w-full rounded-2xl border border-white/10 ring-1 ring-white/5 shadow-2xl shadow-blue-500/10 object-cover aspect-[4/5]"
                />
              </div>
              <div className="relative z-10 flex flex-col items-center mt-1 sm:mt-2">
                <p className="text-base sm:text-lg font-semibold text-white/90" style={{ fontVariant: 'small-caps', letterSpacing: '0.15em' }}>Gene Ryland</p>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-blue-300 font-medium mt-0.5">CEO &amp; Founder <span className="text-white/50 mx-1">|</span> Business Credit Strategist</p>
              </div>
              <img src={asSeenOn} alt="As seen on FOX, USA Today, Digital Journal, MarketWatch" width={1584} height={263} loading="lazy" className="relative z-10 w-full max-w-xs sm:max-w-sm lg:max-w-xl brightness-0 invert opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* Logos Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 mb-16 pt-8 pb-6 relative">
        <div className="text-center">
          <p className="uppercase text-sm font-medium text-slate-500 tracking-wide">TRUSTED BANKING PARTNERS</p>
        </div>
        <div className="overflow-hidden mt-6 relative">
          <div style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
            <div className="flex carousel-wrapper gap-x-10 lg:gap-x-20">
              <div className="flex gap-10 shrink-0 lg:gap-x-20 items-center">
                <img src={logoChase} alt="Chase" width={1622} height={480} loading="lazy" className="h-[32px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src={logoBoa} alt="Bank of America" width={1920} height={1080} loading="lazy" className="h-[40px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src={logoUsBank} alt="US Bank" width={1920} height={558} loading="lazy" className="h-[36px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src={logoNavyFed} alt="Navy Federal Credit Union" width={1920} height={1125} loading="lazy" className="h-[40px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src={logoTruist} alt="Truist" width={1280} height={297} loading="lazy" className="h-[32px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex shrink-0 gap-10 lg:gap-x-20 items-center">
                <img src={logoChase} alt="Chase" width={1622} height={480} loading="lazy" className="h-[32px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src={logoBoa} alt="Bank of America" width={1920} height={1080} loading="lazy" className="h-[40px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src={logoUsBank} alt="US Bank" width={1920} height={558} loading="lazy" className="h-[36px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src={logoNavyFed} alt="Navy Federal Credit Union" width={1920} height={1125} loading="lazy" className="h-[40px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                <img src={logoTruist} alt="Truist" width={1280} height={297} loading="lazy" className="h-[32px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About section */}
      <section className="overflow-hidden mt-4 sm:mt-8 mb-8 sm:mb-12 pt-16 sm:pt-24 pb-16 sm:pb-24 relative" id="about">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs sm:text-sm text-slate-500 mb-4">Meet The Founder</p>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-slate-900 mb-6" style={{ maskImage: 'linear-gradient(to bottom, black 40%, rgba(0,0,0,0.5))', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, rgba(0,0,0,0.5))' }}>Gene Ryland</h2>
            <p className="text-lg text-slate-500">CEO &amp; Founder, Ryland Partners</p>
          </div>
          <div className="border border-[#004E8C] rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl overflow-visible relative">
            <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-3xl" staticOnly />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center relative z-10">
              <div className="relative flex justify-center -mt-20 sm:-mt-32 md:-mt-56 lg:-mt-64">
                <img src={geneRylandAbout} alt="Gene Ryland — Founder of Ryland Partners" loading="lazy" width={1178} height={1667} className="relative z-10 w-full max-w-[16rem] sm:max-w-[20rem] md:max-w-[26rem] lg:max-w-[30rem] object-cover drop-shadow-2xl" />
              </div>
              <div className="space-y-6">
                <p className="text-white/80 leading-relaxed text-base">Gene Ryland is a serial entrepreneur and business funding strategist who has dedicated his career to helping founders unlock the capital they need to scale. With deep expertise in credit optimization, alternative lending, and strategic financial positioning, Gene has built Ryland Partners into a trusted name in the funding space.</p>
                <p className="text-white/80 leading-relaxed text-base">After experiencing firsthand how traditional banks overlook ambitious entrepreneurs, Gene created a system that bridges the gap — connecting business owners with high-limit lenders, credit-building strategies, and the education needed to secure six- and seven-figure funding packages.</p>
                <p className="text-white/80 leading-relaxed text-base">Today, Gene leads a growing community of funded founders through the Ryland Partners ecosystem — offering done-for-you services, a private academy, and direct lender access that most entrepreneurs never knew existed.</p>
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/20">
                  <div><p className="text-2xl md:text-3xl font-semibold text-white tracking-tight">$150M+</p><p className="text-xs text-white/70 mt-1">Funding Secured</p></div>
                  <div><p className="text-2xl md:text-3xl font-semibold text-white tracking-tight">10K+</p><p className="text-xs text-white/70 mt-1">Entrepreneurs Helped</p></div>
                  <div><p className="text-2xl md:text-3xl font-semibold text-white tracking-tight">8+</p><p className="text-xs text-white/70 mt-1">Years of Experience</p></div>
                </div>
                <div className="pt-4">
                  <Link to="/contact" className="inline-flex transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,123,255,0.8)] hover:scale-[1.02] hover:bg-gradient-to-tr hover:from-blue-300 hover:via-blue-500 hover:to-blue-700 active:shadow-inner active:shadow-blue-900/50 active:scale-[0.98] active:duration-75 text-sm font-semibold text-white bg-gradient-to-tr from-blue-400 via-blue-600 to-blue-800 rounded-full py-3.5 px-8 shadow-[0_4px_15px_rgba(0,123,255,0.4)] items-center justify-center">
                    Work With Gene
                  </Link>
                  <p className="text-[10px] text-white/60 mt-2">{DISCLAIMER_TEXT}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funding Journey */}
      <FundingJourney />

      {/* Who This Is For */}
      <section className="sm:pt-24 md:pt-20 pt-24 pb-20 relative" id="showcase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest mb-3">Who This Is For</p>
            <h2 className="text-2xl sm:text-5xl font-medium text-slate-900 tracking-tighter">Designed for the Ambitious</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "Rocket", title: "The Scale-Up", desc: "Entrepreneurs ready to inject $100K+ into marketing or inventory." },
              { icon: "LayoutDashboard", title: "The Digital Architect", desc: "Founders building high-ROI Shopify or digital service businesses." },
              { icon: "ShieldCheck", title: "The Credit Restarter", desc: "Visionaries who need to clear the path to capital through CROA-compliant restoration." },
              { icon: "Handshake", title: "The Strategic Partner", desc: "Professionals (CPAs, Coaches, Agencies) looking to offer funding to their own clients." },
            ].map((card, i) => {
              const IconComp = { Rocket, LayoutDashboard, ShieldCheck, Handshake }[card.icon]!;
              return (
                <motion.div key={card.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: i * 0.1 }} className="group relative overflow-hidden rounded-2xl border border-[#004E8C] p-6 sm:p-8 text-white min-h-[200px]">
                   <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-2xl" staticOnly />
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 mb-5">
                      <IconComp className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold tracking-tight mb-2">{card.title}</h3>
                    <p className="text-sm text-white/70 leading-relaxed">{card.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Wealth ecosystem section */}
      <section className="mt-10 mb-0 pt-0 pb-0 relative" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tighter text-slate-900 font-manrope">How We Help You Move Forward</h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">Everything you need to build, fund, and scale your business</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: iconFunding, title: "Get Business Funding", desc: "Explore strategic business credit options — learn what you may qualify for based on your profile.", cta: "Learn More", href: "/funding" },
              { icon: iconCredit, title: "Optimize My Credit Profile", desc: "Done-for-you credit optimization with negative item analysis and dispute management.", cta: "Get Started", href: "/credit-repair" },
              { icon: iconCommunity, title: "Join The Community", desc: "Access our private Skool network and learn to invest your funding into high-ROI digital businesses.", cta: "Join Now", href: "/community" },
              { icon: iconProducts, title: "Shop Digital Products", desc: "Browse our curated collection of eBooks and digital resources to accelerate your business growth.", cta: "Shop Now", href: "/store" },
              { icon: iconPartner, title: "Become A Partner", desc: "Earn uncapped commissions by referring entrepreneurs to our funding programs. Free to join.", cta: "Partner Up", href: "/partners" },
              { icon: iconConsultation, title: "Schedule A Consultation", desc: "Book a 1-on-1 strategy session with our funding experts to map your personalized capital plan.", cta: "Book Now", href: "/consultation" },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: i * 0.08 }} whileHover={{ y: -4 }} className="relative overflow-hidden border border-[#004E8C] rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
                <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-2xl" staticOnly />
                <div className="relative z-10 flex flex-col items-center text-center flex-1">
                  <img src={card.icon} alt={card.title} loading="lazy" width={112} height={112} className="w-28 h-28 mx-auto mb-6 object-contain" />
                  <h3 className="text-xl font-bold text-white mb-3 font-manrope">{card.title}</h3>
                  <p className="text-sm text-zinc-300 mb-6 leading-relaxed">{card.desc}</p>
                  <Link to={card.href} className="mt-auto inline-flex transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] active:duration-75 text-sm font-semibold text-[#003A70] bg-white rounded-full py-3 px-8 items-center justify-center">
                    {card.cta}
                  </Link>
                  <p className="text-[9px] text-zinc-400 mt-2">{DISCLAIMER_TEXT}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-20 pt-8 pb-10 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-slate-500">Trusted by entrepreneurs</p>
            <h2 className="text-2xl sm:text-5xl font-medium text-slate-900 tracking-tighter pt-4 pb-4" style={{ maskImage: 'linear-gradient(250deg, transparent, black 25%, black 70%, transparent)', WebkitMaskImage: 'linear-gradient(250deg, transparent, black 25%, black 70%, transparent)' }}>Testimonials</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">4.9/5 · 2,431 reviews</span>
          </div>
        </div>
        <div className="relative overflow-hidden h-[420px] md:h-[600px] rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {/* Column 1 */}
            <div data-scroll-column="1" className="flex flex-col gap-4">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex flex-col gap-4">
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofSouthstate} alt="SouthState Visa Business Card — credit limit approved" loading="lazy" width={378} height={443} className="w-full object-cover" />
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] bg-gradient-to-br from-[#0060A9] to-[#003A70] p-6 text-white">
                    <div className="flex items-center gap-3">
                      <img src={profileBradley} alt="Bradley A." width={64} height={64} loading="lazy" className="size-9 object-cover rounded-full" />
                      <div><div className="flex items-center gap-1"><span className="text-base font-semibold text-zinc-100">Bradley A.</span></div><p className="text-sm text-zinc-300">Business Owner</p></div>
                    </div>
                    <p className="mt-4 text-base text-zinc-300 leading-relaxed">"The process was seamless. The team helped me understand my options and guided me every step of the way."</p>
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofBoa} alt="Bank of America — approved for business credit card" loading="lazy" width={378} height={368} className="w-full object-cover" />
                  </article>
                </div>
              ))}
            </div>
            {/* Column 2 */}
            <div data-scroll-column="2" className="hidden md:flex flex-col gap-4">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex flex-col gap-4">
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofTruist} alt="Truist Business credit card approved" loading="lazy" width={378} height={443} className="w-full object-cover" />
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] bg-gradient-to-br from-[#0060A9] to-[#003A70] p-6 text-white">
                    <div className="flex items-center gap-3">
                      <img src={profileMichael} alt="Michael G." width={64} height={64} loading="lazy" className="size-9 object-cover rounded-full" />
                      <div><div className="flex items-center gap-1"><span className="text-base font-semibold text-zinc-100">Michael G.</span></div><p className="text-sm text-zinc-300">Real Estate Investor</p></div>
                    </div>
                    <p className="mt-4 text-base text-zinc-300 leading-relaxed">"Ryland Partners helped me optimize my credit profile. My score improved significantly and I was able to close on my first investment property."</p>
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofAmex} alt="American Express approved — client celebration" loading="lazy" width={378} height={368} className="w-full object-cover" />
                  </article>
                </div>
              ))}
            </div>
            {/* Column 3 */}
            <div data-scroll-column="3" className="hidden md:flex flex-col gap-4">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex flex-col gap-4">
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofUsbank} alt="U.S. Bank — congratulations on your new credit card" loading="lazy" width={378} height={443} className="w-full object-cover" />
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] bg-gradient-to-br from-[#0060A9] to-[#003A70] p-6 text-white">
                    <div className="flex items-center gap-3">
                      <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces" alt="Carlos R." width={64} height={64} loading="lazy" className="size-9 object-cover rounded-full" />
                      <div><div className="flex items-center gap-1"><span className="text-base font-semibold text-zinc-100">Carlos R.</span></div><p className="text-sm text-zinc-300">CEO, Rivera Ventures</p></div>
                    </div>
                    <p className="mt-4 text-base text-zinc-300 leading-relaxed">"Switching to Ryland was the best decision this year. Intuitive process, fully transparent, and measurable results from day one."</p>
                  </article>
                  <article className="rounded-2xl border border-[#004E8C] overflow-hidden">
                    <img src={proofIbc} alt="IBC Visa credit card application approved" loading="lazy" width={378} height={368} className="w-full object-cover" />
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="md:p-10 max-w-7xl border border-[#004E8C] rounded-3xl mt-20 sm:mt-40 mx-4 sm:mx-auto pt-6 px-4 sm:px-6 pb-6 shadow-2xl text-white relative overflow-hidden">
        <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-3xl" staticOnly />
        <div className="mb-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="sm:text-5xl text-2xl font-medium text-white tracking-tighter text-left pt-6 pb-6" style={{ maskImage: 'linear-gradient(90deg, transparent, black 0%, black 45%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, black 0%, black 45%, transparent)' }}>Ryland Partners — Help &amp; FAQs</h2>
              <p className="mt-1 text-sm text-slate-300">Common questions about funding, credit, and our services.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 relative z-10">
          {FAQ_DATA.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex text-left w-full gap-x-4 items-center justify-between" aria-expanded={openFaq === i}>
                <span className="text-base md:text-lg font-semibold leading-6 tracking-tight text-slate-100">{faq.q}</span>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    {openFaq !== i && <path d="M12 5v14" />}
                  </svg>
                </span>
              </button>
              {openFaq === i && (
                <div className="mt-3 text-sm leading-6 text-slate-300">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-sky-300"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
            </span>
            <p className="text-sm text-slate-300">Still have questions? We're here to help.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/contact" className="inline-flex hover:bg-white/10 text-sm font-medium text-slate-200 bg-white/5 border-white/10 border rounded-full pt-3 pr-4 pb-3 pl-4 gap-x-2 items-center">
              Contact Support
            </Link>
            <Link to="/assessment" className="hover:shadow-lg transition-shadow text-sm font-medium text-slate-900 bg-white rounded-full pt-3 pr-5 pb-3 pl-5 shadow">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="my-10 max-w-7xl mx-4 sm:mx-auto border border-[#004E8C] rounded-3xl shadow-2xl text-white relative overflow-hidden" id="cta">
        <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-3xl" staticOnly />
        <div className="relative z-10 text-center mx-auto max-w-3xl py-16 px-6 md:py-24 md:px-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">
            Not Sure Where to Start?
           </h2>
          <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Learn what business credit options may work for your situation. Education-first approach. No guesswork.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/assessment" className="shiny-cta !py-4 !px-10 !text-lg">
              <span>Take the Free Assessment</span>
            </Link>
            <Link to="/store" className="hover:bg-white/10 transition-colors text-base text-white border-white/20 border rounded-full py-3 px-6">
              Explore Products
            </Link>
          </div>
           <p className="text-[10px] text-zinc-400 mt-4 max-w-md mx-auto">{DISCLAIMER_TEXT}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400"><path d="M20 6 9 17l-5-5"/></svg>
              No credit check required
            </span>
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400"><path d="M20 6 9 17l-5-5"/></svg>
              Education-first approach
            </span>
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400"><path d="M20 6 9 17l-5-5"/></svg>
              Thousands of entrepreneurs helped
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
