import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import AdminLeadDetailDrawer from "@/components/admin/AdminLeadDetailDrawer";

interface AffiliateLeadsTabProps {
  affiliateId: string;
  affiliateName: string;
  affiliateAffiliateId: string;
}

interface Lead {
  id: string;
  affiliate_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  status: string;
  pipeline_stage: string;
  deal_amount: number | null;
  commission_amount: number | null;
  commission_status: string | null;
  assigned_rep: string | null;
  next_appointment_at: string | null;
  next_step: string | null;
  latest_update: string | null;
  notes: string | null;
  referred_at: string;
  created_at: string;
  updated_at: string;
}

export default function AffiliateLeadsTab({ affiliateId, affiliateName, affiliateAffiliateId }: AffiliateLeadsTabProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("affiliate_leads")
        .select("*")
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });
      setLeads((data as Lead[]) || []);
      setLoading(false);
    };
    fetch();
  }, [affiliateId]);

  const statusColors: Record<string, string> = {
    "New Lead": "bg-blue-100 text-blue-700",
    "Contacted": "bg-yellow-100 text-yellow-700",
    "Qualified": "bg-purple-100 text-purple-700",
    "Proposal": "bg-orange-100 text-orange-700",
    "Closed Won": "bg-green-100 text-green-700",
    "Closed Lost": "bg-red-100 text-red-700",
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Referred Leads</h3>
            <Badge variant="secondary">{leads.length} total</Badge>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : leads.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No leads referred yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Deal Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Referred</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white">
                          {lead.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{lead.full_name}</p>
                          <p className="text-xs text-slate-500">{lead.email || "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.status] || "bg-slate-100 text-slate-700"}>{lead.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{lead.pipeline_stage}</TableCell>
                    <TableCell className="font-medium">{lead.deal_amount ? `$${lead.deal_amount.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-sm">{lead.commission_amount ? `$${lead.commission_amount.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-slate-500">{format(new Date(lead.referred_at), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminLeadDetailDrawer
        lead={selectedLead ? { ...selectedLead, affiliate: { full_name: affiliateName, affiliate_id: affiliateAffiliateId } } : null}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </>
  );
}
