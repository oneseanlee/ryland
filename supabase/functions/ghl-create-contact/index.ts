import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GHL_API_KEY");
    const locationId = Deno.env.get("GHL_LOCATION_ID");

    if (!apiKey || !locationId) {
      console.error("Missing GHL_API_KEY or GHL_LOCATION_ID");
      return json({ error: "Server configuration error" }, 500);
    }

    const { name, email, phone, businessName, tags, source, customFields, createOpportunity, opportunityName, monetaryValue, notes } = await req.json();

    if (notes !== undefined && notes !== null && (typeof notes !== "string" || notes.length > 5000)) {
      return json({ error: "Invalid notes" }, 400);
    }

    // Required field validation
    if (!name || !email) {
      return json({ error: "Name and email are required" }, 400);
    }

    // Input length validation
    if (typeof name !== "string" || name.length > 100) {
      return json({ error: "Invalid name" }, 400);
    }
    if (typeof email !== "string" || email.length > 255) {
      return json({ error: "Invalid email" }, 400);
    }
    if (phone && (typeof phone !== "string" || phone.length > 20)) {
      return json({ error: "Invalid phone" }, 400);
    }
    if (businessName && (typeof businessName !== "string" || businessName.length > 150)) {
      return json({ error: "Invalid business name" }, 400);
    }
    if (source && (typeof source !== "string" || source.length > 100)) {
      return json({ error: "Invalid source" }, 400);
    }

    // Custom fields validation
    if (customFields) {
      if (typeof customFields !== "object" || Array.isArray(customFields)) {
        return json({ error: "Invalid custom fields" }, 400);
      }
      const fieldCount = Object.keys(customFields).length;
      if (fieldCount > 20) {
        return json({ error: "Too many custom fields" }, 400);
      }
      for (const [key, value] of Object.entries(customFields)) {
        if (typeof key !== "string" || key.length > 50 || String(value).length > 500) {
          return json({ error: "Custom field too long" }, 400);
        }
      }
    }

    // Tags validation
    if (tags && (!Array.isArray(tags) || tags.length > 20 || tags.some((t: unknown) => typeof t !== "string" || (t as string).length > 50))) {
      return json({ error: "Invalid tags" }, 400);
    }

    // Split name into first/last
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Build contact payload for GHL v2 API
    const contactPayload: Record<string, unknown> = {
      firstName,
      lastName,
      email,
      locationId,
      source: source || "Funnel Lead Magnet",
      tags: tags || ["funnel-lead", "blueprint-download"],
    };

    if (phone) contactPayload.phone = phone;
    if (businessName) contactPayload.companyName = businessName;
    if (customFields) contactPayload.customFields = Object.entries(customFields).map(
      ([key, value]) => ({ key, field_value: value })
    );

    // Create contact using GHL v2 API
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

    if (!ghlRes.ok) {
      // Handle duplicate contact gracefully — extract existing contactId from meta
      if (ghlRes.status === 400 && ghlData?.meta?.contactId) {
        contactId = ghlData.meta.contactId;
        console.log("GHL duplicate contact, using existing:", contactId);
      } else {
        console.error("GHL API error:", ghlRes.status, JSON.stringify(ghlData));
        return json({ error: "Unable to process your request. Please try again." }, 500);
      }
    } else {
      contactId = ghlData.contact?.id || ghlData.id;
      console.log("GHL contact created:", contactId);
    }

    // Optionally create opportunity in the Funding pipeline at the New Lead stage
    let opportunityId: string | null = null;
    if (createOpportunity && contactId) {
      try {
        const pipelineId = Deno.env.get("GHL_FUNDING_PIPELINE_ID");
        if (!pipelineId) {
          console.warn("GHL_FUNDING_PIPELINE_ID not configured — skipping opportunity creation");
        } else {
          // Look up pipeline stages to find the "New Lead" stage (fallback to first stage)
          const pipeRes = await fetch(
            `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${locationId}`,
            { headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28" } }
          );
          const pipeData = await pipeRes.json();
          const pipelines = pipeData?.pipelines || [];
          const pipeline = pipelines.find((p: any) => p.id === pipelineId);
          let stageId: string | null = null;
          if (pipeline?.stages?.length) {
            const newLeadStage = pipeline.stages.find((s: any) =>
              /new\s*lead/i.test(s.name || "")
            );
            stageId = (newLeadStage || pipeline.stages[0]).id;
          }

          if (stageId) {
            const oppPayload: Record<string, unknown> = {
              pipelineId,
              locationId,
              name: opportunityName || `${name} — Partner Referral`,
              pipelineStageId: stageId,
              status: "open",
              contactId,
            };
            if (typeof monetaryValue === "number") oppPayload.monetaryValue = monetaryValue;

            const oppRes = await fetch("https://services.leadconnectorhq.com/opportunities/", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                Version: "2021-07-28",
              },
              body: JSON.stringify(oppPayload),
            });
            const oppData = await oppRes.json();
            if (oppRes.ok) {
              opportunityId = oppData?.opportunity?.id || oppData?.id || null;
              console.log("GHL opportunity created:", opportunityId);
            } else {
              console.error("GHL opportunity error:", oppRes.status, JSON.stringify(oppData));
            }
          } else {
            console.warn("No pipeline stages found for pipelineId:", pipelineId);
          }
        }
      } catch (oppErr) {
        console.error("GHL opportunity creation error (non-critical):", oppErr);
      }
    }

    return json({
      success: true,
      contactId,
      opportunityId,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
