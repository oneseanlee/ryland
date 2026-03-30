import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  createCCNotification,
  getPrimaryRepUserId,
} from "@/utils/createCommandCenterNotification";

// Types
export type ApplicationStatus =
  | "Applied"
  | "Pending"
  | "Approved"
  | "Denied"
  | "NeedsFollowUp";

export type ProductType = "CreditCard" | "LOC" | "TermLoan";

export type BureauType = "Experian" | "Equifax" | "TransUnion";

export interface Bank {
  id: string;
  name: string;
  product_name: string | null;
  product_type: ProductType | null;
  bureau_pulled: BureauType | null;
  requires_relationship: boolean;
  typical_limit_min: number | null;
  typical_limit_max: number | null;
  application_url: string | null;
  notes: string | null;
  is_active: boolean;
  sequence_priority: number;
  created_at: string;
}

export interface FundingApplication {
  id: string;
  client_id: string;
  bank_id: string | null;
  product_type: ProductType | null;
  application_url: string | null;
  applied_date: string | null;
  status: ApplicationStatus;
  approval_amount: number | null;
  bureau_pulled: BureauType | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  bank?: Bank | null;
}

export interface BureauStatus {
  id: string;
  client_id: string;
  bureau: BureauType;
  inquiry_count: number;
  is_paused: boolean;
  paused_at: string | null;
  unpaused_at: string | null;
}

interface FetchApplicationsResponse {
  data: FundingApplication[];
  count: number | null;
}

interface CreateApplicationInput {
  bankId: string;
  productType: ProductType;
  applicationUrl: string;
  appliedDate: string;
  bureauPulled: BureauType;
  notes: string | null;
  userId: string | undefined;
  status?: ApplicationStatus;
}

interface UpdateStatusInput {
  applicationId: string;
  newStatus: ApplicationStatus;
  approvalAmount: number | null;
  userId: string | undefined;
}

// Helper function to get primary rep for a client
async function getPrimaryRepForClient(clientId: string): Promise<string | null> {
  const { data: assignments, error } = await supabase
    .from("client_assignments")
    .select("user_id, is_primary")
    .eq("client_id", clientId);

  if (error) {
    console.error("Failed to fetch client assignments:", error);
    return null;
  }

  const primaryAssignment = assignments?.find((a) => a.is_primary);
  return primaryAssignment?.user_id || assignments?.[0]?.user_id || null;
}

// Helper function to get bank name by ID
async function getBankName(bankId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("banks")
    .select("name")
    .eq("id", bankId)
    .single();

  if (error) {
    console.error("Failed to fetch bank name:", error);
    return null;
  }

  return data?.name || null;
}

// Helper function to create a follow-up task for pending applications
async function createPendingFollowUpTask(
  clientId: string,
  applicationId: string,
  bankName: string,
  userId: string | undefined
): Promise<void> {
  const assignedTo = await getPrimaryRepForClient(clientId);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3); // 3 business days from now

  const taskTitle = `Follow up on pending application — ${bankName}`;
  const taskDescription = `Application submitted to ${bankName} is pending. Follow up within 3 business days.`;

  const { data: task, error: taskError } = await supabase
    .from("client_tasks")
    .insert({
      client_id: clientId,
      application_id: applicationId,
      title: taskTitle,
      description: taskDescription,
      due_date: dueDate.toISOString(),
      assigned_to: assignedTo,
      status: "Open",
      created_by: userId || null,
    })
    .select()
    .single();

  if (taskError) {
    console.error("Failed to create follow-up task:", taskError);
    toast.error("Failed to create follow-up task");
    return;
  }

  // Log activity for task creation
  const { error: activityError } = await supabase
    .from("client_activity_log")
    .insert({
      client_id: clientId,
      user_id: userId || null,
      action_type: "TaskCreated",
      details: {
        task_title: taskTitle,
        triggered_by: "PendingApplication",
        task_id: task?.id,
      },
    });

  if (activityError) {
    console.error("Failed to log task creation activity:", activityError);
  }

  toast.success("Follow-up task created for pending application");
}

const APPLICATION_STATUS: ApplicationStatus[] = [
  "Applied",
  "Pending",
  "Approved",
  "Denied",
  "NeedsFollowUp",
];

// Fetch all applications for a client with bank info
async function fetchClientApplications(
  clientId: string
): Promise<FetchApplicationsResponse> {
  const { data, error, count } = await supabase
    .from("funding_applications")
    .select(
      `
      *,
      bank:bank_id (*)
    `,
      { count: "exact" }
    )
    .eq("client_id", clientId)
    .order("applied_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return {
    data: (data as unknown as FundingApplication[]) || [],
    count,
  };
}

