import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { action, time_min, time_max } = body;

    // Get user's Google Calendar connection
    const { data: conn, error: connError } = await supabase
      .from("user_connections")
      .select("credentials")
      .eq("user_id", user.id)
      .eq("provider", "google_calendar")
      .single();

    if (connError || !conn) {
      throw new Error("Google Calendar not connected. Go to Settings → Connections to set it up.");
    }

    const creds = conn.credentials as Record<string, string>;
    let accessToken = creds.access_token;
    const tokenExpiry = creds.token_expiry;

    if (!accessToken) {
      throw new Error("Google Calendar not authorized. Please authorize on the Connections page.");
    }

    // Check if token is expired and refresh
    if (tokenExpiry && new Date(tokenExpiry) <= new Date()) {
      const refreshRes = await fetch(`${supabaseUrl}/functions/v1/google-calendar-auth`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({ action: "refresh_token" }),
      });

      const refreshData = await refreshRes.json();
      if (!refreshRes.ok) throw new Error(refreshData.error || "Failed to refresh token");
      accessToken = refreshData.access_token;
    }

    if (action === "fetch_events") {
      // Fetch events from Google Calendar
      const params = new URLSearchParams({
        timeMin: time_min || new Date().toISOString(),
        timeMax: time_max || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });

      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!gcalRes.ok) {
        const errData = await gcalRes.json();
        throw new Error(`Google Calendar API error: ${errData.error?.message || gcalRes.statusText}`);
      }

      const gcalData = await gcalRes.json();
      const googleEvents = gcalData.items || [];

      return new Response(JSON.stringify({ events: googleEvents, count: googleEvents.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "import_events") {
      // Fetch from Google Calendar
      const params = new URLSearchParams({
        timeMin: time_min || new Date().toISOString(),
        timeMax: time_max || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });

      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!gcalRes.ok) {
        const errData = await gcalRes.json();
        throw new Error(`Google Calendar API error: ${errData.error?.message || gcalRes.statusText}`);
      }

      const gcalData = await gcalRes.json();
      const googleEvents = gcalData.items || [];

      // Map Google events to our calendar_events format and upsert
      let imported = 0;
      for (const ge of googleEvents) {
        if (ge.status === "cancelled") continue;

        const isAllDay = !!ge.start?.date;
        const startTime = isAllDay
          ? new Date(ge.start.date + "T00:00:00").toISOString()
          : ge.start?.dateTime;
        const endTime = isAllDay
          ? new Date(ge.end.date + "T23:59:59").toISOString()
          : ge.end?.dateTime;

        if (!startTime || !endTime) continue;

        // Check if event already exists (by google_event_id in calendar_id field)
        const googleEventId = `gcal_${ge.id}`;

        const { data: existing } = await supabase
          .from("calendar_events")
          .select("id")
          .eq("user_id", user.id)
          .eq("calendar_id", googleEventId)
          .maybeSingle();

        const eventData = {
          user_id: user.id,
          title: ge.summary || "(No title)",
          description: ge.description || null,
          start_time: startTime,
          end_time: endTime,
          is_all_day: isAllDay,
          location: ge.location || null,
          color: "#4285F4", // Google blue
          calendar_id: googleEventId,
          meeting_link: ge.hangoutLink || null,
          attendees: ge.attendees
            ? ge.attendees.map((a: any) => ({ email: a.email, name: a.displayName, status: a.responseStatus }))
            : [],
        };

        if (existing) {
          await supabase
            .from("calendar_events")
            .update(eventData)
            .eq("id", existing.id);
        } else {
          await supabase
            .from("calendar_events")
            .insert(eventData);
        }
        imported++;
      }

      return new Response(JSON.stringify({ success: true, imported }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "push_event") {
      // Push a local event to Google Calendar
      const { event } = body;
      if (!event) throw new Error("Missing event data");

      const isAllDay = event.is_all_day;
      const gcalEvent: any = {
        summary: event.title,
        description: event.description || "",
        location: event.location || "",
        start: isAllDay
          ? { date: event.start_time.split("T")[0] }
          : { dateTime: event.start_time, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: isAllDay
          ? { date: event.end_time.split("T")[0] }
          : { dateTime: event.end_time, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      };

      const gcalRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gcalEvent),
        }
      );

      if (!gcalRes.ok) {
        const errData = await gcalRes.json();
        throw new Error(`Failed to push event: ${errData.error?.message || gcalRes.statusText}`);
      }

      const createdEvent = await gcalRes.json();

      // Update local event with Google Calendar ID
      if (event.id) {
        await supabase
          .from("calendar_events")
          .update({ calendar_id: `gcal_${createdEvent.id}` })
          .eq("id", event.id);
      }

      return new Response(JSON.stringify({ success: true, google_event_id: createdEvent.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (err) {
    console.error("google-calendar-sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
