import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface AffiliateCommissionsTabProps {
  affiliateId: string;
  upfrontRate: number;
  backendRate: number;
}

interface Commission {
  id: string;
  commission_type: string;
  commission_amount: number;
  commission_status: string;
  payout_date: string | null;
  created_at: string;
  lead: { full_name: string; deal_amount: number | null } | null;
}

export default function AffiliateCommissionsTab({ affiliateId, upfrontRate, backendRate }: AffiliateCommissionsTabProps) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("commissions")
        .select("id, commission_type, commission_amount, commission_status, payout_date, created_at, affiliate_leads(full_name, deal_amount)")
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCommissions((data || []).map((c: any) => ({ ...c, lead: c.affiliate_leads })));
      setLoading(false);
    };
    fetch();
  }, [affiliateId]);

  const totalUpfront = commissions.filter(c => c.commission_type !== "backend").reduce((s, c) => s + c.commission_amount, 0);
  const totalBackend = commissions.filter(c => c.commission_type === "backend").reduce((s, c) => s + c.commission_amount, 0);
  const totalEarned = commissions.filter(c => c.commission_status === "paid").reduce((s, c) => s + c.commission_amount, 0);
  const totalPending = commissions.filter(c => c.commission_status === "pending").reduce((s, c) => s + c.commission_amount, 0);

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Rate Display */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Upfront Rate</p>
            <p className="text-2xl font-bold text-blue-600">{upfrontRate}%</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Backend Rate</p>
            <p className="text-2xl font-bold text-purple-600">{backendRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Upfront</p>
                <p className="text-lg font-bold text-slate-900">{fmt(totalUpfront)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Backend</p>
                <p className="text-lg font-bold text-slate-900">{fmt(totalBackend)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Earned</p>
                <p className="text-lg font-bold text-green-700">{fmt(totalEarned)}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Pending</p>
                <p className="text-lg font-bold text-yellow-700">{fmt(totalPending)}</p>
              </div>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission History */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Commission History</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : commissions.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No commissions yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Badge className={c.commission_type === "backend" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                        {c.commission_type === "backend" ? "Backend" : "Upfront"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.lead ? (
                        <div>
                          <p className="text-sm font-medium">{c.lead.full_name}</p>
                          {c.lead.deal_amount && <p className="text-xs text-slate-500">Deal: {fmt(c.lead.deal_amount)}</p>}
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell className="font-medium">{fmt(c.commission_amount)}</TableCell>
                    <TableCell>
                      <Badge className={
                        c.commission_status === "paid" ? "bg-green-100 text-green-700"
                          : c.commission_status === "approved" ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }>{c.commission_status}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
