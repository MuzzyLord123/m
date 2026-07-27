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
    const { action, site_id, email, password, name, phone } = await req.json();

    if (!site_id || !email) throw new Error("site_id and email are required");

    if (action === "signup") {
      // Check if visitor already exists for this site
      const { data: existing } = await supabaseAdmin
        .from("site_visitors")
        .select("id")
        .eq("site_id", site_id)
        .eq("email", email)
        .maybeSingle();

      if (existing) throw new Error("An account with this email already exists");

      // Hash password (simple bcrypt-like approach using Web Crypto)
      const encoder = new TextEncoder();
      const data = encoder.encode(password + site_id);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: visitor, error } = await supabaseAdmin
        .from("site_visitors")
        .insert({
          site_id,
          email,
          password_hash: passwordHash,
          name: name || null,
          phone: phone || null,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      // Generate a session token
      const sessionToken = crypto.randomUUID();
      await supabaseAdmin.from("site_visitor_sessions").insert({
        visitor_id: visitor.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      return new Response(JSON.stringify({
        visitor: { id: visitor.id, email: visitor.email, name: visitor.name },
        session_token: sessionToken,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "login") {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + site_id);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: visitor, error } = await supabaseAdmin
        .from("site_visitors")
        .select("*")
        .eq("site_id", site_id)
        .eq("email", email)
        .eq("password_hash", passwordHash)
        .maybeSingle();

      if (error || !visitor) throw new Error("Invalid email or password");
      if (visitor.status === "blocked") throw new Error("Account is blocked");

      // Update last login
      await supabaseAdmin
        .from("site_visitors")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", visitor.id);

      // Create session
      const sessionToken = crypto.randomUUID();
      await supabaseAdmin.from("site_visitor_sessions").insert({
        visitor_id: visitor.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      return new Response(JSON.stringify({
        visitor: { id: visitor.id, email: visitor.email, name: visitor.name },
        session_token: sessionToken,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "verify") {
      const { session_token } = await req.json();
      const { data: session } = await supabaseAdmin
        .from("site_visitor_sessions")
        .select("*, site_visitors(*)")
        .eq("session_token", session_token)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!session) {
        return new Response(JSON.stringify({ visitor: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(JSON.stringify({
        visitor: {
          id: session.site_visitors.id,
          email: session.site_visitors.email,
          name: session.site_visitors.name,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("[site-visitor-auth] ERROR:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
