import { describe, expect, it } from "vitest";
import { AFFILIATE_BOOKING_URL, affiliateBookingUrl } from "@/lib/affiliateBooking";

describe("Affiliate partner referral booking", () => {
  it("uses the permanent partner calendar", () => {
    expect(AFFILIATE_BOOKING_URL).toBe(
      "https://link.rylandpartners.com/widget/booking/SCgFhVZJmkZBDLyiDGTl",
    );
  });

  it("keeps the referring partner's ref", () => {
    const url = new URL(affiliateBookingUrl("GRyland1"));
    expect(url.origin + url.pathname).toBe(AFFILIATE_BOOKING_URL);
    expect(url.searchParams.get("ref")).toBe("GRyland1");
  });

  it("adds no ref when the visitor arrived without one", () => {
    expect(affiliateBookingUrl(null)).toBe(AFFILIATE_BOOKING_URL);
  });
});
