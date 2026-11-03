import { describe, it, expect, vi } from "vitest";
const invoke = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));
import { syncQuizToGHL } from "@/lib/fundabilitySync";

describe("Browser completion sync", () => {
  it("sends only the assessment receipt, not contact data or a client score", async () => {
    invoke.mockResolvedValueOnce({ error: null });
    await syncQuizToGHL("assessment-id", "receipt");
    expect(invoke).toHaveBeenCalledWith("ghl-fundability-quiz", { body: { assessmentId: "assessment-id", receipt: "receipt" } });
  });
  it("absorbs network failures so results can remain visible", async () => {
    invoke.mockRejectedValueOnce(new Error("network"));
    await expect(syncQuizToGHL("assessment-id", "receipt")).resolves.toBeUndefined();
  });
});