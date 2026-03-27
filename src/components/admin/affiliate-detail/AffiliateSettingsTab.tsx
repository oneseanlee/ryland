import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCw, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface AffiliateSettingsTabProps {
  affiliate: {
    id: string;
    user_id: string;
    full_name: string;
    status: string;
    upfront_commission_rate: number;
    backend_commission_rate: number;
    admin_notes: string | null;
  };
  onUpdate: () => void;
}

export default function AffiliateSettingsTab({ affiliate, onUpdate }: AffiliateSettingsTabProps) {
  const [upfrontRate, setUpfrontRate] = useState(affiliate.upfront_commission_rate);
  const [backendRate, setBackendRate] = useState(affiliate.backend_commission_rate);
  const [adminNotes, setAdminNotes] = useState(affiliate.admin_notes || "");
  const [savingRates, setSavingRates] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const updateRates = async () => {
    setSavingRates(true);
    try {
      const { error } = await supabase
        .from("affiliates")
        .update({
          upfront_commission_rate: upfrontRate,
          backend_commission_rate: backendRate,
        })
        .eq("id", affiliate.id);

      if (error) throw error;
      toast.success("Commission rates updated");
      onUpdate();
    } catch {
      toast.error("Failed to update rates");
    } finally {
      setSavingRates(false);
    }
  };

  const updateNotes = async () => {
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("affiliates")
        .update({ admin_notes: adminNotes })
        .eq("id", affiliate.id);

      if (error) throw error;
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("affiliates")
        .update({ status: newStatus })
        .eq("id", affiliate.id);

      if (error) throw error;
      toast.success(`Affiliate ${newStatus}`);
      onUpdate();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Commission Rates */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Commission Rates</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="upfront-rate" className="text-sm text-slate-600">Upfront Commission Rate (%)</Label>
              <Input
                id="upfront-rate"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={upfrontRate}
                onChange={(e) => setUpfrontRate(Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-slate-400 mt-1">Paid when a lead converts to funded client</p>
            </div>
            <div>
              <Label htmlFor="backend-rate" className="text-sm text-slate-600">Backend Commission Rate (%)</Label>
              <Input
                id="backend-rate"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={backendRate}
                onChange={(e) => setBackendRate(Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-slate-400 mt-1">Recurring commission on subsequent revenue</p>
            </div>
          </div>
          <Button onClick={updateRates} disabled={savingRates} className="mt-4">
            {savingRates ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Rates
          </Button>
        </CardContent>
      </Card>

      {/* Status Actions */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Affiliate Status</h3>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-slate-600">Current status:</span>
            <Badge className={
              affiliate.status === "approved" ? "bg-green-100 text-green-700"
                : affiliate.status === "pending" ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }>{affiliate.status}</Badge>
          </div>
          <div className="flex gap-3">
            {affiliate.status === "pending" && (
              <Button onClick={() => updateStatus("approved")} disabled={updatingStatus} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            {affiliate.status === "approved" && (
              <Button onClick={() => updateStatus("suspended")} disabled={updatingStatus} variant="destructive">
                <XCircle className="h-4 w-4 mr-2" />
                Suspend
              </Button>
            )}
            {affiliate.status === "suspended" && (
              <Button onClick={() => updateStatus("approved")} disabled={updatingStatus}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reactivate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Admin Notes</h3>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Internal notes about this affiliate..."
            rows={5}
            className="resize-none"
          />
          <Button onClick={updateNotes} disabled={savingNotes} variant="outline" className="mt-3">
            {savingNotes ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Notes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
