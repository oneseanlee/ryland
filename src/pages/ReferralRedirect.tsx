import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles /r/:ref — supports both the legacy affiliate_id (e.g. "BWinner1")
 * and new vanity slugs (e.g. "brittany"). Looks up which the value is and
 * forwards to the referral form with a normalized affiliate_id.
 */
export default function ReferralRedirect() {
  const { ref } = useParams<{ ref: string }>();
  const [resolved, setResolved] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = (ref || "").trim();
      if (!r) {
        setDone(true);
        return;
      }
      const { data } = await supabase.rpc("lookup_affiliate_by_ref", { _ref: r });
      if (cancelled) return;
      const row = data && data[0];
      // Fall back to the raw param so the original /r/ID path keeps working
      // even if the affiliate is pending/not-yet-approved.
      setResolved(row?.affiliate_id ?? r);
      setDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [ref]);

  if (!done) return <div className="min-h-screen" aria-hidden />;
  return <Navigate to={`/affiliate-referral?ref=${resolved ?? ""}`} replace />;
}
