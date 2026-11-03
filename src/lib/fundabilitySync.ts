import { supabase } from "@/integrations/supabase/client";

export async function syncQuizToGHL(assessmentId: string, receipt: string) {
  try {
    const { error } = await supabase.functions.invoke("ghl-fundability-quiz", { body: { assessmentId, receipt } });
    if (error) console.error("[GHL sync] Completion sync failed");
  } catch {
    console.error("[GHL sync] Unexpected completion error");
  }
}