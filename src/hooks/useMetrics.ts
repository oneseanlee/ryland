import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ClientsByStageData {
  stage: string;
  count: number;
}

export interface FundingOverTimeData {
  date: string;
  amount: number;
}

export interface ApplicationStatusData {
  status: string;
  count: number;
}

export interface FundingByRepData {
  userId: string;
  displayName: string;
  totalFunded: number;
}

export interface OverdueClientData {
  id: string;
  full_name: string;
  current_stage: string;
  daysInStage: number;
  repUserId?: string;
  repDisplayName?: string;
}

export interface RepPerformanceData {
  userId: string;
  displayName: string;
  assignedClients: number;
  activeClients: number;
  appsSubmitted: number;
  appsApproved: number;
  totalFunded: number;
  avgTimeToFund: number;
}

export interface MetricsData {
  totalApproved: number;
  pipelineValue: number;
  activeClients: number;
  conversionRate: number;
  overdueClients: number;
  avgTimeToFund: number;
  clientsByStage: ClientsByStageData[];
  fundingOverTime: FundingOverTimeData[];
  applicationStatuses: ApplicationStatusData[];
  fundingByRep: FundingByRepData[];
  overdueList: OverdueClientData[];
  repPerformance: RepPerformanceData[];
}

const STAGE_COLORS: Record<string, string> = {
  "Onboarding": "#3b82f6",
  "Analysis": "#8b5cf6",
  "Kickoff Call": "#f59e0b",
  "Remediation": "#ef4444",
  "Post-Audit Check": "#10b981",
  "Funding Execution": "#06b6d4",
  "Closed/Funded": "#22c55e",
  "Inquiry Removal": "#6366f1",
};

const STATUS_COLORS: Record<string, string> = {
  "Applied": "#3b82f6",
  "Pending": "#f59e0b",
  "Approved": "#22c55e",
  "Denied": "#ef4444",
  "NeedsFollowUp": "#8b5cf6",
};

