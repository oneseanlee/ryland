import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a notification for a user in the Command Center
 * This is a fire-and-forget operation - errors are logged but don't throw
 */
export async function createCCNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type: "system",
      read: false,
      link,
    });

    if (error) {
      console.error("Failed to create notification:", error);
    }
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

/**
 * Gets the primary rep user_id for a client
 * Returns null if no primary assignment exists
 */
export async function getPrimaryRepUserId(clientId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("client_assignments")
      .select("user_id")
      .eq("client_id", clientId)
      .eq("is_primary", true)
      .single();

    if (error || !data) {
      return null;
    }

    return data.user_id;
  } catch {
    return null;
  }
}

/**
 * Checks if a notification with the same user and link was created in the last 24 hours
 * Used to avoid spam for task overdue notifications
 */
export async function hasRecentNotification(
  userId: string,
  link: string,
  hoursAgo: number = 24
): Promise<boolean> {
  try {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hoursAgo);

    const { data, error } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("link", link)
      .gte("created_at", cutoff.toISOString())
      .limit(1);

    if (error) {
      return false;
    }

    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}
