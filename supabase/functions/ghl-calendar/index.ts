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

  const apiKey = Deno.env.get("GHL_API_KEY");
  const locationId = Deno.env.get("GHL_LOCATION_ID");

  // Support multiple calendars via calendarType
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const calendarType = body.calendarType as string | undefined;
  const isPartner = calendarType === "partner";
  const isAffiliate = calendarType === "affiliate";
  const calendarId = isAffiliate
    ? (Deno.env.get("GHL_AFFILIATE_CALENDAR_ID") || Deno.env.get("GHL_PARTNER_CALENDAR_ID"))
    : isPartner
      ? Deno.env.get("GHL_PARTNER_CALENDAR_ID")
      : Deno.env.get("GHL_CALENDAR_ID");

  if (!apiKey || !locationId || !calendarId) {
    console.error("Missing GHL env vars:", {
      hasApiKey: !!apiKey,
      hasLocationId: !!locationId,
      hasCalendarId: !!calendarId,
      calendarType: calendarType ?? "consultation (default)",
    });
    return json({ error: "Server configuration error" }, 500);
  }

  const ghlHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Version: "2021-04-15",
  };

  try {
    // body already parsed above for calendarType
    const { action } = body;

    // ── GET FREE SLOTS ──
    if (action === "get-slots") {
      const { startDate, endDate, timezone } = body;
      if (!startDate || !endDate || !timezone) {
        return json({ error: "startDate, endDate, and timezone are required" }, 400);
      }

      // Input length validation
      if (String(startDate).length > 30 || String(endDate).length > 30 || String(timezone).length > 50) {
        return json({ error: "Invalid input" }, 400);
      }

      const url = new URL(
        `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots`
      );
      // GHL expects millisecond timestamps (per API docs example: 1548898600000)
      url.searchParams.set("startDate", String(startDate as number));
      url.searchParams.set("endDate", String(endDate as number));
      url.searchParams.set("timezone", String(timezone));

      // userId is optional but required for round-robin / collective calendar types.
      // Only attach it for partner/affiliate calendars — the consultation calendar
      // ("Free Business Credit Consultation") uses its own team assignments, and
      // filtering by a userId that isn't on that calendar returns zero slots.
      const userId = Deno.env.get("GHL_USER_ID");
      if (userId && (isPartner || isAffiliate)) {
        url.searchParams.set("userId", userId);
      }

      console.log("GHL free-slots request:", {
        calendarId,
        calendarType: calendarType || "consultation",
        startDate,
        endDate,
        timezone,
        userId: userId || "(not set)",
        url: url.toString(),
      });

      const res = await fetch(url.toString(), { headers: ghlHeaders });
      const data = await res.json();

      if (!res.ok) {
        console.error("GHL free-slots error:", {
          status: res.status,
          body: JSON.stringify(data),
        });
        return json({ error: "Unable to fetch available slots. Please try again." }, 500);
      }

      // GHL response contains date-keyed slot objects + a traceId field
      // Strip traceId before returning to keep the response clean for the frontend
      const { traceId, ...slotsByDate } = data as Record<string, unknown>;

      const dateKeys = Object.keys(slotsByDate);
      const totalSlots = dateKeys.reduce((sum, key) => {
        const entry = slotsByDate[key] as { slots?: string[] } | undefined;
        return sum + (entry?.slots?.length ?? 0);
      }, 0);

      console.log("GHL free-slots response:", {
        traceId,
        datesWithSlots: dateKeys.length,
        totalSlots,
        sampleDates: dateKeys.slice(0, 3),
      });

      // If GHL returned zero slot dates, log a diagnostic warning
      if (dateKeys.length === 0) {
        console.warn(
          "GHL returned NO free slots. Check GHL dashboard: " +
          "1) Calendar has a team member assigned, " +
          "2) Availability hours are configured, " +
          "3) No external calendar is blocking all slots, " +
          "4) Slot capacity is not exhausted. " +
          `CalendarId: ${calendarId}, Range: ${new Date(startDate as number).toISOString()} – ${new Date(endDate as number).toISOString()}`
        );
      }

      return json(slotsByDate);
    }

    // ── BOOK APPOINTMENT ──
    if (action === "book") {
      const { name, email, phone, notes, startTime, endTime, timezone } = body;

      if (!name || !email || !startTime || !endTime) {
        return json({ error: "name, email, startTime, endTime are required" }, 400);
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
      if (notes && (typeof notes !== "string" || notes.length > 1000)) {
        return json({ error: "Notes too long" }, 400);
      }
      if (String(startTime).length > 30 || String(endTime).length > 30) {
        return json({ error: "Invalid time format" }, 400);
      }
      if (timezone && (typeof timezone !== "string" || timezone.length > 50)) {
        return json({ error: "Invalid timezone" }, 400);
      }

      // Step 1: Create/upsert contact
      const nameParts = (name as string).trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const contactPayload: Record<string, unknown> = {
        firstName,
        lastName,
        email,
        locationId,
        source: isAffiliate ? "Affiliate Referral Booking" : isPartner ? "Partner Onboarding" : "Consultation Booking",
        tags: isAffiliate
          ? ["affiliate-referral", "affiliate-appointment-scheduled"]
          : isPartner
            ? ["partner-onboarding", "referral-partner"]
            : ["consultation-booking", "funnel-lead"],
      };
      if (phone) contactPayload.phone = phone;

      const contactRes = await fetch("https://services.leadconnectorhq.com/contacts/", {
        method: "POST",
        headers: { ...ghlHeaders, Version: "2021-07-28" },
        body: JSON.stringify(contactPayload),
      });
      const contactData = await contactRes.json();

      let contactId: string | undefined;

      if (!contactRes.ok) {
        // Handle duplicate contact error by extracting existing contactId
        if (contactData?.statusCode === 400 && contactData?.meta?.contactId) {
          contactId = contactData.meta.contactId;
          console.log("Duplicate contact found, using existing:", contactId);
        } else {
          console.error("GHL contact error:", JSON.stringify(contactData));
          return json({ error: "Unable to process your request. Please try again." }, 500);
        }
      } else {
        contactId = contactData.contact?.id || contactData.id;
        console.log("Contact created:", contactId);
      }

      // Step 2: Create appointment
      const appointmentPayload: Record<string, unknown> = {
        calendarId,
        locationId,
        contactId,
        startTime,
        endTime,
        title: `Strategy Session — ${name}`,
        appointmentStatus: "new",
        selectedTimezone: timezone || "America/New_York",
      };
      if (notes) appointmentPayload.notes = notes;

      const apptRes = await fetch(
        "https://services.leadconnectorhq.com/calendars/events/appointments",
        {
          method: "POST",
          headers: ghlHeaders,
          body: JSON.stringify(appointmentPayload),
        }
      );
      const apptData = await apptRes.json();

      if (!apptRes.ok) {
        console.error("GHL appointment error:", JSON.stringify(apptData));
        return json({ error: "Unable to book appointment. Please try again." }, 500);
      }

      console.log("Appointment booked:", apptData.id);
      return json({ success: true, appointmentId: apptData.id });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