async function fetchMetrics(dateRange: DateRange | null): Promise<MetricsData> {
  // Build date filter
  const dateFilter = dateRange
    ? { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() }
    : null;

  // 1. Total Approved Funding - sum of approval_amount where status = 'Approved'
  let approvedQuery = supabase
    .from("funding_applications")
    .select("approval_amount")
    .eq("status", "Approved")
    .not("approval_amount", "is", null);

  if (dateFilter) {
    approvedQuery = approvedQuery
      .gte("applied_date", dateFilter.start.split("T")[0])
      .lte("applied_date", dateFilter.end.split("T")[0]);
  }

  const { data: approvedData, error: approvedError } = await approvedQuery;

  if (approvedError) throw approvedError;

  const totalApproved =
    approvedData?.reduce((sum, app) => sum + (app.approval_amount || 0), 0) || 0;

  // 2. Pipeline Value - sum of approval_amount where status IN ('Applied', 'Pending')
  // Use typical_limit_min from banks as estimate if no approval_amount
  let pipelineQuery = supabase
    .from("funding_applications")
    .select(`
      approval_amount,
      status,
      banks!inner(typical_limit_min)
    `)
    .in("status", ["Applied", "Pending"]);

  if (dateFilter) {
    pipelineQuery = pipelineQuery
      .gte("applied_date", dateFilter.start.split("T")[0])
      .lte("applied_date", dateFilter.end.split("T")[0]);
  }

  const { data: pipelineData, error: pipelineError } = await pipelineQuery;

  if (pipelineError) throw pipelineError;

  const pipelineValue =
    pipelineData?.reduce((sum, app) => {
      const bankLimit = Array.isArray(app.banks)
        ? (app.banks[0] as { typical_limit_min: number | null })?.typical_limit_min
        : (app.banks as unknown as { typical_limit_min: number | null })?.typical_limit_min;
      return sum + (app.approval_amount || bankLimit || 0);
    }, 0) || 0;

  // 3. Active Clients - count where is_archived = false and current_stage != 'Closed/Funded'
  let activeClientsQuery = supabase
    .from("funding_clients")
    .select("id", { count: "exact" })
    .eq("is_archived", false)
    .neq("current_stage", "Closed/Funded");

  if (dateFilter) {
    activeClientsQuery = activeClientsQuery
      .gte("created_at", dateFilter.start)
      .lte("created_at", dateFilter.end);
  }

  const { count: activeClients, error: activeClientsError } = await activeClientsQuery;

  if (activeClientsError) throw activeClientsError;

  // 4. Conversion Rate - (approved count / total applications count) * 100
  let totalAppsQuery = supabase.from("funding_applications").select("id", { count: "exact" });

  if (dateFilter) {
    totalAppsQuery = totalAppsQuery
      .gte("applied_date", dateFilter.start.split("T")[0])
      .lte("applied_date", dateFilter.end.split("T")[0]);
  }

  const { count: totalApps, error: totalAppsError } = await totalAppsQuery;

  if (totalAppsError) throw totalAppsError;

  let approvedCountQuery = supabase
    .from("funding_applications")
    .select("id", { count: "exact" })
    .eq("status", "Approved");

  if (dateFilter) {
    approvedCountQuery = approvedCountQuery
      .gte("applied_date", dateFilter.start.split("T")[0])
      .lte("applied_date", dateFilter.end.split("T")[0]);
  }

  const { count: approvedCount, error: approvedCountError } = await approvedCountQuery;

  if (approvedCountError) throw approvedCountError;

  const conversionRate =
    totalApps && totalApps > 0 ? ((approvedCount || 0) / totalApps) * 100 : 0;

  // 5. Overdue Clients - count with stage_entered_at older than 7 days and not in 'Closed/Funded'
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let overdueQuery = supabase
    .from("funding_clients")
    .select("id", { count: "exact" })
    .lt("stage_entered_at", sevenDaysAgo.toISOString())
    .neq("current_stage", "Closed/Funded")
    .eq("is_archived", false);

  if (dateFilter) {
    overdueQuery = overdueQuery
      .gte("created_at", dateFilter.start)
      .lte("created_at", dateFilter.end);
  }

  const { count: overdueClients, error: overdueError } = await overdueQuery;

  if (overdueError) throw overdueError;

  // 6. Clients by Stage - bar chart data (client-side grouping)
  let clientsByStageQuery = supabase
    .from("funding_clients")
    .select("current_stage")
    .eq("is_archived", false);

  if (dateFilter) {
    clientsByStageQuery = clientsByStageQuery
      .gte("created_at", dateFilter.start)
      .lte("created_at", dateFilter.end);
  }

  const { data: clientsByStageData, error: clientsByStageError } =
    await clientsByStageQuery;

  if (clientsByStageError) throw clientsByStageError;

  // Group by stage on the client side
  const stageCounts = new Map<string, number>();
  clientsByStageData?.forEach((item) => {
    const stage = item.current_stage || "Unknown";
    stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);
  });

  const clientsByStage: ClientsByStageData[] = Array.from(stageCounts.entries()).map(
    ([stage, count]) => ({ stage, count })
  );

  // 7. Funding Over Time - line chart data
  let fundingOverTimeQuery = supabase
    .from("funding_applications")
    .select("applied_date, approval_amount")
    .eq("status", "Approved")
    .not("approval_amount", "is", null)
    .order("applied_date", { ascending: true });

  if (dateFilter) {
    fundingOverTimeQuery = fundingOverTimeQuery
      .gte("applied_date", dateFilter.start.split("T")[0])
      .lte("applied_date", dateFilter.end.split("T")[0]);
  }

  const { data: fundingOverTimeData, error: fundingOverTimeError } =
    await fundingOverTimeQuery;

  if (fundingOverTimeError) throw fundingOverTimeError;

  // Group by date
  const fundingByDate = new Map<string, number>();
  fundingOverTimeData?.forEach((item) => {
    const date = item.applied_date;
    const current = fundingByDate.get(date) || 0;
    fundingByDate.set(date, current + (item.approval_amount || 0));
  });

  const fundingOverTime: FundingOverTimeData[] = Array.from(fundingByDate.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 8. Application Statuses - pie chart data (client-side grouping)
  let appStatusQuery = supabase
    .from("funding_applications")
    .select("status");

  if (dateFilter) {
    appStatusQuery = appStatusQuery
      .gte("applied_date", dateFilter.start.split("T")[0])
      .lte("applied_date", dateFilter.end.split("T")[0]);
  }

  const { data: appStatusData, error: appStatusError } = await appStatusQuery;

  if (appStatusError) throw appStatusError;

  // Group by status on the client side
  const statusCounts = new Map<string, number>();
  appStatusData?.forEach((item) => {
    const status = item.status || "Unknown";
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });

  const applicationStatuses: ApplicationStatusData[] = Array.from(
    statusCounts.entries()
  ).map(([status, count]) => ({ status, count }));

  // 9. Funding by Rep - fetch approved applications with rep assignments
  const { data: repFundingData, error: repFundingError } = await supabase
    .from("funding_applications")
    .select(`
      approval_amount,
      client_id
    `)
    .eq("status", "Approved")
    .not("approval_amount", "is", null);

  if (repFundingError) throw repFundingError;

  // Fetch primary assignments for clients with approved applications
  const clientIds = repFundingData?.map(app => app.client_id) || [];
  let fundingByRep: FundingByRepData[] = [];

  if (clientIds.length > 0) {
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("client_assignments")
      .select("client_id, user_id, is_primary")
      .in("client_id", clientIds)
      .eq("is_primary", true);

    if (assignmentsError) throw assignmentsError;

    // Fetch user roles for display names
    const userIds = assignmentsData?.map(a => a.user_id) || [];
    const userDisplayNames = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: userRolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Use role as display name fallback, or truncate user_id
      userRolesData?.forEach((ur) => {
        userDisplayNames.set(ur.user_id, ur.role);
      });
    }

    // Group funding by user_id
    const fundingByUser = new Map<string, number>();
    repFundingData?.forEach((app) => {
      const assignment = assignmentsData?.find(a => a.client_id === app.client_id);
      if (assignment) {
        const current = fundingByUser.get(assignment.user_id) || 0;
        fundingByUser.set(assignment.user_id, current + (app.approval_amount || 0));
      }
    });

    fundingByRep = Array.from(fundingByUser.entries()).map(([userId, totalFunded]) => ({
      userId,
      displayName: userDisplayNames.get(userId) || `${userId.slice(0, 8)}...`,
      totalFunded,
    })).sort((a, b) => b.totalFunded - a.totalFunded);
  }

  // 10. Overdue Clients List - detailed list with rep assignments
  const { data: overdueListData, error: overdueListError } = await supabase
    .from("funding_clients")
    .select(`
      id, full_name, current_stage, stage_entered_at
    `)
    .lt("stage_entered_at", sevenDaysAgo.toISOString())
    .neq("current_stage", "Closed/Funded")
    .eq("is_archived", false)
    .limit(20);

  if (overdueListError) throw overdueListError;

  // Fetch primary rep assignments for overdue clients
  const overdueClientIds = overdueListData?.map(c => c.id) || [];
  let overdueWithReps: OverdueClientData[] = [];

  if (overdueClientIds.length > 0) {
    const { data: overdueAssignments } = await supabase
      .from("client_assignments")
      .select("client_id, user_id")
      .in("client_id", overdueClientIds)
      .eq("is_primary", true);

    // Fetch user display names
    const overdueUserIds = overdueAssignments?.map(a => a.user_id) || [];
    const overdueUserDisplayNames = new Map<string, string>();

    if (overdueUserIds.length > 0) {
      const { data: overdueUserRoles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", overdueUserIds);

      overdueUserRoles?.forEach((ur) => {
        overdueUserDisplayNames.set(ur.user_id, ur.role);
      });
    }

    overdueWithReps = (overdueListData || []).map((client) => {
      const assignment = overdueAssignments?.find(a => a.client_id === client.id);
      const daysInStage = Math.floor(
        (Date.now() - new Date(client.stage_entered_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: client.id,
        full_name: client.full_name,
        current_stage: client.current_stage,
        daysInStage,
        repUserId: assignment?.user_id,
        repDisplayName: assignment ? (overdueUserDisplayNames.get(assignment.user_id) || `${assignment.user_id.slice(0, 8)}...`) : undefined,
      };
    });
  }

  // 11. Average Time to Fund - for clients in Closed/Funded stage
  const { data: fundedClientsData, error: fundedClientsError } = await supabase
    .from("funding_clients")
    .select("created_at, stage_entered_at")
    .eq("current_stage", "Closed/Funded")
    .eq("is_archived", false);

  if (fundedClientsError) throw fundedClientsError;

  const avgTimeToFund = fundedClientsData && fundedClientsData.length > 0
    ? fundedClientsData.reduce((sum, c) => {
        const createdAt = new Date(c.created_at).getTime();
        const stageEnteredAt = new Date(c.stage_entered_at || c.created_at).getTime();
        const diff = stageEnteredAt - createdAt;
        return sum + (diff / (1000 * 60 * 60 * 24));
      }, 0) / fundedClientsData.length
    : 0;

  // 12. Rep Performance - fetch all assignments, applications, and clients once, then group by user_id
  // Get all primary assignments
  const { data: allAssignments, error: assignmentsError } = await supabase
    .from("client_assignments")
    .select("client_id, user_id, is_primary")
    .eq("is_primary", true);

  if (assignmentsError) throw assignmentsError;

  // Get all clients for assigned client counts
  const { data: allClients, error: allClientsError } = await supabase
    .from("funding_clients")
    .select("id, current_stage, is_archived, created_at, stage_entered_at");

  if (allClientsError) throw allClientsError;

  // Get all applications for app counts
  const { data: allApplications, error: allAppsError } = await supabase
    .from("funding_applications")
    .select("id, client_id, status, approval_amount");

  if (allAppsError) throw allAppsError;

  // Get user display names from user_roles
  const repUserIds = [...new Set(allAssignments?.map(a => a.user_id) || [])];
  const userDisplayNames = new Map<string, string>();

  if (repUserIds.length > 0) {
    const { data: userRolesData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", repUserIds);

    userRolesData?.forEach((ur) => {
      userDisplayNames.set(ur.user_id, ur.role);
    });
  }

  // Build client to rep mapping
  const clientToRepMap = new Map<string, string>();
  allAssignments?.forEach((assignment) => {
    clientToRepMap.set(assignment.client_id, assignment.user_id);
  });

  // Group data by rep
  const repStatsMap = new Map<string, {
    assignedClients: number;
    activeClients: number;
    appsSubmitted: number;
    appsApproved: number;
    totalFunded: number;
    fundedDays: number[];
  }>();

  // Initialize rep stats for all reps
  repUserIds.forEach((userId) => {
    repStatsMap.set(userId, {
      assignedClients: 0,
      activeClients: 0,
      appsSubmitted: 0,
      appsApproved: 0,
      totalFunded: 0,
      fundedDays: [],
    });
  });

  // Count assigned and active clients per rep
  allClients?.forEach((client) => {
    const repId = clientToRepMap.get(client.id);
    if (repId && repStatsMap.has(repId)) {
      const stats = repStatsMap.get(repId)!;
      stats.assignedClients++;
      if (!client.is_archived && client.current_stage !== "Closed/Funded") {
        stats.activeClients++;
      }
      // Calculate time to fund for Closed/Funded clients
      if (client.current_stage === "Closed/Funded" && client.stage_entered_at) {
        const createdAt = new Date(client.created_at).getTime();
        const fundedAt = new Date(client.stage_entered_at).getTime();
        const days = (fundedAt - createdAt) / (1000 * 60 * 60 * 24);
        stats.fundedDays.push(days);
      }
    }
  });

  // Count applications per rep
  allApplications?.forEach((app) => {
    const repId = clientToRepMap.get(app.client_id);
    if (repId && repStatsMap.has(repId)) {
      const stats = repStatsMap.get(repId)!;
      stats.appsSubmitted++;
      if (app.status === "Approved") {
        stats.appsApproved++;
        stats.totalFunded += app.approval_amount || 0;
      }
    }
  });

  // Build rep performance array
  const repPerformance: RepPerformanceData[] = repUserIds.map((userId) => {
    const stats = repStatsMap.get(userId)!;
    const avgTimeToFundForRep = stats.fundedDays.length > 0
      ? stats.fundedDays.reduce((sum, days) => sum + days, 0) / stats.fundedDays.length
      : 0;

    return {
      userId,
      displayName: userDisplayNames.get(userId) || `${userId.slice(-8)}`,
      assignedClients: stats.assignedClients,
      activeClients: stats.activeClients,
      appsSubmitted: stats.appsSubmitted,
      appsApproved: stats.appsApproved,
      totalFunded: stats.totalFunded,
      avgTimeToFund: avgTimeToFundForRep,
    };
  }).sort((a, b) => b.totalFunded - a.totalFunded);

  return {
    totalApproved,
    pipelineValue,
    activeClients: activeClients || 0,
    conversionRate,
    overdueClients: overdueClients || 0,
    avgTimeToFund,
    clientsByStage,
    fundingOverTime,
    applicationStatuses,
    fundingByRep,
    overdueList: overdueWithReps,
    repPerformance,
  };
}

export function useMetrics(dateRange: DateRange | null) {
  return useQuery<MetricsData, Error>({
    queryKey: ["metrics", dateRange?.start?.toISOString(), dateRange?.end?.toISOString()],
    queryFn: () => fetchMetrics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export { STAGE_COLORS, STATUS_COLORS };
