import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Building2, Globe, Calendar, Link2, Mail, Phone, Save, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AffiliateProfileTabProps {
  affiliate: {
    id: string;
    user_id: string;
    affiliate_id: string;
    full_name: string;
    email: string;
    phone: string | null;
    company_name: string | null;
    website: string | null;
    ghl_contact_id: string | null;
    status: string;
    created_at: string;
    payment_email: string | null;
  };
  onUpdate: () => void;
}

export default function AffiliateProfileTab({ affiliate, onUpdate }: AffiliateProfileTabProps) {
  const [form, setForm] = useState({
    full_name: affiliate.full_name,
    email: affiliate.email,
    phone: affiliate.phone ?? "",
    company_name: affiliate.company_name ?? "",
    website: affiliate.website ?? "",
    payment_email: affiliate.payment_email ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const statusColors: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("affiliates")
        .update({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          company_name: form.company_name.trim() || null,
          website: form.website.trim() || null,
          payment_email: form.payment_email.trim() || null,
        })
        .eq("id", affiliate.id);
      if (error) throw error;
      toast.success("Profile updated");
      onUpdate();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(affiliate.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`Password reset email sent to ${affiliate.email}`);
    } catch {
      toast.error("Failed to send password reset email");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Personal Information</h3>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} className="border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 555-5555" className="border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Affiliate ID</Label>
              <Input value={affiliate.affiliate_id} disabled className="border-slate-200 bg-slate-50 text-slate-500 font-mono cursor-not-allowed" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div>
                <Label className="text-xs text-slate-500">Status</Label>
                <div className="mt-1">
                  <Badge className={statusColors[affiliate.status] || "bg-slate-100 text-slate-700"}>
                    {affiliate.status}
                  </Badge>
                </div>
              </div>
              <div className="ml-auto">
                <Label className="text-xs text-slate-500">Joined</Label>
                <p className="text-sm text-slate-700 mt-1">{format(new Date(affiliate.created_at), "MMM dd, yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Business Information</h3>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Company Name</Label>
              <Input value={form.company_name} onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder="Company name" className="border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Website</Label>
              <Input value={form.website} onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://example.com" className="border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Payment Email</Label>
              <Input type="email" value={form.payment_email} onChange={(e) => setForm(p => ({ ...p, payment_email: e.target.value }))} placeholder="paypal@example.com" className="border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">GHL Contact ID</Label>
              <Input value={affiliate.ghl_contact_id ?? ""} disabled className="border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Referral Link</Label>
              <Input value={`rylandpartners.com/r/${affiliate.affiliate_id}`} disabled className="border-slate-200 bg-slate-50 text-slate-500 font-mono cursor-not-allowed" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
        <Button onClick={handleResetPassword} disabled={resetting} variant="outline" className="gap-2">
          {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Send Password Reset
        </Button>
      </div>
    </div>
  );
}
