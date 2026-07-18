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

// In-memory per-IP rate limiter (best-effort; resets on cold start).
// Combined with verify_jwt=true this prevents unauthenticated bulk PII submissions.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;
const rlBuckets = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (rlBuckets.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (arr.length >= RATE_LIMIT_MAX) {
    rlBuckets.set(ip, arr);
    return true;
  }
  arr.push(now);
  rlBuckets.set(ip, arr);
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get("SCOREXER_ZAPIER_WEBHOOK_URL");
    if (!webhookUrl) {
      console.error("Missing SCOREXER_ZAPIER_WEBHOOK_URL");
      return json({ error: "Server configuration error" }, 500);
    }

    // Rate limit by client IP (from Supabase gateway forwarded headers)
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "unknown";
    if (rateLimited(ip)) {
      console.warn("scorexer-intake rate limited", { ip });
      return json({ error: "Too many requests. Please try again later." }, 429);
    }

    const body = await req.json();
    const {
      firstName, middleName, lastName, email, phone, dob,
      ssn, creditMonitoring, street, city, state, zip,
    } = body;

    // Server-side validation
    if (!firstName || typeof firstName !== "string" || firstName.length > 50) {
      return json({ error: "Invalid first name" }, 400);
    }
    if (!lastName || typeof lastName !== "string" || lastName.length > 50) {
      return json({ error: "Invalid last name" }, 400);
    }
    if (!email || typeof email !== "string" || !email.includes("@") || email.length > 255) {
      return json({ error: "Invalid email" }, 400);
    }
    if (!phone || typeof phone !== "string" || phone.length > 20) {
      return json({ error: "Invalid phone" }, 400);
    }
    if (!dob || typeof dob !== "string") {
      return json({ error: "Invalid date of birth" }, 400);
    }
    if (!ssn || typeof ssn !== "string" || ssn.replace(/[^0-9]/g, "").length !== 9) {
      return json({ error: "Invalid SSN" }, 400);
    }
    if (!creditMonitoring || typeof creditMonitoring !== "string") {
      return json({ error: "Invalid credit monitoring selection" }, 400);
    }
    if (!street || typeof street !== "string" || street.length > 200) {
      return json({ error: "Invalid street address" }, 400);
    }
    if (!city || typeof city !== "string" || city.length > 100) {
      return json({ error: "Invalid city" }, 400);
    }
    if (!state || typeof state !== "string" || state.length > 5) {
      return json({ error: "Invalid state" }, 400);
    }
    if (!zip || typeof zip !== "string" || zip.length > 10) {
      return json({ error: "Invalid ZIP code" }, 400);
    }

    const ssnClean = ssn.replace(/[^0-9]/g, "");
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

    // 1. Send to Zapier webhook → Scorexer
    const zapierPayload = {
      firstName,
      middleName: middleName || "",
      lastName,
      fullName,
      email,
      phone,
      dateOfBirth: dob,
      ssn: ssnClean,
      creditMonitoringService: creditMonitoring,
      street,
      city,
      state,
      zip,
      submittedAt: new Date().toISOString(),
      source: "Ryland Partners Client Intake",
    };

    console.log("Sending to Zapier webhook (SSN redacted):", {
      ...zapierPayload,
      ssn: "***-**-" + ssnClean.slice(-4),
    });

    const zapierRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(zapierPayload),
    });

    if (!zapierRes.ok) {
      const errText = await zapierRes.text();
      console.error("Zapier webhook failed:", zapierRes.status, errText);
      return json({ error: "Failed to submit intake. Please try again." }, 500);
    }

    // Consume response body
    await zapierRes.text();
    console.log("Zapier webhook success");

    // 2. Sync to GHL as contact update (fire-and-forget, no SSN sent)
    try {
      const ghlApiKey = Deno.env.get("GHL_API_KEY");
      const ghlLocationId = Deno.env.get("GHL_LOCATION_ID");

      if (ghlApiKey && ghlLocationId) {
        const ghlPayload = {
          firstName,
          lastName,
          email,
          phone,
          locationId: ghlLocationId,
          source: "Credit Intake Form",
          tags: ["credit-intake-complete", `cm-${creditMonitoring}`],
          address1: street,
          city,
          state,
          postalCode: zip,
          dateOfBirth: dob,
        };

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
        if (!ghlRes.ok && ghlRes.status !== 400) {
          console.error("GHL sync failed:", ghlRes.status, JSON.stringify(ghlData));
        } else {
          console.log("GHL contact synced:", ghlData?.contact?.id || ghlData?.meta?.contactId || "ok");
        }
      }
    } catch (ghlErr) {
      console.error("GHL sync error (non-blocking):", ghlErr);
    }

    return json({ success: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
