import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { BureauName, RemovalStatus } from "./useBureauStatus";

export interface InquiryQueueItem {
  id: string;
  bureau: BureauName;
  inquiry_count: number;
  paused_at: string | null;
  client: {
    id: string;
    full_name: string;
  };
  inquiry_removals: Array<{
    id: string;
    status: RemovalStatus;
    requested_at: string | null;
    completed_at: string | null;
    assigned_to: string | null;
  }>;
}

async function fetchPausedBureaus(): Promise<InquiryQueueItem[]> {
  // First query: fetch paused bureau_status records with client info
  const { data: pausedBureaus, error: bureausError } = await supabase
    .from("bureau_status")
    .select(
      `
      id,
      bureau,
      inquiry_count,
      paused_at,
      client_id,
      client:funding_clients!inner(id, full_name)
    `
    )
    .eq("is_paused", true)
    .order("paused_at", { ascending: true });

  if (bureausError) {
    throw new Error(`Failed to fetch paused bureaus: ${bureausError.message}`);
  }

  if (!pausedBureaus || pausedBureaus.length === 0) {
    return [];
  }

  // Get unique client IDs
  const clientIds = [...new Set(pausedBureaus.map((b) => b.client_id))];

  // Second query: fetch inquiry_removals for those same client_ids
  const { data: removals, error: removalsError } = await supabase
    .from("inquiry_removals")
    .select(
      "id, client_id, bureau, status, requested_at, completed_at, assigned_to, notes"
    )
    .in("client_id", clientIds);

  if (removalsError) {
    throw new Error(`Failed to fetch inquiry removals: ${removalsError.message}`);
  }

  // Combine them client-side — match removals to bureau_status entries by client_id + bureau
  const items: InquiryQueueItem[] = pausedBureaus.map((bureau) => {
    const bureauRemovals =
      removals?.filter(
        (r) => r.client_id === bureau.client_id && r.bureau === bureau.bureau
      ) || [];

    return {
      id: bureau.id,
      bureau: bureau.bureau as BureauName,
      inquiry_count: bureau.inquiry_count,
      paused_at: bureau.paused_at,
      client: bureau.client as { id: string; full_name: string },
      inquiry_removals: bureauRemovals.map((r) => ({
        id: r.id,
        status: r.status as RemovalStatus,
        requested_at: r.requested_at,
        completed_at: r.completed_at,
        assigned_to: r.assigned_to,
      })),
    };
  });

  return items;
}

async function startRemoval(
  bureauStatusId: string,
  clientId: string,
  bureau: BureauName,
  userId: string | undefined
): Promise<void> {
  const now = new Date().toISOString();

  // Create inquiry_removals row
  const { error: insertError } = await supabase.from("inquiry_removals").insert({
    client_id: clientId,
    bureau,
    status: "Requested",
    requested_at: now,
    assigned_to: userId || null,
  });

  if (insertError) {
    throw new Error(`Failed to start removal: ${insertError.message}`);
  }

  // Log activity
  await supabase.from("client_activity_log").insert({
    client_id: clientId,
    user_id: userId || null,
    action_type: "InquiryRemovalRequested",
    details: { bureau, bureau_status_id: bureauStatusId },
  });
}

async function updateRemovalStatus(
  removalId: string,
  clientId: string,
  bureau: BureauName,
  newStatus: RemovalStatus,
  userId: string | undefined
): Promise<void> {
  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status: newStatus,
  };

  if (newStatus === "InProgress") {
    // Mark as in progress
    updateData.assigned_to = userId;
  } else if (newStatus === "Completed") {
    updateData.completed_at = now;
  }

  // Update removal status
  const { error: updateError } = await supabase
    .from("inquiry_removals")
    .update(updateData)
    .eq("id", removalId);

  if (updateError) {
    throw new Error(`Failed to update removal status: ${updateError.message}`);
  }

  // If completed, unpause the bureau
  if (newStatus === "Completed") {
    const { error: unpauseError } = await supabase
      .from("bureau_status")
      .update({
        is_paused: false,
        unpaused_at: now,
        inquiry_count: 0,
      })
      .eq("client_id", clientId)
      .eq("bureau", bureau);

    if (unpauseError) {
      throw new Error(`Failed to unpause bureau: ${unpauseError.message}`);
    }

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
}

export function useInquiryQueue() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch paused bureaus
  const {
    data: items,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inquiry-queue"],
    queryFn: fetchPausedBureaus,
  });

  // Start removal mutation
  const startRemovalMutation = useMutation({
    mutationFn: ({
      bureauStatusId,
      clientId,
      bureau,
    }: {
      bureauStatusId: string;
      clientId: string;
      bureau: BureauName;
    }) => startRemoval(bureauStatusId, clientId, bureau, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiry-queue"] });
    },
  });

  // Update removal status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      removalId,
      clientId,
      bureau,
      status,
    }: {
      removalId: string;
      clientId: string;
      bureau: BureauName;
      status: RemovalStatus;
    }) => updateRemovalStatus(removalId, clientId, bureau, status, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiry-queue"] });
    },
  });

  // Compute summary stats
  const summary = {
    total: items?.length || 0,
    experian: items?.filter((i) => i.bureau === "Experian").length || 0,
    equifax: items?.filter((i) => i.bureau === "Equifax").length || 0,
    transunion: items?.filter((i) => i.bureau === "TransUnion").length || 0,
  };

  return {
    items: items || [],
    isLoading,
    error,
    refetch,
    summary,
    startRemoval: startRemovalMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    isStartingRemoval: startRemovalMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
