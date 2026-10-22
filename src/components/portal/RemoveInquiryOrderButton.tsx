import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import type { InquiryOrder } from "@/hooks/useInquiryPortal";
import { canRemoveInquiryOrder } from "@/lib/inquiryCleanup";

export default function RemoveInquiryOrderButton({ order, onRemoved }: { order: InquiryOrder; onRemoved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  if (!canRemoveInquiryOrder(order)) return null;

  const remove = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("remove_unpaid_inquiry_order", { _order_id: order.id });
      if (error) throw error;
      await Promise.all(["inquiry-orders", "admin-inquiries", "checkout-batches"].map(key => queryClient.invalidateQueries({ queryKey: [key] })));
      toast.success("Unpaid order removed");
      setOpen(false);
      onRemoved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (error as { message?: string })?.message || "Could not remove order");
    } finally { setBusy(false); }
  };

  return <>
    <Button variant="ghost" size="icon" className="h-11 w-11" title="Remove unpaid order" aria-label="Remove unpaid order" onClick={event => { event.stopPropagation(); setOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
    <AlertDialog open={open} onOpenChange={value => !busy && setOpen(value)}>
      <AlertDialogContent onClick={event => event.stopPropagation()}>
        <AlertDialogHeader><AlertDialogTitle>Remove unpaid order?</AlertDialogTitle><AlertDialogDescription>This unfinished order will be removed from active lists. Its documents and history will be kept. Paid orders cannot be removed. Any invoice already sent is not cancelled in GoHighLevel.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>Keep order</AlertDialogCancel><Button disabled={busy} onClick={remove}>{busy ? "Removing…" : "Remove order"}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}