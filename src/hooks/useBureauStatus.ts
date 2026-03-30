import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type BureauName = "Experian" | "Equifax" | "TransUnion";
export type RemovalStatus = "Requested" | "InProgress" | "Completed";

export interface BureauStatus extends Tables<"bureau_status"> {
  bureau: BureauName;
}

export interface InquiryRemoval extends Tables<"inquiry_removals"> {
  bureau: BureauName;
  status: RemovalStatus;
  assigned_user?: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  } | null;
}

const BUREAUS: BureauName[] = ["Experian", "Equifax", "TransUnion"];
const INQUIRY_THRESHOLD = 2;

// Default bureau status for initialization
function getDefaultBureauStatus(clientId: string, bureau: BureauName): BureauStatus {
  return {
    id: `default-${bureau.toLowerCase()}`,
    client_id: clientId,
    bureau,
    inquiry_count: 0,
    is_paused: false,
    paused_at: null,
    unpaused_at: null,
  };
}

// Fetch bureau status records for a client
async function fetchBureauStatuses(clientId: string): Promise<BureauStatus[]> {
  const { data, error } = await supabase
    .from("bureau_status")
    .select("*")
    .eq("client_id", clientId);

  if (error) {
    throw new Error(`Failed to fetch bureau statuses: ${error.message}`);
  }

  // Create a map of existing statuses
  const existingStatuses = new Map<string, BureauStatus>();
  (data || []).forEach((status) => {
    existingStatuses.set(status.bureau, status as BureauStatus);
  });

  // Return all 3 bureaus, using defaults for missing ones
  return BUREAUS.map((bureau) => {
    const existing = existingStatuses.get(bureau);
    if (existing) return existing;
    return getDefaultBureauStatus(clientId, bureau);
  });
}

// Fetch inquiry removals for a client
async function fetchInquiryRemovals(clientId: string): Promise<InquiryRemoval[]> {
  const { data, error } = await supabase
    .from("inquiry_removals")
    .select(
      `
      *,
      assigned_user:assigned_to (
        email,
        raw_user_meta_data
      )
    `
    )
    .eq("client_id", clientId)
    .order("requested_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch inquiry removals: ${error.message}`);
  }

  return (data as unknown as InquiryRemoval[]) || [];
}

// Ensure bureau status records exist (create if not)
async function ensureBureauStatusExists(clientId: string, bureau: BureauName): Promise<BureauStatus> {
  const { data: existing } = await supabase
    .from("bureau_status")
    .select("*")
    .eq("client_id", clientId)
    .eq("bureau", bureau)
    .maybeSingle();

  if (existing) {
    return existing as BureauStatus;
  }

  const { data, error } = await supabase
    .from("bureau_status")
    .insert({
      client_id: clientId,
      bureau,
      inquiry_count: 0,
      is_paused: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create bureau status: ${error.message}`);
  }

  return data as BureauStatus;
}

// Unpause bureau (admin override)
async function unpauseBureau(
  clientId: string,
  bureau: BureauName,
  userId: string | undefined
): Promise<BureauStatus> {
  // Ensure the record exists
  await ensureBureauStatusExists(clientId, bureau);

  const now = new Date().toISOString();

  // Update bureau status
  const { data, error } = await supabase
    .from("bureau_status")
    .update({
      is_paused: false,
      unpaused_at: now,
      inquiry_count: 0,
    })
    .eq("client_id", clientId)
    .eq("bureau", bureau)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to unpause bureau: ${error.message}`);
  }

  // Create activity log entry
  await supabase.from("client_activity_log").insert({
    client_id: clientId,
    user_id: userId || null,
    action_type: "BureauUnpaused",
    details: {
      bureau,
      unpaused_at: now,
    },
  });

  return data as BureauStatus;
}

// Create inquiry removal request
async function createInquiryRemoval(
  clientId: string,
  bureau: BureauName,
  notes: string | null,
  userId: string | undefined
): Promise<InquiryRemoval> {
  // Ensure the bureau status record exists
  await ensureBureauStatusExists(clientId, bureau);

  // Create inquiry removal record
  const { data: removal, error: removalError } = await supabase
    .from("inquiry_removals")
    .insert({
      client_id: clientId,
      bureau,
      status: "Requested",
      notes,
    })
    .select()
    .single();

  if (removalError) {
    throw new Error(`Failed to create inquiry removal: ${removalError.message}`);
  }

  // Create client task
  await supabase.from("client_tasks").insert({
    client_id: clientId,
    title: `Inquiry Removal - ${bureau}`,
    description: notes || `Process inquiry removal request for ${bureau}`,
    status: "Open",
    created_by: userId || null,
  });

  // Create activity log entry
  await supabase.from("client_activity_log").insert({
    client_id: clientId,
    user_id: userId || null,
    action_type: "InquiryRemovalRequested" as ActivityType,
    details: {
      bureau,
      removal_id: removal.id,
    },
  });

  return removal as InquiryRemoval;
}

