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

    const body = await req.json();
    const {
      first_name,
      last_name,
      name, // legacy fallback
      email,
      password,
      phone,
      business_name,
      referral_source,
      message,
    } = body ?? {};

    // Derive first/last from legacy `name` if provided
    let firstNameIn = typeof first_name === "string" ? first_name.trim() : "";
    let lastNameIn = typeof last_name === "string" ? last_name.trim() : "";
    if ((!firstNameIn || !lastNameIn) && typeof name === "string") {
      const parts = name.trim().split(/\s+/);
      firstNameIn = firstNameIn || parts[0] || "";
      lastNameIn = lastNameIn || parts.slice(1).join(" ") || "";
    }

    // Validation
    if (!firstNameIn || !lastNameIn) {
      return json({ error: "First and last name are required" }, 400);
    }
    if (firstNameIn.length > 50 || lastNameIn.length > 50) {
      return json({ error: "Name is too long" }, 400);
    }
    if (!email || typeof email !== "string" || email.length > 255) {
      return json({ error: "Invalid email" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 8 || password.length > 72) {
      return json({ error: "Password must be between 8 and 72 characters" }, 400);
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = `${firstNameIn} ${lastNameIn}`.trim();

    // Check if email already exists in affiliates
    const { data: existingAffiliate } = await supabase
      .from("affiliates")
      .select("id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (existingAffiliate) {
      return json({ error: "An account with this email already exists. Please log in at the partner portal." }, 409);
    }

    // Generate affiliate ID: FirstInitialLastName1, increment if duplicate
    const baseId = (firstNameIn.charAt(0) + lastNameIn.replace(/\s+/g, "")).replace(/[^a-zA-Z]/g, "");

    let affiliateId = `${baseId}1`;
    let counter = 1;

    const { data: existingIds } = await supabase
      .from("affiliates")
      .select("affiliate_id")
      .ilike("affiliate_id", `${baseId}%`);

    if (existingIds && existingIds.length > 0) {
      const usedNumbers = existingIds
        .map((r) => {
          const match = r.affiliate_id.match(new RegExp(`^${baseId}(\\d+)$`, "i"));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => n > 0);

      if (usedNumbers.length > 0) {
        counter = Math.max(...usedNumbers) + 1;
      }
      affiliateId = `${baseId}${counter}`;
    }

    // Create auth user with user-chosen password, email confirmed
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedName,
        first_name: firstNameIn,
        last_name: lastNameIn,
      },
    });

    if (authError) {
      console.error("Auth user creation error:", authError);
      if (authError.message?.includes("already been registered")) {
        return json({ error: "An account with this email already exists. Please log in at the partner portal." }, 409);
      }
      return json({ error: "Failed to create account. Please try again." }, 500);
    }

    const userId = authData.user.id;

    // Insert affiliates record
    const { error: affiliateError } = await supabase.from("affiliates").insert({
      user_id: userId,
      affiliate_id: affiliateId,
      full_name: trimmedName,
      email: trimmedEmail,
      phone: phone || null,
      company_name: business_name || null,
      status: "pending",
    });

    if (affiliateError) {
      console.error("Affiliate insert error:", affiliateError);
      await supabase.auth.admin.deleteUser(userId);
      return json({ error: "Failed to create partner record. Please try again." }, 500);
    }

    // ── Non-critical background tasks ──
    const backgroundTasks = async () => {
      let ghlContactId: string | null = null;

      try {
        const ghlApiKey = Deno.env.get("GHL_API_KEY");
        const ghlLocationId = Deno.env.get("GHL_LOCATION_ID");

        if (ghlApiKey && ghlLocationId) {
          const ghlPayload: Record<string, unknown> = {
            firstName: firstNameIn,
            lastName: lastNameIn,
            email: trimmedEmail,
            locationId: ghlLocationId,
            source: "Partner Signup Form",
            tags: ["partner-signup", "referral-partner"],
          };

          if (phone) ghlPayload.phone = phone;
          if (business_name) ghlPayload.companyName = business_name;

          const ghlRes = await fetch("https://services.leadconnectorhq.com/contacts/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ghlApiKey}`,
              "Content-Type": "application/json",
              Version: "2021-07-28",
            },
            body: JSON.stringify(ghlPayload),
          });

          const ghlData = await ghlRes.json();

          if (!ghlRes.ok && ghlRes.status === 400 && ghlData?.meta?.contactId) {
            ghlContactId = ghlData.meta.contactId;
          } else if (ghlRes.ok) {
            ghlContactId = ghlData.contact?.id || ghlData.id;
          }
        }
      } catch (ghlErr) {
        console.error("GHL sync error (non-critical):", ghlErr);
      }

      await supabase.from("partner_submissions").insert({
        name: trimmedName,
        email: trimmedEmail,
        phone: phone || null,
        business_name: business_name || null,
        referral_source: referral_source || null,
        message: message || null,
        ghl_contact_id: ghlContactId,
      });

      // Send internal notification email to info@rylandpartners.com
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "partner-signup-notification",
            idempotencyKey: `partner-signup-${affiliateId}`,
            templateData: {
              partnerName: trimmedName,
              affiliateId,
              email: trimmedEmail,
              phone: phone || "",
              businessName: business_name || "",
              referralSource: referral_source || "",
              message: message || "",
            },
          },
        });
      } catch (notifyErr) {
        console.error("Partner signup notification email error (non-critical):", notifyErr);
      }
    };

    backgroundTasks().catch((err) => console.error("Background task error:", err));

    return json({ success: true, affiliateId });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
