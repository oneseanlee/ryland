import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic2, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PortalSpeaking() {
  const { affiliate } = useAuth();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: affiliate?.full_name ?? "",
    email: affiliate?.email ?? "",
    organization_name: "",
    event_name: "",
    requested_date: "",
    event_location: "",
    audience_description: "",
    notes: "",
  });

  useEffect(() => {
    if (affiliate) {
      setForm((prev) => ({
        ...prev,
        full_name: prev.full_name || affiliate.full_name || "",
        email: prev.email || affiliate.email || "",
      }));
    }
  }, [affiliate]);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate) return;
    setLoading(true);

    const { error } = await supabase.from("speaker_requests").insert({
      affiliate_id: affiliate.id,
      full_name: form.full_name,
      email: form.email,
      organization_name: form.organization_name || null,
      event_name: form.event_name,
      requested_date: form.requested_date || null,
      event_location: form.event_location || null,
      audience_description: form.audience_description || null,
      notes: form.notes || null,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: "Failed to submit request. Please try again.", variant: "destructive" });
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Speaking Request</h1>
        </div>
        <Card className="border-border/60">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Request Submitted!</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Thank you for your interest. Our team will review your request and get back to you within 2-3 business days.
            </p>
            <Button onClick={() => { setSubmitted(false); setForm({ full_name: affiliate?.full_name ?? "", email: affiliate?.email ?? "", organization_name: "", event_name: "", requested_date: "", event_location: "", audience_description: "", notes: "" }); }} variant="outline" className="mt-6">
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Speaking Request</h1>
        <p className="text-sm text-slate-500 mt-1">Invite Ryland Partners to speak at your event or training.</p>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Mic2 className="h-4 w-4 text-muted-foreground" />
            Event Details
          </CardTitle>
          <CardDescription>Fill out the form below and our team will follow up within 2-3 business days.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Organization / Company</Label>
                <Input value={form.organization_name} onChange={(e) => update("organization_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Event Name *</Label>
                <Input value={form.event_name} onChange={(e) => update("event_name", e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Requested Date</Label>
                <Input type="date" value={form.requested_date} onChange={(e) => update("requested_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Event Location</Label>
                <Input value={form.event_location} onChange={(e) => update("event_location", e.target.value)} placeholder="City, State or Virtual" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Audience Description</Label>
              <Textarea value={form.audience_description} onChange={(e) => update("audience_description", e.target.value)} placeholder="Who will be attending? How many people?" rows={3} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Additional Notes</Label>
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Any specific topics or format preferences?" rows={3} />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Speaking Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
