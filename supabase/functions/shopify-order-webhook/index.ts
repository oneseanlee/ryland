import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain",
};

// Bundle handle → array of { handle, title } for each included ebook
const BUNDLE_MAP: Record<string, Array<{ handle: string; title: string }>> = {
  "business-credit-quickstart-kit-bundle": [
    { handle: "business-credit-basics-101", title: "Business Credit Basics 101" },
    { handle: "how-to-get-your-first-net-30-account", title: "How to Get Your First Net-30 Account" },
    { handle: "essential-business-credit-checklist", title: "Essential Business Credit Checklist" },
  ],
  "the-ultimate-business-funding-credit-bundle": [
    { handle: "how-to-get-vehicle-financing-with-ein-only", title: "How to Get Vehicle Financing with EIN Only" },
    { handle: "how-to-get-up-to-150-000-in-funding-even-with-a-new-llc", title: "How to Get Up to $150,000 in Funding — Even with a New LLC" },
    { handle: "the-ultimate-business-credit-card-playbook", title: "The Ultimate Business Credit Card Playbook" },
    { handle: "fast-track-vendor-accounts-for-new-businesses", title: "Fast-Track Vendor Accounts for New Businesses" },
    { handle: "the-business-funding-application-success-checklist", title: "The Business Funding Application Success Checklist" },
    { handle: "the-fundability-factor-business-assessment-scorecard", title: 'The "Fundability Factor" Business Assessment & Scorecard' },
  ],
  "credit-business-accelerator-pack": [
    { handle: "unlock-credit-potential", title: "Unlock Your Credit Potential – Credit Repair Guide 2025" },
    { handle: "diy-credit-master-guide", title: "DIY Credit Repair – Action Guide 2025" },
    { handle: "diy-credit-repair-workbook", title: "DIY Credit Repair – Workbook" },
    { handle: "13-ways-to-pay-off-debt", title: "13 Best Ways to Pay Off Debt" },
    { handle: "frugal-living-success-workbook", title: "Frugal Living Success Workbook" },
    { handle: "crush-100k-debt-worksheet", title: "Crush $100K Debt Worksheet" },
    { handle: "stop-living-paycheck-to-paycheck", title: "How to Stop Living Paycheck to Paycheck" },
    { handle: "money-management-worksheet", title: "Money Management Worksheet" },
    { handle: "23-money-wasting-habits-to-break", title: "23 Money-Wasting Habits to Break" },
  ],
  "credit-authority-bundle": [
    { handle: "ultimate-business-credit-blueprint", title: "Ultimate Business Credit Blueprint" },
    { handle: "smart-credit-hacks", title: "Smart Credit Hacks" },
    { handle: "the-financial-playbook-your-ultimate-money-resource-guide", title: "The Financial Playbook: Your Ultimate Money Resource Guide" },
    { handle: "ai-powered-credit-dispute-letter-prompts", title: "AI-Powered Credit Dispute Letter Prompts" },
    { handle: "credit-inquiry-phone-script-remove-inquiries-fast", title: "Credit Inquiry Phone Script – Remove Inquiries Fast" },
    { handle: "ultimate-credit-card-lender-list", title: "Ultimate Credit Card Lender List" },
  ],
  "ultimate-credit-business-vault": [
    { handle: "the-ultimate-homebuyers-handbook", title: "The Ultimate Homebuyers Handbook" },
    { handle: "manufactured-spending-techniques", title: "Manufactured Spending Techniques" },
    { handle: "unlocking-business-credit-step-by-step-success", title: "Unlocking Business Credit: Step-by-Step Success" },
    { handle: "credit-score-accelerator-the-90-day-credit-comeback-plan", title: "Credit Score Accelerator – 90-Day Plan" },
    { handle: "secret-lenders-database", title: "Secret Lenders Database" },
    { handle: "master-your-credit-a-practical-step-by-step-guide-to-boosting-your-score", title: "Master Your Credit Guide" },
    { handle: "credit-repair-chatgpt-prompts", title: "Credit Repair ChatGPT Prompts" },
    { handle: "inquiry-removal-guide-step-by-step-directions-to-clean-up-your-credit", title: "Inquiry Removal Guide" },
    { handle: "repo-eraser-how-to-delete-repossessions-from-your-credit-fast", title: "Repo Eraser" },
    { handle: "credit-repair-success-mindset-guide", title: "Credit Repair Success Mindset Guide" },
    { handle: "credit-repair-success-planner", title: "Credit Repair Success Planner" },
    { handle: "credit-repair-legal-rights-cheat-sheet", title: "Credit Repair Legal Rights Cheat Sheet" },
    { handle: "credit-repair-mistakes-to-avoid-guide", title: "Credit Repair Mistakes to Avoid" },
    { handle: "credit-building-resource-library", title: "Credit Building Resource Library" },
    { handle: "100-dispute-letters-templates", title: "100 Dispute Letter Templates" },
    { handle: "credit-score-tracker-printable", title: "Credit Score Tracker" },
    { handle: "bankruptcy-removal-blueprint-your-step-by-step-guide-to-clean-credit", title: "Bankruptcy Removal Guide" },
    { handle: "late-payment-removal-guide", title: "Late Payment Removal Guide" },
  ],
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyShopifyHmac(body: string, hmacHeader: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const computedHmac = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return computedHmac === hmacHeader;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");
    const ghlApiKey = Deno.env.get("GHL_API_KEY");
    const ghlLocationId = Deno.env.get("GHL_LOCATION_ID");
    const siteUrl = "https://rylandpartners.com";

    const body = await req.text();

    // Verify HMAC — REQUIRED. Refuse if secret is not configured so forged
    // webhooks can't be accepted when the env var is missing.
    if (!webhookSecret) {
      console.error("SHOPIFY_WEBHOOK_SECRET is not configured");
      return json({ error: "Webhook secret not configured" }, 500);
    }
    const hmac = req.headers.get("x-shopify-hmac-sha256");
    if (!hmac) return json({ error: "Missing HMAC header" }, 401);
    const valid = await verifyShopifyHmac(body, hmac, webhookSecret);
    if (!valid) return json({ error: "Invalid HMAC" }, 401);

    const order = JSON.parse(body);
    console.log("Shopify order received:", order.id, order.email);

    const email = order.email || order.contact_email;
    if (!email) return json({ error: "No email in order" }, 400);

    const customerName = [order.customer?.first_name, order.customer?.last_name]
      .filter(Boolean).join(" ") || "Customer";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert order
    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .upsert(
        {
          shopify_order_id: String(order.id),
          shopify_order_number: order.name || String(order.order_number),
          email: email.toLowerCase(),
          customer_name: customerName,
        },
        { onConflict: "shopify_order_id" }
      )
      .select("id")
      .single();

    if (orderErr) {
      console.error("Order insert error:", orderErr);
      return json({ error: "Failed to store order" }, 500);
    }

    // Extract line items and create order_items with download tokens
    const lineItems = order.line_items || [];
    const downloadLinks: Array<{ title: string; url: string; token: string }> = [];

    for (const item of lineItems) {
      // Use product handle from line item properties or construct from title
      const handle = item.product_id
        ? await getProductHandle(item.product_id)
        : slugify(item.title);

      // Check if this is a bundle — if so, expand into individual ebooks
      const ebooksToInsert = BUNDLE_MAP[handle]
        ? BUNDLE_MAP[handle].map((eb) => ({ handle: eb.handle, title: eb.title }))
        : [{ handle, title: item.title }];

      console.log(`Processing "${item.title}" → ${ebooksToInsert.length} ebook(s)`);

      for (const ebook of ebooksToInsert) {
        const { data: itemRow, error: itemErr } = await supabase
          .from("order_items")
          .insert({
            order_id: orderRow.id,
            shopify_product_handle: ebook.handle,
            product_title: ebook.title,
          })
          .select("download_token")
          .single();

        if (itemErr) {
          console.error("Order item insert error:", itemErr);
          continue;
        }

        downloadLinks.push({
          title: ebook.title,
          url: `${siteUrl}/download/${itemRow.download_token}`,
          token: itemRow.download_token,
        });
      }
    }

    console.log("Download links generated:", downloadLinks.length);

    // Send download links email directly via transactional email system
    if (downloadLinks.length > 0) {
      try {
        const emailPayload = {
          templateName: "order-download-links",
          recipientEmail: email.toLowerCase(),
          idempotencyKey: `order-downloads-${order.id}`,
          templateData: {
            customerName,
            orderNumber: order.name || String(order.order_number),
            downloadLinks,
            libraryUrl: `${siteUrl}/my-orders`,
          },
        };

        const emailRes = await fetch(
          `${supabaseUrl}/functions/v1/send-transactional-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
              apikey: supabaseServiceKey,
            },
            body: JSON.stringify(emailPayload),
          }
        );

        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error("Transactional email error:", emailRes.status, errText);
        } else {
          await emailRes.text();
          console.log("Download email queued for:", email);
        }
      } catch (emailErr) {
        console.error("Download email invocation error:", emailErr);
      }
    }

    // Still update GHL contact for CRM tracking (but no email dependency)
    if (ghlApiKey && ghlLocationId && downloadLinks.length > 0) {
      try {
        await sendGhlOrderEmail({
          apiKey: ghlApiKey,
          locationId: ghlLocationId,
          email: email.toLowerCase(),
          customerName,
          orderNumber: order.name || String(order.order_number),
          downloadLinks,
          libraryUrl: `${siteUrl}/my-orders`,
        });
        console.log("GHL contact updated for:", email);
      } catch (ghlErr) {
        console.error("GHL contact update error:", ghlErr);
      }
    }

    return json({
      success: true,
      orderId: orderRow.id,
      downloads: downloadLinks.length,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getProductHandle(productId: number | string): Promise<string> {
  // Try to get handle from Shopify Admin API
  try {
    const shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN");
    const storeDomain = "ryland-zer87.myshopify.com";
    const res = await fetch(
      `https://${storeDomain}/admin/api/2025-07/products/${productId}.json?fields=handle`,
      {
        headers: { "X-Shopify-Access-Token": shopifyToken! },
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.product.handle;
    }
  } catch (e) {
    console.error("Failed to fetch product handle:", e);
  }
  return String(productId);
}

interface GhlEmailParams {
  apiKey: string;
  locationId: string;
  email: string;
  customerName: string;
  orderNumber: string;
  downloadLinks: Array<{ title: string; url: string }>;
  libraryUrl: string;
}

async function sendGhlOrderEmail(params: GhlEmailParams) {
  const { apiKey, locationId, email, customerName, orderNumber, downloadLinks, libraryUrl } = params;

  const nameParts = customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Build download links text for custom fields
  const linksText = downloadLinks
    .map((l, i) => `${i + 1}. ${l.title}: ${l.url}`)
    .join("\n");

  // Create/update GHL contact with order info
  const contactPayload: Record<string, unknown> = {
    firstName,
    lastName,
    email,
    locationId,
    source: "Shopify Order",
    tags: ["customer", "ebook-purchase", `order-${orderNumber}`],
    customFields: [
      { key: "latest_order_number", field_value: orderNumber },
      { key: "latest_download_links", field_value: linksText },
      { key: "download_library_url", field_value: libraryUrl },
    ],
  };

  const ghlRes = await fetch("https://services.leadconnectorhq.com/contacts/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Version: "2021-07-28",
    },
    body: JSON.stringify(contactPayload),
  });

  const ghlData = await ghlRes.json();

  let contactId: string | null = null;
  if (!ghlRes.ok && ghlRes.status === 400 && ghlData?.meta?.contactId) {
    contactId = ghlData.meta.contactId;
    // Update existing contact with new order tags/fields
    await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        tags: ["customer", "ebook-purchase", `order-${orderNumber}`],
        customFields: contactPayload.customFields,
      }),
    });
  } else if (ghlRes.ok) {
    contactId = ghlData.contact?.id || ghlData.id;
  }

  console.log("GHL contact processed:", contactId);
  return contactId;
}
