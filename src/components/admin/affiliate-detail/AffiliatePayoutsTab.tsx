import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DollarSign, FileText, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface AffiliatePayoutsTabProps {
  affiliateId: string;
  paymentEmail: string | null;
  w9FileUrl: string | null;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  payout_period: string | null;
  created_at: string;
}

export default function AffiliatePayoutsTab({ affiliateId, paymentEmail, w9FileUrl }: AffiliatePayoutsTabProps) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("payouts")
        .select("*")
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });
      setPayouts((data as Payout[]) || []);
      setLoading(false);
    };
    fetch();
  }, [affiliateId]);

  const totalPaid = payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payouts.filter(p => p.status === "pending" || p.status === "processing").reduce((s, p) => s + p.amount, 0);
  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-100 text-green-700",
      processing: "bg-blue-100 text-blue-700",
      pending: "bg-yellow-100 text-yellow-700",
      failed: "bg-red-100 text-red-700",
    };
    return <Badge className={colors[status] || "bg-slate-100 text-slate-700"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Payment Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Paid</p>
                <p className="text-lg font-bold text-green-700">{fmt(totalPaid)}</p>
              </div>
              <DollarSign className="h-5 w-5 text-green-500" />
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
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-400" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Payment Email</p>
                <p className="text-sm font-medium text-slate-900 truncate">{paymentEmail || "Not set"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">W-9 Status</p>
                {w9FileUrl ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">Uploaded</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-700">Not uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout History */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Payout History</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : payouts.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No payouts yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold">{fmt(p.amount)}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell className="text-slate-600">{p.payout_period || "—"}</TableCell>
                    <TableCell className="text-slate-600">{p.payment_method || "Bank Transfer"}</TableCell>
                    <TableCell className="text-slate-500">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
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
