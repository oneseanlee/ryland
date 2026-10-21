import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

export type InquiryOrderUpdate = Database["public"]["Tables"]["inquiry_orders"]["Update"];

export interface InquiryClient {
  id: string;
  affiliate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  created_at: string;
}

export interface InquiryAddOn {
  name: string;
  price: number;
}

export interface InquiryOrder {
  id: string;
  affiliate_id: string;
  client_id: string | null;
  service_name: string;
  bureaus: string[];
  add_ons: InquiryAddOn[];
  instructions: string | null;
  status: "draft" | "cart" | "submitted" | "cancelled";
  payment_status: "unpaid" | "pending_verification" | "paid" | "failed" | "refunded";
  service_status: "submitted" | "needs_information" | "ready_for_review" | "in_progress" | "completed" | "cancelled";
  price: number;
  checkout_batch_id: string | null;
  permission_confirmed: boolean;
  admin_notes: string | null;
  affiliate_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface InquiryDocument {
  id: string;
  order_id: string;
  category: string;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface CheckoutBatch {
  id: string;
  reference: string;
  affiliate_id: string;
  order_count: number;
  total: number;
  status: "awaiting_payment" | "pending_verification" | "paid" | "cancelled";
  payment_ref: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface InquirySettings {
  service_price: number;
  per_bureau_price: number;
  add_ons: InquiryAddOn[];
  required_document_categories: string[];
  ghl_payment_link: string | null;
  retention_days: number;
}

export const BUREAUS = ["Equifax", "Experian", "TransUnion"] as const;

export const DOC_CATEGORY_LABELS: Record<string, string> = {
  drivers_license_front: "Driver's License — Front",
  drivers_license_back: "Driver's License — Back",
  social_security_card: "Social Security Card",
  credit_report: "Credit Report",
  proof_of_address: "Proof of Address",
  other: "Other Document",
  completed_results: "Completed Results",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  pending_verification: "Pending Verification",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  needs_information: "Needs Information",
  ready_for_review: "Ready for Review",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function formatMoney(value: number | null | undefined): string {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

/** Server-mirrored pricing calculation — the settings table is the source of truth. */
export function orderPrice(
  order: Pick<InquiryOrder, "bureaus" | "add_ons">,
  settings: InquirySettings | null
): number {
  if (!settings) return 0;
  const base = Number(settings.service_price) || 0;
  const perBureau = Number(settings.per_bureau_price) || 0;
  const addOns = (order.add_ons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  return base + perBureau * (order.bureaus?.length || 0) + addOns;
}

export function missingCategories(
  docs: InquiryDocument[],
  settings: InquirySettings | null
): string[] {
  const required = (settings?.required_document_categories || []) as string[];
  const present = new Set(docs.map((d) => d.category));
  return required.filter((c) => !present.has(c));
}

export async function downloadInquiryDocument(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("inquiry-documents")
    .createSignedUrl(storagePath, 300);
  if (error || !data) return null;
  return data.signedUrl;
}

const SETTINGS_FIELDS = "service_price, per_bureau_price, add_ons, required_document_categories, ghl_payment_link, retention_days";

export function useInquirySettings() {
  return useQuery<InquirySettings | null>({
    queryKey: ["inquiry-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiry_settings")
        .select(SETTINGS_FIELDS)
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as InquirySettings) ?? null;
    },
    staleTime: 60 * 1000,
  });
}

export function useInquiryClients() {
  const { user, loading } = useAuth();
  return useQuery<InquiryClient[]>({
    queryKey: ["inquiry-clients", user?.id],
    enabled: !!user && !loading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiry_clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as InquiryClient[];
    },
  });
}

export function useInquiryOrders() {
  const { user, loading } = useAuth();
  return useQuery<InquiryOrder[]>({
    queryKey: ["inquiry-orders", user?.id],
    enabled: !!user && !loading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiry_orders")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InquiryOrder[];
    },
  });
}

export function useInquiryDocuments() {
  const { user, loading } = useAuth();
  return useQuery<InquiryDocument[]>({
    queryKey: ["inquiry-documents", user?.id],
    enabled: !!user && !loading,
    queryFn: async () => {
      // RLS restricts rows to documents on the affiliate's own orders.
      const { data, error } = await supabase
        .from("inquiry_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as InquiryDocument[];
    },
  });
}

export function useCheckoutBatches() {
  const { user, loading } = useAuth();
  return useQuery<CheckoutBatch[]>({
    queryKey: ["checkout-batches", user?.id],
    enabled: !!user && !loading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkout_batches")
        .select("id, reference, affiliate_id, order_count, total, status, payment_ref, paid_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CheckoutBatch[];
    },
  });
}
