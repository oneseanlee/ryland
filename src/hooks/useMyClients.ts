import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssignedClient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  current_stage: string;
  stage_entered_at: string;
  is_archived: boolean;
  created_at: string;
  assigned_at: string;
  is_primary: boolean;
  last_action?: {
    action_type: string;
    created_at: string;
    details: Record<string, unknown> | null;
  } | null;
}

interface FetchMyClientsOptions {
  searchQuery?: string;
  stageFilter?: string;
  sortBy?: "name" | "stage" | "daysInStage";
  sortOrder?: "asc" | "desc";
}

async function fetchMyClients(
  options: FetchMyClientsOptions = {}
): Promise<AssignedClient[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not authenticated");
  }

  const userId = userData.user.id;

  // Fetch client assignments joined with funding_clients
  const query = supabase
    .from("client_assignments")
    .select(
      `
      client_id,
      assigned_at,
      is_primary,
      funding_clients!inner(
        id,
        full_name,
        email,
        phone,
        current_stage,
        stage_entered_at,
        is_archived,
        created_at
      )
    `
    )
    .eq("user_id", userId);

  const { data: assignments, error: assignmentsError } = await query;

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  if (!assignments || assignments.length === 0) {
    return [];
  }

  // Get client IDs for fetching latest activity
  const clientIds = assignments.map((a) => a.client_id);

  // Fetch latest activity for each client
  const { data: activities, error: activitiesError } = await supabase
    .from("client_activity_log")
    .select("client_id, action_type, created_at, details")
    .in("client_id", clientIds)
    .order("created_at", { ascending: false });

  if (activitiesError) {
    console.error("Error fetching activities:", activitiesError);
  }

  // Group activities by client_id and get the latest for each
  const latestActivitiesByClient = new Map<
    string,
    { action_type: string; created_at: string; details: Record<string, unknown> | null }
  >();

  activities?.forEach((activity) => {
    if (!latestActivitiesByClient.has(activity.client_id)) {
      latestActivitiesByClient.set(activity.client_id, {
        action_type: activity.action_type,
        created_at: activity.created_at,
        details: activity.details as Record<string, unknown> | null,
      });
    }
  });

  // Transform and filter the data
  let clients: AssignedClient[] = assignments
    .map((assignment) => {
      const client = Array.isArray(assignment.funding_clients)
        ? assignment.funding_clients[0]
        : assignment.funding_clients;

      return {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        phone: client.phone,
        current_stage: client.current_stage,
        stage_entered_at: client.stage_entered_at,
        is_archived: client.is_archived,
        created_at: client.created_at,
        assigned_at: assignment.assigned_at,
        is_primary: assignment.is_primary,
        last_action: latestActivitiesByClient.get(client.id) || null,
      };
    })
    .filter((client) => !client.is_archived);

  // Apply search filter
  if (options.searchQuery) {
    const searchLower = options.searchQuery.toLowerCase();
    clients = clients.filter(
      (client) =>
        client.full_name.toLowerCase().includes(searchLower) ||
        (client.email && client.email.toLowerCase().includes(searchLower))
    );
  }

  // Apply stage filter
  if (options.stageFilter && options.stageFilter !== "all") {
    clients = clients.filter((client) => client.current_stage === options.stageFilter);
  }

  // Apply sorting
  if (options.sortBy) {
    clients.sort((a, b) => {
      let comparison = 0;

      switch (options.sortBy) {
        case "name":
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case "stage":
          comparison = a.current_stage.localeCompare(b.current_stage);
          break;
        case "daysInStage": {
          const daysA =
            (new Date().getTime() - new Date(a.stage_entered_at).getTime()) /
            (1000 * 60 * 60 * 24);
          const daysB =
            (new Date().getTime() - new Date(b.stage_entered_at).getTime()) /
            (1000 * 60 * 60 * 24);
          comparison = daysA - daysB;
          break;
        }
      }

      return options.sortOrder === "desc" ? -comparison : comparison;
    });
  }

  return clients;
}

export function useMyClients(options: FetchMyClientsOptions = {}) {
  return useQuery({
    queryKey: ["my-clients", options],
    queryFn: () => fetchMyClients(options),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook to get stage options for filter dropdown
export function useClientStages() {
  return useQuery({
    queryKey: ["client-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funding_clients")
        .select("current_stage")
        .order("current_stage");

      if (error) throw new Error(error.message);

      // Get unique stages
      const stages = [...new Set(data?.map((d) => d.current_stage) || [])];
      return stages;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
