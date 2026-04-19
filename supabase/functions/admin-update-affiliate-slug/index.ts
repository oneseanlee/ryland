// Admin-only: update an affiliate's referral_slug with validation.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESERVED = new Set<string>([
  "about", "partners", "store", "product", "privacy-policy", "terms-of-service",
  "ccpa", "tsr-compliance", "disclaimers", "cookie-policy", "contact", "funnel",
  "assessment", "funding", "credit-repair", "community", "consultation",
  "booking-confirmed", "partner-onboarding", "opt-in", "thank-you", "my-orders",
  "download", "reset-password", "credit-intake", "unsubscribe", "r",
  "affiliate-referral", "affiliate-booking", "portal", "admin", "api", "auth",
  "login", "signup", "register", "logout", "settings", "dashboard", "leads",
  "commissions", "payouts", "reports", "events", "speaking", "resources",
  "blog", "support", "help", "faq", "pricing", "checkout", "cart", "search",
  "sitemap.xml", "robots.txt", "favicon.ico",
]);

const SLUG_REGEX = /^[a-z][a-z0-9-]{2,29}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin, error: roleErr } = await userClient.rpc("is_admin");
    if (roleErr || !isAdmin) return json({ error: "Forbidden — admin role required" }, 403);

    const body = await req.json().catch(() => ({}));
    const { affiliate_id, slug } = body as { affiliate_id?: string; slug?: string | null };

    if (!affiliate_id) return json({ error: "affiliate_id is required" }, 400);

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Allow clearing slug (set to null)
    if (slug === null || slug === "") {
      const { error } = await adminClient
        .from("affiliates")
        .update({ referral_slug: null })
        .eq("id", affiliate_id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, slug: null });
    }

    if (typeof slug !== "string") return json({ error: "Invalid slug" }, 400);

    const normalized = slug.trim().toLowerCase();
    if (!SLUG_REGEX.test(normalized)) {
      return json({
        error: "Use lowercase letters, numbers, and hyphens. Must start with a letter, 3–30 chars.",
      }, 400);
    }
    if (RESERVED.has(normalized)) {
      return json({ error: "This handle is reserved." }, 400);
    }

    // Uniqueness check (case-insensitive) excluding this affiliate
    const { data: existing, error: lookupErr } = await adminClient
      .from("affiliates")
      .select("id")
      .ilike("referral_slug", normalized)
      .neq("id", affiliate_id)
      .maybeSingle();
    if (lookupErr) return json({ error: lookupErr.message }, 500);
    if (existing) return json({ error: "This handle is already taken." }, 409);

    const { error: updateErr } = await adminClient
      .from("affiliates")
      .update({ referral_slug: normalized })
      .eq("id", affiliate_id);
    if (updateErr) return json({ error: updateErr.message }, 500);

    return json({ ok: true, slug: normalized });
  } catch (err) {
    console.error("admin-update-affiliate-slug error:", err);
    return json({ error: (err as Error).message || "Internal error" }, 500);
  }
});
