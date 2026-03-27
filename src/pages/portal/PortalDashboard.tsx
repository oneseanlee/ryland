import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, CalendarClock, Copy, Check, ExternalLink, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const SITE_DOMAIN = "rylandpartners.com";

export default function PortalDashboard() {
  const { affiliate, user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Fallback to user ID if affiliate data isn't available
  const referralId = affiliate?.affiliate_id ?? user?.id ?? "";
  const referralLink = referralId
    ? `https://${SITE_DOMAIN}/r/${referralId}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ["portal-dashboard-stats", affiliate?.id],
    enabled: !!affiliate,
    queryFn: async () => {
      const [leadsRes, commissionsRes, payoutsRes] = await Promise.all([
        supabase.from("affiliate_leads").select("id, pipeline_stage").eq("affiliate_id", affiliate!.id),
        supabase.from("commissions").select("commission_amount, commission_status").eq("affiliate_id", affiliate!.id),
        supabase.from("payouts").select("amount, status, payout_period, created_at").eq("affiliate_id", affiliate!.id).order("created_at", { ascending: false }),
      ]);

      const leads = leadsRes.data ?? [];
      const commissions = commissionsRes.data ?? [];
      const payouts = payoutsRes.data ?? [];

      const totalEarned = commissions.reduce((s, c) => s + Number(c.commission_amount), 0);
      const pipelineLeads = leads.filter((l) => !["Closed Lost", "Funded"].includes(l.pipeline_stage)).length;

      // Next payout: first pending/processing payout
      const nextPayout = payouts.find((p) => p.status === "pending" || p.status === "processing");
      const nextPayoutDate = nextPayout?.payout_period ?? null;

      return { totalEarned, pipelineLeads, nextPayoutDate };
    },
  });

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const kpiCards = [
    {
      label: "Total Earned",
      value: isLoading ? null : fmt(stats?.totalEarned ?? 0),
      icon: DollarSign,
      gradient: "from-emerald-500 to-green-600",
      bgAccent: "bg-emerald-50",
    },
    {
      label: "Leads in Pipeline",
      value: isLoading ? null : String(stats?.pipelineLeads ?? 0),
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      bgAccent: "bg-blue-50",
    },
    {
      label: "Next Payout Date",
      value: isLoading ? null : (stats?.nextPayoutDate ?? "TBD"),
      icon: CalendarClock,
      gradient: "from-amber-500 to-orange-600",
      bgAccent: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your partner performance at a glance.</p>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5 px-5">
              {kpi.value === null ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                    <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${kpi.gradient} flex items-center justify-center`}>
                      <kpi.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">{kpi.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral Link */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Your Referral Link</h3>
              <p className="text-xs text-slate-500 mt-0.5">Share with business owners to track referrals automatically.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-700 overflow-x-auto">
              <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 mr-3" />
              <span className="truncate">{referralLink}</span>
            </div>
            <Button onClick={copyLink} variant="outline" className="shrink-0 gap-2 border-slate-200 text-slate-700 hover:bg-slate-100">
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/portal/leads">
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Lead Tracker</p>
                  <p className="text-xs text-slate-500">View & submit leads</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/portal/commissions">
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Commissions</p>
                  <p className="text-xs text-slate-500">View earnings & payouts</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