// Update removal status (and unpause bureau if completed)
async function updateRemovalStatus(
  clientId: string,
  removalId: string,
  newStatus: RemovalStatus,
  userId: string | undefined
): Promise<InquiryRemoval> {
  const now = new Date().toISOString();

  // Get the removal to find the bureau
  const { data: existingRemoval, error: fetchError } = await supabase
    .from("inquiry_removals")
    .select("*")
    .eq("id", removalId)
    .single();

  if (fetchError || !existingRemoval) {
    throw new Error("Inquiry removal not found");
  }

  const bureau = existingRemoval.bureau as BureauName;

  // Update removal status
  const updateData: TablesUpdate<"inquiry_removals"> = {
    status: newStatus,
    ...(newStatus === "Completed" ? { completed_at: now } : {}),
  };

  const { data: removal, error: updateError } = await supabase
    .from("inquiry_removals")
    .update(updateData)
    .eq("id", removalId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update removal status: ${updateError.message}`);
  }

  // If completed, unpause the bureau
  if (newStatus === "Completed") {
    await supabase
      .from("bureau_status")
      .update({
        is_paused: false,
        unpaused_at: now,
        inquiry_count: 0,
      })
      .eq("client_id", clientId)
      .eq("bureau", bureau);

    // Log bureau unpause
    await supabase.from("client_activity_log").insert({
      client_id: clientId,
      user_id: userId || null,
      action_type: "BureauUnpaused",
      details: {
        bureau,
        reason: "Inquiry removal completed",
        removal_id: removalId,
      },
    });
  }

  return removal as InquiryRemoval;
}

// React Query hook
export function useBureauStatus(clientId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch bureau statuses
  const {
    data: bureauStatuses,
    isLoading: isLoadingStatuses,
    error: statusesError,
  } = useQuery({
    queryKey: ["bureau-status", clientId],
    queryFn: () => fetchBureauStatuses(clientId!),
    enabled: !!clientId,
  });

  // Fetch inquiry removals
  const {
    data: inquiryRemovals,
    isLoading: isLoadingRemovals,
    error: removalsError,
  } = useQuery({
    queryKey: ["inquiry-removals", clientId],
    queryFn: () => fetchInquiryRemovals(clientId!),
    enabled: !!clientId,
  });

  // Set up Realtime subscription for bureau_status
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`bureau-status:${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bureau_status",
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bureau-status", clientId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, queryClient]);

  // Unpause mutation
  const unpauseMutation = useMutation({
    mutationFn: ({ bureau, userId }: { bureau: BureauName; userId: string | undefined }) =>
      unpauseBureau(clientId!, bureau, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bureau-status", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-activity", clientId] });
    },
  });

  // Create removal mutation
  const createRemovalMutation = useMutation({
    mutationFn: ({
      bureau,
      notes,
      userId,
    }: {
      bureau: BureauName;
      notes: string | null;
      userId: string | undefined;
    }) => createInquiryRemoval(clientId!, bureau, notes, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiry-removals", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-activity", clientId] });
    },
  });

  // Update removal status mutation
  const updateRemovalMutation = useMutation({
    mutationFn: ({
      removalId,
      status,
      userId,
    }: {
      removalId: string;
      status: RemovalStatus;
      userId: string | undefined;
    }) => updateRemovalStatus(clientId!, removalId, status, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiry-removals", clientId] });
      queryClient.invalidateQueries({ queryKey: ["bureau-status", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-activity", clientId] });
    },
  });

  return {
    bureauStatuses: bureauStatuses || [],
    inquiryRemovals: inquiryRemovals || [],
    isLoading: isLoadingStatuses || isLoadingRemovals,
    error: statusesError || removalsError,
    unpauseBureau: unpauseMutation.mutate,
    createRemoval: createRemovalMutation.mutate,
    updateRemovalStatus: updateRemovalMutation.mutate,
    isUnpausing: unpauseMutation.isPending,
    isCreatingRemoval: createRemovalMutation.isPending,
    isUpdatingRemoval: updateRemovalMutation.isPending,
  };
}

// Utility: Get status color based on inquiry count
export function getBureauStatusColor(inquiryCount: number): "green" | "yellow" | "red" {
  if (inquiryCount === 0) return "green";
  if (inquiryCount === 1) return "yellow";
  return "red";
}

// Utility: Get status badge variant for removal
export function getRemovalStatusVariant(
  status: RemovalStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Requested":
      return "default";
    case "InProgress":
      return "secondary";
    case "Completed":
      return "outline";
    default:
      return "outline";
  }
}

// Utility: Count active bureaus
export function countActiveBureaus(statuses: BureauStatus[]): number {
  return statuses.filter((s) => !s.is_paused).length;
}

// Utility: Get paused bureaus
export function getPausedBureaus(statuses: BureauStatus[]): BureauName[] {
  return statuses.filter((s) => s.is_paused).map((s) => s.bureau);
}

// Export constants
export { BUREAUS, INQUIRY_THRESHOLD };

// Type for activity log (extend existing types)
type ActivityType =
  | "StageChange"
  | "NoteAdded"
  | "DocumentUploaded"
  | "ApplicationSubmitted"
  | "ApplicationApproved"
  | "ApplicationDenied"
  | "TaskCreated"
  | "TaskCompleted"
  | "AssignmentChanged"
  | "BureauPaused"
  | "BureauUnpaused"
  | "InquiryRemovalRequested"
  | "Other";
