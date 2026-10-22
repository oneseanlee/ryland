import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInquiryClients, useInquiryOrders, type InquiryOrder, SERVICE_STATUS_LABELS } from "@/hooks/useInquiryPortal";
import LeadDocuments from "@/components/portal/LeadDocuments";
import RemoveInquiryOrderButton from "@/components/portal/RemoveInquiryOrderButton";
import { PAYMENT_STATUS_LABELS } from "@/hooks/useInquiryPortal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Paid credit inquiry orders are clients; each opens a document uploader that also sends files to GoHighLevel. */
export default function InquiryClientsTable() {
  const ordersQ = useInquiryOrders();
  const clientsQ = useInquiryClients();
  const [open, setOpen] = useState<InquiryOrder | null>(null);
  const names = useMemo(() => new Map((clientsQ.data ?? []).map((c) => [c.id, `${c.first_name} ${c.last_name}`])), [clientsQ.data]);
  const paid = (ordersQ.data ?? []).filter((o) => o.payment_status === "paid");
  const unpaid = (ordersQ.data ?? []).filter((o) => o.status !== "cancelled" && o.payment_status !== "paid");
  const name = (o: InquiryOrder) => (o.client_id && names.get(o.client_id)) || "Unknown client";

  if (ordersQ.isLoading) return <div className="space-y-2 p-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;

  return (
    <>
      <Tabs defaultValue="paid">
        <TabsList className="mx-4 mb-3"><TabsTrigger value="paid">Clients ({paid.length})</TabsTrigger><TabsTrigger value="unpaid">Unpaid orders ({unpaid.length})</TabsTrigger></TabsList>
        {([{ key: "paid", orders: paid }, { key: "unpaid", orders: unpaid }]).map(group => <TabsContent key={group.key} value={group.key}>
      {group.orders.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">{group.key === "paid" ? "No paid clients yet." : "No unpaid orders."}</p> : <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Bureaus</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.orders.map((o) => (
            <TableRow key={o.id} className="cursor-pointer" onClick={() => setOpen(o)}>
              <TableCell className="font-medium">{name(o)}</TableCell>
              <TableCell>{o.service_name}</TableCell>
              <TableCell>{o.bureaus.join(", ")}</TableCell>
              <TableCell><Badge variant="secondary">{group.key === "paid" ? SERVICE_STATUS_LABELS[o.service_status] : PAYMENT_STATUS_LABELS[o.payment_status]}</Badge></TableCell>
              <TableCell className="text-right"><RemoveInquiryOrderButton order={o} onRemoved={() => setOpen(null)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>}
      </TabsContent>)}
      </Tabs>
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{name(open)}</DialogTitle>
                <DialogDescription>{open.service_name} · {open.bureaus.join(", ")}</DialogDescription>
              </DialogHeader>
              <p className="text-sm font-medium">Documents</p>
              <LeadDocuments kind="inquiry" leadId={open.id} affiliateId={open.affiliate_id} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
