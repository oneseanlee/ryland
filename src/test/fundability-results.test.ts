import { describe, expect, it } from "vitest";
import { resultBand } from "@/lib/fundabilityResults";

describe("PDF results score ranges", () => {
  it("0–4 uses the not-ready band", () => {
    expect([0, 1, 2, 3, 4].map(resultBand)).toEqual(Array(5).fill("not_ready"));
  });
  it("5–8 uses the getting-close band", () => {
    expect([5, 6, 7, 8].map(resultBand)).toEqual(Array(4).fill("getting_close"));
  });
  it("9–11 uses the almost-there band", () => {
    expect([9, 10, 11].map(resultBand)).toEqual(Array(3).fill("almost_there"));
  });
  it("only 12 uses the ready band", () => {
    expect(resultBand(12)).toBe("ready");
    expect(resultBand(11)).not.toBe("ready");
  });
});
import { attentionItems } from "@/lib/fundabilityResults";
describe("attention order", () => {
  it("puts score under 700, negatives, then business compliance first", () => {
    expect(attentionItems({})).toEqual(["01", "02", "07"]);
  });
  it("falls through to the next most important when the majors pass", () => {
    expect(attentionItems({ "01": "yes", "02": "yes", "07": "yes" })).toEqual(["05", "11", "03"]);
  });
});
import { BENCHMARKS } from "@/lib/fundability";
import { PASS_COPY, passLine } from "@/lib/fundabilityResults";
describe("personal pass lines", () => {
  it("every benchmark has its own line", () => {
    for (const b of BENCHMARKS) expect(passLine(b.id)).toBe(PASS_COPY[b.id]);
  });
  it("tells a clean-payment person they passed and to keep it up", () => {
    const line = passLine("02");
    expect(line).toMatch(/no late payments/i);
    expect(line).toMatch(/keep every payment on time/i);
  });
  it("falls back for an unknown benchmark", () => {
    expect(passLine("13")).toMatch(/you meet this benchmark/i);
  });
});
