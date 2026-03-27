import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Download, ExternalLink, BookOpen, FileText, Video, Megaphone,
  MessageSquare, Presentation, FolderOpen, ShoppingCart, Building2,
  CheckCircle2, Loader2
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const categoryIcons: Record<string, React.ElementType> = {
  "Marketing Materials": Megaphone,
  "Sales Funnels": Presentation,
  "E-books / Digital Products": BookOpen,
  "Training / Education": Video,
  "Promotional Assets": FileText,
  "Scripts / Talking Points": MessageSquare,
  "Event Materials": FolderOpen,
};

const ALL = "All";

// Shelf corporation products (static for now — can move to DB later)
const shelfCorpProducts = [
  {
    id: "shelf-aged-1",
    name: "Aged Shelf Corporation — 1 Year",
    age: "1 Year",
    state: "Wyoming",
    price: 1500,
    description: "Clean Wyoming shelf corporation aged 1 year. Includes EIN, articles of organization, and operating agreement. Ready for bank account setup and credit building.",
    features: ["EIN included", "Articles of Organization", "Operating Agreement", "Registered Agent (1 year)"],
  },
  {
    id: "shelf-aged-2",
    name: "Aged Shelf Corporation — 2 Years",
    age: "2 Years",
    state: "Wyoming",
    price: 2500,
    description: "Clean Wyoming shelf corporation aged 2 years. Stronger credit profile for funding applications. Includes all documentation for immediate transfer.",
    features: ["EIN included", "Articles of Organization", "Operating Agreement", "Registered Agent (1 year)", "2-year business history"],
  },
  {
    id: "shelf-aged-3",
    name: "Aged Shelf Corporation — 3+ Years",
    age: "3+ Years",
    state: "Wyoming",
    price: 4000,
    description: "Premium aged shelf corporation with 3+ years of history. Ideal for higher funding amounts and faster approvals. Full documentation package included.",
    features: ["EIN included", "Articles of Organization", "Operating Agreement", "Registered Agent (1 year)", "3+ year business history", "Priority transfer processing"],
  },
];

interface ShelfOrderForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
}

export default function PortalResources() {
  const { affiliate } = useAuth();
  const [filter, setFilter] = useState(ALL);
  const [orderDialog, setOrderDialog] = useState<typeof shelfCorpProducts[0] | null>(null);
  const [orderForm, setOrderForm] = useState<ShelfOrderForm>({ clientName: "", clientEmail: "", clientPhone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const { data: resources, isLoading } = useQuery({
    queryKey: ["portal-resources"],
    queryFn: async () => {
      const { data } = await supabase
        .from("resources")
        .select("*")
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  const categories = [ALL, ...new Set(resources?.map((r) => r.category) ?? [])];
  const filtered = filter === ALL ? resources : resources?.filter((r) => r.category === filter);

  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

  const handleShelfOrder = async () => {
    if (!orderDialog || !affiliate) return;
    if (!orderForm.clientName.trim() || !orderForm.clientEmail.trim()) {
      toast.error("Client name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      // Insert into partner_submissions as a shelf corp order
      const { error } = await supabase.from("partner_submissions").insert({
        name: orderForm.clientName,
        email: orderForm.clientEmail,
        phone: orderForm.clientPhone || null,
        business_name: orderDialog.name,
        referral_source: "shelf_corp_order",
        message: `Shelf Corp Order: ${orderDialog.name} (${orderDialog.state}, ${orderDialog.age}) — $${orderDialog.price}\n\nOrdered by affiliate: ${affiliate.affiliate_id}\n\nNotes: ${orderForm.notes || "None"}`,
        affiliate_link: affiliate.affiliate_id,
      });
      if (error) throw error;
      toast.success("Order submitted! The team will process your shelf corporation request.");
      setOrderDialog(null);
      setOrderForm({ clientName: "", clientEmail: "", clientPhone: "", notes: "" });
    } catch {
      toast.error("Failed to submit order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Partner Store</h1>
        <p className="text-sm text-slate-500 mt-1">Resources, tools, and services to grow your referral business.</p>
      </div>

      <Tabs defaultValue="resources" className="space-y-6">
        <TabsList>
          <TabsTrigger value="resources">Resources & Tools</TabsTrigger>
          <TabsTrigger value="shelf-corps">Shelf Corporations</TabsTrigger>
        </TabsList>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : !filtered?.length ? (
            <div className="py-16 text-center">
              <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No resources found</p>
              <p className="text-xs text-slate-400 mt-1">Resources will appear here as they become available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((resource) => {
                const Icon = categoryIcons[resource.category] ?? FileText;
                return (
                  <Card key={resource.id} className="border-slate-200 group hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-sm font-semibold text-slate-900 leading-tight">{resource.title}</h2>
                          <Badge variant="secondary" className="mt-1 text-[10px] font-normal">{resource.category}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                        {resource.description ?? "Resource description coming soon."}
                      </p>
                      {resource.is_placeholder ? (
                        <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                          Coming Soon
                        </Button>
                      ) : resource.file_url ? (
                        <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5">
                          <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        </Button>
                      ) : resource.external_url ? (
                        <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5">
                          <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" /> View Resource
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                          Coming Soon
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Shelf Corporations Tab */}
        <TabsContent value="shelf-corps" className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Shelf Corporation Services</p>
                <p className="text-xs text-blue-700 mt-1">Order aged shelf corporations for your clients. All entities come with EIN, articles of organization, and operating agreement. Orders are processed within 3-5 business days.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {shelfCorpProducts.map((product) => (
              <Card key={product.id} className="border-slate-200 hover:shadow-md transition-shadow flex flex-col">
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-slate-100 text-slate-700">{product.state}</Badge>
                    <Badge className="bg-blue-100 text-blue-700">{product.age}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{product.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{product.description}</p>

                  <ul className="space-y-1.5 mb-5 flex-1">
                    {product.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <p className="text-xl font-bold text-slate-900">{fmt(product.price)}</p>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setOrderDialog(product)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Dialog */}
      <Dialog open={!!orderDialog} onOpenChange={(open) => !open && setOrderDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Shelf Corporation</DialogTitle>
            <DialogDescription>
              {orderDialog?.name} — {fmt(orderDialog?.price ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="client-name">Client Name *</Label>
              <Input
                id="client-name"
                placeholder="Full legal name"
                value={orderForm.clientName}
                onChange={(e) => setOrderForm(prev => ({ ...prev, clientName: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="client-email">Client Email *</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="client@example.com"
                value={orderForm.clientEmail}
                onChange={(e) => setOrderForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="client-phone">Client Phone</Label>
              <Input
                id="client-phone"
                placeholder="(555) 000-0000"
                value={orderForm.clientPhone}
                onChange={(e) => setOrderForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or instructions..."
                value={orderForm.notes}
                onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialog(null)}>Cancel</Button>
            <Button onClick={handleShelfOrder} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              Submit Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
