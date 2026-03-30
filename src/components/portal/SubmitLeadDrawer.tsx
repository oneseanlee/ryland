import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SubmitLeadDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitLeadDrawer({ open, onClose, onSuccess }: SubmitLeadDrawerProps) {
  const { affiliate, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", company_name: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (submitted) {
      setErrors((prev) => {
        const next = { ...prev };
        if (field === "full_name" && value.trim()) delete next.full_name;
        if (field === "email" && value.trim()) delete next.email;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!affiliate) {
      console.error("Submit Lead: affiliate is null", { user: !!user });
      toast({ title: "Error", description: "Affiliate profile not loaded. Please refresh and try again.", variant: "destructive" });
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!form.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email.trim())) newErrors.email = "Enter a valid email address";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    const { error } = await supabase.from("affiliate_leads").insert({
      affiliate_id: affiliate.id,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company_name: form.company_name.trim() || null,
      notes: form.notes.trim() || null,
      status: "New Lead",
      pipeline_stage: "New Lead",
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead submitted", description: `${form.full_name} has been added to your pipeline.` });
      setForm({ full_name: "", email: "", phone: "", company_name: "", notes: "" });
      setErrors({});
      setSubmitted(false);
      onSuccess();
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-white">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-bold text-slate-900">Submit New Lead</SheetTitle>
          <SheetDescription className="text-sm text-slate-500">Add a business owner you've referred.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="John Smith" className={errors.full_name ? "border-red-400 focus-visible:ring-red-400" : "border-slate-200"} />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" className={errors.email ? "border-red-400 focus-visible:ring-red-400" : "border-slate-200"} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Phone</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(555) 555-5555" className="border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Company Name</Label>
            <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} placeholder="Acme Corp" className="border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Any context about this lead..." rows={3} className="border-slate-200 resize-none" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Submit Lead
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
