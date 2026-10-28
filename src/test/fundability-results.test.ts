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