// Fetch all active banks for the form dropdown
async function fetchBanks(): Promise<Bank[]> {
  const { data, error } = await supabase
    .from("banks")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch banks: ${error.message}`);
  }

  return (data as Bank[]) || [];
}

// Fetch bureau status for a client
async function fetchBureauStatus(clientId: string): Promise<BureauStatus[]> {
  const { data, error } = await supabase
    .from("bureau_status")
    .select("*")
    .eq("client_id", clientId);

  if (error) {
    throw new Error(`Failed to fetch bureau status: ${error.message}`);
  }

  return (data as BureauStatus[]) || [];
}

// Create application with bureau status update and activity log
async function createApplication(
  clientId: string,
  input: CreateApplicationInput
): Promise<FundingApplication> {
  const applicationStatus = input.status || "Applied";

  // 1. Insert the application
  const { data: application, error: appError } = await supabase
    .from("funding_applications")
    .insert({
      client_id: clientId,
      bank_id: input.bankId,
      product_type: input.productType,
      application_url: input.applicationUrl,
      applied_date: input.appliedDate,
      bureau_pulled: input.bureauPulled,
      notes: input.notes,
      status: applicationStatus,
      created_by: input.userId || null,
    })
    .select()
    .single();

  if (appError) {
    throw new Error(`Failed to create application: ${appError.message}`);
  }

  // 2. Upsert bureau status - increment inquiry count
  const { data: existingBureau, error: bureauFetchError } = await supabase
    .from("bureau_status")
    .select("*")
    .eq("client_id", clientId)
    .eq("bureau", input.bureauPulled)
    .single();

  if (bureauFetchError && bureauFetchError.code !== "PGRST116") {
    // PGRST116 = no rows returned, which is expected if bureau doesn't exist yet
    throw new Error(`Failed to fetch bureau status: ${bureauFetchError.message}`);
  }

  const newInquiryCount = (existingBureau?.inquiry_count || 0) + 1;
  const shouldPause = newInquiryCount >= 2;

  const { error: bureauError } = await supabase.from("bureau_status").upsert({
    id: existingBureau?.id,
    client_id: clientId,
    bureau: input.bureauPulled,
    inquiry_count: newInquiryCount,
    is_paused: shouldPause,
    paused_at: shouldPause && !existingBureau?.is_paused ? new Date().toISOString() : existingBureau?.paused_at,
    unpaused_at: existingBureau?.unpaused_at,
  }, {
    onConflict: "id",
  });

  if (bureauError) {
    throw new Error(`Failed to update bureau status: ${bureauError.message}`);
  }

  // 3. Create activity log entry
  const { error: activityError } = await supabase
    .from("client_activity_log")
    .insert({
      client_id: clientId,
      user_id: input.userId || null,
      action_type: "ApplicationSubmitted",
      details: {
        application_id: application.id,
        bank_id: input.bankId,
        bureau: input.bureauPulled,
        inquiry_count: newInquiryCount,
        bureau_paused: shouldPause,
      },
    });

  if (activityError) {
    console.error("Failed to log application activity:", activityError);
  }

  // 4. If status is "Pending", create a follow-up task
  if (applicationStatus === "Pending") {
    const bankName = await getBankName(input.bankId);
    if (bankName) {
      await createPendingFollowUpTask(clientId, application.id, bankName, input.userId);
    }
  }

  // 5. If bureau became paused, create a task
  if (shouldPause && (!existingBureau || !existingBureau.is_paused)) {
    const { error: taskError } = await supabase.from("client_tasks").insert({
      client_id: clientId,
      title: `Inquiry Removal Needed - ${input.bureauPulled}`,
      description: `Bureau ${input.bureauPulled} has reached ${newInquiryCount} inquiries and has been paused. Inquiry removal is needed before continuing applications with this bureau.`,
      status: "Open",
      created_by: input.userId || null,
    });

    if (taskError) {
      console.error("Failed to create inquiry removal task:", taskError);
    }

    // Also log the bureau pause activity
    const { error: pauseActivityError } = await supabase
      .from("client_activity_log")
      .insert({
        client_id: clientId,
        user_id: input.userId || null,
        action_type: "BureauPaused",
        details: {
          bureau: input.bureauPulled,
          inquiry_count: newInquiryCount,
          reason: "Inquiry threshold reached",
        },
      });

    if (pauseActivityError) {
      console.error("Failed to log bureau pause activity:", pauseActivityError);
    }

    // Send notification to primary rep about bureau pause
    getPrimaryRepUserId(clientId).then((repUserId) => {
      if (repUserId) {
        // Fetch client name for notification
        supabase
          .from("funding_clients")
          .select("full_name")
          .eq("id", clientId)
          .single()
          .then(({ data: clientData }) => {
            if (clientData) {
              createCCNotification(
                repUserId,
                `Bureau paused: ${input.bureauPulled} for ${clientData.full_name}`,
                `The ${input.bureauPulled} bureau has been paused for ${clientData.full_name} due to reaching the inquiry threshold. Inquiry removal is needed.`,
                `/command-center/clients/${clientId}`
              );
            }
          });
      }
    });
  }

  return application as FundingApplication;
}

// Update application status
async function updateApplicationStatus(
  clientId: string,
  input: UpdateStatusInput
): Promise<FundingApplication> {
  // 1. Fetch the current application to get bank info (needed for pending task)
  const { data: currentApp, error: fetchError } = await supabase
    .from("funding_applications")
    .select(`
      *,
      bank:bank_id (name)
    `)
    .eq("id", input.applicationId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch application: ${fetchError.message}`);
  }

  // 2. Update the application
  const { data: application, error: appError } = await supabase
    .from("funding_applications")
    .update({
      status: input.newStatus,
      approval_amount: input.newStatus === "Approved" ? input.approvalAmount : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId)
    .select()
    .single();

  if (appError) {
    throw new Error(`Failed to update application: ${appError.message}`);
  }

  // 3. Create activity log entry
  const actionType =
    input.newStatus === "Approved"
      ? "ApplicationApproved"
      : input.newStatus === "Denied"
      ? "ApplicationDenied"
      : "ApplicationSubmitted";

  const { error: activityError } = await supabase
    .from("client_activity_log")
    .insert({
      client_id: clientId,
      user_id: input.userId || null,
      action_type: actionType,
      details: {
        application_id: input.applicationId,
        new_status: input.newStatus,
        approval_amount: input.approvalAmount,
      },
    });

  if (activityError) {
    console.error("Failed to log status change activity:", activityError);
  }

  // 4. If new status is "Pending", create a follow-up task
  if (input.newStatus === "Pending") {
    const bankName = (currentApp?.bank as { name?: string } | null)?.name || "Unknown Bank";
    await createPendingFollowUpTask(clientId, input.applicationId, bankName, input.userId);
  }

  // 5. Send notification for approved applications
  if (input.newStatus === "Approved") {
    getPrimaryRepUserId(clientId).then((repUserId) => {
      if (repUserId) {
        const bankName = (currentApp?.bank as { name?: string } | null)?.name || "Unknown Bank";
        const amount = input.approvalAmount
          ? ` — $${input.approvalAmount.toLocaleString()}`
          : "";

        // Fetch client name for notification
        supabase
          .from("funding_clients")
          .select("full_name")
          .eq("id", clientId)
          .single()
          .then(({ data: clientData }) => {
            if (clientData) {
              createCCNotification(
                repUserId,
                `Application approved: ${bankName}${amount}`,
                `The application to ${bankName} for ${clientData.full_name} has been approved${input.approvalAmount ? ` for $${input.approvalAmount.toLocaleString()}` : ""}.`,
                `/command-center/clients/${clientId}`
              );
            }
          });
      }
    });
  }

  return application as FundingApplication;
}

