import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Bank, ProductType, BureauType } from "./useClientApplications";

// Re-export types for convenience
export type { Bank, ProductType, BureauType };

// Input types for mutations
export interface CreateBankInput {
  name: string;
  product_name?: string | null;
  product_type?: ProductType | null;
  bureau_pulled?: BureauType | null;
  requires_relationship?: boolean;
  typical_limit_min?: number | null;
  typical_limit_max?: number | null;
  application_url?: string | null;
  notes?: string | null;
  is_active?: boolean;
  sequence_priority?: number;
}

export interface UpdateBankInput extends CreateBankInput {
  id: string;
}

export interface BulkImportInput {
  banks: CreateBankInput[];
}

// Fetch all banks (including inactive) for admin
async function fetchAllBanks(): Promise<Bank[]> {
  const { data, error } = await supabase
    .from("banks")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch banks: ${error.message}`);
  }

  return (data as Bank[]) || [];
}

// Create a new bank
async function createBank(input: CreateBankInput): Promise<Bank> {
  const { data, error } = await supabase
    .from("banks")
    .insert({
      name: input.name,
      product_name: input.product_name || null,
      product_type: input.product_type || null,
      bureau_pulled: input.bureau_pulled || null,
      requires_relationship: input.requires_relationship || false,
      typical_limit_min: input.typical_limit_min || null,
      typical_limit_max: input.typical_limit_max || null,
      application_url: input.application_url || null,
      notes: input.notes || null,
      is_active: input.is_active !== undefined ? input.is_active : true,
      sequence_priority: input.sequence_priority || 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create bank: ${error.message}`);
  }

  return data as Bank;
}

// Update an existing bank
async function updateBank(input: UpdateBankInput): Promise<Bank> {
  const { data, error } = await supabase
    .from("banks")
    .update({
      name: input.name,
      product_name: input.product_name || null,
      product_type: input.product_type || null,
      bureau_pulled: input.bureau_pulled || null,
      requires_relationship: input.requires_relationship || false,
      typical_limit_min: input.typical_limit_min || null,
      typical_limit_max: input.typical_limit_max || null,
      application_url: input.application_url || null,
      notes: input.notes || null,
      is_active: input.is_active !== undefined ? input.is_active : true,
      sequence_priority: input.sequence_priority || 0,
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update bank: ${error.message}`);
  }

  return data as Bank;
}

// Delete a bank
async function deleteBank(id: string): Promise<void> {
  const { error } = await supabase.from("banks").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete bank: ${error.message}`);
  }
}

// Toggle bank active status
async function toggleBankActive(id: string, isActive: boolean): Promise<Bank> {
  const { data, error } = await supabase
    .from("banks")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update bank status: ${error.message}`);
  }

  return data as Bank;
}

// Bulk import banks
async function bulkImportBanks(input: BulkImportInput): Promise<{
  successCount: number;
  errorCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let successCount = 0;

  for (const bank of input.banks) {
    try {
      const { error } = await supabase.from("banks").insert({
        name: bank.name,
        product_name: bank.product_name || null,
        product_type: bank.product_type || null,
        bureau_pulled: bank.bureau_pulled || null,
        requires_relationship: bank.requires_relationship || false,
        typical_limit_min: bank.typical_limit_min || null,
        typical_limit_max: bank.typical_limit_max || null,
        application_url: bank.application_url || null,
        notes: bank.notes || null,
        is_active: bank.is_active !== undefined ? bank.is_active : true,
        sequence_priority: bank.sequence_priority || 0,
      });

      if (error) {
        // Check for duplicate key error (unique constraint on name + product_name)
        if (error.code === "23505") {
          errors.push(`Duplicate: ${bank.name}${bank.product_name ? ` - ${bank.product_name}` : ""}`);
        } else {
          errors.push(`${bank.name}: ${error.message}`);
        }
      } else {
        successCount++;
      }
    } catch (err) {
      errors.push(`${bank.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return {
    successCount,
    errorCount: errors.length,
    errors,
  };
}

// React Query hook for fetching all banks (admin)
export function useBanksAdmin() {
  return useQuery({
    queryKey: ["banks-admin"],
    queryFn: fetchAllBanks,
  });
}

// React Query hook for creating a bank
export function useCreateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks-admin"] });
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}

// React Query hook for updating a bank
export function useUpdateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks-admin"] });
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}

// React Query hook for deleting a bank
export function useDeleteBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks-admin"] });
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}

// React Query hook for toggling bank active status
export function useToggleBankActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleBankActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks-admin"] });
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}

// React Query hook for bulk importing banks
export function useBulkImportBanks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkImportBanks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks-admin"] });
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}

// Helper function to format limit range for display
export function formatLimitRange(min: number | null, max: number | null): string {
  const formatDollar = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  if (min && max) {
    return `${formatDollar(min)} - ${formatDollar(max)}`;
  }
  if (min) {
    return `From ${formatDollar(min)}`;
  }
  if (max) {
    return `Up to ${formatDollar(max)}`;
  }
  return "—";
}
