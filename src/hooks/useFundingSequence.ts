import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Bank, FundingApplication, BureauType } from "@/hooks/useClientApplications";
import type { BureauStatus } from "@/hooks/useBureauStatus";

// Types for existing accounts stored in funding_clients
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

interface ClientAccounts {
  existing_checking_accounts: CheckingAccount[] | null;
  existing_credit_cards: CreditCard[] | null;
}

export interface SequenceItem {
  bank: Bank;
  priority: number;
  isBlocked: boolean;
  hasRelationship: boolean;
  existingApplication?: FundingApplication;
}

interface FundingSequenceResult {
  sequence: SequenceItem[];
  blockedCount: number;
  pausedBureaus: BureauType[];
}

// Fetch all active banks ordered by sequence_priority
async function fetchActiveBanks(): Promise<Bank[]> {
  const { data, error } = await supabase
    .from("banks")
    .select("*")
    .eq("is_active", true)
    .order("sequence_priority", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch banks: ${error.message}`);
  }

  return (data as Bank[]) || [];
}

// Fetch existing applications for a client
async function fetchClientApplications(clientId: string): Promise<FundingApplication[]> {
  const { data, error } = await supabase
    .from("funding_applications")
    .select(`
      *,
      bank:bank_id (*)
    `)
    .eq("client_id", clientId);

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return (data as unknown as FundingApplication[]) || [];
}

// Fetch client's existing accounts
async function fetchClientAccounts(clientId: string): Promise<ClientAccounts> {
  const { data, error } = await supabase
    .from("funding_clients")
    .select("existing_checking_accounts, existing_credit_cards")
    .eq("id", clientId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch client accounts: ${error.message}`);
  }

  return {
    existing_checking_accounts: (data?.existing_checking_accounts as CheckingAccount[]) || null,
    existing_credit_cards: (data?.existing_credit_cards as CreditCard[]) || null,
  };
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

// Check if client has a relationship with a specific bank
function hasExistingRelationship(
  bank: Bank,
  accounts: ClientAccounts
): boolean {
  const checkingAccounts = accounts.existing_checking_accounts || [];
  const creditCards = accounts.existing_credit_cards || [];

  // Check if any checking account matches the bank name (case-insensitive)
  const hasCheckingAccount = checkingAccounts.some(
    (account) =>
      account.bank_name?.toLowerCase().trim() === bank.name.toLowerCase().trim()
  );

  // Check if any credit card matches the bank name (case-insensitive)
  const hasCreditCard = creditCards.some(
    (card) =>
      card.bank_name?.toLowerCase().trim() === bank.name.toLowerCase().trim()
  );

  return hasCheckingAccount || hasCreditCard;
}

// Generate the funding sequence
async function generateFundingSequence(
  clientId: string
): Promise<FundingSequenceResult> {
  // Fetch all required data in parallel
  const [banks, applications, accounts, bureauStatuses] = await Promise.all([
    fetchActiveBanks(),
    fetchClientApplications(clientId),
    fetchClientAccounts(clientId),
    fetchBureauStatus(clientId),
  ]);

  // Get set of paused bureaus
  const pausedBureaus = bureauStatuses
    .filter((b) => b.is_paused)
    .map((b) => b.bureau);

  // Get set of bank IDs where client has approved applications (to exclude)
  const approvedBankIds = new Set(
    applications
      .filter((app) => app.status === "Approved" && app.bank_id)
      .map((app) => app.bank_id!)
  );

  // Create a map of bank_id to existing application
  const applicationMap = new Map<string, FundingApplication>();
  applications.forEach((app) => {
    if (app.bank_id) {
      applicationMap.set(app.bank_id, app);
    }
  });

  // Build sequence items
  const sequenceItems: SequenceItem[] = [];

  for (const bank of banks) {
    // Skip banks where client already has an approved application
    if (approvedBankIds.has(bank.id)) {
      continue;
    }

    const hasRelationship = bank.requires_relationship
      ? hasExistingRelationship(bank, accounts)
      : false;

    const isBlocked = bank.bureau_pulled
      ? pausedBureaus.includes(bank.bureau_pulled)
      : false;

    sequenceItems.push({
      bank,
      priority: bank.sequence_priority,
      isBlocked,
      hasRelationship,
      existingApplication: applicationMap.get(bank.id),
    });
  }

  // Sort: prioritized relationship banks first, then by sequence_priority
  sequenceItems.sort((a, b) => {
    // Relationship banks come first
    if (a.hasRelationship && !b.hasRelationship) return -1;
    if (!a.hasRelationship && b.hasRelationship) return 1;
    // Then sort by sequence_priority
    return a.priority - b.priority;
  });

  const blockedCount = sequenceItems.filter((item) => item.isBlocked).length;

  return {
    sequence: sequenceItems,
    blockedCount,
    pausedBureaus: pausedBureaus as BureauType[],
  };
}

// React Query hook for funding sequence
export function useFundingSequence(clientId: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["funding-sequence", clientId],
    queryFn: () => generateFundingSequence(clientId!),
    enabled: !!clientId,
  });

  // Function to regenerate (refetch) the sequence
  const regenerate = () => {
    refetch();
  };

  return {
    sequence: data?.sequence || [],
    blockedCount: data?.blockedCount || 0,
    pausedBureaus: data?.pausedBureaus || [],
    isLoading,
    error,
    regenerate,
  };
}

// Utility: Format limit range for display
export function formatLimitRange(
  min: number | null,
  max: number | null
): string {
  if (min === null && max === null) return "—";
  if (min === null) return `Up to $${(max! / 1000).toFixed(0)}k`;
  if (max === null) return `$${(min / 1000).toFixed(0)}k+`;
  return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
}

// Utility: Get product type display name
export function getProductTypeDisplay(type: string | null): string {
  switch (type) {
    case "CreditCard":
      return "Credit Card";
    case "LOC":
      return "Line of Credit";
    case "TermLoan":
      return "Term Loan";
    default:
      return type || "Unknown";
  }
}
