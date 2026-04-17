import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

interface ReferralBody {
  fullName: string;
  email: string;
  phone: string;
  businessName?: string;
  fundingAmount: string;
  creditScore: string;
  affiliateRef?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase env vars");
      return json({ error: "Server configuration error" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let body: ReferralBody;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const { fullName, email, phone, businessName, fundingAmount, creditScore, affiliateRef } = body;

    // Basic validation
    if (
      !fullName || typeof fullName !== "string" || fullName.length > 100 ||
      !email || typeof email !== "string" || email.length > 255 ||
      !phone || typeof phone !== "string" || phone.length > 20 ||
      !fundingAmount || typeof fundingAmount !== "string" || fundingAmount.length > 50 ||
      !creditScore || typeof creditScore !== "string" || creditScore.length > 50
    ) {
      return json({ error: "Invalid input" }, 400);
    }
    if (businessName && (typeof businessName !== "string" || businessName.length > 150)) {
      return json({ error: "Invalid business name" }, 400);
    }
    if (affiliateRef && (typeof affiliateRef !== "string" || affiliateRef.length > 100)) {
      return json({ error: "Invalid affiliate ref" }, 400);
    }

    // Look up affiliate by public affiliate_id (e.g. "JSmith1")
    let affiliate: { id: string; full_name: string; affiliate_id: string } | null = null;
    if (affiliateRef) {
      const { data, error } = await supabase
        .from("affiliates")
        .select("id, full_name, affiliate_id")
        .eq("affiliate_id", affiliateRef)
        .maybeSingle();
      if (error) console.error("Affiliate lookup error:", error);
      affiliate = data ?? null;
    }

    // Insert into affiliate_leads if we found a real affiliate
    if (affiliate) {
      const { error: insertErr } = await supabase.from("affiliate_leads").insert({
        affiliate_id: affiliate.id,
        full_name: fullName,
        email,
        phone,
        company_name: businessName || null,
        pipeline_stage: "New Lead",
        status: "New Lead",
        notes: `Funding amount needed: ${fundingAmount}\nCredit score range: ${creditScore}`,
        latest_update: "Submitted via affiliate referral form",
      });
      if (insertErr) console.error("affiliate_leads insert error:", insertErr);
    } else if (affiliateRef) {
      console.warn("Affiliate ref provided but not found:", affiliateRef);
    }

    // Push to GoHighLevel
    const apiKey = Deno.env.get("GHL_API_KEY");
    const locationId = Deno.env.get("GHL_LOCATION_ID");
    const pipelineId = Deno.env.get("GHL_AFFILIATE_PIPELINE_ID"); // optional

    let ghlContactId: string | null = null;

    if (apiKey && locationId) {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const tags = ["affiliate-referral", "new-lead"];
      if (affiliate) {
        tags.push(`ref:${affiliate.affiliate_id}`);
        tags.push(`partner:${affiliate.full_name.replace(/\s+/g, "-").toLowerCase()}`);
      } else if (affiliateRef) {
        tags.push(`ref:${affiliateRef}`);
      }

      const customFields = [
        { key: "funding_amount_needed", field_value: fundingAmount },
        { key: "credit_score_range", field_value: creditScore },
      ];
      if (affiliate) {
        customFields.push({ key: "referring_affiliate", field_value: affiliate.full_name });
        customFields.push({ key: "referring_affiliate_id", field_value: affiliate.affiliate_id });
      }

      const contactPayload: Record<string, unknown> = {
        firstName,
        lastName,
        email,
        phone,
        locationId,
        source: "Affiliate Referral Form",
        tags,
        customFields,
      };
      if (businessName) contactPayload.companyName = businessName;

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

      if (!ghlRes.ok) {
        if (ghlRes.status === 400 && ghlData?.meta?.contactId) {
          ghlContactId = ghlData.meta.contactId;
          console.log("GHL duplicate contact, using existing:", ghlContactId);
          // Update tags on duplicate
          await fetch(`https://services.leadconnectorhq.com/contacts/${ghlContactId}/tags`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              Version: "2021-07-28",
            },
            body: JSON.stringify({ tags }),
          }).catch((e) => console.error("Tag update failed:", e));
        } else {
          console.error("GHL contact create failed:", ghlRes.status, JSON.stringify(ghlData));
        }
      } else {
        ghlContactId = ghlData.contact?.id || ghlData.id;
        console.log("GHL contact created:", ghlContactId);
      }

      // Create opportunity in Affiliate Referral Pipeline → New Lead stage
      if (ghlContactId && pipelineId) {
        const oppPayload: Record<string, unknown> = {
          pipelineId,
          locationId,
          name: `${fullName} — Affiliate Referral`,
          status: "open",
          contactId: ghlContactId,
          monetaryValue: 0,
          source: affiliate ? `Affiliate: ${affiliate.full_name}` : "Affiliate Referral",
        };

        const oppRes = await fetch("https://services.leadconnectorhq.com/opportunities/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Version: "2021-07-28",
          },
          body: JSON.stringify(oppPayload),
        });
        if (!oppRes.ok) {
          const oppErr = await oppRes.text();
          console.error("GHL opportunity create failed:", oppRes.status, oppErr);
        } else {
          const oppData = await oppRes.json();
          console.log("GHL opportunity created:", oppData?.opportunity?.id || oppData?.id);
        }
      } else if (ghlContactId && !pipelineId) {
        console.log("Skipping pipeline assignment — GHL_AFFILIATE_PIPELINE_ID not set");
      }
    } else {
      console.log("Skipping GHL sync — missing GHL_API_KEY or GHL_LOCATION_ID");
    }

    return json({
      success: true,
      ghlContactId,
      attributedTo: affiliate?.affiliate_id ?? null,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
