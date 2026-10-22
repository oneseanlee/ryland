import { describe, expect, it } from "vitest";
import { canRemoveInquiryOrder } from "./inquiryCleanup";

describe("unpaid inquiry cleanup", () => {
  it("allows unfinished unpaid orders to be removed", () => {
    expect(canRemoveInquiryOrder({ status: "submitted", payment_status: "unpaid", service_status: "submitted" })).toBe(true);
  });
  it("never removes paid orders", () => {
    expect(canRemoveInquiryOrder({ status: "submitted", payment_status: "paid", service_status: "submitted" })).toBe(false);
  });
  it("protects payments awaiting verification", () => {
    expect(canRemoveInquiryOrder({ status: "submitted", payment_status: "pending_verification", service_status: "submitted" })).toBe(false);
  });
  it("protects completed service orders", () => {
    expect(canRemoveInquiryOrder({ status: "submitted", payment_status: "unpaid", service_status: "completed" })).toBe(false);
  });
  it("excludes previously removed orders", () => {
    expect(canRemoveInquiryOrder({ status: "cancelled", payment_status: "unpaid", service_status: "cancelled" })).toBe(false);
  });
});