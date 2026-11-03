// Admin-only: list Fundability submissions whose GHL sync failed, and retry one or all.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { syncAssessmentToGhl } from "../_shared/fundability-ghl.ts";

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.object({ action: z.enum(["list", "retry"]), id: z.string().uuid().optional(), all: z.boolean().optional() });
const COLS = "id, first_name, email, phone, marketing_consent, sms_consent, answers, utm, landing_url, completed_at";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const user = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: claims, error: cErr } = await user.auth.getClaims(auth.slice(7));
  if (cErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
  const { data: isAdmin, error: rErr } = await user.rpc("is_admin");
  if (rErr || !isAdmin) return json({ error: "Forbidden — admin role required" }, 403);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request" }, 400);
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (parsed.data.action === "list") {
    const { data, error } = await db.from("fundability_assessments")
      .select("id, first_name, email, phone, total_score, track, crm_status, crm_error, created_at, utm")
      .neq("crm_status", "synced").order("created_at", { ascending: false }).limit(200);
    if (error) return json({ error: error.message }, 500);
    return json({ rows: data });
  }

  let q = db.from("fundability_assessments").select(COLS);
  if (parsed.data.id) q = q.eq("id", parsed.data.id);
  else if (parsed.data.all) q = q.neq("crm_status", "synced").limit(50);
  else return json({ error: "Pass id or all" }, 400);
  const { data: rows, error } = await q;
  if (error) return json({ error: error.message }, 500);
  const results = [];
  for (const row of rows ?? []) results.push({ id: row.id, ...(await syncAssessmentToGhl(db, row)) });
  return json({ results });
});
