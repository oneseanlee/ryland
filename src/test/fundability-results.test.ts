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