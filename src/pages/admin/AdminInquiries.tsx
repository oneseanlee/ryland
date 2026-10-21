import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Eye,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  MessageSquareWarning,
} from "lucide-react";
import {
  DOC_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS,
  SERVICE_STATUS_LABELS,
  formatMoney,
  downloadInquiryDocument,
  type CheckoutBatch,
  type InquiryClient,
  type InquiryDocument,
  type InquiryOrder,
  type InquiryOrderUpdate,
} from "@/hooks/useInquiryPortal";

const SERVICE_STATUSES = [
  "submitted",
  "needs_information",
  "ready_for_review",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const PAYMENT_STATUSES = [
  "unpaid",
  "pending_verification",
  "paid",
  "failed",
  "refunded",
] as const;

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const ALLOWED_EXTS = ["pdf", "jpg", "jpeg", "png"];
const MAX_FILE_SIZE = 25 * 1024 * 1024;

interface AdminOrder extends InquiryOrder {
  affiliates: { full_name: string; email: string } | null;
}

interface AdminBatch extends CheckoutBatch {
  affiliates: { full_name: string; email: string } | null;
}

export default function AdminInquiries() {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [batches, setBatches] = useState<AdminBatch[]>([]);
  const [clients, setClients] = useState<InquiryClient[]>([]);
  const [documents, setDocuments] = useState<InquiryDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [affiliateFilter, setAffiliateFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");

  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [requestText, setRequestText] = useState("");
  const [uploadingResult, setUploadingResult] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState<AdminBatch | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [ordersRes, batchesRes, clientsRes, docsRes] = await Promise.all([
        supabase
          .from("inquiry_orders")
          .select("*, affiliates(full_name, email)")
          .order("updated_at", { ascending: false }),
        supabase
          .from("checkout_batches")
          .select("*, affiliates(full_name, email)")
          .order("created_at", { ascending: false }),
        supabase.from("inquiry_clients").select("*"),
        supabase.from("inquiry_documents").select("*").order("created_at", { ascending: false }),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (batchesRes.error) throw batchesRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (docsRes.error) throw docsRes.error;
      setOrders((ordersRes.data ?? []) as unknown as AdminOrder[]);
      setBatches((batchesRes.data ?? []) as AdminBatch[]);
      setClients((clientsRes.data ?? []) as InquiryClient[]);
      setDocuments((docsRes.data ?? []) as InquiryDocument[]);
    } catch (err) {
      console.error(err);
      toast.error("Could not load inquiry data");
    } finally {
      setLoading(false);
    }
  };

  const clientsById = useMemo(() => {
    const map = new Map<string, InquiryClient>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  const affiliates = useMemo(() => {
    const seen = new Map<string, string>();
    orders.forEach((o) => {
      if (o.affiliates) seen.set(o.affiliate_id, o.affiliates.full_name);
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const client = o.client_id ? clientsById.get(o.client_id) : null;
      const clientName = client ? `${client.first_name} ${client.last_name}`.toLowerCase() : "";
      const affName = (o.affiliates?.full_name ?? "").toLowerCase();
      if (
        q &&
        !clientName.includes(q) &&
        !affName.includes(q) &&
        !(client?.email ?? "").toLowerCase().includes(q)
      )
        return false;
      if (affiliateFilter !== "all" && o.affiliate_id !== affiliateFilter) return false;
      if (serviceFilter !== "all" && o.service_status !== serviceFilter) return false;
      if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
      if (fromDate && o.created_at < fromDate) return false;
      return true;
    });
  }, [orders, clientsById, search, affiliateFilter, serviceFilter, paymentFilter, fromDate]);

  const refresh = () => {
    fetchAll();
  };

  const openDetail = (o: AdminOrder) => {
    setDetail(o);
    setAdminNotes(o.admin_notes ?? "");
    setRequestText("");
  };

  const updateOrder = async (orderId: string, patch: InquiryOrderUpdate) => {
    try {
      const { error } = await supabase.from("inquiry_orders").update(patch).eq("id", orderId);
      if (error) throw error;
      toast.success("Order updated");
      refresh();
      setDetail((d) => (d && d.id === orderId ? { ...d, ...patch } as AdminOrder : d));
    } catch (err) {
      console.error(err);
      toast.error("Could not update the order");
    }
  };

  const requestInformation = async () => {
    if (!detail) return;
    if (!requestText.trim()) {
      toast.error("Describe what information or documents are needed");
      return;
    }
    await updateOrder(detail.id, {
      service_status: "needs_information",
      affiliate_message: requestText.trim(),
    });
    try {
      const { data: aff } = await supabase
        .from("affiliates")
        .select("user_id")
        .eq("id", detail.affiliate_id)
        .maybeSingle();
      if (aff?.user_id) {
        const client = detail.client_id ? clientsById.get(detail.client_id) : null;
        await supabase.from("notifications").insert({
          user_id: aff.user_id,
          title: "Information requested on an order",
          message: `Action needed on the Credit Inquiry Removal order for ${client ? `${client.first_name} ${client.last_name}` : "your client"}.`,
          type: "system",
          link: "/portal/inquiries",
        });
      }
    } catch {
      // notification is best-effort
    }
    setRequestText("");
  };

  const viewDocument = async (doc: InquiryDocument) => {
    const { data, error } = await supabase.storage
      .from("inquiry-documents")
      .createSignedUrl(doc.storage_path, 300);
    if (error || !data) {
      toast.error("Could not open document");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const deleteDocument = async (doc: InquiryDocument) => {
    try {
      const { data, error } = await supabase.rpc("delete_inquiry_document", { _doc_id: doc.id });
      if (error) throw error;
      if (!data) {
        toast.error("Could not delete that document");
        return;
      }
      toast.success("Document deleted (recorded in audit log)");
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      console.error(err);
      toast.error("Could not delete document");
    }
  };

  const uploadResult = async (file: File) => {
    if (!detail) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTS.includes(ext)) {
      toast.error("Only PDF, JPG, and PNG files are accepted");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is larger than 25 MB");
      return;
    }
    setUploadingResult(true);
    try {
      const path = `${detail.affiliate_id}/${detail.id}/completed_results-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("inquiry-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("inquiry_documents").insert({
        order_id: detail.id,
        category: "completed_results",
        filename: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (dbErr) throw dbErr;
      toast.success("Result uploaded");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploadingResult(false);
    }
  };

  const confirmPayment = async () => {
    if (!confirmingPayment) return;
    setConfirming(true);
    try {
      const { data, error } = await supabase.rpc("admin_confirm_batch_payment", {
        _batch_id: confirmingPayment.id,
        _payment_ref: paymentRef.trim() || null,
      });
      if (error) throw error;
      if (!data) {
        toast.error("Batch was already confirmed");
      } else {
        toast.success("Payment verified and orders marked paid (audited)");
      }
      setConfirmingPayment(null);
      setPaymentRef("");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Could not confirm payment");
    } finally {
      setConfirming(false);
    }
  };

  const docsFor = (orderId: string) => documents.filter((d) => d.order_id === orderId);

  const statusBadge = (payment: string, service: string) => (
    <div className="flex flex-col gap-1">
      <Badge variant={payment === "paid" ? "default" : payment === "pending_verification" ? "secondary" : "outline"}>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Credit Inquiry Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage affiliate client orders, documents, checkout batches, and payment verification.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="orders">Orders ({filteredOrders.length})</TabsTrigger>
          <TabsTrigger value="batches">Checkout Batches ({batches.length})</TabsTrigger>
        </TabsList>

        {/* ---------- ORDERS ---------- */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search client, email, affiliate"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={affiliateFilter} onValueChange={setAffiliateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Affiliate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All affiliates</SelectItem>
                    {affiliates.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Service status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All service statuses</SelectItem>
                    {SERVICE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SERVICE_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All payment statuses</SelectItem>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {PAYMENT_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  aria-label="From date"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              {loading ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No orders match the filters.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Bureaus</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Checkout</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((o) => {
                      const client = o.client_id ? clientsById.get(o.client_id) : null;
                      return (
                        <TableRow key={o.id}>
                          <TableCell>
                            {client ? `${client.first_name} ${client.last_name}` : "—"}
                            <span className="block text-xs text-muted-foreground">{client?.email}</span>
                          </TableCell>
                          <TableCell>{o.affiliates?.full_name ?? "—"}</TableCell>
                          <TableCell>{o.bureaus.join(", ")}</TableCell>
                          <TableCell>{formatMoney(o.price)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {batches.find((b) => b.id === o.checkout_batch_id)?.reference ?? "—"}
                          </TableCell>
                          <TableCell>{statusBadge(o.payment_status, o.service_status)}</TableCell>
                          <TableCell className="text-xs">
                            {o.created_at ? format(new Date(o.created_at), "MMM d, yyyy") : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => openDetail(o)}>
                              <Eye className="h-3.5 w-3.5 mr-1" />
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

        {/* ---------- BATCHES ---------- */}
        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardContent>
              {loading ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : batches.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No checkout batches yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.reference}</TableCell>
                        <TableCell>{b.affiliates?.full_name ?? "—"}</TableCell>
                        <TableCell>{b.order_count}</TableCell>
                        <TableCell className="font-medium">{formatMoney(b.total)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.status === "paid"
                                ? "default"
                                : b.status === "cancelled"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {b.status === "awaiting_payment"
                              ? "Awaiting Payment"
                              : b.status === "pending_verification"
                                ? "Pending Verification"
                                : b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(b.created_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell className="text-right">
                          {b.status !== "paid" && b.status !== "cancelled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setConfirmingPayment(b);
                                setPaymentRef("");
                              }}
                            >
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                              Verify payment
                            </Button>
                          )}
                          {b.status === "paid" && (
                            <span className="text-xs text-muted-foreground">
                              {b.paid_at ? format(new Date(b.paid_at), "MMM d") : ""}
                            </span>
                          )}
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

      {/* Order detail dialog */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {detail.client_id && clientsById.get(detail.client_id)
                    ? `${clientsById.get(detail.client_id)!.first_name} ${clientsById.get(detail.client_id)!.last_name}`
                    : "Client order"}
                </DialogTitle>
                <DialogDescription>
                  {detail.affiliates?.full_name ?? "Unknown affiliate"} · {formatMoney(detail.price)} ·{" "}
                  {detail.bureaus.join(", ")}
                </DialogDescription>
              </DialogHeader>

              {(() => {
                const client = detail.client_id ? clientsById.get(detail.client_id) : null;
                if (!client) return null;
                return (
                  <div className="rounded-lg border p-3 text-sm grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Email:</span> {client.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span> {client.phone ?? "—"}
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Address:</span>{" "}
                      {[client.address_line1, client.address_line2, client.city, client.state, client.zip]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </div>
                    {client.notes && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Client notes:</span> {client.notes}
                      </div>
                    )}
                    {detail.instructions && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Order instructions:</span>{" "}
                        {detail.instructions}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2 flex-wrap">{statusBadge(detail.payment_status, detail.service_status)}</div>

              <div className="space-y-1.5">
                <Label>Service status</Label>
                <Select
                  value={detail.service_status}
                  onValueChange={(v) => updateOrder(detail.id, { service_status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SERVICE_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquareWarning className="h-4 w-4" />
                  Request missing information (affiliate-visible)
                </div>
                <Textarea
                  placeholder="e.g. We need a clearer copy of the driver's license back side."
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={requestInformation}>
                  Send request
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label>Internal notes (not visible to affiliates)</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateOrder(detail.id, { admin_notes: adminNotes })}
                >
                  Save notes
                </Button>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Documents</p>
                <div className="space-y-2">
                  {docsFor(detail.id).length === 0 && (
                    <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                  )}
                  {docsFor(detail.id).map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-2 text-sm rounded-lg border px-3 py-2">
                      <span className="flex flex-col min-w-0">
                        <span className="flex items-center gap-1.5 truncate">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          {d.filename}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {DOC_CATEGORY_LABELS[d.category] ?? d.category}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => viewDocument(d)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteDocument(d)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </span>
                    </div>
                  ))}
                </div>
                <label className="mt-2 inline-block cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) uploadResult(f);
                    }}
                  />
                  <span className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors">
                    {uploadingResult ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload completed results
                  </span>
                </label>
              </div>

              {(() => {
                const batch = batches.find((b) => b.id === detail.checkout_batch_id);
                if (!batch) return null;
                return (
                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertDescription>
                      Checkout <span className="font-mono">{batch.reference}</span> ·{" "}
                      {batch.order_count} orders · {formatMoney(batch.total)} ·{" "}
                      {batch.status === "paid" ? "Paid" : batch.status === "cancelled" ? "Cancelled" : "Awaiting payment"}.{" "}
                      {batch.status !== "paid" &&
                        batch.status !== "cancelled" &&
                        "Verify payment from the Checkout Batches tab — orders are marked paid only through this audited action."}
                    </AlertDescription>
                  </Alert>
                );
              })()}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetail(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment confirmation dialog */}
      <Dialog open={!!confirmingPayment} onOpenChange={(open) => !open && setConfirmingPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify payment</DialogTitle>
            <DialogDescription>
              Confirming marks batch{" "}
              <span className="font-mono">{confirmingPayment?.reference}</span> and its{" "}
              {confirmingPayment?.order_count} orders as paid. This action is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="pay-ref">Payment reference (optional)</Label>
            <Input
              id="pay-ref"
              placeholder="GHL payment / transaction ID"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingPayment(null)}>
              Cancel
            </Button>
            <Button className="shiny-cta" onClick={confirmPayment} disabled={confirming}>
              {confirming ? "Confirming…" : "Confirm payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
