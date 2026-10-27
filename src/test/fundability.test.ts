import { describe, it, expect } from "vitest";
import { BENCHMARKS, scoreAssessment, type Answer } from "../../supabase/functions/_shared/fundability";

const all = (a: Answer) => Object.fromEntries(BENCHMARKS.map((b) => [b.id, a])) as Record<string, Answer>;
const with_ = (base: Answer, over: Record<string, Answer>) => ({ ...all(base), ...over });
const personalIds = ["01", "02", "03", "04", "05", "06"];
const businessIds = ["07", "08", "09", "10", "11", "12"];

describe("Fundability score", () => {
  it("all yes is 12/12 Funding Ready with no priorities", () => {
    const r = scoreAssessment(all("yes"));
    expect([r.total, r.personal, r.business, r.track, r.priorities.length]).toEqual([12, 6, 6, "funding_ready", 0]);
  });
  it("all no is 0/12 with both gaps and top 3 = 02, 05, 03", () => {
    const r = scoreAssessment(all("no"));
    expect(r.total).toBe(0);
    expect(r.track).toBe("both");
    expect(r.priorities).toEqual(["02", "05", "03"]);
  });
  it("personal pass, business fail is Business Setup First", () => {
    const r = scoreAssessment(with_("yes", Object.fromEntries(businessIds.map((i) => [i, "no"]))));
    expect(r.track).toBe("business_setup");
    expect(r.priorities).toEqual(["07", "08", "09"]);
  });
  it("business pass, personal fail is Credit Optimization First", () => {
    const r = scoreAssessment(with_("yes", Object.fromEntries(personalIds.map((i) => [i, "no"]))));
    expect(r.track).toBe("credit_optimization");
  });
  it("not sure scores 0, stays distinct and marks provisional", () => {
    const r = scoreAssessment(with_("yes", { "05": "unsure", "11": "unsure" }));
    expect(r.total).toBe(10);
    expect(r.unverified).toEqual(["05", "11"]);
    expect(r.failed).toEqual([]);
    expect(r.provisional).toBe(true);
    expect(r.track).toBe("both");
  });
  it("one failed benchmark shows only that priority", () => {
    const r = scoreAssessment(with_("yes", { "11": "no" }));
    expect(r.total).toBe(11);
    expect(r.priorities).toEqual(["11"]);
  });
  it("11/12 is never Funding Ready", () => {
    expect(scoreAssessment(with_("yes", { "01": "no" })).track).not.toBe("funding_ready");
  });
});
