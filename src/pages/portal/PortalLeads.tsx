import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Plus } from "lucide-react";
import { useAffiliateLeads } from "@/hooks/useAffiliateLeads";
import LeadsTable from "@/components/portal/LeadsTable";
import LeadDetailDrawer from "@/components/portal/LeadDetailDrawer";
import SubmitLeadDrawer from "@/components/portal/SubmitLeadDrawer";
import type { Lead } from "@/types/leads";
import { toast } from "sonner";

export default function PortalLeads() {
  const { leads, isLoading, refetch } = useAffiliateLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("affiliate_leads").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Failed to delete lead");
    } else {
      toast.success(`${deleteTarget.full_name} deleted`);
      refetch();
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lead Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Track every referral from submission to funding.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setSubmitOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2">
            <Plus className="h-4 w-4" />
            Submit New Lead
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            Referred Leads
            {leads.length > 0 && (
              <Badge variant="secondary" className="ml-2 font-normal bg-slate-100 text-slate-600">{leads.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LeadsTable leads={leads} isLoading={isLoading} onSelectLead={setSelectedLead} onDeleteLead={setDeleteTarget} onRefresh={refetch} />
        </CardContent>
      </Card>

      <LeadDetailDrawer
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />

      <SubmitLeadDrawer
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSuccess={() => refetch()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{deleteTarget?.full_name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
