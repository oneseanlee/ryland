import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Payment verification webhook for GoHighLevel.
 *
 * Configure a GHL workflow ("Payment Received" trigger → Webhook action) to POST:
 *   { "reference": "<checkout reference>", "token": "<payment token>", "payment_ref": "<ghl payment id>" }
 *
 * The reference and token come from the checkout URL parameters. Until this is
 * configured, payments stay "Pending Verification" and an admin confirms them
 * manually (audited) in the admin portal. Duplicate events are safe: a batch
 * can only be marked paid once.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => null);
    const reference = typeof body?.reference === "string" ? body.reference.trim().toUpperCase() : "";
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const paymentRef =
      typeof body?.payment_ref === "string" && body.payment_ref.length <= 100 ? body.payment_ref : null;

    if (!reference || !token) {
      return json({ error: "Missing reference or token" }, 400);
    }

    const { data: batch } = await supabase
      .from("checkout_batches")
      .select("id, reference, status, total, payment_token, affiliate_id")
      .eq("reference", reference)
      .maybeSingle();

    if (!batch || batch.payment_token !== token) {
      return json({ error: "Unknown checkout reference" }, 404);
    }

    if (batch.status === "paid") {
      // Duplicate payment event — already verified, acknowledge idempotently.
      return json({ success: true, already_paid: true });
    }

    if (batch.status === "cancelled") {
      return json({ error: "Checkout batch was cancelled" }, 409);
    }

    const { error: updErr } = await supabase
      .from("checkout_batches")
      .update({ status: "paid", paid_at: new Date().toISOString(), payment_ref: paymentRef })
      .eq("id", batch.id)
      .neq("status", "paid");
    if (updErr) {
      console.error("batch update error:", updErr.message);
      return json({ error: "Could not update batch" }, 500);
    }

    await supabase
      .from("inquiry_orders")
      .update({ payment_status: "paid" })
      .eq("checkout_batch_id", batch.id)
      .neq("payment_status", "paid");

    await supabase.from("inquiry_audit_log").insert({
      action: "payment_confirmed",
      entity_type: "checkout_batch",
      entity_id: batch.id,
      details: { method: "ghl_webhook", payment_ref: paymentRef, reference },
    });

    // Notify the affiliate
    const { data: aff } = await supabase
      .from("affiliates")
      .select("user_id")
      .eq("id", batch.affiliate_id)
      .maybeSingle();
    if (aff?.user_id) {
      await supabase.from("notifications").insert({
        user_id: aff.user_id,
        title: "Payment confirmed",
        message: `Payment for checkout ${batch.reference} ($${Number(batch.total).toFixed(2)}) has been verified. Your orders are being processed.`,
        type: "system",
        link: "/portal/inquiries",
      });
    }

    return json({ success: true });
  } catch (err) {
    console.error("ghl-payment-webhook error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
