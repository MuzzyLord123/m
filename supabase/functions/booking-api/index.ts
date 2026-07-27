import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    const { action } = body;

    // ── API Key Authentication ────────────────────────────
    const apiKey = req.headers.get("x-api-key") || body.api_key;
    let authenticatedUserId: string | null = null;

    if (apiKey) {
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = new Uint8Array(hashBuffer);
      const keyHash = Array.from(hashArray).map(b => b.toString(16).padStart(2, "0")).join("");
      const keyPrefix = apiKey.substring(0, 8);

      const { data: keyRecord } = await supabase
        .from("api_keys")
        .select("user_id, is_active, expires_at, permissions")
        .eq("key_hash", keyHash)
        .eq("key_prefix", keyPrefix)
        .maybeSingle();

      if (!keyRecord) return json({ error: "Invalid API key" }, 401);
      if (!keyRecord.is_active) return json({ error: "API key is deactivated" }, 401);
      if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) return json({ error: "API key has expired" }, 401);

      const perms = keyRecord.permissions as any;
      if (perms && perms.booking === false) return json({ error: "API key does not have booking permission" }, 403);

      authenticatedUserId = keyRecord.user_id;
      await supabase
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString(), usage_count: (keyRecord as any).usage_count ? (keyRecord as any).usage_count + 1 : 1 })
        .eq("key_hash", keyHash);
    }

    if (authenticatedUserId && !body.user_id && !body.slug) {
      body.user_id = authenticatedUserId;
    }

    switch (action) {
      case "get-services": return await getServices(supabase, body);
      case "get-staff": return await getStaff(supabase, body);
      case "get-availability": return await getAvailability(supabase, body);
      case "get-slots": return await getSlots(supabase, body);
      case "create-booking": return await createBooking(supabase, body);
      case "cancel-booking": return await cancelBooking(supabase, body);
      case "reschedule-booking": return await rescheduleBooking(supabase, body);
      case "get-settings": return await getSettings(supabase, body);
      // ── NEW: Multi-mode actions ──
      case "submit-enquiry": return await submitEnquiry(supabase, body);
      case "book-table": return await bookTable(supabase, body);
      case "place-order": return await placeOrder(supabase, body);
      case "contact-form": return await handleContactForm(supabase, body);
      default: throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("[booking-api] ERROR:", error);
    return json({ error: (error as Error).message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

// ── Get Services ──────────────────────────────────────────
async function getServices(supabase: any, { user_id, slug }: any) {
  let query = supabase
    .from("booking_services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (user_id) {
    query = query.eq("user_id", user_id);
  } else if (slug) {
    const settings = await getSettingsBySlug(supabase, slug);
    if (!settings) throw new Error("Business not found");
    query = query.eq("user_id", settings.user_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return json({ services: data });
}

// ── Get Staff ─────────────────────────────────────────────
async function getStaff(supabase: any, { user_id, service_id, slug }: any) {
  let ownerUserId = user_id;
  if (!ownerUserId && slug) {
    const settings = await getSettingsBySlug(supabase, slug);
    if (!settings) throw new Error("Business not found");
    ownerUserId = settings.user_id;
  }

  const { data, error } = await supabase
    .from("booking_staff")
    .select("*, booking_staff_services(service_id)")
    .eq("user_id", ownerUserId)
    .eq("is_active", true);
  if (error) throw error;

  let staff = data || [];
  if (service_id) {
    staff = staff.filter((s: any) =>
      s.booking_staff_services?.some((ss: any) => ss.service_id === service_id)
    );
  }

  return json({ staff });
}

// ── Get Availability ──────────────────────────────────────
async function getAvailability(supabase: any, { user_id, staff_id }: any) {
  let query = supabase
    .from("booking_availability")
    .select("*")
    .eq("user_id", user_id)
    .eq("is_active", true)
    .order("day_of_week");

  if (staff_id) query = query.eq("staff_id", staff_id);

  const { data, error } = await query;
  if (error) throw error;
  return json({ availability: data });
}

// ── Get Available Slots ───────────────────────────────────
async function getSlots(supabase: any, { user_id, slug, date, service_id, staff_id }: any) {
  if (!date) throw new Error("date is required");

  let ownerUserId = user_id;
  if (!ownerUserId && slug) {
    const settings = await getSettingsBySlug(supabase, slug);
    if (!settings) throw new Error("Business not found");
    ownerUserId = settings.user_id;
  }
  if (!ownerUserId) throw new Error("user_id or slug required");

  const { data: settings } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("user_id", ownerUserId)
    .maybeSingle();

  let duration = 60;
  let bufferMinutes = 0;
  if (service_id) {
    const { data: service } = await supabase
      .from("booking_services")
      .select("duration_minutes, buffer_minutes")
      .eq("id", service_id)
      .single();
    if (service) {
      duration = service.duration_minutes;
      bufferMinutes = service.buffer_minutes || 0;
    }
  }

  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getDay();

  let availQuery = supabase
    .from("booking_availability")
    .select("*")
    .eq("user_id", ownerUserId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  if (staff_id) availQuery = availQuery.eq("staff_id", staff_id);

  const { data: availSlots } = await availQuery;
  if (!availSlots || availSlots.length === 0) {
    return json({ slots: [], message: "Not available on this day" });
  }

  let blockedQuery = supabase
    .from("booking_blocked_dates")
    .select("id")
    .eq("user_id", ownerUserId)
    .eq("blocked_date", date);
  if (staff_id) blockedQuery = blockedQuery.eq("staff_id", staff_id);

  const { data: blocked } = await blockedQuery;
  if (blocked && blocked.length > 0) {
    return json({ slots: [], message: "This date is blocked" });
  }

  let bookingsQuery = supabase
    .from("bookings")
    .select("start_time, end_time, duration_minutes")
    .eq("user_id", ownerUserId)
    .eq("booking_date", date)
    .neq("status", "cancelled");
  if (staff_id) bookingsQuery = bookingsQuery.eq("staff_id", staff_id);

  const { data: existingBookings } = await bookingsQuery;

  const now = new Date();
  const bookingNoticeMs = (settings?.booking_notice_hours || 1) * 3600000;
  const maxAdvanceDays = settings?.max_advance_days || 90;
  const maxDate = new Date(now.getTime() + maxAdvanceDays * 86400000);

  if (dateObj > maxDate) {
    return json({ slots: [], message: "Too far in advance" });
  }

  const slots: string[] = [];
  for (const avail of availSlots) {
    const [startH, startM] = avail.start_time.split(":").map(Number);
    const [endH, endM] = avail.end_time.split(":").map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    for (let m = startMins; m + duration <= endMins; m += duration + bufferMinutes) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      const slotEnd = m + duration;

      const isToday = date === now.toISOString().split("T")[0];
      if (isToday) {
        const slotDateTime = new Date(date + `T${timeStr}:00`);
        if (slotDateTime.getTime() < now.getTime() + bookingNoticeMs) continue;
      }

      const hasConflict = existingBookings?.some((b: any) => {
        const [bStartH, bStartM] = b.start_time.split(":").map(Number);
        const [bEndH, bEndM] = b.end_time.split(":").map(Number);
        const bStart = bStartH * 60 + bStartM;
        const bEnd = bEndH * 60 + bEndM;
        return m < bEnd && slotEnd > bStart;
      });

      if (!hasConflict) slots.push(timeStr);
    }
  }

  return json({ slots, duration });
}

// ── Create Booking (Appointment) ──────────────────────────
async function createBooking(supabase: any, body: any) {
  const { user_id, slug, service_id, staff_id, date, start_time, customer_name, customer_email, customer_phone, notes, source, site_id, booking_type } = body;

  if (!date || !start_time) throw new Error("date and start_time required");

  let ownerUserId = user_id;
  if (!ownerUserId && slug) {
    const settings = await getSettingsBySlug(supabase, slug);
    if (!settings) throw new Error("Business not found");
    ownerUserId = settings.user_id;
  }
  if (!ownerUserId) throw new Error("user_id or slug required");

  let duration = 60;
  let price = 0;
  let currency = "GBP";
  let serviceName = "General Booking";

  if (service_id) {
    const { data: service } = await supabase
      .from("booking_services")
      .select("*")
      .eq("id", service_id)
      .single();
    if (service) {
      duration = service.duration_minutes;
      price = service.price || 0;
      currency = service.currency || "GBP";
      serviceName = service.name;
    }
  }

  const [h, m] = start_time.split(":").map(Number);
  const endMin = h * 60 + m + duration;
  const endTime = `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;

  const { data: settings } = await supabase
    .from("booking_settings")
    .select("auto_confirm")
    .eq("user_id", ownerUserId)
    .maybeSingle();

  const status = settings?.auto_confirm !== false ? "confirmed" : "pending";

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: ownerUserId,
      service_id: service_id || null,
      staff_id: staff_id || null,
      site_id: site_id || null,
      booking_date: date,
      start_time: start_time + ":00",
      end_time: endTime + ":00",
      duration_minutes: duration,
      status,
      source: source || "embed",
      customer_name,
      customer_email,
      customer_phone,
      notes,
      price,
      currency,
      confirmation_sent: true,
      metadata: { booking_type: booking_type || "appointment" },
    })
    .select("*, booking_services(name, color), booking_staff(name)")
    .single();

  if (error) throw error;

  // Create CRM lead
  if (customer_email) {
    await upsertLead(supabase, ownerUserId, customer_name, customer_email, customer_phone, `Booked: ${serviceName} on ${date} at ${start_time}`, "booking_appointment");
  }

  return json({ booking, status });
}

// ── Submit Enquiry ────────────────────────────────────────
async function submitEnquiry(supabase: any, body: any) {
  const { slug, customer_name, customer_email, customer_phone, message, subject, source, company } = body;

  if (!customer_name || !customer_email) throw new Error("customer_name and customer_email are required");

  const settings = await getSettingsBySlug(supabase, slug);
  if (!settings) throw new Error("Business not found");
  const ownerUserId = settings.user_id;

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: ownerUserId,
      booking_date: today,
      start_time: timeStr + ":00",
      end_time: timeStr + ":00",
      duration_minutes: 0,
      status: "pending",
      source: source || "embed",
      customer_name,
      customer_email,
      customer_phone: customer_phone || null,
      notes: message || null,
      price: 0,
      currency: "GBP",
      metadata: {
        booking_type: "enquiry",
        subject: subject || null,
        company: company || null,
        submitted_at: now.toISOString(),
      },
    })
    .select()
    .single();

  if (error) throw error;

  await upsertLead(supabase, ownerUserId, customer_name, customer_email, customer_phone, `Enquiry: ${subject || message?.slice(0, 50) || "General"}`, "enquiry");

  return json({ success: true, enquiry: booking });
}

// ── Book Table (Restaurant) ───────────────────────────────
async function bookTable(supabase: any, body: any) {
  const { slug, customer_name, customer_email, customer_phone, date, time, party_size, notes, source, special_requests } = body;

  if (!customer_name || !date || !time || !party_size) throw new Error("customer_name, date, time, and party_size are required");

  const settings = await getSettingsBySlug(supabase, slug);
  if (!settings) throw new Error("Business not found");
  const ownerUserId = settings.user_id;

  const durationMin = 90; // Default table booking duration
  const [h, m] = time.split(":").map(Number);
  const endMin = h * 60 + m + durationMin;
  const endTime = `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;

  const autoConfirm = (await supabase.from("booking_settings").select("auto_confirm").eq("user_id", ownerUserId).maybeSingle())?.data?.auto_confirm;
  const status = autoConfirm !== false ? "confirmed" : "pending";

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: ownerUserId,
      booking_date: date,
      start_time: time + ":00",
      end_time: endTime + ":00",
      duration_minutes: durationMin,
      status,
      source: source || "embed",
      customer_name,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      notes: notes || null,
      price: 0,
      currency: "GBP",
      metadata: {
        booking_type: "table",
        party_size: parseInt(party_size),
        special_requests: special_requests || null,
      },
    })
    .select()
    .single();

  if (error) throw error;

  if (customer_email) {
    await upsertLead(supabase, ownerUserId, customer_name, customer_email, customer_phone, `Table for ${party_size} on ${date} at ${time}`, "table_booking");
  }

  return json({ success: true, booking, status });
}

// ── Place Order ───────────────────────────────────────────
async function placeOrder(supabase: any, body: any) {
  const { slug, customer_name, customer_email, customer_phone, items, notes, source, delivery_address, order_type } = body;

  if (!customer_name || !items || items.length === 0) throw new Error("customer_name and items are required");

  const settings = await getSettingsBySlug(supabase, slug);
  if (!settings) throw new Error("Business not found");
  const ownerUserId = settings.user_id;

  const totalPrice = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: ownerUserId,
      booking_date: today,
      start_time: timeStr + ":00",
      end_time: timeStr + ":00",
      duration_minutes: 0,
      status: "pending",
      source: source || "embed",
      customer_name,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      notes: notes || null,
      price: totalPrice,
      currency: "GBP",
      metadata: {
        booking_type: "order",
        items,
        order_type: order_type || "collection",
        delivery_address: delivery_address || null,
        ordered_at: now.toISOString(),
      },
    })
    .select()
    .single();

  if (error) throw error;

  if (customer_email) {
    await upsertLead(supabase, ownerUserId, customer_name, customer_email, customer_phone, `Order: ${items.length} items (£${totalPrice.toFixed(2)})`, "order");
  }

  return json({ success: true, order: booking });
}

// ── Handle Contact Form ───────────────────────────────────
async function handleContactForm(supabase: any, body: any) {
  const { slug, name, email, phone, message, company, subject } = body;

  if (!name || !email) throw new Error("name and email are required");

  // Try to resolve business owner from slug or just create a lead
  let ownerUserId: string | null = null;
  if (slug) {
    const settings = await getSettingsBySlug(supabase, slug);
    if (settings) ownerUserId = settings.user_id;
  }

  if (!ownerUserId) {
    // Fallback: find first admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    ownerUserId = adminRole?.user_id;
  }

  if (!ownerUserId) throw new Error("Could not resolve business owner");

  // Create as enquiry
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: ownerUserId,
      booking_date: today,
      start_time: timeStr + ":00",
      end_time: timeStr + ":00",
      duration_minutes: 0,
      status: "pending",
      source: "contact_form",
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      notes: message || null,
      price: 0,
      currency: "GBP",
      metadata: {
        booking_type: "enquiry",
        subject: subject || "Contact Form",
        company: company || null,
        submitted_at: now.toISOString(),
      },
    })
    .select()
    .single();

  if (error) throw error;

  await upsertLead(supabase, ownerUserId, name, email, phone, `Contact: ${subject || message?.slice(0, 50) || "General"}`, "contact_form");

  return json({ success: true });
}

