import type { InquiryOrder } from "@/hooks/useInquiryPortal";

export function canRemoveInquiryOrder(order: Pick<InquiryOrder, "status" | "payment_status" | "service_status">): boolean {
  return order.status !== "cancelled" && ["unpaid", "failed"].includes(order.payment_status) && order.service_status !== "completed";
}