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

function makeReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "CIR-";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const GHL_BASE = "https://services.leadconnectorhq.com";

async function ghl(path: string, init: RequestInit) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${Deno.env.get("GHL_API_KEY")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Version: "2021-07-28",
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`[${res.status}] ${path}: ${text}`);
  return text ? JSON.parse(text) : {};
}

function toE164(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (phone.trim().startsWith("+") && d.length >= 8 && d.length <= 15) return `+${d}`;
  return undefined;
}

async function createGhlInvoice(args: {
  reference: string;
  affiliate: { full_name: string; email: string; phone: string | null; ghl_contact_id: string | null };
  lineItems: { name: string; description: string; amount: number; qty: number }[];
}): Promise<{ id: string; url: string }> {
  const locationId = Deno.env.get("GHL_LOCATION_ID");
  if (!locationId || !Deno.env.get("GHL_API_KEY")) throw new Error("GHL not configured");
  const { affiliate } = args;

  let contactId = affiliate.ghl_contact_id;
  if (!contactId) {
    const [firstName, ...rest] = affiliate.full_name.split(" ");
    const up = await ghl("/contacts/upsert", {
      method: "POST",
      body: JSON.stringify({
        locationId,
        firstName,
        lastName: rest.join(" "),
        email: affiliate.email,
        phone: toE164(affiliate.phone),
      }),
    });
    contactId = up?.contact?.id;
  }
  if (!contactId) throw new Error("No GHL contact id");

  const today = new Date().toISOString().slice(0, 10);
  const inv = await ghl("/invoices/", {
    method: "POST",
    body: JSON.stringify({
      altId: locationId,
      altType: "location",
      name: `Credit Inquiry Removal — ${args.reference}`,
      title: "INVOICE",
      currency: "USD",
      liveMode: true,
      issueDate: today,
      dueDate: today,
      invoiceNumber: args.reference,
      businessDetails: { name: "Ryland Partners" },
      contactDetails: {
        id: contactId,
        name: affiliate.full_name,
        email: affiliate.email,
        phoneNo: toE164(affiliate.phone),
      },
      items: args.lineItems.map((i) => ({ ...i, currency: "USD", type: "one_time" })),
      discount: { value: 0, type: "percentage" },
      termsNotes: `Batch reference ${args.reference}`,
    }),
  });
  const id = inv?._id || inv?.invoice?._id || inv?.id;
  if (!id) throw new Error(`Invoice created without id: ${JSON.stringify(inv)}`);

  // Mark as sent so the public payment page is live
  try {
    await ghl(`/invoices/${id}/send`, {
      method: "POST",
      body: JSON.stringify({
        altId: locationId,
        altType: "location",
        userId: Deno.env.get("GHL_USER_ID"),
        action: "send_manually",
        liveMode: true,
      }),
    });
  } catch (e) {
    console.warn("invoice send warning:", e instanceof Error ? e.message : e);
  }

  return { id, url: `https://link.rylandpartners.com/invoice/${id}` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate the caller with their own JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Resolve the caller's affiliate record
    const { data: affiliate, error: affErr } = await supabase
      .from("affiliates")
      .select("id, full_name, email, phone, ghl_contact_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (affErr || !affiliate) {
      return json({ error: "Affiliate account not found" }, 403);
    }

    // Load cart orders that belong to this affiliate and are not yet batched
    const { data: cartOrders, error: cartErr } = await supabase
      .from("inquiry_orders")
      .select("id, bureaus, add_ons, status, checkout_batch_id, service_name")
      .eq("affiliate_id", affiliate.id)
      .eq("status", "cart")
      .is("checkout_batch_id", null);
    if (cartErr) {
      console.error("cart query error:", cartErr.message);
      return json({ error: "Could not load your cart" }, 500);
    }
    if (!cartOrders || cartOrders.length === 0) {
      return json({ error: "Your cart is empty" }, 400);
    }

    // Server-side pricing is the source of truth
    const { data: settings, error: setErr } = await supabase
      .from("inquiry_settings")
      .select("service_price, per_bureau_price, ghl_payment_link")
      .eq("id", 1)
      .maybeSingle();
    if (setErr) {
      console.error("settings query error:", setErr.message);
      return json({ error: "Could not load pricing" }, 500);
    }
    if (!settings) {
      return json(
        { error: "Checkout is not configured yet. Pricing or the payment link still needs to be set up by the admin." },
        503
      );
    }

    const servicePrice = Number(settings.service_price) || 0;
    const perBureauPrice = Number(settings.per_bureau_price) || 0;

    let total = 0;
    const lineItems: { name: string; description: string; amount: number; qty: number }[] = [];
    for (const order of cartOrders) {
      const bureaus = Array.isArray(order.bureaus) ? order.bureaus.length : 0;
      const addOns = Array.isArray(order.add_ons) ? order.add_ons : [];
      const addOnTotal = addOns.reduce(
        (sum: number, a: { name?: string; price?: number }) => sum + (Number(a?.price) || 0),
        0
      );
      const orderTotal = servicePrice + perBureauPrice * bureaus + addOnTotal;
      total += orderTotal;
      const addOnNames = addOns.map((a: { name?: string }) => a?.name).filter(Boolean).join(", ");
      lineItems.push({
        name: order.service_name || "Credit Inquiry Removal",
        description: [
          `Bureaus: ${(order.bureaus || []).join(", ") || "none"}`,
          addOnNames ? `Add-ons: ${addOnNames}` : "",
        ].filter(Boolean).join(" · "),
        amount: Math.round(orderTotal * 100) / 100,
        qty: 1,
      });
    }
    total = Math.round(total * 100) / 100;

    if (total <= 0) {
      return json({ error: "Pricing is not configured. Checkout is unavailable until an admin sets prices." }, 503);
    }

    const reference = makeReference();

    // Create a GoHighLevel invoice for the exact cart total
    let invoice: { id: string; url: string };
    try {
      invoice = await createGhlInvoice({
        reference,
        affiliate,
        lineItems,
      });
    } catch (e) {
      console.error("GHL invoice error:", e instanceof Error ? e.message : e);
      return json({ error: "Could not create the payment invoice. Your cart was not changed — please try again." }, 502);
    }
    const orderIds = cartOrders.map((o: { id: string }) => o.id);

    // Create the batch (payment_token is generated by the DB default)
    const { data: batch, error: batchErr } = await supabase
      .from("checkout_batches")
      .insert({
        reference,
        affiliate_id: affiliate.id,
        order_count: orderIds.length,
        total,
        status: "awaiting_payment",
        payment_ref: `ghl-invoice:${invoice.id}`,
      })
      .select("id, reference, total, payment_token")
      .single();
    if (batchErr || !batch) {
      console.error("batch insert error:", batchErr?.message);
      return json({ error: "Could not create checkout batch" }, 500);
    }

    // Snapshot prices onto the orders and attach them to the batch
    const { error: updErr } = await supabase
      .from("inquiry_orders")
      .update({
        checkout_batch_id: batch.id,
        status: "submitted",
        service_status: "submitted",
        payment_status: "unpaid",
      })
      .in("id", orderIds)
      .eq("affiliate_id", affiliate.id);
    if (updErr) {
      console.error("order update error:", updErr.message);
      return json({ error: "Could not attach orders to the checkout batch" }, 500);
    }

    // Notify every admin (billing metadata only — no client identity)
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminMessage = `${affiliate.full_name} submitted a checkout batch (${reference}) containing ${orderIds.length} client order${orderIds.length === 1 ? "" : "s"} totaling $${total.toFixed(2)}. Payment is pending verification.`;
    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          title: "New checkout batch submitted",
          message: adminMessage,
          type: "system",
          link: "/portal/admin/inquiries",
        }))
      );
    }

    // Notify the affiliate
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Checkout batch created",
      message: `Batch ${reference} (${orderIds.length} order${orderIds.length === 1 ? "" : "s"}, $${total.toFixed(2)}) was created. Complete payment to start processing.`,
      type: "system",
      link: "/portal/inquiries",
    });

    const paymentUrl = invoice.url;

    return json({
      success: true,
      reference: batch.reference,
      batchId: batch.id,
      total,
      orderCount: orderIds.length,
      paymentUrl,
    });
  } catch (err) {
    console.error("create-inquiry-checkout error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
