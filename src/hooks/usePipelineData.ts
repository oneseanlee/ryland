import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  PipelineStage,
  PipelineData,
  StageData,
  ClientWithDetails,
  FundingClient,
  ClientAssignment,
  ClientActivityLog,
  RepOption,
} from "@/types/command-center";

interface RawClientData {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  ssn_encrypted: string | null;
  mothers_maiden_name: string | null;
  home_address: Record<string, unknown> | null;
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: Record<string, unknown> | null;
  ein: string | null;
  duns: string | null;
  website: string | null;
  personal_income: number | null;
  business_revenue: number | null;
  monthly_deposits: number | null;
  funding_goal: string | null;
  current_stage: PipelineStage;
  stage_entered_at: string;
  mfsn_credentials: Record<string, unknown> | null;
  nav_credentials: Record<string, unknown> | null;
  existing_checking_accounts: Record<string, unknown> | null;
  existing_credit_cards: Record<string, unknown> | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface RawAssignment {
  id: string;
  client_id: string;
  user_id: string;
  assigned_at: string;
  is_primary: boolean;
  users: {
    id: string;
    email: string;
    raw_user_meta_data: {
      full_name?: string;
    } | null;
  } | null;
}

interface RawActivity {
  id: string;
  client_id: string;
  user_id: string | null;
  action_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface RawOpenTask {
  client_id: string;
  title: string;
}

interface RawBureauStatus {
  client_id: string;
  is_paused: boolean;
}

const OVERDUE_THRESHOLD_DAYS = 7;

function calculateDaysInStage(stageEnteredAt: string): number {
  const entered = new Date(stageEnteredAt);
  const now = new Date();
  const diffMs = now.getTime() - entered.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function isOverdue(daysInStage: number): boolean {
  return daysInStage > OVERDUE_THRESHOLD_DAYS;
}

export function usePipelineData() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pipeline-data"],
    queryFn: async (): Promise<PipelineData> => {
      // Fetch all active clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("funding_clients")
        .select("*")
        .eq("is_archived", false);

      if (clientsError) {
        throw new Error(`Failed to fetch clients: ${clientsError.message}`);
      }

      const clients = (clientsData || []) as RawClientData[];

      // Get all client IDs
      const clientIds = clients.map((c) => c.id);

      if (clientIds.length === 0) {
        // Return empty state
        const emptyStages: Record<string, StageData> = {};
        const stages: PipelineStage[] = [
          "Onboarding",
          "Analysis",
          "Kickoff Call",
          "Remediation",
          "Post-Audit Check",
          "Funding Execution",
          "Closed/Funded",
          "Inquiry Removal",
        ];
        stages.forEach((stage) => {
          emptyStages[stage] = {
            stage,
            clients: [],
            count: 0,
            overdueCount: 0,
          };
        });
        return {
          stages: emptyStages as Record<PipelineStage, StageData>,
          totalActiveClients: 0,
          totalOverdue: 0,
          totalFundedThisMonth: 0,
        };
      }

      // Fetch assignments with user info
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("client_assignments")
        .select(
          `
          id,
          client_id,
          user_id,
          assigned_at,
          is_primary,
          users:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `
        )
        .in("client_id", clientIds);

      if (assignmentsError) {
        throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
      }

      // Fetch latest activity per client using a subquery approach
      // We'll get all activities and then find the latest per client
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("client_activity_log")
        .select("*")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false });

      if (activitiesError) {
        throw new Error(`Failed to fetch activities: ${activitiesError.message}`);
      }

      // Process activities - get latest per client
      const latestActivitiesByClient: Record<string, RawActivity> = {};
      for (const activity of (activitiesData || []) as RawActivity[]) {
        if (!latestActivitiesByClient[activity.client_id]) {
          latestActivitiesByClient[activity.client_id] = activity;
        }
      }

      // Fetch open tasks for all clients (for Next Action column)
      const { data: openTasksData, error: openTasksError } = await supabase
        .from("client_tasks")
        .select("client_id, title")
        .in("client_id", clientIds)
        .eq("status", "Open")
        .order("due_date", { ascending: true });

      if (openTasksError) {
        throw new Error(`Failed to fetch open tasks: ${openTasksError.message}`);
      }

      // Build map of client_id -> first open task title
      const openTasksByClient: Record<string, string> = {};
      for (const task of (openTasksData || []) as RawOpenTask[]) {
        if (!openTasksByClient[task.client_id]) {
          openTasksByClient[task.client_id] = task.title;
        }
      }

