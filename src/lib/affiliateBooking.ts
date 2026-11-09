/** Partner referral calendar: the permanent GHL booking widget for affiliate referral leads. */
export const AFFILIATE_BOOKING_URL: string =
  "https://link.rylandpartners.com/widget/booking/SCgFhVZJmkZBDLyiDGTl";

/** Builds the partner booking link, keeping the referring partner's ?ref so attribution survives. */
export function affiliateBookingUrl(ref?: string | null): string {
  const url = new URL(AFFILIATE_BOOKING_URL);
  if (ref) url.searchParams.set("ref", ref);
  return url.toString();
}
