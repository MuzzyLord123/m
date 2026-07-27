import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { action, site_id, date, service_name, start_time, duration_minutes, customer_name, customer_email, customer_phone, notes, visitor_id } = await req.json();

    if (!site_id) throw new Error("site_id is required");

    // Get business settings
    const { data: settings } = await supabaseAdmin
      .from("site_business_settings")
      .select("*")
      .eq("site_id", site_id)
      .maybeSingle();

    if (action === "get-slots") {
      if (!date) throw new Error("date is required");
      
      const slotDuration = settings?.booking_slot_duration || 60;
      const startHour = settings?.booking_start_time || "09:00:00";
      const endHour = settings?.booking_end_time || "17:00:00";
      const bookingDays = settings?.booking_days || ["monday", "tuesday", "wednesday", "thursday", "friday"];

      // Check if the requested day is a booking day
      const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      if (!bookingDays.includes(dayName)) {
        return new Response(JSON.stringify({ slots: [], message: "Not available on this day" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get existing bookings for this date
      const { data: existingBookings } = await supabaseAdmin
        .from("site_bookings")
        .select("start_time, end_time, duration_minutes")
        .eq("site_id", site_id)
        .eq("booking_date", date)
        .neq("status", "cancelled");

      // Generate available slots
      const [startH, startM] = startHour.split(":").map(Number);
      const [endH, endM] = endHour.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const slots: string[] = [];

      for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeStr = `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        
        // Check if slot is taken
        const isTaken = existingBookings?.some((b: any) => b.start_time === timeStr + ":00");
        if (!isTaken) slots.push(timeStr);
      }

      return new Response(JSON.stringify({ slots, slot_duration: slotDuration }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      if (!date || !start_time || !service_name) throw new Error("date, start_time, and service_name required");

      // Get the site owner
      const { data: site } = await supabaseAdmin
        .from("designer_sites")
        .select("user_id")
        .eq("id", site_id)
        .single();
      
      if (!site) throw new Error("Site not found");

      const dur = duration_minutes || settings?.booking_slot_duration || 60;
      const [h, m] = start_time.split(":").map(Number);
      const endMin = h * 60 + m + dur;
      const endTime = `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;

      const { data: booking, error } = await supabaseAdmin
        .from("site_bookings")
        .insert({
          site_id,
          user_id: site.user_id,
          visitor_id: visitor_id || null,
          service_name,
          booking_date: date,
          start_time: start_time + ":00",
          end_time: endTime + ":00",
          duration_minutes: dur,
          status: "pending",
          customer_name,
          customer_email,
          customer_phone,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ booking }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("[site-booking] ERROR:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
