// GoHighLevel sync for a saved fundability_assessments row. Shared by fundability-submit and fundability-retry.
import {
  ALL_TRACK_TAGS, BENCHMARKS, TRACK_LABEL, TRACK_TAG, benchmarkById, leadSourceTag, scoreAssessment, type Answer,
} from "./fundability.ts";

export interface AssessmentRow {
  id: string; first_name: string; email: string; phone: string | null;
  marketing_consent: boolean; sms_consent: boolean; answers: Record<string, Answer>;
  utm: Record<string, string> | null; landing_url: string | null;
}

const GHL = "https://services.leadconnectorhq.com";

export function toE164(p?: string) {
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


const answerText = (a: string) => (a === "yes" ? "Yes" : a === "no" ? "No" : "Not sure");

/** Syncs one saved row to GHL and records crm_status/crm_error/ghl_contact_id. Never throws. */
// deno-lint-ignore no-explicit-any
export async function syncAssessmentToGhl(db: any, row: AssessmentRow): Promise<{ crm: "synced" | "failed"; error: string | null; contactId: string | null }> {
  const answers = row.answers; const r = scoreAssessment(answers);
  const b = { first_name: row.first_name, email: row.email, phone: row.phone ?? "", marketing_consent: row.marketing_consent, sms_consent: row.sms_consent, utm: row.utm ?? {}, landing_url: row.landing_url };
  const key = Deno.env.get("GHL_API_KEY"); const locationId = Deno.env.get("GHL_LOCATION_ID");
  let crm: "synced" | "failed" = "failed"; let crmError: string | null = null; let contactId: string | null = null;
  try {
    if (!key || !locationId) throw new Error("[config] GoHighLevel not configured");
    const tags = ["Fundability Quiz Started", "Fundability Quiz Completed", ...TRACK_TAG[r.track], leadSourceTag(b.utm)];
    if (b.marketing_consent) tags.push("Marketing Consent");
    if (b.sms_consent && b.phone) tags.push("SMS Consent");
    const phone = toE164(b.phone || undefined);
    const source = b.utm?.utm_source ? `Fundability Score - ${b.utm.utm_source}` : "Fundability Score";
    // Match existing contacts by email first, then phone, so SMS-first leads are updated, not duplicated.
    const findDup = async (q: string) => {
      const res = await ghlFetch(`/contacts/search/duplicate?locationId=${encodeURIComponent(locationId)}&${q}`, { method: "GET" }, key);
      if (!res.ok) { console.error("fundability dup search", res.status, (await res.text()).slice(0, 300)); return null; }
      const j = await res.json().catch(() => ({}));
      return (j?.contact?.id as string | undefined) ?? null;
    };
    contactId = await findDup(`email=${encodeURIComponent(b.email.toLowerCase())}`);
    if (!contactId && phone) contactId = await findDup(`number=${encodeURIComponent(phone)}`);
    const fields = { firstName: b.first_name, email: b.email.toLowerCase(), ...(phone ? { phone } : {}), source };
    const up = contactId
      ? await ghlFetch(`/contacts/${contactId}`, { method: "PUT", body: JSON.stringify(fields) }, key)
      : await ghlFetch("/contacts/", { method: "POST", body: JSON.stringify({ locationId, ...fields }) }, key);
    const upBody = await up.json().catch(() => ({}));
    if (!up.ok) throw new Error(`contact ${contactId ? "update" : "create"} ${up.status}: ${JSON.stringify(upBody).slice(0, 300)}`);
    contactId = contactId ?? upBody?.contact?.id ?? null;
    if (!contactId) throw new Error("contact create returned no id");

    const stale = ALL_TRACK_TAGS.filter((t) => !tags.includes(t));
    await ghlFetch(`/contacts/${contactId}/tags`, { method: "DELETE", body: JSON.stringify({ tags: stale }) }, key).catch(() => null);
    const tagRes = await ghlFetch(`/contacts/${contactId}/tags`, { method: "POST", body: JSON.stringify({ tags }) }, key);
    if (!tagRes.ok) throw new Error(`tags ${tagRes.status}`);

    const label = (a: string) => (a === "yes" ? "PASS" : a === "no" ? "NEEDS ATTENTION" : "NOT VERIFIED");
    const note = [
      `Fundability Score: ${r.total}/12${r.provisional ? " (provisional)" : ""}`,
      `Personal: ${r.personal}/6 · Business: ${r.business}/6`,
      `Track: ${TRACK_LABEL[r.track]}`,
      `Top 3 fixes: ${r.priorities.slice(0, 3).map((id, i) => `${i + 1}) ${benchmarkById(id).title}`).join("; ") || "none"}`,
      "", "Answers:", ...BENCHMARKS.map((x) => `${x.id} ${x.question}\n   Answer: ${answerText(answers[x.id])} (${label(answers[x.id])})`), "",
      `Marketing consent: ${b.marketing_consent ? "yes" : "no"} · SMS consent: ${b.sms_consent && b.phone ? "yes" : "no"}`,
      `UTM: ${Object.entries(b.utm ?? {}).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}`,
      `Landing: ${b.landing_url ?? ""}`, `Assessment ID: ${row.id}`,
    ].join("\n");
    const noteRes = await ghlFetch(`/contacts/${contactId}/notes`, { method: "POST", body: JSON.stringify({ body: note }) }, key);
    if (!noteRes.ok) throw new Error(`note ${noteRes.status}: ${(await noteRes.text()).slice(0, 300)}`);
    crm = "synced";
  } catch (e) {
    crmError = String((e as Error).message ?? e).slice(0, 1000);
    console.error("fundability crm", row.id, crmError);
  }
  const { error } = await db.from("fundability_assessments").update({ crm_status: crm, crm_error: crmError, ghl_contact_id: contactId }).eq("id", row.id);
  if (error) console.error("fundability crm status write", row.id, error);
  return { crm, error: crmError, contactId };
}