      // Fetch bureau status for all clients (for Blocked status)
      const { data: bureauStatusData, error: bureauStatusError } = await supabase
        .from("bureau_status")
        .select("client_id, is_paused")
        .in("client_id", clientIds)
        .eq("is_paused", true);

      if (bureauStatusError) {
        throw new Error(`Failed to fetch bureau status: ${bureauStatusError.message}`);
      }

      // Build map of client_id -> has paused bureau
      const pausedBureausByClient: Record<string, boolean> = {};
      for (const status of (bureauStatusData || []) as RawBureauStatus[]) {
        pausedBureausByClient[status.client_id] = true;
      }

      // Group assignments by client
      const assignmentsByClient: Record<string, ClientAssignment[]> = {};
      for (const assignment of (assignmentsData || []) as RawAssignment[]) {
        if (!assignmentsByClient[assignment.client_id]) {
          assignmentsByClient[assignment.client_id] = [];
        }
        assignmentsByClient[assignment.client_id].push({
          id: assignment.id,
          client_id: assignment.client_id,
          user_id: assignment.user_id,
          assigned_at: assignment.assigned_at,
          is_primary: assignment.is_primary,
          user: assignment.users
            ? {
                id: assignment.users.id,
                email: assignment.users.email,
                raw_user_meta_data: assignment.users.raw_user_meta_data || undefined,
              }
            : undefined,
        });
      }

      // Build clients with details
      const clientsWithDetails: ClientWithDetails[] = clients.map((client) => ({
        ...client,
        assignments: assignmentsByClient[client.id] || [],
        last_activity: latestActivitiesByClient[client.id]
          ? {
              ...latestActivitiesByClient[client.id],
            }
          : null,
        days_in_stage: calculateDaysInStage(client.stage_entered_at),
        next_action: openTasksByClient[client.id] || null,
        has_paused_bureau: pausedBureausByClient[client.id] || false,
      }));

      // Get count of funded this month (clients who entered Closed/Funded stage this month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const fundedThisMonth = clientsWithDetails.filter(
        (c) =>
          c.current_stage === "Closed/Funded" &&
          new Date(c.stage_entered_at) >= startOfMonth
      ).length;

      // Group by stage
      const stages: PipelineStage[] = [
        "Onboarding",
        "Analysis",
        "Kickoff Call",
        "Remediation",
        "Post-Audit Check",
        "Funding Execution",
        "Closed/Funded",
        "Inquiry Removal",
      ];

      const stagesData: Record<string, StageData> = {};
      let totalOverdue = 0;

      for (const stage of stages) {
        const stageClients = clientsWithDetails.filter((c) => c.current_stage === stage);
        const overdueClients = stageClients.filter((c) => isOverdue(c.days_in_stage));
        totalOverdue += overdueClients.length;

        stagesData[stage] = {
          stage,
          clients: stageClients,
          count: stageClients.length,
          overdueCount: overdueClients.length,
        };
      }

      return {
        stages: stagesData as Record<PipelineStage, StageData>,
        totalActiveClients: clients.length,
        totalOverdue,
        totalFundedThisMonth: fundedThisMonth,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("pipeline-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "funding_clients",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pipeline-data"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useReps() {
  return useQuery({
    queryKey: ["pipeline-reps"],
    queryFn: async (): Promise<RepOption[]> => {
      // Fetch users who are assigned to clients
      const { data, error } = await supabase
        .from("client_assignments")
        .select(
          `
          user_id,
          users:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `
        )
        .not("user_id", "is", null);

      if (error) {
        throw new Error(`Failed to fetch reps: ${error.message}`);
      }

      // Dedupe by user_id
      const repsMap = new Map<string, RepOption>();
      for (const assignment of data || []) {
        const user = assignment.users as {
          id: string;
          email: string;
          raw_user_meta_data: { full_name?: string } | null;
        } | null;
        if (user && !repsMap.has(user.id)) {
          repsMap.set(user.id, {
            id: user.id,
            name: user.raw_user_meta_data?.full_name || user.email,
            email: user.email,
          });
        }
      }

      return Array.from(repsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function getClientStatus(
  daysInStage: number,
  isBlocked: boolean
): "On Track" | "At Risk" | "Overdue" | "Blocked" {
  if (isBlocked) return "Blocked";
  if (daysInStage > 14) return "Overdue";
  if (daysInStage > 7) return "At Risk";
  return "On Track";
}
