import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Expected incoming payload from GHL webhook
 */
interface GHLWebhookPayload {
  // Contact info
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;

  // Address
  address?: string;
  city?: string;
  state?: string;
  zip?: string;

  // Business info
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  business_address?: string;
  business_city?: string;
  business_state?: string;
  business_zip?: string;
  ein?: string;
  duns?: string;
  website?: string;

  // Financial
  personal_income?: string | number;
  business_revenue?: string | number;
  monthly_deposits?: string | number;
  funding_goal?: string;

  // Credentials (optional)
  ssn?: string;
  mothers_maiden_name?: string;

  // GHL metadata
  contact_id?: string;
  location_id?: string;
  [key: string]: unknown;
}

function parseNumeric(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "number") {
    return value;
  }
  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
}

function parseDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // Try to parse the date - GHL may send various formats
  const date = new Date(value);
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString().split("T")[0]; // Return YYYY-MM-DD
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("INTAKE_WEBHOOK_SECRET");

    // Validate webhook secret if configured
    if (webhookSecret) {
      const providedSecret = req.headers.get("x-webhook-secret");
      if (!providedSecret) {
        return json({ success: false, error: "Missing webhook secret header" }, 401);
      }
      if (providedSecret !== webhookSecret) {
        return json({ success: false, error: "Invalid webhook secret" }, 401);
      }
    }

    // Create Supabase client with service role to bypass RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Parse JSON body
    const payload: GHLWebhookPayload = await req.json();

    // Validate required fields
    const fullName = payload.full_name?.trim() ||
      `${payload.first_name || ""} ${payload.last_name || ""}`.trim();

    if (!fullName) {
      return json(
        { success: false, error: "full_name or first_name/last_name is required" },
        400
      );
    }

    // Build home address JSONB
    const homeAddress = payload.address || payload.city || payload.state || payload.zip
      ? {
          street: payload.address || null,
          city: payload.city || null,
          state: payload.state || null,
          zip: payload.zip || null,
        }
      : undefined;

    // Build company address JSONB
    const companyAddress = payload.business_address || payload.business_city ||
      payload.business_state || payload.business_zip
      ? {
          street: payload.business_address || null,
          city: payload.business_city || null,
          state: payload.business_state || null,
          zip: payload.business_zip || null,
        }
      : undefined;

    // Prepare client record
    const clientData = {
      full_name: fullName,
      email: payload.email?.trim().toLowerCase() || null,
      phone: payload.phone?.trim() || null,
      dob: parseDate(payload.date_of_birth),
      ssn_encrypted: payload.ssn || null,
      mothers_maiden_name: payload.mothers_maiden_name || null,
      home_address: homeAddress || null,
      company_name: payload.company_name?.trim() || null,
      company_email: payload.company_email?.trim().toLowerCase() || null,
      company_phone: payload.company_phone?.trim() || null,
      company_address: companyAddress || null,
      ein: payload.ein?.trim() || null,
      duns: payload.duns?.trim() || null,
      website: payload.website?.trim() || null,
      personal_income: parseNumeric(payload.personal_income),
      business_revenue: parseNumeric(payload.business_revenue),
      monthly_deposits: parseNumeric(payload.monthly_deposits),
      funding_goal: payload.funding_goal?.trim() || null,
      current_stage: "Onboarding",
      stage_entered_at: new Date().toISOString(),
    };

    // Insert funding_clients record
    const { data: client, error: clientError } = await supabase
      .from("funding_clients")
      .insert(clientData)
      .select("id")
      .single();

    if (clientError) {
      console.error("Error creating funding client:", clientError);
      return json(
        { success: false, error: "Failed to create client record" },
        500
      );
    }

    const clientId = client.id;

    // Create initial activity log entry
    const { error: activityError } = await supabase
      .from("client_activity_log")
      .insert({
        client_id: clientId,
        action_type: "ClientCreated",
        details: {
          source: "ghl_webhook",
          contact_id: payload.contact_id || null,
          location_id: payload.location_id || null,
        },
      });

    if (activityError) {
      console.error("Error creating activity log:", activityError);
      // Don't fail the request for activity log errors
    }

    // Create bureau_status records for all 3 bureaus
    const bureaus = ["Experian", "Equifax", "TransUnion"];
    const bureauRecords = bureaus.map((bureau) => ({
      client_id: clientId,
      bureau,
      inquiry_count: 0,
      is_paused: false,
    }));

    const { error: bureauError } = await supabase
      .from("bureau_status")
      .insert(bureauRecords);

    if (bureauError) {
      console.error("Error creating bureau status records:", bureauError);
      // Don't fail the request for bureau status errors
    }

    console.log(`Client created via GHL webhook: ${clientId} (${fullName})`);

    return json(
      {
        success: true,
        client_id: clientId,
      },
      201
    );
  } catch (err) {
    console.error("Intake webhook error:", err);
    return json(
      { success: false, error: "Internal server error" },
      500
    );
  }
});
