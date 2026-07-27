import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/** Fetch OAuth credentials from user_connections table */
async function getOAuthCredentials(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  provider: "gmail" | "outlook"
): Promise<{ clientId: string; clientSecret: string } | null> {
  const connProvider = `${provider}_oauth`;
  const { data } = await adminClient
    .from("user_connections")
    .select("credentials")
    .eq("user_id", userId)
    .eq("provider", connProvider)
    .eq("is_connected", true)
    .maybeSingle();

  if (!data?.credentials) return null;
  const creds = data.credentials as Record<string, string>;
  if (!creds.client_id || !creds.client_secret) return null;
  return { clientId: creds.client_id, clientSecret: creds.client_secret };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);
  const corsHeaders = getCorsHeaders(req);
  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }
    const userId = claimsData.claims.sub as string;

    const { provider, action, code, redirectUri } = await req.json();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ---- GET AUTH URL ----
    if (action === "get_auth_url") {
      if (provider === "gmail") {
        const creds = await getOAuthCredentials(adminClient, userId, "gmail");
        if (!creds) {
          return new Response(JSON.stringify({ error: "Gmail not configured. Go to Mail Settings → API Credentials to add your Gmail Client ID and Secret." }), { status: 400, headers });
        }
        const scopes = [
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.modify",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
        ].join(" ");

        const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${creds.clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent(scopes)}` +
          `&access_type=offline` +
          `&prompt=consent` +
          `&state=gmail`;

        return new Response(JSON.stringify({ url }), { status: 200, headers });
      }

      if (provider === "outlook") {
        const creds = await getOAuthCredentials(adminClient, userId, "outlook");
        if (!creds) {
          return new Response(JSON.stringify({ error: "Outlook not configured. Go to Mail Settings → API Credentials to add your Outlook Client ID and Secret." }), { status: 400, headers });
        }
        const scopes = "https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access";

        const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
          `client_id=${creds.clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent(scopes)}` +
          `&state=outlook`;

        return new Response(JSON.stringify({ url }), { status: 200, headers });
      }

      return new Response(JSON.stringify({ error: "Unsupported provider" }), { status: 400, headers });
    }

    // ---- EXCHANGE CODE ----
    if (action === "exchange_code") {
      if (provider === "gmail") {
        const creds = await getOAuthCredentials(adminClient, userId, "gmail");
        if (!creds) {
          return new Response(JSON.stringify({ error: "Gmail credentials not found" }), { status: 400, headers });
        }

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: creds.clientId,
            client_secret: creds.clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenRes.ok) {
          const err = await tokenRes.text();
          return new Response(JSON.stringify({ error: `Token exchange failed: ${err}` }), { status: 400, headers });
        }

        const tokens = await tokenRes.json();

        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userInfo = await userRes.json();

        // Upsert email account
        const { data: existing } = await adminClient.from("email_accounts")
          .select("id")
          .eq("user_id", userId)
          .eq("email_address", userInfo.email)
          .maybeSingle();

        const accountData = {
          provider: "gmail",
          email_address: userInfo.email,
          display_name: userInfo.name || userInfo.email,
          color: "#EA4335",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          status: "active",
          error_message: null,
        };

        if (existing) {
          await adminClient.from("email_accounts").update(accountData).eq("id", existing.id);
        } else {
          await adminClient.from("email_accounts").insert({ user_id: userId, ...accountData });
        }

        return new Response(JSON.stringify({ success: true, email: userInfo.email }), { status: 200, headers });
      }

      if (provider === "outlook") {
        const creds = await getOAuthCredentials(adminClient, userId, "outlook");
        if (!creds) {
          return new Response(JSON.stringify({ error: "Outlook credentials not found" }), { status: 400, headers });
        }

        const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: creds.clientId,
            client_secret: creds.clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
            scope: "https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access",
          }),
        });

        if (!tokenRes.ok) {
          const err = await tokenRes.text();
          return new Response(JSON.stringify({ error: `Token exchange failed: ${err}` }), { status: 400, headers });
        }

        const tokens = await tokenRes.json();

        const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userInfo = await userRes.json();
        const email = userInfo.mail || userInfo.userPrincipalName;

        const { data: existing } = await adminClient.from("email_accounts")
          .select("id")
          .eq("user_id", userId)
          .eq("email_address", email)
          .maybeSingle();

        const accountData = {
          provider: "outlook",
          email_address: email,
          display_name: userInfo.displayName || email,
          color: "#0078D4",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          status: "active",
          error_message: null,
        };

        if (existing) {
          await adminClient.from("email_accounts").update(accountData).eq("id", existing.id);
        } else {
          await adminClient.from("email_accounts").insert({ user_id: userId, ...accountData });
        }

        return new Response(JSON.stringify({ success: true, email }), { status: 200, headers });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers });
  } catch (err) {
    console.error("email-oauth error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
