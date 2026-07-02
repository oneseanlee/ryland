import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AddClientDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddClientDrawer({ open, onClose, onSuccess }: AddClientDrawerProps) {
  const { affiliate } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[field];
      return n;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate) {
      toast({ title: "Error", description: "Partner profile not loaded. Refresh and try again.", variant: "destructive" });
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email.trim())) newErrors.email = "Enter a valid email";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const fullName = `${form.first_name.trim()} ${form.last_name.trim()}`;
    const partnerName = affiliate.full_name;
    const partnerTag = `partner:${partnerName}`;

    // 1. Save lead to DB
    const { error: dbError } = await supabase.from("affiliate_leads").insert({
      affiliate_id: affiliate.id,
      full_name: fullName,
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: "New Lead",
      pipeline_stage: "New Lead",
    });

    if (dbError) {
      setLoading(false);
      toast({ title: "Error", description: dbError.message, variant: "destructive" });
      return;
    }

    // 2. Sync to GHL with partner tag
    try {
      await supabase.functions.invoke("ghl-create-contact", {
        body: {
          name: fullName,
          email: form.email.trim(),
          phone: form.phone.trim(),
          source: `Partner Referral: ${partnerName}`,
          tags: ["partner-referral", partnerTag, `partner-id:${affiliate.affiliate_id}`],
        },
      });
    } catch (err) {
      console.error("GHL sync failed (non-critical):", err);
    }

    setLoading(false);
    toast({ title: "Client added", description: `${fullName} was added and sent to CRM.` });
    setForm({ first_name: "", last_name: "", email: "", phone: "" });
    onSuccess?.();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-white">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Add New Client
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-500">
            Quick add — we'll link this client to you and sync to CRM automatically.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">First Name *</Label>
              <Input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} placeholder="John" className={errors.first_name ? "border-red-400" : "border-slate-200"} />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Last Name *</Label>
              <Input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} placeholder="Smith" className={errors.last_name ? "border-red-400" : "border-slate-200"} />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" className={errors.email ? "border-red-400" : "border-slate-200"} />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Phone *</Label>
            <Input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(555) 555-5555" className={errors.phone ? "border-red-400" : "border-slate-200"} />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Add Client
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
