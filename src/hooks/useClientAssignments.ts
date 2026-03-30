import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createCCNotification } from "@/utils/createCommandCenterNotification";

export interface ClientAssignment {
  id: string;
  client_id: string;
  user_id: string;
  assigned_at: string;
  is_primary: boolean;
  user?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

export interface AssignmentInput {
  clientId: string;
  userId: string;
  isPrimary?: boolean;
}

/**
 * Fetch all assignments for a client
 */
async function fetchClientAssignments(clientId: string): Promise<ClientAssignment[]> {
  const { data, error } = await supabase
    .from("client_assignments")
    .select(
      `
      *,
      user:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `
    )
    .eq("client_id", clientId);

  if (error) {
    throw new Error(`Failed to fetch assignments: ${error.message}`);
  }

  return (data as ClientAssignment[]) || [];
}

/**
 * Assign a user to a client
 * Creates a notification for the assigned user
 */
async function assignUserToClient(
  input: AssignmentInput,
  assignedBy: string | undefined
): Promise<ClientAssignment> {
  // Upsert the assignment
  const { data: assignment, error: assignError } = await supabase
    .from("client_assignments")
    .upsert(
      {
        client_id: input.clientId,
        user_id: input.userId,
        is_primary: input.isPrimary ?? true,
        assigned_at: new Date().toISOString(),
      },
      {
        onConflict: "client_id,user_id",
      }
    )
    .select()
    .single();

  if (assignError) {
    throw new Error(`Failed to assign user: ${assignError.message}`);
  }

  // Get client name for notification
  const { data: client } = await supabase
    .from("funding_clients")
    .select("full_name")
    .eq("id", input.clientId)
    .single();

  // Send notification to the newly assigned user
  if (client) {
    createCCNotification(
      input.userId,
      `New client assigned: ${client.full_name}`,
      `You have been assigned as the primary representative for ${client.full_name}.`,
      `/command-center/clients/${input.clientId}`
    );
  }

  // Log the assignment activity
  await supabase.from("client_activity_log").insert({
    client_id: input.clientId,
    user_id: assignedBy || null,
    action_type: "AssignmentChanged",
    details: {
      assigned_to: input.userId,
      is_primary: input.isPrimary ?? true,
    },
  });

  return assignment as ClientAssignment;
}

/**
 * Remove a user assignment from a client
 */
async function removeAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from("client_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    throw new Error(`Failed to remove assignment: ${error.message}`);
  }
}

/**
 * Hook to fetch assignments for a specific client
 */
export function useClientAssignments(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-assignments", clientId],
    queryFn: () => fetchClientAssignments(clientId!),
    enabled: !!clientId,
  });
}

/**
 * Hook for assignment mutations
 */
export function useAssignmentMutations() {
  const queryClient = useQueryClient();

  const assignUser = useMutation({
    mutationFn: ({
      input,
      assignedBy,
    }: {
      input: AssignmentInput;
      assignedBy: string | undefined;
    }) => assignUserToClient(input, assignedBy),
    onSuccess: (_, { input }) => {
      queryClient.invalidateQueries({
        queryKey: ["client-assignments", input.clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["client", input.clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-clients"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-activity", input.clientId],
      });
    },
  });

  const removeUser = useMutation({
    mutationFn: (assignmentId: string) => removeAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["my-clients"] });
    },
  });

  return {
    assignUser,
    removeUser,
  };
}
