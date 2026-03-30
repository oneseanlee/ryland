import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Types based on database schema
export type ClientStage =
  | "Onboarding"
  | "Analysis"
  | "Kickoff Call"
  | "Remediation"
  | "Post-Audit Check"
  | "Funding Execution"
  | "Closed/Funded"
  | "Inquiry Removal";

export const CLIENT_STAGES: ClientStage[] = [
  "Onboarding",
  "Analysis",
  "Kickoff Call",
  "Remediation",
  "Post-Audit Check",
  "Funding Execution",
  "Closed/Funded",
  "Inquiry Removal",
];

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface Credentials {
  username?: string;
  password?: string;
}

interface CheckingAccount {
  bank_name?: string;
  account_type?: string;
  open_date?: string;
}

interface CreditCard {
  bank_name?: string;
  card_name?: string;
  limit?: number;
  open_date?: string;
}

export interface FundingClient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  ssn_encrypted: string | null;
  mothers_maiden_name: string | null;
  home_address: Address | null;
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: Address | null;
  ein: string | null;
  duns: string | null;
  website: string | null;
  personal_income: number | null;
  business_revenue: number | null;
  monthly_deposits: number | null;
  funding_goal: string | null;
  current_stage: ClientStage;
  stage_entered_at: string | null;
  mfsn_credentials: Credentials | null;
  nav_credentials: Credentials | null;
  existing_checking_accounts: CheckingAccount[] | null;
  existing_credit_cards: CreditCard[] | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientAssignment {
  id: string;
  client_id: string;
  user_id: string;
  assigned_at: string;
  is_primary: boolean;
  user?: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

export interface ClientWithAssignments extends FundingClient {
  assignments: ClientAssignment[];
  primary_assignment?: ClientAssignment;
}

interface FetchClientResponse {
  client: FundingClient | null;
  assignments: ClientAssignment[];
}

// Fetch a single client with assignments
async function fetchClient(clientId: string): Promise<ClientWithAssignments> {
  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from("funding_clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientError) {
    throw new Error(`Failed to fetch client: ${clientError.message}`);
  }

  if (!client) {
    throw new Error("Client not found");
  }

  // Fetch assignments with user info
  const { data: assignments, error: assignmentsError } = await supabase
    .from("client_assignments")
    .select(`
      *,
      user:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq("client_id", clientId);

  if (assignmentsError) {
    throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
  }

  const primaryAssignment = assignments?.find((a) => a.is_primary) || assignments?.[0];

  return {
    ...(client as FundingClient),
    assignments: (assignments as unknown as ClientAssignment[]) || [],
    primary_assignment: primaryAssignment as unknown as ClientAssignment | undefined,
  };
}

// Update client fields
async function updateClient(
  clientId: string,
  updates: Partial<FundingClient>
): Promise<FundingClient> {
  // Convert updates to a format compatible with Supabase
  const dbUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    dbUpdates[key] = value;
  }

  const { data, error } = await supabase
    .from("funding_clients")
    .update(dbUpdates)
    .eq("id", clientId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update client: ${error.message}`);
  }

  return data as FundingClient;
}

// Change client stage and log to activity
async function changeClientStage(
  clientId: string,
  newStage: ClientStage,
  userId: string | undefined
): Promise<FundingClient> {
  // Update client stage
  const { data: client, error: clientError } = await supabase
    .from("funding_clients")
    .update({
      current_stage: newStage,
      stage_entered_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .select()
    .single();

  if (clientError) {
    throw new Error(`Failed to update stage: ${clientError.message}`);
  }

  // Log activity
  const { error: activityError } = await supabase.from("client_activity_log").insert({
    client_id: clientId,
    user_id: userId || null,
    action_type: "StageChange",
    details: {
      new_stage: newStage,
      changed_at: new Date().toISOString(),
    },
  });

  if (activityError) {
    console.error("Failed to log stage change activity:", activityError);
  }

  return client as FundingClient;
}

// Archive client (soft delete)
async function archiveClient(clientId: string): Promise<void> {
  const { error } = await supabase
    .from("funding_clients")
    .update({ is_archived: true })
    .eq("id", clientId);

  if (error) {
    throw new Error(`Failed to archive client: ${error.message}`);
  }
}

// React Query hook for fetching a client
export function useClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client", clientId],
    queryFn: () => fetchClient(clientId!),
    enabled: !!clientId,
  });
}

// React Query hook for updating a client
export function useUpdateClient(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<FundingClient>) => updateClient(clientId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
    },
  });
}

// React Query hook for changing client stage
export function useChangeClientStage(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      newStage,
      userId,
    }: {
      newStage: ClientStage;
      userId: string | undefined;
    }) => changeClientStage(clientId, newStage, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-activity", clientId] });
    },
  });
}

// React Query hook for archiving a client
export function useArchiveClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveClient,
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
