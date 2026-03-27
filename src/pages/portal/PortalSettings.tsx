import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserCircle, CreditCard, Upload, Loader2, CheckCircle2, FileText, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PortalSettings() {
  const { affiliate, user, updatePassword } = useAuth();
  const { toast } = useToast();

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Payout form
  const [paymentEmail, setPaymentEmail] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);

  // W-9 upload
  const [w9Loading, setW9Loading] = useState(false);
  const [w9Url, setW9Url] = useState<string | null>(null);

  useEffect(() => {
    if (affiliate) {
      // Fetch payment_email and w9_file_url from affiliates
      supabase
        .from("affiliates")
        .select("payment_email, w9_file_url")
        .eq("id", affiliate.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setPaymentEmail(data.payment_email ?? "");
            setW9Url(data.w9_file_url ?? null);
          }
        });
    }
  }, [affiliate]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    const { error } = await updatePassword(newPassword);
    setPwLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been changed." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSavePaymentEmail = async () => {
    if (!affiliate) return;
    setPayoutLoading(true);
    const { error } = await supabase
      .from("affiliates")
      .update({ payment_email: paymentEmail.trim() || null })
      .eq("id", affiliate.id);
    setPayoutLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Payment email updated." });
    }
  };

  const handleW9Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !affiliate) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File must be under 10MB.", variant: "destructive" });
      return;
    }

    setW9Loading(true);
    const path = `${user.id}/w9-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage.from("w9-uploads").upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setW9Loading(false);
      return;
    }

    // Save path to affiliates table
    const { error: updateError } = await supabase
      .from("affiliates")
      .update({ w9_file_url: path })
      .eq("id", affiliate.id);

    setW9Loading(false);
    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
    } else {
      setW9Url(path);
      toast({ title: "W-9 uploaded", description: "Your W-9 has been saved." });
    }
  };

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    suspended: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile & Payouts</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account, payment info, and tax documents.</p>
      </div>

      {/* Profile Info */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-slate-400" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500">Full Name</Label>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{affiliate?.full_name ?? "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Email</Label>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{affiliate?.email ?? "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Phone</Label>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{affiliate?.phone ?? "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Affiliate ID</Label>
              <p className="text-sm font-mono font-semibold text-slate-900 mt-0.5">{affiliate?.affiliate_id ?? "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Status</Label>
              <div className="mt-1">
                <Badge className={`${statusColors[affiliate?.status ?? "pending"]} text-xs border`}>
                  {affiliate?.status ? affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1) : "—"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Email */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-400" />
            Payout Method
          </CardTitle>
          <CardDescription className="text-slate-500">Enter your PayPal or Stripe email for commission payouts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={paymentEmail}
              onChange={(e) => setPaymentEmail(e.target.value)}
              placeholder="your-email@paypal.com"
              type="email"
              className="flex-1 border-slate-200"
            />
            <Button onClick={handleSavePaymentEmail} disabled={payoutLoading} variant="outline" className="shrink-0 border-slate-200 text-slate-700 hover:bg-slate-100">
              {payoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* W-9 Upload */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            W-9 Tax Form
          </CardTitle>
          <CardDescription className="text-slate-500">Upload your W-9 for tax compliance. PDF or image, max 10MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleW9Upload} className="hidden" />
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                {w9Loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {w9Loading ? "Uploading…" : "Choose File"}
              </div>
            </label>
            {w9Url && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                W-9 on file
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" required minLength={8} className="border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required className="border-slate-200" />
            </div>
            <Button type="submit" disabled={pwLoading} variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100">
              {pwLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
