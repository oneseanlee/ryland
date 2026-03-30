import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type ActivityType =
  | "StageChange"
  | "NoteAdded"
  | "DocumentUploaded"
  | "DocumentDeleted"
  | "DocumentReplaced"
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

export interface ActivityLogEntry {
  id: string;
  client_id: string;
  user_id: string | null;
  action_type: ActivityType;
  details: Json | null;
  created_at: string;
  user?: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  } | null;
}

interface FetchActivityResponse {
  data: ActivityLogEntry[];
  count: number | null;
}

const PAGE_SIZE = 20;

// Fetch activity log for a client
async function fetchClientActivity(
  clientId: string,
  page: number = 1
): Promise<FetchActivityResponse> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("client_activity_log")
    .select(
      `
      *,
      user:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `,
      { count: "exact" }
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch activity log: ${error.message}`);
  }

  return {
    data: (data as unknown as ActivityLogEntry[]) || [],
    count,
  };
}

// Create activity log entry
async function createActivityLogEntry(
  clientId: string,
  actionType: ActivityType,
  details: Json | null,
  userId: string | undefined
): Promise<ActivityLogEntry> {
  const { data, error } = await supabase
    .from("client_activity_log")
    .insert({
      client_id: clientId,
      user_id: userId || null,
      action_type: actionType,
      details,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create activity log entry: ${error.message}`);
  }

  return data as ActivityLogEntry;
}

// React Query hook for fetching client activity
export function useClientActivity(
  clientId: string | undefined,
  page: number = 1
) {
  return useQuery({
    queryKey: ["client-activity", clientId, page],
    queryFn: () => fetchClientActivity(clientId!, page),
    enabled: !!clientId,
  });
}

// React Query hook for creating activity log entries
export function useCreateActivityLog(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      actionType,
      details,
      userId,
    }: {
      actionType: ActivityType;
      details: Json | null;
      userId: string | undefined;
    }) => createActivityLogEntry(clientId, actionType, details, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client-activity", clientId],
      });
    },
  });
}

// Get activity badge color based on action type
export function getActivityBadgeVariant(
  actionType: ActivityType
): "default" | "secondary" | "destructive" | "outline" {
  switch (actionType) {
    case "StageChange":
      return "default";
    case "NoteAdded":
      return "secondary";
    case "ApplicationApproved":
      return "default";
    case "ApplicationDenied":
      return "destructive";
    case "TaskCompleted":
      return "default";
    case "BureauPaused":
      return "destructive";
    case "BureauUnpaused":
      return "default";
    default:
      return "outline";
  }
}

// Get activity icon based on action type
export function getActivityIcon(actionType: ActivityType): string {
  switch (actionType) {
    case "StageChange":
      return "GitBranch";
    case "NoteAdded":
      return "FileText";
    case "DocumentUploaded":
      return "Upload";
    case "DocumentDeleted":
      return "Trash2";
    case "DocumentReplaced":
      return "RefreshCw";
    case "ApplicationSubmitted":
      return "Send";
    case "ApplicationApproved":
      return "CheckCircle";
    case "ApplicationDenied":
      return "XCircle";
    case "TaskCreated":
      return "PlusCircle";
    case "TaskCompleted":
      return "CheckCircle2";
    case "AssignmentChanged":
      return "UserCog";
    case "BureauPaused":
      return "PauseCircle";
    case "BureauUnpaused":
      return "PlayCircle";
    case "InquiryRemovalRequested":
      return "FileQuestion";
    default:
      return "Activity";
  }
}