// ── Cancel Booking ────────────────────────────────────────
async function cancelBooking(supabase: any, { booking_id, reason }: any) {
  if (!booking_id) throw new Error("booking_id required");

  const { data, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason || null,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", booking_id)
    .select()
    .single();

  if (error) throw error;
  return json({ booking: data });
}

// ── Reschedule Booking ────────────────────────────────────
async function rescheduleBooking(supabase: any, body: any) {
  const { booking_id, new_date, new_start_time } = body;
  if (!booking_id || !new_date || !new_start_time) throw new Error("booking_id, new_date, new_start_time required");

  const { data: original } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", booking_id)
    .single();

  if (!original) throw new Error("Booking not found");

  await supabase.from("bookings").update({ status: "rescheduled" }).eq("id", booking_id);

  const [h, m] = new_start_time.split(":").map(Number);
  const endMin = h * 60 + m + original.duration_minutes;
  const endTime = `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;

  const { data: newBooking, error } = await supabase
    .from("bookings")
    .insert({
      ...original,
      id: undefined,
      booking_date: new_date,
      start_time: new_start_time + ":00",
      end_time: endTime + ":00",
      status: "confirmed",
      rescheduled_from: booking_id,
      created_at: undefined,
      updated_at: undefined,
    })
    .select()
    .single();

  if (error) throw error;
  return json({ booking: newBooking });
}

// ── Get Settings ──────────────────────────────────────────
async function getSettings(supabase: any, { user_id, slug }: any) {
  let query;
  if (slug) {
    query = supabase.from("booking_settings").select("*").eq("business_slug", slug).maybeSingle();
  } else if (user_id) {
    query = supabase.from("booking_settings").select("*").eq("user_id", user_id).maybeSingle();
  } else {
    throw new Error("user_id or slug required");
  }

  const { data, error } = await query;
  if (error) throw error;
  return json({ settings: data });
}

// ── Helpers ───────────────────────────────────────────────
async function getSettingsBySlug(supabase: any, slug: string) {
  const { data } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("business_slug", slug)
    .maybeSingle();
  return data;
}

async function upsertLead(supabase: any, userId: string, name: string | null, email: string, phone: string | null, note: string, source: string) {
  try {
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("user_id", userId)
      .eq("email", email)
      .maybeSingle();

    if (!existing) {
      await supabase.from("leads").insert({
        user_id: userId,
        name: name || "Unknown",
        email,
        phone: phone || null,
        source,
        status: "new",
        notes: note,
      });
    }
  } catch (_) {
    // Non-critical, don't fail the main operation
  }
}
