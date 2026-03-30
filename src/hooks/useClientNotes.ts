import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientNote {
  id: string;
  client_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  created_by_user?: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  } | null;
}

interface FetchNotesResponse {
  data: ClientNote[];
  count: number | null;
}

// Fetch notes for a client
async function fetchClientNotes(
  clientId: string
): Promise<FetchNotesResponse> {
  const { data, error, count } = await supabase
    .from("client_notes")
    .select(
      `
      *,
      created_by_user:created_by (
        id,
        email,
        raw_user_meta_data
      )
    `,
      { count: "exact" }
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`);
  }

  return {
    data: (data as unknown as ClientNote[]) || [],
    count,
  };
}

// Add a new note
async function addNote(
  clientId: string,
  content: string,
  userId: string | undefined
): Promise<ClientNote> {
  // Insert the note
  const { data: note, error: noteError } = await supabase
    .from("client_notes")
    .insert({
      client_id: clientId,
      content,
      created_by: userId || null,
    })
    .select()
    .single();

  if (noteError) {
    throw new Error(`Failed to add note: ${noteError.message}`);
  }

  // Log activity
  const { error: activityError } = await supabase.from("client_activity_log").insert({
    client_id: clientId,
    user_id: userId || null,
    action_type: "NoteAdded",
    details: {
      note_id: note.id,
      note_preview: content.slice(0, 100),
      created_at: new Date().toISOString(),
    },
  });

  if (activityError) {
    console.error("Failed to log note activity:", activityError);
  }

  return note as ClientNote;
}

// Delete a note
async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase.from("client_notes").delete().eq("id", noteId);

  if (error) {
    throw new Error(`Failed to delete note: ${error.message}`);
  }
}

// React Query hook for fetching client notes
export function useClientNotes(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-notes", clientId],
    queryFn: () => fetchClientNotes(clientId!),
    enabled: !!clientId,
  });
}

// React Query hook for adding a note
export function useAddNote(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      content,
      userId,
    }: {
      content: string;
      userId: string | undefined;
    }) => addNote(clientId, content, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
      queryClient.invalidateQueries({
        queryKey: ["client-activity", clientId],
      });
    },
  });
}

// React Query hook for deleting a note
export function useDeleteNote(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
    },
  });
}
