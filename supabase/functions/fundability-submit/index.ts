import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { BENCHMARKS, isCompleteAnswers, scoreAssessment } from "../_shared/fundability.ts";
import { syncAssessmentToGhl } from "../_shared/fundability-ghl.ts";
import { completionReceipt } from "../_shared/fundability-receipt.ts";

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.object({
  first_name: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).regex(/^[+\d\s().-]*$/).optional().or(z.literal("")),
  marketing_consent: z.boolean(),
  sms_consent: z.boolean(),
  answers: z.record(z.enum(["yes", "no", "unsure"])),
  started_at: z.string().datetime().optional(),
  utm: z.record(z.string().max(200)).optional(),
  landing_url: z.string().max(500).optional(),
  website: z.string().max(0).optional(), // honeypot
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Please check your details and try again." }, 400);
  const b = parsed.data;
  if (b.website) return json({ ok: true, id: null, crm: "skipped" }); // bot
  if (!isCompleteAnswers(b.answers)) return json({ error: "All 12 questions must be answered." }, 400);

  const answers = Object.fromEntries(BENCHMARKS.map((x) => [x.id, b.answers[x.id]]));
  const r = scoreAssessment(answers);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ error: "Service unavailable" }, 503);
  const db = createClient(url, serviceKey);
  const completedAt = new Date().toISOString();

  const { data: row, error } = await db.from("fundability_assessments").insert({
    first_name: b.first_name, email: b.email.toLowerCase(), phone: b.phone || null,
    marketing_consent: b.marketing_consent, sms_consent: b.sms_consent && !!b.phone,
    answers, personal_score: r.personal, business_score: r.business, total_score: r.total,
    track: r.track, provisional: r.provisional, failed: r.failed, unverified: r.unverified, priorities: r.priorities,
    started_at: b.started_at ?? null, completed_at: completedAt,
    utm: b.utm ?? {}, landing_url: b.landing_url ?? null,
  }).select("id").single();
  if (error) { console.error("fundability insert", error); return json({ error: "Could not save your results." }, 500); }

  const receipt = await completionReceipt(row.id, serviceKey);
  // Durable server-side fallback: competes with browser completion for the same atomic claim.
  EdgeRuntime.waitUntil((async () => {
    const { data: claimed, error: claimError } = await db.from("fundability_assessments").update({ crm_status: "syncing" }).eq("id", row.id).eq("crm_status", "pending").select("id").maybeSingle();
    if (claimError) { console.error("fundability claim failed", row.id); return; }
    if (claimed) await syncAssessmentToGhl(db, { ...b, id: row.id, completed_at: completedAt, email: b.email.toLowerCase(), phone: b.phone || null, sms_consent: b.sms_consent && !!b.phone, answers, utm: b.utm ?? {}, landing_url: b.landing_url ?? null });
  })());
  return json({ ok: true, id: row.id, receipt, crm: "pending" });
});
