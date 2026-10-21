import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatMoney } from "@/hooks/useInquiryPortal";
import { Save, Copy } from "lucide-react";

interface AddOn {
  name: string;
  price: number;
}

const SETTING_FIELDS =
  "service_price, per_bureau_price, add_ons, required_document_categories, ghl_payment_link, retention_days";

const DOC_CATEGORY_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "drivers_license_front", label: "Driver's License — Front" },
  { key: "drivers_license_back", label: "Driver's License — Back" },
  { key: "social_security_card", label: "Social Security Card" },
  { key: "credit_report", label: "Credit Report" },
  { key: "proof_of_address", label: "Proof of Address" },
  { key: "other", label: "Other Document" },
];

const DEFAULTS = {
  service_price: 0,
  per_bureau_price: 0,
  add_ons: [] as AddOn[],
  required_document_categories: [
    "drivers_license_front",
    "drivers_license_back",
    "social_security_card",
    "credit_report",
  ],
  ghl_payment_link: "",
  retention_days: 365,
};

export default function AdminInquirySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [servicePrice, setServicePrice] = useState("0");
  const [perBureauPrice, setPerBureauPrice] = useState("0");
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [requiredDocs, setRequiredDocs] = useState<string[]>(DEFAULTS.required_document_categories);
  const [paymentLink, setPaymentLink] = useState("");
  const [retentionDays, setRetentionDays] = useState("365");

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ghl-payment-webhook`;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inquiry_settings")
        .select(SETTING_FIELDS)
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setExists(true);
        setServicePrice(String(data.service_price ?? 0));
        setPerBureauPrice(String(data.per_bureau_price ?? 0));
        setAddOns((data.add_ons as unknown as AddOn[]) || []);
        setRequiredDocs((data.required_document_categories as unknown as string[]) || []);
        setPaymentLink(data.ghl_payment_link || "");
        setRetentionDays(String(data.retention_days ?? 365));
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load inquiry settings");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!paymentLink.trim()) {
      toast.error("A GoHighLevel payment link is required before checkout can be enabled.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: 1,
        service_price: Number(servicePrice) || 0,
        per_bureau_price: Number(perBureauPrice) || 0,
        add_ons: addOns.filter((a) => a.name.trim()) as unknown as Json,
        required_document_categories: requiredDocs as unknown as Json,
        ghl_payment_link: paymentLink.trim(),
        retention_days: Math.max(1, Number(retentionDays) || 365),
      };
      const { error } = await supabase.from("inquiry_settings").upsert(payload);
      if (error) throw error;
      setExists(true);
      toast.success("Inquiry settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleDoc = (key: string) => {
    setRequiredDocs((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const updateAddOn = (idx: number, patch: Partial<AddOn>) => {
    setAddOns((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inquiry Portal Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pricing, required documents, and payment configuration for Credit Inquiry Removal orders.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing (server-side source of truth)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="service-price">Service price per client order</Label>
              <Input
                id="service-price"
                type="number"
                min="0"
                step="0.01"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bureau-price">Additional price per bureau</Label>
              <Input
                id="bureau-price"
                type="number"
                min="0"
                step="0.01"
                value={perBureauPrice}
                onChange={(e) => setPerBureauPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Order price = service price + (per-bureau price × bureaus selected) + add-ons.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Add-ons</Label>
            {addOns.map((a, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Add-on name"
                  value={a.name}
                  onChange={(e) => updateAddOn(i, { name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  value={a.price}
                  onChange={(e) => updateAddOn(i, { price: Number(e.target.value) })}
                  className="w-28"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddOns((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddOns((prev) => [...prev, { name: "", price: 0 }])}
            >
              Add add-on
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required document categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Affiliates cannot add an order to the cart until every checked category is uploaded.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {DOC_CATEGORY_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 text-sm">
                <Checkbox checked={requiredDocs.includes(opt.key)} onCheckedChange={() => toggleDoc(opt.key)} />
                {opt.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">GoHighLevel payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-link">Payment link</Label>
            <Input
              id="payment-link"
              placeholder="https://link.rylandpartners.com/payment-link/..."
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A static payment link cannot charge a variable cart total. Totals are snapshotted per
              checkout batch; until an Invoices/Products integration or the payment webhook below is
              configured, payments stay “Pending Verification” and are confirmed manually in the admin
              portal (audited).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="retention">Document retention (days)</Label>
            <Input
              id="retention"
              type="number"
              min="1"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payment verification webhook</Label>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1.5 rounded flex-1 break-all">
                {webhookUrl}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast.success("Webhook URL copied");
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Point a GoHighLevel “Payment Received” workflow → Webhook action at this URL with body
              {" {\"reference\": \"{{url_param.ref}}\", \"token\": \"{{url_param.token}}\", \"payment_ref\": \"...\"}"}.
              When configured, payments verify automatically (idempotent).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="shiny-cta">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving…" : exists ? "Save settings" : "Create settings"}
        </Button>
        {!exists && (
          <span className="text-sm text-muted-foreground">
            No settings row yet — checkout is unavailable until these are saved.
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Current configuration preview: {formatMoney(Number(servicePrice) || 0)} per order
        {Number(perBureauPrice) > 0 ? ` + ${formatMoney(Number(perBureauPrice))} per bureau` : ""}.
      </p>
    </div>
  );
}
