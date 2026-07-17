import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { Loader2 } from "lucide-react";

const AFFILIATE_BOOKING_URL = "https://link.rylandpartners.com/widget/booking/rpfgxBFIjZC7pWMCYBv9";

export default function AffiliateBooking() {
  const [params] = useSearchParams();

  useEffect(() => {
    const bookingUrl = new URL(AFFILIATE_BOOKING_URL);
    const ref = params.get("ref");
    if (ref) bookingUrl.searchParams.set("ref", ref);
    window.location.replace(bookingUrl.toString());
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001F3F] text-white">
      <PageMeta
        title="Affiliate Referral Booking | Ryland Partners"
        description="Book your funding consultation meeting as an affiliate referral."
        noindex
      />
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm text-white/70">Redirecting to booking calendar…</p>
      </div>
    </div>
  );
}
