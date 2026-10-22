import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import {
  BUREAUS,
  DOC_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS,
  SERVICE_STATUS_LABELS,
  formatMoney,
  missingCategories,
  orderPrice,
  downloadInquiryDocument,
  useCheckoutBatches,
  useInquiryClients,
  useInquiryDocuments,
  useInquiryOrders,
  useInquirySettings,
  type InquiryClient,
  type InquiryDocument,
  type InquiryOrder,
} from "@/hooks/useInquiryPortal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageMeta from "@/components/PageMeta";
import InquiryProfileFallback from "@/components/portal/InquiryProfileFallback";
import { toast } from "sonner";
import {
  FilePlus2,
  FileText,
  Loader2,
  Pencil,
  ShoppingBag,
  Trash2,
  Upload,
  Users,
  Eye,
  CreditCard,
  ShieldAlert,
} from "lucide-react";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const ALLOWED_EXTS = ["pdf", "jpg", "jpeg", "png"];
const MAX_FILE_SIZE = 25 * 1024 * 1024;

interface ClientFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

const emptyClient: ClientFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  notes: "",
};

interface OrderFormState {
  draftId: string | null;
  clientId: string; // "new" or client id
  newClient: ClientFormValues;
  bureaus: string[];
  addOns: string[];
  instructions: string;
  permission: boolean;
}

const emptyOrderForm: OrderFormState = {
  draftId: null,
  clientId: "new",
  newClient: { ...emptyClient },
  bureaus: [],
  addOns: [],
  instructions: "",
  permission: false,
};

