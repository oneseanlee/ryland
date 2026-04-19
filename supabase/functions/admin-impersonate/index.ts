// Admin-only edge function: generate a magic link to sign in as another user.
// Logs every impersonation attempt to admin_impersonation_log.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const adminUserId = claimsData.claims.sub as string;

    // Check admin role via RPC (server-side)
    const { data: isAdmin, error: roleErr } = await userClient.rpc("is_admin");
    if (roleErr || !isAdmin) {
      return json({ error: "Forbidden — admin role required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { target_user_id, reason, redirect_to } = body as {
      target_user_id?: string;
      reason?: string;
      redirect_to?: string;
    };

    if (!target_user_id || typeof target_user_id !== "string") {
      return json({ error: "target_user_id is required" }, 400);
    }

    // Service-role client for admin actions
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get target user
    const { data: targetUserData, error: targetErr } =
      await adminClient.auth.admin.getUserById(target_user_id);
    if (targetErr || !targetUserData?.user) {
      return json({ error: "Target user not found" }, 404);
    }
    const targetUser = targetUserData.user;
    const targetEmail = targetUser.email;
    if (!targetEmail) {
      return json({ error: "Target user has no email" }, 400);
    }

    // Block impersonating other admins
    const { data: targetIsAdmin } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", target_user_id)
      .eq("role", "admin")
      .maybeSingle();
    if (targetIsAdmin) {
      return json({ error: "Cannot impersonate another admin" }, 403);
    }

    // Generate magic link
    const { data: linkData, error: linkErr } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: targetEmail,
        options: {
          redirectTo: redirect_to || `${new URL(req.url).origin}/portal`,
        },
      });
    if (linkErr || !linkData?.properties?.action_link) {
      console.error("generateLink error:", linkErr);
      return json({ error: "Failed to generate sign-in link" }, 500);
    }

    // Log
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;
    const ua = req.headers.get("user-agent") || null;

    const { data: logRow, error: logErr } = await adminClient
      .from("admin_impersonation_log")
      .insert({
        admin_user_id: adminUserId,
        target_user_id,
        target_email: targetEmail,
        reason: reason || null,
        ip_address: ip,
        user_agent: ua,
      })
      .select("id")
      .single();
    if (logErr) {
      console.error("audit log insert failed:", logErr);
    }

    return json({
      action_link: linkData.properties.action_link,
      target_email: targetEmail,
      target_user_id,
      log_id: logRow?.id || null,
    });
  } catch (err) {
    console.error("admin-impersonate error:", err);
    return json({ error: (err as Error).message || "Internal error" }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
