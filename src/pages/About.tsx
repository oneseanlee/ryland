import { Shield, DollarSign, Users } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import heroPortrait from "@/assets/hero-portrait.png";
import asSeenOn from "@/assets/as-seen-on.png";
import geneRylandAbout from "@/assets/gene-ryland-about-v2.png.asset.json";
import InfiniteGrid from "@/components/ui/infinite-grid";
import Counter from "@/components/funding-visuals/Counter";
import HlsVideoBackground from "@/components/HlsVideoBackground";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";


const About = () => {
  return (
    <div className="min-h-screen selection:bg-blue-500/30 selection:text-white antialiased text-slate-900">
      <PageMeta title="About Gene Ryland | Ryland Partners" description="Learn about Gene Ryland and Ryland Partners — helping entrepreneurs secure business funding and build credit since day one." />
      
      <style dangerouslySetInnerHTML={{__html: `
        .gradient-blur {
          position: fixed; z-index: 5; inset: 0 0 auto 0; height: 12%; pointer-events: none;
        }
        .gradient-blur>, .gradient-blur::before, .gradient-blur::after { position: absolute; inset: 0; }
        .gradient-blur::before { content: ""; z-index: 1; backdrop-filter: blur(0.5px); mask: linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 37.5%); }
        .gradient-blur>div:nth-of-type(1) { z-index: 2; backdrop-filter: blur(1px); mask: linear-gradient(to top, rgba(0,0,0,0) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 37.5%, rgba(0,0,0,0) 50%); }
        .gradient-blur>div:nth-of-type(2) { z-index: 3; backdrop-filter: blur(2px); mask: linear-gradient(to top, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 37.5%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 62.5%); }
        .gradient-blur>div:nth-of-type(3) { z-index: 4; backdrop-filter: blur(4px); mask: linear-gradient(to top, rgba(0,0,0,0) 37.5%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 62.5%, rgba(0,0,0,0) 75%); }
        .gradient-blur>div:nth-of-type(4) { z-index: 5; backdrop-filter: blur(8px); mask: linear-gradient(to top, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 62.5%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 87.5%); }
        .gradient-blur>div:nth-of-type(5) { z-index: 6; backdrop-filter: blur(16px); mask: linear-gradient(to top, rgba(0,0,0,0) 62.5%, rgba(0,0,0,1) 75%, rgba(0,0,0,1) 87.5%, rgba(0,0,0,0) 100%); }
        .gradient-blur>div:nth-of-type(6) { z-index: 7; backdrop-filter: blur(32px); mask: linear-gradient(to top, rgba(0,0,0,0) 75%, rgba(0,0,0,1) 87.5%, rgba(0,0,0,1) 100%); }
        .gradient-blur::after { content: ""; z-index: 8; backdrop-filter: blur(64px); mask: linear-gradient(to top, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%); }
      `}} />

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-white pointer-events-none">
        <InfiniteGrid baseGridColor="rgba(148, 163, 184, 0.5)" activeGridColor="rgba(59, 130, 246, 0.8)" />
      </div>

      {/* Gradient blur */}
      <div className="gradient-blur pointer-events-none">
        <div></div><div></div><div></div><div></div><div></div><div></div>
      </div>

      <Navbar />

      {/* HERO */}
      <section className="relative max-w-7xl mx-4 sm:mx-6 lg:mx-auto mt-4 sm:mt-8 pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-8 lg:px-20 overflow-hidden rounded-2xl border border-[#004E8C]">
        <HlsVideoBackground overlay="bg-[#003A70]/90" />
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 relative z-10">
          <div className="text-center lg:text-left lg:flex-1 max-w-3xl">
            <h1 className="text-[28px] leading-[0.95] sm:text-[42px] md:text-[52px] lg:text-[64px] font-medium tracking-tighter font-geist text-center lg:text-left mt-4 sm:mt-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500">
              Capital, Credit &amp; Community for Entrepreneurs Ready to Scale
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-400 mt-4 sm:mt-6 max-w-xl text-center lg:text-left leading-relaxed mx-auto lg:mx-0">
              We help founders unlock business funding, optimize their credit, and plug into a network of funded operators — so you can build, scale, and grow with confidence.
            </p>
            <div className="flex flex-col mt-6 sm:mt-8 gap-4 items-center lg:items-start">
              <img src={asSeenOn} alt="As seen on FOX, USA Today, Digital Journal, MarketWatch" width={1584} height={263} loading="lazy" className="w-full max-w-xs sm:max-w-sm lg:max-w-md brightness-0 invert opacity-60" />
            </div>
          </div>
          <div className="relative lg:flex-1 flex justify-center mt-4 lg:mt-0 w-full">
            <div className="relative flex flex-col items-center gap-4 sm:gap-6 w-full max-w-sm sm:max-w-md lg:max-w-xl">
              <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full" />
              <img src={geneRylandAbout} alt="Gene Ryland — Founder of Ryland Partners" width={1178} height={1667} loading="lazy" className="relative z-10 w-full max-w-[16rem] sm:max-w-[20rem] md:max-w-[24rem] lg:max-w-[28rem] object-cover drop-shadow-2xl" />
              <div className="relative z-10 flex flex-col items-center mt-1 sm:mt-2">
                <p className="text-base sm:text-lg font-semibold text-white/90" style={{ fontVariant: 'small-caps', letterSpacing: '0.15em' }}>Gene Ryland</p>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-blue-300 font-medium mt-0.5">CEO &amp; Founder <span className="text-white/50 mx-1">|</span> Business Funding Expert</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="max-w-7xl mx-4 sm:mx-6 lg:mx-auto mt-8 sm:mt-12">
        <div className="relative overflow-hidden border border-[#004E8C] rounded-3xl p-6 sm:p-8 md:p-10">
          <HlsVideoBackground overlay="bg-[#003A70]/90" />
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div><p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-tight">$<Counter target={150} />M+</p><p className="text-xs sm:text-sm text-white/70 mt-1">Funding Secured</p></div>
            <div><p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-tight"><Counter target={10000} prefix="" />+</p><p className="text-xs sm:text-sm text-white/70 mt-1">Entrepreneurs Helped</p></div>
            <div><p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-tight"><Counter target={8} />+</p><p className="text-xs sm:text-sm text-white/70 mt-1">Years Experience</p></div>
            <div><p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-tight"><Counter target={0} />%</p><p className="text-xs sm:text-sm text-white/70 mt-1">APR Introductory Rates</p></div>
          </div>
        </div>
      </section>

      {/* THE FOUNDER'S JOURNEY */}
      <section className="max-w-4xl mx-auto px-6 mt-20 sm:mt-32 mb-20 sm:mb-32">
        <p className="text-xs sm:text-sm text-slate-500 mb-4 text-center">The Story</p>
        <h2 className="text-3xl md:text-5xl font-medium tracking-tighter text-slate-900 mb-8 text-center" style={{ maskImage: 'linear-gradient(to bottom, black 40%, rgba(0,0,0,0.5))', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, rgba(0,0,0,0.5))' }}>
          The Founder's Journey
        </h2>
        <div className="space-y-6 text-base sm:text-lg text-slate-600 leading-relaxed">
          <p>Gene Ryland is a serial entrepreneur and business funding strategist who has dedicated his career to helping founders unlock the capital they need to scale. With deep expertise in credit optimization, alternative lending, and strategic financial positioning, Gene has built Ryland Partners into a trusted name in the funding space.</p>
          <p>After experiencing firsthand how traditional banks overlook ambitious entrepreneurs, Gene created a system that bridges the gap — connecting business owners with high-limit lenders, credit-building strategies, and the education needed to secure six- and seven-figure funding packages.</p>
          <p>Featured in <span className="font-semibold text-slate-900">FOX</span>, <span className="font-semibold text-slate-900">USA Today</span>, <span className="font-semibold text-slate-900">Digital Journal</span>, and <span className="font-semibold text-slate-900">MarketWatch</span>, Gene's methods have helped over 10,000 entrepreneurs secure more than $150 million in business funding — with no tax returns or revenue required.</p>
          <p>Today, Gene leads a growing community of funded founders through the Ryland Partners ecosystem — offering done-for-you services, a private academy, and direct lender access that most entrepreneurs never knew existed.</p>
        </div>
      </section>

      {/* THE RYLAND PILLARS */}
      <section className="max-w-7xl mx-auto px-6 mb-20 sm:mb-32">
        <p className="text-xs sm:text-sm text-slate-500 mb-4 text-center">Our Approach</p>
        <h2 className="text-3xl md:text-5xl font-medium tracking-tighter text-slate-900 mb-12 text-center" style={{ maskImage: 'linear-gradient(to bottom, black 40%, rgba(0,0,0,0.5))', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, rgba(0,0,0,0.5))' }}>
          The Ryland Pillars
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: DollarSign, title: "Capital Access", desc: "We connect entrepreneurs with high-limit lenders offering 0% APR business credit lines — no revenue or tax returns required. Our proprietary matching system ensures you get the best terms for your profile." },
            { icon: Shield, title: "Credit Mastery", desc: "Our CROA-compliant credit restoration program removes negative items, optimizes your profile, and positions you for maximum funding eligibility. Most clients see 50–150 point improvements." },
            { icon: Users, title: "Community & Education", desc: "Join a private network of funded founders learning to invest their capital into high-ROI digital businesses. Weekly live training, done-with-you builds, and direct access to Gene Ryland." },
          ].map((card, i) => (
            <div key={i} className="rounded-2xl border border-[#004E8C] overflow-hidden relative p-8 text-white">
              <HlsVideoBackground overlay="bg-[#003A70]/90" />
              <div className="relative z-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-400/20">
                  <card.icon className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3 text-center">{card.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed text-center">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