export default function PortalInquiries() {
  const { affiliate } = useAuth();
  const queryClient = useQueryClient();
  const settingsQ = useInquirySettings();
  const clientsQ = useInquiryClients();
  const ordersQ = useInquiryOrders();
  const docsQ = useInquiryDocuments();
  const batchesQ = useCheckoutBatches();

  const settings = settingsQ.data;
  const clients = clientsQ.data ?? [];
  const orders = ordersQ.data ?? [];
  const docs = docsQ.data ?? [];
  const batches = batchesQ.data ?? [];

  const [tab, setTab] = useState("orders");
  const [clientDialog, setClientDialog] = useState<{ open: boolean; editing: InquiryClient | null; values: ClientFormValues }>({
    open: false,
    editing: null,
    values: { ...emptyClient },
  });
  const [savingClient, setSavingClient] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormState | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{
    reference: string;
    total: number;
    orderCount: number;
    paymentUrl: string;
  } | null>(null);
  const [detailOrder, setDetailOrder] = useState<InquiryOrder | null>(null);

  const clientsById = useMemo(() => {
    const map = new Map<string, InquiryClient>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  const batchesById = useMemo(() => {
    const map = new Map<string, (typeof batches)[number]>();
    batches.forEach((b) => map.set(b.id, b));
    return map;
  }, [batches]);

  const cartOrders = orders.filter((o) => o.status === "cart");
  const draftOrders = orders.filter((o) => o.status === "draft");
  const submittedOrders = orders.filter((o) => o.status === "submitted");
  const settingsReady = !!settings && Number(settings.service_price) > 0;

  const documentsByOrder = useMemo(() => {
    const map = new Map<string, InquiryDocument[]>();
    docs.forEach((doc) => {
      const group = map.get(doc.order_id) ?? [];
      group.push(doc);
      map.set(doc.order_id, group);
    });
    return map;
  }, [docs]);
  const ordersById = useMemo(() => new Map(orders.map((order) => [order.id, order])), [orders]);
  const docsForOrder = (orderId: string) => documentsByOrder.get(orderId) ?? [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["inquiry-orders"] });
    queryClient.invalidateQueries({ queryKey: ["inquiry-documents"] });
    queryClient.invalidateQueries({ queryKey: ["checkout-batches"] });
    queryClient.invalidateQueries({ queryKey: ["inquiry-clients"] });
  };

  // ---------- clients ----------

  const saveClient = async (): Promise<InquiryClient | null> => {
    const v = clientDialog.values;
    if (!v.first_name.trim() || !v.last_name.trim()) {
      toast.error("First name and last name are required");
      return null;
    }
    if (v.email.length > 255) {
      toast.error("Email is too long");
      return null;
    }
    setSavingClient(true);
    try {
      if (clientDialog.editing) {
        const { data, error } = await supabase
          .from("inquiry_clients")
          .update({
            first_name: v.first_name.trim(),
            last_name: v.last_name.trim(),
            email: v.email.trim() || null,
            phone: v.phone.trim() || null,
            address_line1: v.address_line1.trim() || null,
            address_line2: v.address_line2.trim() || null,
            city: v.city.trim() || null,
            state: v.state.trim() || null,
            zip: v.zip.trim() || null,
            notes: v.notes.trim() || null,
          })
          .eq("id", clientDialog.editing.id)
          .select()
          .single();
        if (error) throw error;
        toast.success("Client updated");
        return data as InquiryClient;
      }
      const { data, error } = await supabase
        .from("inquiry_clients")
        .insert({
          affiliate_id: affiliate!.id,
          first_name: v.first_name.trim(),
          last_name: v.last_name.trim(),
          email: v.email.trim() || null,
          phone: v.phone.trim() || null,
          address_line1: v.address_line1.trim() || null,
          address_line2: v.address_line2.trim() || null,
          city: v.city.trim() || null,
          state: v.state.trim() || null,
          zip: v.zip.trim() || null,
          notes: v.notes.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Client saved");
      return data as InquiryClient;
    } catch (err) {
      console.error(err);
      toast.error("Could not save client");
      return null;
    } finally {
      setSavingClient(false);
    }
  };

  // ---------- orders ----------

  const validateOrderForm = (form: OrderFormState): boolean => {
    if (form.clientId === "new") {
      const c = form.newClient;
      if (!c.first_name.trim() || !c.last_name.trim()) {
        toast.error("Client first name and last name are required");
        return false;
      }
    }
    if (form.bureaus.length === 0) {
      toast.error("Select at least one credit bureau");
      return false;
    }
    if (!form.permission) {
      toast.error("Please confirm you have the client's permission to submit their information");
      return false;
    }
    return true;
  };

  /** Persists the form as a draft (or updates the existing draft). Returns the order id or null. */
  const saveOrderDraft = async (form: OrderFormState): Promise<string | null> => {
    setSavingOrder(true);
    try {
      let clientId = form.clientId;
      if (clientId === "new") {
        const v = form.newClient;
        const { data, error } = await supabase
          .from("inquiry_clients")
          .insert({
            affiliate_id: affiliate!.id,
            first_name: v.first_name.trim(),
            last_name: v.last_name.trim(),
            email: v.email.trim() || null,
            phone: v.phone.trim() || null,
            address_line1: v.address_line1.trim() || null,
            address_line2: v.address_line2.trim() || null,
            city: v.city.trim() || null,
            state: v.state.trim() || null,
            zip: v.zip.trim() || null,
            notes: v.notes.trim() || null,
          })
          .select()
          .single();
        if (error) throw error;
        clientId = (data as InquiryClient).id;
      }

      const payload = {
        affiliate_id: affiliate!.id,
        client_id: clientId,
        bureaus: form.bureaus,
        add_ons: (settings?.add_ons || []).filter((a) => form.addOns.includes(a.name)) as unknown as Json,
        instructions: form.instructions.trim() || null,
        permission_confirmed: form.permission,
      };

      if (form.draftId) {
        const { error } = await supabase
          .from("inquiry_orders")
          .update(payload)
          .eq("id", form.draftId)
          .eq("status", "draft");
        if (error) throw error;
        return form.draftId;
      }

      const { data, error } = await supabase
        .from("inquiry_orders")
        .insert({ ...payload, status: "draft", service_name: "Credit Inquiry Removal" })
        .select()
        .single();
      if (error) throw error;
      return (data as unknown as InquiryOrder).id;
    } catch (err) {
      console.error(err);
      toast.error("Could not save the order");
      return null;
    } finally {
      setSavingOrder(false);
    }
  };

  const uploadDoc = async (orderId: string, category: string, file: File) => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTS.includes(ext)) {
      toast.error("Only PDF, JPG, and PNG files are accepted");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is larger than 25 MB");
      return;
    }
    setUploadingCategory(category);
    try {
      const path = `${affiliate!.id}/${orderId}/${category}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("inquiry-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("inquiry_documents").insert({
        order_id: orderId,
        category,
        filename: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      });
      if (dbErr) throw dbErr;
      toast.success(`${DOC_CATEGORY_LABELS[category] ?? "Document"} uploaded`);
      queryClient.invalidateQueries({ queryKey: ["inquiry-documents"] });
      if (ordersById.get(orderId)?.status === "submitted") {
        const { data, error } = await supabase.functions.invoke("push-lead-documents", { body: { kind: "inquiry", id: orderId } });
        if (error) toast.error("Saved, but sending to Ryland Partners failed. We'll retry from the admin side.");
        else if (data?.state === "uploaded") toast.success("Document sent to Ryland Partners");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingCategory(null);
    }
  };

  const deleteDoc = async (doc: InquiryDocument) => {
    try {
      const { data, error } = await supabase.rpc("delete_inquiry_document", { _doc_id: doc.id });
      if (error) throw error;
      if (!data) {
        toast.error("Documents can only be removed while the order is still a draft");
        return;
      }
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["inquiry-documents"] });
    } catch (err) {
      console.error(err);
      toast.error("Could not delete document");
    }
  };

  const addToCart = async () => {
    const form = orderForm;
    if (!form || !validateOrderForm(form)) return;
    const orderId = await saveOrderDraft(form);
    if (!orderId) return;
    // First save: keep the form open with the draft id so documents can be uploaded
    if (orderId !== form.draftId) {
      setOrderForm({ ...form, draftId: orderId });
    }
    const missing = missingCategories(docsForOrder(orderId), settings);
    if (missing.length > 0) {
      toast.error(`Upload required documents first: ${missing.map((m) => DOC_CATEGORY_LABELS[m] ?? m).join(", ")}`);
      return;
    }
    try {
      const { error } = await supabase
        .from("inquiry_orders")
        .update({ status: "cart" })
        .eq("id", orderId)
        .eq("status", "draft");
      if (error) throw error;
      toast.success("Added to cart");
      setOrderForm(null);
      invalidateAll();
      setTab("cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart");
    }
  };

  const saveDraftOnly = async () => {
    const form = orderForm;
    if (!form || !validateOrderForm(form)) return;
    const orderId = await saveOrderDraft(form);
    if (!orderId) return;
    toast.success("Draft saved — you can return to it anytime");
    setOrderForm(null);
    invalidateAll();
    setTab("orders");
  };

  const removeFromCart = async (order: InquiryOrder) => {
    try {
      const { error } = await supabase
        .from("inquiry_orders")
        .update({ status: "draft" })
        .eq("id", order.id)
        .eq("status", "cart");
      if (error) throw error;
      invalidateAll();
      toast.success("Removed from cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not remove from cart");
    }
  };

  const doCheckout = async () => {
    if (cartOrders.length === 0) return;
    // Final validation before checkout: required docs present
    const invalid = cartOrders.filter(
      (o) => missingCategories(docsForOrder(o.id), settings).length > 0
    );
    if (invalid.length > 0) {
      toast.error("Some cart orders are missing required documents. Remove or fix them first.");
      return;
    }
    if (!settingsReady) {
      toast.error("Checkout is not available yet — pricing or the payment link still needs admin setup.");
      return;
    }
    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-inquiry-checkout");
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      invalidateAll();
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setCheckoutResult(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Checkout failed. Your cart was not changed — please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const openEditOrder = async (order: InquiryOrder) => {
    // Cart items go back to draft while being edited (remove-from-cart semantics)
    if (order.status === "cart") {
      try {
        await supabase.from("inquiry_orders").update({ status: "draft" }).eq("id", order.id).eq("status", "cart");
        queryClient.invalidateQueries({ queryKey: ["inquiry-orders"] });
      } catch {
        // ignore — editing continues against the row either way
      }
    }
    const client = order.client_id ? clientsById.get(order.client_id) : null;
    setOrderForm({
      draftId: order.id,
      clientId: order.client_id ?? "new",
      newClient: client
        ? {
            first_name: client.first_name,
            last_name: client.last_name,
            email: client.email,
            phone: client.phone ?? "",
            address_line1: client.address_line1 ?? "",
            address_line2: client.address_line2 ?? "",
            city: client.city ?? "",
            state: client.state ?? "",
            zip: client.zip ?? "",
            notes: client.notes ?? "",
          }
        : { ...emptyClient },
      bureaus: order.bureaus ?? [],
      addOns: (order.add_ons ?? []).map((a) => a.name),
      instructions: order.instructions ?? "",
      permission: order.permission_confirmed,
    });
    setTab("new-order");
  };

  const viewDocument = async (doc: InquiryDocument) => {
    const url = await downloadInquiryDocument(doc.storage_path);
    if (!url) {
      toast.error("Could not open document");
      return;
    }
    window.open(url, "_blank", "noopener");
  };

  const requiredDocs = (settings?.required_document_categories || []) as string[];

  const renderDocUploader = (orderId: string) => {
    const orderDocs = docsForOrder(orderId);
    const missing = missingCategories(orderDocs, settings);
    const optionalCats = Object.keys(DOC_CATEGORY_LABELS).filter(
      (k) => !requiredDocs.includes(k) && k !== "completed_results"
    );
    const categories = [...requiredDocs, ...optionalCats.filter((c) => !requiredDocs.includes(c))];

    return (
      <div className="space-y-3">
        {missing.length > 0 && (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Missing required documents: {missing.map((m) => DOC_CATEGORY_LABELS[m] ?? m).join(", ")}
            </AlertDescription>
          </Alert>
        )}
        {categories.map((cat) => {
          const existing = orderDocs.filter((d) => d.category === cat);
          return (
            <div key={cat} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-medium">
                    {DOC_CATEGORY_LABELS[cat] ?? cat}
                    {requiredDocs.includes(cat) && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, or PNG · up to 25 MB</p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) uploadDoc(orderId, cat, f);
                    }}
                  />
                  <span className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors">
                    {uploadingCategory === cat ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload
                  </span>
                </label>
              </div>
              {existing.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 mt-2 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    {d.filename}
                  </span>
                  <span className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => viewDocument(d)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteDoc(d)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const clientName = (orderId: string) => {
    const order = ordersById.get(orderId);
    const client = order?.client_id ? clientsById.get(order.client_id) : null;
    return client ? `${client.first_name} ${client.last_name}` : "Unknown client";
  };

  const statusBadge = (payment: string, service: string) => (
    <div className="flex flex-col gap-1">
      <Badge
        variant={payment === "paid" ? "default" : payment === "pending_verification" ? "secondary" : "outline"}
      >
        {PAYMENT_STATUS_LABELS[payment] ?? payment}
      </Badge>
      <Badge
        variant={
          service === "completed"
            ? "default"
            : service === "needs_information"
              ? "destructive"
              : service === "cancelled"
                ? "outline"
                : "secondary"
        }
      >
        {SERVICE_STATUS_LABELS[service] ?? service}
      </Badge>
    </div>
  );

  if (!affiliate) {
    return <InquiryProfileFallback />;
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Credit Inquiry Orders | Ryland Partners" description="Submit and track credit inquiry removal orders for your clients." noindex />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Credit Inquiry Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a separate order for each client, upload their documents securely, and check out once for all of them.
          </p>
        </div>
      </div>

      {!settingsReady && (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Checkout is not available yet — the admin still needs to configure pricing and the payment
            link. You can create clients and draft orders in the meantime.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="new-order">
            <FilePlus2 className="h-4 w-4 mr-1.5" />
            New Order
          </TabsTrigger>
          <TabsTrigger value="cart">
            <ShoppingBag className="h-4 w-4 mr-1.5" />
            Cart {cartOrders.length > 0 && `(${cartOrders.length})`}
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="h-4 w-4 mr-1.5" />
            My Clients
          </TabsTrigger>
        </TabsList>

        {/* ---------- ORDERS ---------- */}
        <TabsContent value="orders" className="space-y-4">
          {draftOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saved drafts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Bureaus</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Missing documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftOrders.map((o) => {
                      const missing = missingCategories(docsForOrder(o.id), settings);
                      return (
                        <TableRow key={o.id}>
                          <TableCell>{clientName(o.id)}</TableCell>
                          <TableCell>{o.bureaus.join(", ")}</TableCell>
                          <TableCell>{formatMoney(orderPrice(o, settings))}</TableCell>
                          <TableCell>
                            {missing.length === 0 ? (
                              <Badge variant="secondary">Complete</Badge>
                            ) : (
                              <Badge variant="destructive">{missing.length} missing</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => openEditOrder(o)}>
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submitted orders</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersQ.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : submittedOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No submitted orders yet. Create one under “New Order”.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Bureaus</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Checkout</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedOrders.map((o) => {
                      const batch = o.checkout_batch_id ? batchesById.get(o.checkout_batch_id) : null;
                      return (
                        <TableRow key={o.id}>
                          <TableCell>{clientName(o.id)}</TableCell>
                          <TableCell>{o.bureaus.join(", ")}</TableCell>
                          <TableCell>{formatMoney(o.price)}</TableCell>
                          <TableCell className="font-mono text-xs">{batch?.reference ?? "—"}</TableCell>
                          <TableCell>{statusBadge(o.payment_status, o.service_status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => setDetailOrder(o)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- NEW ORDER ---------- */}
        <TabsContent value="new-order" className="space-y-4">
          {!orderForm ? (
            <Card>
              <CardContent className="py-10 text-center space-y-3">
                <FilePlus2 className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Start a new client order. Each client gets their own order — add several, then check out together.
                </p>
                <Button
                  onClick={() => setOrderForm({ ...emptyOrderForm, newClient: { ...emptyClient } })}
                  className="shiny-cta"
                >
                  <FilePlus2 className="h-4 w-4 mr-2" />
                  Start a new order
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4 items-start">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Client & service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Client</Label>
                    <Select
                      value={orderForm.clientId}
                      onValueChange={(v) => setOrderForm({ ...orderForm, clientId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">+ New client</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.first_name} {c.last_name} {c.email ? `(${c.email})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Existing clients can be reused so you never re-enter their details.
                    </p>
                  </div>

                  {orderForm.clientId === "new" && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="of-first">First name *</Label>
                        <Input
                          id="of-first"
                          value={orderForm.newClient.first_name}
                          onChange={(e) =>
                            setOrderForm({
                              ...orderForm,
                              newClient: { ...orderForm.newClient, first_name: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="of-last">Last name *</Label>
                        <Input
                          id="of-last"
                          value={orderForm.newClient.last_name}
                          onChange={(e) =>
                            setOrderForm({
                              ...orderForm,
                              newClient: { ...orderForm.newClient, last_name: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="of-email">Email</Label>
                        <Input
                          id="of-email"
                          type="email"
                          value={orderForm.newClient.email}
                          onChange={(e) =>
                            setOrderForm({
                              ...orderForm,
                              newClient: { ...orderForm.newClient, email: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="of-phone">Phone</Label>
                        <Input
                          id="of-phone"
                          value={orderForm.newClient.phone}
                          onChange={(e) =>
                            setOrderForm({
                              ...orderForm,
                              newClient: { ...orderForm.newClient, phone: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="of-notes">Notes</Label>
                        <Textarea
                          id="of-notes"
                          value={orderForm.newClient.notes}
                          onChange={(e) =>
                            setOrderForm({
                              ...orderForm,
                              newClient: { ...orderForm.newClient, notes: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Input value="Credit Inquiry Removal" disabled readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label>Applicable credit bureaus *</Label>
                    <div className="flex flex-wrap gap-4">
                      {BUREAUS.map((b) => (
                        <label key={b} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={orderForm.bureaus.includes(b)}
                            onCheckedChange={(checked) =>
                              setOrderForm({
                                ...orderForm,
                                bureaus: checked
                                  ? [...orderForm.bureaus, b]
                                  : orderForm.bureaus.filter((x) => x !== b),
                              })
                            }
                          />
                          {b}
                        </label>
                      ))}
                    </div>
                  </div>

                  {(settings?.add_ons?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <Label>Add-ons</Label>
                      <div className="flex flex-wrap gap-4">
                        {settings!.add_ons.map((a) => (
                          <label key={a.name} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={orderForm.addOns.includes(a.name)}
                              onCheckedChange={(checked) =>
                                setOrderForm({
                                  ...orderForm,
                                  addOns: checked
                                    ? [...orderForm.addOns, a.name]
                                    : orderForm.addOns.filter((x) => x !== a.name),
                                })
                              }
                            />
                            {a.name} ({formatMoney(a.price)})
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="of-instructions">Additional instructions or notes</Label>
                    <Textarea
                      id="of-instructions"
                      value={orderForm.instructions}
                      onChange={(e) => setOrderForm({ ...orderForm, instructions: e.target.value })}
                    />
                  </div>

                  <label className="flex items-start gap-2 text-sm rounded-lg border p-3 bg-muted/40">
                    <Checkbox
                      checked={orderForm.permission}
                      onCheckedChange={(checked) => setOrderForm({ ...orderForm, permission: !!checked })}
                      className="mt-0.5"
                    />
                    <span>
                      I confirm I have the client's permission to submit their information and documents
                      for credit inquiry removal.
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button onClick={addToCart} disabled={savingOrder} className="shiny-cta">
                      {savingOrder ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                      Add to cart
                    </Button>
                    <Button variant="outline" onClick={saveDraftOnly} disabled={savingOrder}>
                      Save draft
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setOrderForm(null)}
                      disabled={savingOrder}
                    >
                      Cancel
                    </Button>
                  </div>
                  {orderForm.draftId && (
                    <p className="text-xs text-muted-foreground">
                      Editing draft — changes save to the existing draft.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {!orderForm.draftId ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Click “Save draft” or “Add to cart” first — then you can upload the client's documents here.
                    </p>
                  ) : (
                    renderDocUploader(orderForm.draftId)
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ---------- CART ---------- */}
        <TabsContent value="cart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your cart</CardTitle>
            </CardHeader>
            <CardContent>
              {cartOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Your cart is empty. Complete a client order and click “Add to cart”.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Bureaus</TableHead>
                        <TableHead>Add-ons</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Requirements</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartOrders.map((o) => {
                        const missing = missingCategories(docsForOrder(o.id), settings);
                        const addOnNames = (o.add_ons ?? []).map((a) => a.name).join(", ");
                        return (
                          <TableRow key={o.id}>
                            <TableCell>{clientName(o.id)}</TableCell>
                            <TableCell>Credit Inquiry Removal</TableCell>
                            <TableCell>{o.bureaus.join(", ")}</TableCell>
                            <TableCell>{addOnNames || "—"}</TableCell>
                            <TableCell>{formatMoney(orderPrice(o, settings))}</TableCell>
                            <TableCell>
                              {missing.length === 0 ? (
                                <Badge variant="secondary">Ready</Badge>
                              ) : (
                                <Badge variant="destructive">{missing.length} missing</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openEditOrder(o)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => removeFromCart(o)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {cartOrders.length} order{cartOrders.length === 1 ? "" : "s"} · Estimated total{" "}
                        <span className="font-semibold text-foreground">
                          {formatMoney(cartOrders.reduce((s, o) => s + orderPrice(o, settings), 0))}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Final total is verified server-side at checkout.
                      </p>
                    </div>
                    <Button onClick={doCheckout} disabled={checkingOut || !settingsReady} className="shiny-cta">
                      {checkingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                      Checkout
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- CLIENTS ---------- */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() =>
                setClientDialog({ open: true, editing: null, values: { ...emptyClient } })
              }
              className="shiny-cta"
            >
              <Users className="h-4 w-4 mr-2" />
              New client
            </Button>
          </div>
          <Card>
            <CardContent>
              {clientsQ.isLoading ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : clients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No clients yet. Add one here or while creating an order.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          {c.first_name} {c.last_name}
                        </TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.phone ?? "—"}</TableCell>
                        <TableCell>
                          {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setClientDialog({
                                open: true,
                                editing: c,
                                values: {
                                  first_name: c.first_name,
                                  last_name: c.last_name,
                                  email: c.email,
                                  phone: c.phone ?? "",
                                  address_line1: c.address_line1 ?? "",
                                  address_line2: c.address_line2 ?? "",
                                  city: c.city ?? "",
                                  state: c.state ?? "",
                                  zip: c.zip ?? "",
                                  notes: c.notes ?? "",
                                },
                              })
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Client dialog */}
      <Dialog open={clientDialog.open} onOpenChange={(open) => setClientDialog((p) => ({ ...p, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{clientDialog.editing ? "Edit client" : "New client"}</DialogTitle>
            <DialogDescription>
              Client details are saved so future orders don't need re-entry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cf-first">First name *</Label>
              <Input
                id="cf-first"
                value={clientDialog.values.first_name}
                onChange={(e) =>
                  setClientDialog((p) => ({ ...p, values: { ...p.values, first_name: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-last">Last name *</Label>
              <Input
                id="cf-last"
                value={clientDialog.values.last_name}
                onChange={(e) =>
                  setClientDialog((p) => ({ ...p, values: { ...p.values, last_name: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="cf-email">Email</Label>
              <Input
                id="cf-email"
                type="email"
                value={clientDialog.values.email}
                onChange={(e) =>
                  setClientDialog((p) => ({ ...p, values: { ...p.values, email: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-phone">Phone</Label>
              <Input
                id="cf-phone"
                value={clientDialog.values.phone}
                onChange={(e) =>
                  setClientDialog((p) => ({ ...p, values: { ...p.values, phone: e.target.value } }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClientDialog((p) => ({ ...p, open: false }))}
            >
              Cancel
            </Button>
            <Button
              className="shiny-cta"
              disabled={savingClient}
              onClick={async () => {
                const saved = await saveClient();
                if (saved) {
                  queryClient.invalidateQueries({ queryKey: ["inquiry-clients"] });
                  setClientDialog({ open: false, editing: null, values: { ...emptyClient } });
                }
              }}
            >
              {savingClient ? "Saving…" : "Save client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout result dialog */}
      <Dialog open={!!checkoutResult} onOpenChange={(open) => !open && setCheckoutResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout batch created</DialogTitle>
            <DialogDescription>
              Reference <span className="font-mono font-semibold">{checkoutResult?.reference}</span> ·{" "}
              {checkoutResult?.orderCount} order{checkoutResult?.orderCount === 1 ? "" : "s"} ·{" "}
              {formatMoney(checkoutResult?.total ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Payment note: the payment link charges a fixed amount, so your batch stays “Pending
              Verification” until payment is confirmed by Ryland Partners. Your orders are safely
              stored under this reference in the meantime.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (checkoutResult?.paymentUrl) window.open(checkoutResult.paymentUrl, "_blank", "noopener");
              }}
            >
              Open payment link
            </Button>
            <Button
              className="shiny-cta"
              onClick={() => {
                setCheckoutResult(null);
                setTab("orders");
              }}
            >
              View my orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order detail dialog (affiliate) */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle>{clientName(detailOrder.id)} — Credit Inquiry Removal</DialogTitle>
                <DialogDescription>
                  Checkout {detailOrder.checkout_batch_id ? batchesById.get(detailOrder.checkout_batch_id)?.reference ?? "" : "—"} ·{" "}
                  {formatMoney(detailOrder.price)} · {detailOrder.bureaus.join(", ")}
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-2 flex-wrap">
                {statusBadge(detailOrder.payment_status, detailOrder.service_status)}
              </div>

              {detailOrder.service_status === "needs_information" && detailOrder.affiliate_message && (
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-medium">Information requested:</span>{" "}
                    {detailOrder.affiliate_message}
                  </AlertDescription>
                </Alert>
              )}

              {detailOrder.instructions && (
                <div>
                  <p className="text-sm font-medium mb-1">Your notes</p>
                  <p className="text-sm text-muted-foreground">{detailOrder.instructions}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Documents</p>
                {renderDocUploader(detailOrder.id)}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDetailOrder(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {ordersQ.isLoading && <Progress value={30} className="h-1" />}
    </div>
  );
}
