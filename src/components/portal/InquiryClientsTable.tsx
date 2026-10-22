import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInquiryClients, useInquiryOrders, type InquiryOrder, SERVICE_STATUS_LABELS } from "@/hooks/useInquiryPortal";
import LeadDocuments from "@/components/portal/LeadDocuments";

/** Paid credit inquiry orders are clients; each opens a document uploader that also sends files to GoHighLevel. */
export default function InquiryClientsTable() {
  const ordersQ = useInquiryOrders();
  const clientsQ = useInquiryClients();
  const [open, setOpen] = useState<InquiryOrder | null>(null);
  const names = useMemo(() => new Map((clientsQ.data ?? []).map((c) => [c.id, `${c.first_name} ${c.last_name}`])), [clientsQ.data]);
  const paid = (ordersQ.data ?? []).filter((o) => o.payment_status === "paid");
  const name = (o: InquiryOrder) => (o.client_id && names.get(o.client_id)) || "Unknown client";

  if (ordersQ.isLoading) return <div className="space-y-2 p-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  if (paid.length === 0) return <p className="p-6 text-center text-sm text-muted-foreground">No clients yet. Credit inquiry orders appear here once payment is confirmed.</p>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Bureaus</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paid.map((o) => (
            <TableRow key={o.id} className="cursor-pointer" onClick={() => setOpen(o)}>
              <TableCell className="font-medium">{name(o)}</TableCell>
              <TableCell>{o.service_name}</TableCell>
              <TableCell>{o.bureaus.join(", ")}</TableCell>
              <TableCell><Badge variant="secondary">{SERVICE_STATUS_LABELS[o.service_status] ?? o.service_status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