// React Query hook for fetching client applications
export function useClientApplications(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-applications", clientId],
    queryFn: () => fetchClientApplications(clientId!),
    enabled: !!clientId,
  });
}

// React Query hook for fetching banks
export function useBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: fetchBanks,
  });
}

// React Query hook for fetching bureau status
export function useBureauStatus(clientId: string | undefined) {
  return useQuery({
    queryKey: ["bureau-status", clientId],
    queryFn: () => fetchBureauStatus(clientId!),
    enabled: !!clientId,
  });
}

// React Query hook for creating applications
export function useCreateApplication(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      createApplication(clientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client-applications", clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bureau-status", clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-activity", clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-tasks", clientId],
      });
    },
  });
}

// React Query hook for updating application status
export function useUpdateApplicationStatus(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStatusInput) =>
      updateApplicationStatus(clientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client-applications", clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-activity", clientId],
      });
    },
  });
}

// Get status badge variant
export function getStatusBadgeVariant(
  status: ApplicationStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Applied":
      return "default";
    case "Pending":
      return "secondary";
    case "Approved":
      return "default";
    case "Denied":
      return "destructive";
    case "NeedsFollowUp":
      return "outline";
    default:
      return "default";
  }
}

// Get status display color (for custom styling)
export function getStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case "Applied":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "Denied":
      return "bg-red-100 text-red-800 border-red-200";
    case "NeedsFollowUp":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

// Format currency
export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calculate total approved funding
export function calculateTotalApproved(
  applications: FundingApplication[]
): { total: number; count: number; totalCount: number } {
  const approvedApps = applications.filter((app) => app.status === "Approved");
  const total = approvedApps.reduce((sum, app) => sum + (app.approval_amount || 0), 0);
  return {
    total,
    count: approvedApps.length,
    totalCount: applications.length,
  };
}

export { APPLICATION_STATUS };
