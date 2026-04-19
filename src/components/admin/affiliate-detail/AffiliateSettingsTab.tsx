import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, RefreshCw, Loader2, Save, Link2, UserCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { validateSlug } from "@/lib/reservedSlugs";
import { startImpersonationSession } from "@/components/ImpersonationBanner";

interface AffiliateSettingsTabProps {
  affiliate: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    affiliate_id: string;
    referral_slug?: string | null;
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
  const [slug, setSlug] = useState(affiliate.referral_slug || "");
  const [savingSlug, setSavingSlug] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [impersonating, setImpersonating] = useState(false);

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
        .update({ status: newStatus as "approved" | "pending" | "suspended" })
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

  const saveSlug = async () => {
    const trimmed = slug.trim().toLowerCase();
    if (trimmed) {
      const v = validateSlug(trimmed);
      if (!v.valid) {
        toast.error(v.error || "Invalid slug");
        return;
      }
    }
    setSavingSlug(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-affiliate-slug", {
        body: { affiliate_id: affiliate.id, slug: trimmed || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(trimmed ? `Referral handle set to "${trimmed}"` : "Referral handle cleared");
      setSlug(data?.slug || "");
      onUpdate();
    } catch (err) {
      toast.error((err as Error).message || "Failed to update referral handle");
    } finally {
      setSavingSlug(false);
    }
  };

  const startImpersonation = async () => {
    setImpersonating(true);
    try {
      // Capture current admin session BEFORE we sign in as the target
      const { data: sessionData } = await supabase.auth.getSession();
      const adminAccess = sessionData.session?.access_token;
      const adminRefresh = sessionData.session?.refresh_token;
      if (!adminAccess || !adminRefresh) {
        throw new Error("No active admin session");
      }

      const { data, error } = await supabase.functions.invoke("admin-impersonate", {
        body: {
          target_user_id: affiliate.user_id,
          reason: reason.trim() || null,
          redirect_to: `${window.location.origin}/portal`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.action_link) throw new Error("No sign-in link returned");

      // Save admin session so we can return later
      startImpersonationSession(adminAccess, adminRefresh, data.target_email);

      // Follow the magic link — Supabase will sign in as the target user
      window.location.href = data.action_link;
    } catch (err) {
      toast.error((err as Error).message || "Failed to start impersonation");
      setImpersonating(false);
    }
  };

  const referralLink = affiliate.referral_slug
    ? `rylandpartners.com/${affiliate.referral_slug}`
    : `rylandpartners.com/r/${affiliate.affiliate_id}`;

  return (
    <div className="space-y-6">
      {/* Referral Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Referral Handle</h3>
              <p className="text-xs text-slate-500 mt-1">
                Custom vanity URL. Defaults to affiliate ID if blank.
              </p>
            </div>
            <Link2 className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-slate-50 rounded-md border border-slate-200">
            <span className="text-xs text-slate-500">Current link:</span>
            <a
              href={`https://${referralLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-blue-600 hover:underline flex items-center gap-1"
            >
              {referralLink}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <Label htmlFor="slug-input" className="text-sm text-slate-600">Custom handle</Label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-500 shrink-0">rylandpartners.com/</span>
            <Input
              id="slug-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="brittany"
              maxLength={30}
              className="font-mono"
            />
            <Button onClick={saveSlug} disabled={savingSlug || slug === (affiliate.referral_slug || "")}>
              {savingSlug ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            3–30 chars, lowercase letters, numbers, hyphens. Must start with a letter.
          </p>
        </CardContent>
      </Card>

      {/* Impersonation */}
      <Card className="border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-600" aria-hidden="true" />
                Sign In As User
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Log into the portal as <span className="font-medium">{affiliate.full_name}</span> to verify their experience.
                A red banner will let you return to admin. Every session is recorded.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setImpersonateOpen(true)}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Log in as {affiliate.full_name}
          </Button>
        </CardContent>
      </Card>

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

      {/* Impersonation confirm dialog */}
      <AlertDialog open={impersonateOpen} onOpenChange={setImpersonateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log in as {affiliate.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed in as <span className="font-medium">{affiliate.email}</span> in a new session.
              A red banner across the top of the site will let you return to your admin account.
              This action is recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs text-slate-500">Reason (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Verifying portal layout"
              maxLength={200}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={impersonating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startImpersonation} disabled={impersonating} className="bg-amber-600 hover:bg-amber-700">
              {impersonating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserCheck className="h-4 w-4 mr-2" />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
