import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import {
  ALL_TRACK_TAGS, BENCHMARKS, TRACK_LABEL, TRACK_TAG, benchmarkById, isCompleteAnswers, scoreAssessment,
} from "../_shared/fundability.ts";

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

const GHL = "https://services.leadconnectorhq.com";

function toE164(p?: string) {
  if (!p) return undefined;
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return d.length >= 8 ? `+${d}` : undefined;
}

async function ghlFetch(path: string, init: RequestInit, key: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${GHL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${key}`, Version: "2021-07-28", "Content-Type": "application/json", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status >= 500 && attempt === 0) continue;
    return res;
  }
  throw new Error("unreachable");
}

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
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: row, error } = await db.from("fundability_assessments").insert({
    first_name: b.first_name, email: b.email.toLowerCase(), phone: b.phone || null,
    marketing_consent: b.marketing_consent, sms_consent: b.sms_consent && !!b.phone,
    answers, personal_score: r.personal, business_score: r.business, total_score: r.total,
    track: r.track, provisional: r.provisional, failed: r.failed, unverified: r.unverified, priorities: r.priorities,
    started_at: b.started_at ?? null, completed_at: new Date().toISOString(),
    utm: b.utm ?? {}, landing_url: b.landing_url ?? null,
  }).select("id").single();
  if (error) { console.error("fundability insert", error); return json({ error: "Could not save your results." }, 500); }

  // CRM sync (best effort — results are already saved)
  const key = Deno.env.get("GHL_API_KEY"); const locationId = Deno.env.get("GHL_LOCATION_ID");
  let crm = "failed"; let crmError: string | null = null; let contactId: string | null = null;
  try {
    if (!key || !locationId) throw new Error("[config] GoHighLevel not configured");
    const tags = ["Fundability Quiz Started", "Fundability Quiz Completed", ...TRACK_TAG[r.track]];
    if (b.marketing_consent) tags.push("Marketing Consent");
    if (b.sms_consent && b.phone) tags.push("SMS Consent");
    const up = await ghlFetch("/contacts/upsert", { method: "POST", body: JSON.stringify({
      locationId, firstName: b.first_name, email: b.email, phone: toE164(b.phone || undefined),
      source: b.utm?.utm_source ? `Fundability Score (${b.utm.utm_source})` : "Fundability Score",
    }) }, key);
    const upBody = await up.json().catch(() => ({}));
    if (!up.ok) throw new Error(`upsert ${up.status}: ${JSON.stringify(upBody).slice(0, 300)}`);
    contactId = upBody?.contact?.id ?? null;
    if (!contactId) throw new Error("upsert returned no contact id");

    const stale = ALL_TRACK_TAGS.filter((t) => !tags.includes(t));
    await ghlFetch(`/contacts/${contactId}/tags`, { method: "DELETE", body: JSON.stringify({ tags: stale }) }, key).catch(() => null);
    const tagRes = await ghlFetch(`/contacts/${contactId}/tags`, { method: "POST", body: JSON.stringify({ tags }) }, key);
    if (!tagRes.ok) throw new Error(`tags ${tagRes.status}`);

    const label = (a: string) => (a === "yes" ? "PASS" : a === "no" ? "NEEDS ATTENTION" : "NOT VERIFIED");
    const note = [
      `Fundability Score: ${r.total}/12${r.provisional ? " (provisional)" : ""}`,
      `Personal: ${r.personal}/6 · Business: ${r.business}/6`,
      `Track: ${TRACK_LABEL[r.track]}`,
      `Top priorities: ${r.priorities.map((id) => `${id} ${benchmarkById(id).title}`).join("; ") || "none"}`,
      "", ...BENCHMARKS.map((x) => `${x.id} ${x.title}: ${label(answers[x.id])}`), "",
      `Marketing consent: ${b.marketing_consent ? "yes" : "no"} · SMS consent: ${b.sms_consent && b.phone ? "yes" : "no"}`,
      `UTM: ${Object.entries(b.utm ?? {}).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}`,
      `Landing: ${b.landing_url ?? ""}`, `Assessment ID: ${row.id}`,
    ].join("\n");
    await ghlFetch(`/contacts/${contactId}/notes`, { method: "POST", body: JSON.stringify({ body: note }) }, key).catch(() => null);
    crm = "synced";
  } catch (e) {
    crmError = String((e as Error).message ?? e).slice(0, 1000);
    console.error("fundability crm", crmError);
  }
  await db.from("fundability_assessments").update({ crm_status: crm, crm_error: crmError, ghl_contact_id: contactId }).eq("id", row.id);

  return json({ ok: true, id: row.id, crm });
});
