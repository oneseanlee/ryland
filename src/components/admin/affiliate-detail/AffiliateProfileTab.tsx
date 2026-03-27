import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User, Building2, Globe, Calendar, Link2, Mail, Phone, Save, Loader2, KeyRound, Pencil, X, AlertTriangle } from "lucide-react";
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

function InfoRow({ label, value, href }: { label: string; value: string | null; href?: string }) {
  const link = href;
  const isExternal = link?.startsWith('http');
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {link && value ? (
          <a href={link} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined} className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all">{value}</a>
        ) : (
          <p className="text-sm text-slate-900">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

export default function AffiliateProfileTab({ affiliate, onUpdate }: AffiliateProfileTabProps) {
  const getInitialForm = useCallback(() => ({
    full_name: affiliate.full_name,
    email: affiliate.email,
    phone: affiliate.phone ?? "",
    company_name: affiliate.company_name ?? "",
    website: affiliate.website ?? "",
    payment_email: affiliate.payment_email ?? "",
  }), [affiliate]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(getInitialForm);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Reset form when affiliate data changes (e.g., after save)
  useEffect(() => {
    setForm(getInitialForm());
  }, [getInitialForm]);

  const statusColors: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
  };

  const hasChanges = () => {
    const initial = getInitialForm();
    return Object.keys(initial).some(
      (key) => form[key as keyof typeof form] !== initial[key as keyof typeof initial]
    );
  };

  const handleCancelEdit = () => {
    if (hasChanges()) {
      setShowDiscardDialog(true);
    } else {
      setEditing(false);
    }
  };

  const handleDiscard = () => {
    setForm(getInitialForm());
    setEditing(false);
    setShowDiscardDialog(false);
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
      setEditing(false);
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
      {/* Unsaved changes banner */}
      {editing && hasChanges() && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">You have unsaved changes</p>
          <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100" onClick={handleCancelEdit}>
            Discard
          </Button>
          <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            Save
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Personal Information</h3>
              {!editing && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-slate-500 hover:text-slate-700" onClick={() => setEditing(true)}>
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>

            {editing ? (
              <>
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
              </>
            ) : (
              <>
                <InfoRow label="Full Name" value={affiliate.full_name} />
                <InfoRow label="Email" value={affiliate.email} href={`mailto:${affiliate.email}`} />
                <InfoRow label="Phone" value={affiliate.phone} href={affiliate.phone ? `tel:${affiliate.phone}` : undefined} />
              </>
            )}

            <InfoRow label="Affiliate ID" value={affiliate.affiliate_id} />
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Business Information</h3>
              {!editing && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-slate-500 hover:text-slate-700" onClick={() => setEditing(true)}>
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>

            {editing ? (
              <>
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
              </>
            ) : (
              <>
                <InfoRow label="Company" value={affiliate.company_name} />
                <InfoRow label="Website" value={affiliate.website} href={affiliate.website ? (affiliate.website.startsWith('http') ? affiliate.website : `https://${affiliate.website}`) : undefined} />
                <InfoRow label="Payment Email" value={affiliate.payment_email} href={affiliate.payment_email ? `mailto:${affiliate.payment_email}` : undefined} />
              </>
            )}

            <InfoRow label="GHL Contact ID" value={affiliate.ghl_contact_id} />
            <InfoRow label="Referral Link" value={`rylandpartners.com/r/${affiliate.affiliate_id}`} />
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {editing ? (
          <>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
            <Button onClick={handleCancelEdit} variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setEditing(true)} variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
            <Button onClick={handleResetPassword} disabled={resetting} variant="outline" className="gap-2">
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Send Password Reset
            </Button>
          </>
        )}
      </div>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved edits to this affiliate's profile. If you cancel now, your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard} className="bg-red-600 hover:bg-red-700">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
