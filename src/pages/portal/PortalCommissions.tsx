import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, CheckCircle2, Banknote } from "lucide-react";
import { format } from "date-fns";

const statusBadge: Record<string, { className: string; label: string }> = {
  pending: { className: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending" },
  approved: { className: "bg-blue-50 text-blue-700 border-blue-200", label: "Approved" },
  paid: { className: "bg-green-50 text-green-700 border-green-200", label: "Paid" },
};

export default function PortalCommissions() {
  const { affiliate } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["portal-commissions", affiliate?.id],
    enabled: !!affiliate,
    queryFn: async () => {
      const [commissionsRes, payoutsRes] = await Promise.all([
        supabase
          .from("commissions")
          .select("*, affiliate_leads(full_name)")
          .eq("affiliate_id", affiliate!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payouts")
          .select("*")
          .eq("affiliate_id", affiliate!.id)
          .order("created_at", { ascending: false }),
      ]);
      return {
        commissions: commissionsRes.data ?? [],
        payouts: payoutsRes.data ?? [],
      };
    },
  });

  const commissions = data?.commissions ?? [];
  const totalEarned = commissions.reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalPending = commissions.filter((c) => c.commission_status !== "paid").reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalPaid = commissions.filter((c) => c.commission_status === "paid").reduce((s, c) => s + Number(c.commission_amount), 0);

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const summaryCards = [
    { label: "Total Earned", value: fmt(totalEarned), icon: DollarSign, gradient: "from-emerald-500 to-green-600" },
    { label: "Pending", value: fmt(totalPending), icon: Clock, gradient: "from-amber-500 to-orange-600" },
    { label: "Paid Out", value: fmt(totalPaid), icon: CheckCircle2, gradient: "from-blue-500 to-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Commissions</h1>
        <p className="text-sm text-slate-500 mt-1">View your earnings and payout history.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label} className="border-slate-200 bg-white shadow-sm">
            <CardContent className="pt-5 pb-5 px-5">
              {isLoading ? (
                <div className="space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{c.label}</p>
                    <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center`}>
                      <c.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">{c.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-slate-400" />
            Commission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !commissions.length ? (
            <div className="py-16 text-center">
              <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-900 font-medium">No commissions yet</p>
              <p className="text-xs text-slate-500 mt-1">Commissions appear as your leads progress through funding.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lead</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">Payout Date</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => {
                    const badge = statusBadge[c.commission_status] ?? statusBadge.pending;
                    const leadName = (c as any).affiliate_leads?.full_name ?? "—";
                    return (
                      <TableRow key={c.id} className="border-slate-100 hover:bg-slate-50">
                        <TableCell className="font-medium text-sm text-slate-900">{leadName}</TableCell>
                        <TableCell className="text-sm text-slate-500 capitalize">{c.commission_type}</TableCell>
                        <TableCell className="text-sm text-right font-mono text-slate-900">{fmt(Number(c.commission_amount))}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {c.payout_date ? format(new Date(c.payout_date), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {format(new Date(c.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
