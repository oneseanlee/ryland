import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isReservedSlug } from "@/lib/reservedSlugs";

/**
 * Catch-all root-level vanity URL handler: rylandpartners.com/:slug
 * - If slug matches an approved affiliate's referral_slug or affiliate_id → redirect to referral form
 * - Otherwise → 404
 */
export default function VanitySlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<"checking" | "match" | "miss">("checking");
  const [ref, setRef] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = (slug || "").trim();
      if (!s || isReservedSlug(s)) {
        setStatus("miss");
        return;
      }
      const { data, error } = await supabase.rpc("lookup_affiliate_by_ref", { _ref: s });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setStatus("miss");
        return;
      }
      const row = data[0] as { affiliate_id: string };
      setRef(row.affiliate_id);
      setStatus("match");
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "checking") return <div className="min-h-screen" aria-hidden />;
  if (status === "match") return <Navigate to={`/affiliate-referral?ref=${ref}`} replace />;
  return <Navigate to="/404" replace />;
}
