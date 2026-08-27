import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, X, Quote, Building2, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import JsonLd, { breadcrumbSchema } from "@/components/JsonLd";
import InfiniteGrid from "@/components/ui/infinite-grid";
import HlsVideoBackground from "@/components/HlsVideoBackground";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CLIENT_WINS, WIN_INDUSTRIES, type ClientWin } from "@/data/clientWins";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const compact = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M+` : `$${Math.round(n / 1000)}K`;

type Filter = "all" | "credit" | "100k" | (typeof WIN_INDUSTRIES)[number];

export default function Wins() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"highest" | "recent">("highest");
  const [active, setActive] = useState<ClientWin | null>(null);

  const stats = useMemo(() => {
    const total = CLIENT_WINS.reduce((s, w) => s + w.amount, 0);
    return {
      count: CLIENT_WINS.length,
      total,
      avg: Math.round(total / CLIENT_WINS.length),
      max: Math.max(...CLIENT_WINS.map((w) => w.amount)),
    };
  }, []);

  const counts = useMemo(() => {
    const byIndustry: Record<string, number> = {};
    CLIENT_WINS.forEach((w) => {
      byIndustry[w.industry] = (byIndustry[w.industry] || 0) + 1;
    });
    return {
      byIndustry,
      credit: CLIENT_WINS.filter((w) => w.scoreFrom !== null).length,
      over100k: CLIENT_WINS.filter((w) => w.amount >= 100000).length,
    };
  }, []);

  const visible = useMemo(() => {
    let list = [...CLIENT_WINS];
    if (filter === "credit") list = list.filter((w) => w.scoreFrom !== null);
    else if (filter === "100k") list = list.filter((w) => w.amount >= 100000);
    else if (filter !== "all") list = list.filter((w) => w.industry === filter);
    return sort === "highest" ? list.sort((a, b) => b.amount - a.amount) : list;
  }, [filter, sort]);

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All Wins", count: CLIENT_WINS.length },
    ...WIN_INDUSTRIES.map((i) => ({ key: i as Filter, label: i, count: counts.byIndustry[i] || 0 })),
    { key: "credit", label: "Credit → Funding", count: counts.credit },
    { key: "100k", label: "$100K+ Funding", count: counts.over100k },
  ];

  return (
    <div className="min-h-screen selection:bg-blue-500/30 selection:text-white antialiased text-slate-900">
      <PageMeta
        title="Client Wins | Business Funding Case Studies | Ryland Partners"
        description="Documented business funding case studies — funding amounts, credit profile progress, how each structure was built, and the owner's account. Results vary by client."
        canonical="/wins"
      />
      <JsonLd
        id="wins-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Client Wins", path: "/wins" },
        ])}
      />

      <div className="fixed inset-0 -z-10 overflow-hidden bg-white pointer-events-none">
        <InfiniteGrid baseGridColor="rgba(148, 163, 184, 0.5)" activeGridColor="rgba(59, 130, 246, 0.8)" />
      </div>

      <Navbar />

      {/* Hero */}
      <section className="relative max-w-7xl mx-4 sm:mx-6 lg:mx-auto mt-4 sm:mt-8 pt-16 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-8 lg:px-20 overflow-hidden rounded-2xl border border-[#004E8C]">
        <HlsVideoBackground overlay="bg-gradient-to-r from-[#003A70]/95 via-[#003A70]/85 to-[#004E8C]/60" className="rounded-2xl" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs sm:text-sm text-blue-300 uppercase tracking-widest mb-4 font-[Inter,sans-serif]">
              Portfolio Examples
            </p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tighter text-white font-[Geist,sans-serif] leading-[0.95]">
              Business funding outcomes,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
                documented as case studies
              </span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-300 mt-6 max-w-2xl mx-auto leading-relaxed">
              Every card below is one client outcome — the funding amount, how the structure was built, what the
              capital was used for, and the owner's own account of the process. Open any card for the full story.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/consultation" className="shiny-cta !py-4 !px-10 !text-base">
                <span className="flex items-center gap-2">
                  Start Your Funding Plan <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <Link
                to="/credit-repair"
                className="hover:bg-white/10 transition-colors text-sm font-medium text-white border border-white/20 rounded-full py-3.5 px-8 inline-flex items-center justify-center"
              >
                See Credit Improvement Services
              </Link>
            </div>
            <p className="mt-6 text-xs text-blue-200/70 max-w-xl mx-auto">
              Individual results vary. These case studies are educational examples and are not a promise or guarantee
              of funding, credit improvement, or any specific outcome.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { v: String(stats.count), l: "Client outcomes featured" },
              { v: compact(stats.total), l: "Funding represented" },
              { v: compact(stats.avg), l: "Average funding outcome" },
              { v: compact(stats.max), l: "Largest featured outcome" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/5 ring-1 ring-white/15 backdrop-blur-sm px-4 py-5">
                <div className="text-2xl sm:text-3xl font-medium text-white tracking-tight font-[Manrope,sans-serif]">
                  {s.v}
                </div>
                <div className="text-[11px] sm:text-xs text-blue-200/80 mt-1 leading-snug">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20">
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => {
            const on = filter === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                aria-pressed={on}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors min-h-[44px] ${
                  on
                    ? "bg-[#003A70] border-[#003A70] text-white"
                    : "bg-white/70 border-slate-200 text-slate-700 hover:border-[#0060A9] hover:text-[#0060A9]"
                }`}
              >
                {c.label}
                <span className={`text-xs ${on ? "text-blue-200" : "text-slate-400"}`}>{c.count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
          <p className="text-sm text-slate-500">
            Showing <span className="text-slate-900 font-medium">{visible.length}</span> case studies
          </p>
          <div className="inline-flex rounded-full border border-slate-200 bg-white/70 p-1">
            {(["highest", "recent"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={sort === s}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  sort === s ? "bg-[#003A70] text-white" : "text-slate-600 hover:text-[#0060A9]"
                }`}
              >
                {s === "highest" ? "Highest" : "Most recent"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((w, i) => (
            <motion.article
              key={w.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-[#004E8C] text-white flex flex-col"
            >
              <HlsVideoBackground overlay="bg-[#003A70]/92" className="rounded-2xl" />
              <div className="relative z-10 p-6 sm:p-7 flex flex-col h-full">
                <span className="self-start rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1 text-[11px] uppercase tracking-wider text-blue-200">
                  {w.badge}
                </span>

                <div className="mt-5 flex items-center gap-3">
                  <img
                    src={w.portrait}
                    alt={`${w.name}, business owner featured in a Ryland Partners funding case study`}
                    loading="lazy"
                    className="w-12 h-12 rounded-xl object-cover object-top ring-1 ring-white/20"
                  />
                  <div>
                    <h3 className="text-base font-semibold tracking-tight font-[Geist,sans-serif]">{w.name}</h3>
                    <p className="text-xs text-blue-200/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" aria-hidden="true" /> {w.industry} · {w.location}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-3xl font-medium tracking-tight font-[Manrope,sans-serif]">
                    {money(w.amount)}
                  </div>
                  <div className="text-xs text-blue-200/70 mt-1">In business funding</div>
                </div>

                <div className="mt-5 rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-blue-300/80 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" aria-hidden="true" /> {w.structureLabel}
                  </p>
                  <p className="text-sm text-white mt-1.5">{w.banks}</p>
                  <p className="text-xs text-zinc-400 mt-1">{w.structureType}</p>
                </div>

                {w.scoreFrom !== null && (
                  <div className="mt-3 rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-blue-300/80 flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" aria-hidden="true" /> Credit profile
                    </p>
                    <p className="text-sm text-white mt-1.5">
                      {w.scoreFrom} → {w.scoreTo}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">Improved over {w.months} months</p>
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-wider text-blue-300/80">Used for</p>
                  <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{w.usedFor}</p>
                </div>

                <button
                  onClick={() => setActive(w)}
                  className="mt-6 inline-flex items-center justify-between gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors min-h-[44px]"
                >
                  <span>View full story</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-2xl border border-[#004E8C] px-6 sm:px-12 py-14 text-center text-white">
          <HlsVideoBackground overlay="bg-gradient-to-r from-[#003A70]/95 to-[#004E8C]/70" className="rounded-2xl" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tighter font-[Manrope,sans-serif]">
              Ready to build your own funding structure?
            </h2>
            <p className="text-base text-zinc-300 mt-4 leading-relaxed">
              We help business owners strengthen their credit profile and build a funding strategy — with credit repair
              and optimization available as a full-service option.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/consultation" className="shiny-cta !py-4 !px-10 !text-base">
                <span className="flex items-center gap-2">
                  Book a Free Consultation <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <Link
                to="/assessment"
                className="hover:bg-white/10 transition-colors text-sm font-medium text-white border border-white/20 rounded-full py-3.5 px-8 inline-flex items-center justify-center"
              >
                Take the Assessment
              </Link>
            </div>
            <p className="mt-6 text-xs text-blue-200/70">
              Educational services only. Individual results vary; no outcome is guaranteed.
            </p>
          </div>
        </div>
      </section>

      {/* Detail dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-[#004E8C] bg-[#003A70] text-white max-h-[90vh] overflow-y-auto">
          {active && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setActive(null)}
                aria-label="Close case study"
                className="absolute right-4 top-4 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              <span className="inline-block rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1 text-[11px] uppercase tracking-wider text-blue-200">
                {active.badge}
              </span>

              <div className="mt-5 flex items-center gap-4">
                <img
                  src={active.portrait}
                  alt={`${active.name}, business owner featured in a Ryland Partners funding case study`}
                  className="w-20 h-20 rounded-2xl object-cover object-top ring-1 ring-white/20"
                />
                <div>
                  <h2 className="text-2xl font-medium tracking-tight font-[Manrope,sans-serif]">{active.name}</h2>
                  <p className="text-sm text-blue-200/80">
                    {active.industry} · {active.location}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-blue-300/80">Funding secured</p>
                  <p className="text-2xl font-medium mt-1 font-[Manrope,sans-serif]">{money(active.amount)}</p>
                  <p className="text-xs text-zinc-400 mt-1">{active.structureType}</p>
                </div>
                <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-blue-300/80">{active.structureLabel}</p>
                  <p className="text-sm mt-1.5">{active.banks}</p>
                </div>
                {active.scoreFrom !== null && (
                  <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-blue-300/80">Credit profile</p>
                    <p className="text-sm mt-1.5">
                      {active.scoreFrom} → {active.scoreTo}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">Improved over {active.months} months</p>
                  </div>
                )}
                <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-blue-300/80">Capital used for</p>
                  <p className="text-sm mt-1.5 leading-relaxed">{active.usedFor}</p>
                </div>
              </div>

              <blockquote className="mt-6 rounded-xl bg-white/5 ring-1 ring-white/10 p-5">
                <Quote className="w-5 h-5 text-blue-300 mb-3" aria-hidden="true" />
                <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">{active.quote}</p>
                <footer className="text-xs text-blue-200/80 mt-3">
                  — {active.name}, {active.industry}
                </footer>
              </blockquote>

              <figure className="mt-6">
                <img
                  src={active.proof}
                  alt={`Funding documentation for ${active.name} — ${money(active.amount)}`}
                  loading="lazy"
                  className="w-full rounded-xl ring-1 ring-white/15"
                />
                <figcaption className="text-xs text-zinc-400 mt-2">
                  Documentation shared with permission. Details redacted for privacy.
                </figcaption>
              </figure>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link to="/consultation" className="shiny-cta !py-3.5 !px-8 !text-sm flex-1">
                  <span className="flex items-center justify-center gap-2">
                    Start Your Funding Plan <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
              <p className="mt-4 text-xs text-blue-200/70">
                Individual results vary. This case study is educational and is not a guarantee of funding or credit
                improvement.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
