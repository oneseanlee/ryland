import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { verifyCompletionReceipt } from "../_shared/fundability-receipt.ts";
import { syncAssessmentToGhl } from "../_shared/fundability-ghl.ts";

const Body = z.object({ assessmentId: z.string().uuid(), receipt: z.string().max(200) }).strict();
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid completion request" }, 400);
  const url = Deno.env.get("SUPABASE_URL");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secret) return json({ error: "Service unavailable" }, 503);
  const { assessmentId, receipt } = parsed.data;
  if (!await verifyCompletionReceipt(assessmentId, receipt, secret)) return json({ error: "Unauthorized completion" }, 401);
  const db = createClient(url, secret);
  const { data: row, error } = await db.from("fundability_assessments")
    .update({ crm_status: "syncing" }).eq("id", assessmentId).eq("crm_status", "pending")
    .select("id, first_name, email, phone, marketing_consent, sms_consent, answers, utm, landing_url, completed_at").maybeSingle();
  if (error) { console.error("fundability completion claim failed", assessmentId); return json({ error: "Could not queue sync" }, 500); }
  if (!row) return json({ ok: true, status: "already_processed" });
  EdgeRuntime.waitUntil(syncAssessmentToGhl(db, row));
  return json({ ok: true, status: "queued" }, 202);
});