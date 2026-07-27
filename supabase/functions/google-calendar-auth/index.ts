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

    // Verify user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { action, code, redirect_uri } = await req.json();

    // Get the user's stored Google credentials
    const { data: conn, error: connError } = await supabase
      .from("user_connections")
      .select("credentials")
      .eq("user_id", user.id)
      .eq("provider", "google_calendar")
      .single();

    if (connError || !conn) {
      throw new Error("Google Calendar connection not found. Please add your Client ID and Secret on the Connections page first.");
    }

    const creds = conn.credentials as Record<string, string>;
    const clientId = creds.client_id;
    const clientSecret = creds.client_secret;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Google Client ID or Client Secret in your connection settings.");
    }

    if (action === "get_auth_url") {
      // Build the Google OAuth consent URL
      const scopes = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
      ].join(" ");

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirect_uri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", user.id);

      return new Response(JSON.stringify({ auth_url: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange_code") {
      // Exchange auth code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);
      }

      // Store tokens in user_connections
      const updatedCreds = {
        ...creds,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || creds.refresh_token,
        token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      };

      await supabase
        .from("user_connections")
        .update({
          credentials: updatedCreds,
          is_connected: true,
          connected_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("provider", "google_calendar");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "refresh_token") {
      const refreshToken = creds.refresh_token;
      if (!refreshToken) throw new Error("No refresh token available. Please re-authorize.");

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(`Token refresh failed: ${tokenData.error_description || tokenData.error}`);
      }

      const updatedCreds = {
        ...creds,
        access_token: tokenData.access_token,
        token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      };

      await supabase
        .from("user_connections")
        .update({ credentials: updatedCreds })
        .eq("user_id", user.id)
        .eq("provider", "google_calendar");

      return new Response(JSON.stringify({ access_token: tokenData.access_token }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (err) {
    console.error("google-calendar-auth error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
