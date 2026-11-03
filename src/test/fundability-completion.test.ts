import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { completionReceipt, verifyCompletionReceipt } from "../../supabase/functions/_shared/fundability-receipt";
import { quizCustomFields, fundingReviewUpdate } from "../../supabase/functions/_shared/fundability-quiz-fields";
import { BENCHMARKS, type Answer } from "../../supabase/functions/_shared/fundability";
import { syncAssessmentToGhl } from "../../supabase/functions/_shared/fundability-ghl";

const answers = Object.fromEntries(BENCHMARKS.map((b) => [b.id, "yes"])) as Record<string, Answer>;
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());

describe("Fundability completion authorization", () => {
  it("accepts a signed receipt only for its own assessment", async () => {
    const receipt = await completionReceipt("assessment-a", "server-test-key", 1000);
    expect(await verifyCompletionReceipt("assessment-a", receipt, "server-test-key", 2000)).toBe(true);
    expect(await verifyCompletionReceipt("assessment-b", receipt, "server-test-key", 2000)).toBe(false);
    expect(await verifyCompletionReceipt("assessment-a", receipt, "wrong-key", 2000)).toBe(false);
  });
  it("rejects expired, forged and malformed receipts", async () => {
    const receipt = await completionReceipt("assessment-a", "server-test-key", 1000);
    expect(await verifyCompletionReceipt("assessment-a", receipt, "server-test-key", 901000)).toBe(false);
    expect(await verifyCompletionReceipt("assessment-a", receipt.replace("901000", "999999"), "server-test-key", 2000)).toBe(false);
    expect(await verifyCompletionReceipt("assessment-a", "bad", "server-test-key", 2000)).toBe(false);
  });
});

describe("Quiz contact custom fields", () => {
  it("maps all five supplied IDs to recomputed score, track, failed checks, answers and original completion date", () => {
    const given = { ...answers, "01": "no", "02": "unsure" } as Record<string, Answer>;
    const fields = quizCustomFields(given, "2026-11-03T04:05:00.000Z");
    expect(fields).toEqual([
      { id: "DeHa5lUES78xgzGHK1z8", field_value: 10 },
      { id: "qus9hzaK6eiiQQ3ikUUw", field_value: "credit_optimization" },
      { id: "lUoyZSsfb9zck1WHpIbd", field_value: BENCHMARKS[0].title },
      { id: "k1nTuBBq6WilEdZWmvcn", field_value: JSON.stringify(given, null, 2) },
      { id: "EgMMU713TJ2x0TxKsLIm", field_value: "2026-11-03" },
    ]);
  });
});

describe("Funding Review appointment scope", () => {
  const appt = { id: "appointment", title: "Free Funding Review", startTime: "2026-11-04T12:00:00Z", notes: "Original notes" };
  const now = Date.parse("2026-11-03T04:05:00Z");
  it("preserves existing notes when prefixing a verified upcoming Funding Review", () => {
    expect(fundingReviewUpdate(appt, 10, "credit_optimization", "Credit Scores", now)).toBe("[Fundability Quiz: 10/12 · Track: credit_optimization]\nRed flags: Credit Scores\n\nOriginal notes");
  });
  it("does not touch past, unrelated, malformed or already prefixed events", () => {
    expect(fundingReviewUpdate({ ...appt, startTime: "2026-11-01T12:00:00Z" }, 10, "both", "", now)).toBeNull();
    expect(fundingReviewUpdate({ ...appt, title: "Partner consultation" }, 10, "both", "", now)).toBeNull();
    expect(fundingReviewUpdate({ ...appt, startTime: "bad" }, 10, "both", "", now)).toBeNull();
    expect(fundingReviewUpdate({ ...appt, notes: "[Fundability Quiz: 9/12] existing" }, 10, "both", "", now)).toBeNull();
  });
});

describe("Shared sync and retry behavior", () => {
  it("records a retryable failure if contact update fails", async () => {
    vi.stubGlobal("Deno", { env: { get: (key: string) => ({ GHL_API_KEY: "test-key", GHL_LOCATION_ID: "test-location" }[key]) } });
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("search/duplicate")
      ? new Response(JSON.stringify({ contact: { id: "test-contact" } }))
      : new Response(JSON.stringify({ error: "test failure" }), { status: 400 })));
    const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
    const result = await syncAssessmentToGhl({ from: () => ({ update }) }, { id: "test-assessment", first_name: "Test", email: "test@example.com", phone: null, marketing_consent: false, sms_consent: false, answers, utm: {}, landing_url: null, completed_at: "2026-11-03T04:05:00Z" });
    expect(result.crm).toBe("failed");
    expect(update).toHaveBeenCalledWith({ crm_status: "failed", crm_error: expect.stringContaining("contact update 400"), ghl_contact_id: "test-contact" });
  });
  it("writes fields, completion tag and full note once, while appointment failure is non-fatal", async () => {
    vi.stubGlobal("Deno", { env: { get: (key: string) => ({ GHL_API_KEY: "test-key", GHL_LOCATION_ID: "test-location" }[key]) } });
    const calls: { path: string; body: Record<string, unknown> | null }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      const path = url.replace("https://services.leadconnectorhq.com", "");
      calls.push({ path, body: init.body ? JSON.parse(String(init.body)) : null });
      if (path.includes("search/duplicate")) return new Response(JSON.stringify({ contact: { id: "test-contact" } }));
      if (path.endsWith("appointments")) return new Response("Forbidden", { status: 403 });
      return new Response(JSON.stringify({ contact: { id: "test-contact" } }));
    }));
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const db = { from: vi.fn(() => ({ update })) };
    const result = await syncAssessmentToGhl(db, { id: "test-assessment", first_name: "Test", email: "test@example.com", phone: null, marketing_consent: false, sms_consent: false, answers, utm: { utm_source: "sms" }, landing_url: null, completed_at: "2026-11-03T04:05:00Z" });
    expect(result.crm).toBe("synced");
    expect(calls.find((c) => c.path === "/contacts/test-contact")?.body?.customFields).toEqual(quizCustomFields(answers, "2026-11-03T04:05:00Z"));
    expect(calls.find((c) => c.path.endsWith("/tags"))?.body?.tags).toEqual(expect.arrayContaining(["fundability quiz completed", "fundability-track-funding_ready", "lead source - sms keyword"]));
    const notes = calls.filter((c) => c.path.endsWith("/notes"));
    expect(notes).toHaveLength(1);
    for (const b of BENCHMARKS) expect(notes[0].body?.body).toContain(`${b.id} ${b.question}\n   Answer: Yes`);
    expect(update).toHaveBeenCalledWith({ crm_status: "synced", crm_error: null, ghl_contact_id: "test-contact" });
  });
});