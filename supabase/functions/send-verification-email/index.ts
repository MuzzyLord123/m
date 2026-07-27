import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  user_id?: string;
  email?: string;
  is_resend?: boolean;
}

// Default site URL (used if we can't infer origin). Can be overridden by an env var.
const DEFAULT_SITE_URL = Deno.env.get("SITE_URL") || "https://quooro.com";

function getBestSiteUrl(req: Request) {
  // Prefer browser origin so preview environments generate correct links.
  const origin = req.headers.get("origin");
  if (origin && origin.startsWith("http")) return origin;
  return DEFAULT_SITE_URL;
}

async function findAuthUserIdByEmail(
  supabaseAdmin: any,
  email: string
): Promise<string | null> {
  const target = email.trim().toLowerCase();

  // GoTrue admin API doesn't provide a direct "get user by email" helper.
  // We page through a small number of users to cover typical small/medium projects.
  const perPage = 1000;
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error("listUsers error:", error);
      return null;
    }

    const match = data?.users?.find((u: any) => (u.email || "").toLowerCase() === target);
    if (match?.id) return match.id;

    if (!data?.users || data.users.length < perPage) break;
  }

  return null;
}

type ProfileRow = {
  user_id: string;
  email: string;
  email_verified?: boolean | null;
  full_name?: string | null;
};

async function ensureProfileExists(
  supabaseAdmin: any,
  params: { userId?: string; email?: string }
): Promise<ProfileRow | null> {
  const { userId, email } = params;

  // If we have a userId but no profile, try to create it from auth user.
  if (userId) {
    const { data: profile } = await (supabaseAdmin as any)
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile) return profile;

    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authUserError) {
      console.error("getUserById error:", authUserError);
      return null;
    }

    const authEmail = authUser?.user?.email;
    if (!authEmail) return null;

    const meta = authUser.user?.user_metadata as Record<string, unknown> | null | undefined;
    const fullName = typeof meta?.full_name === "string" ? meta.full_name : null;

    const { error: upsertErr } = await (supabaseAdmin as any)
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          email: authEmail,
          full_name: fullName,
          email_verified: false,
        },
        { onConflict: "user_id" }
      );

    if (upsertErr) {
      console.error("Failed to upsert missing profile (user_id):", upsertErr);
      return null;
    }

    const { data: created } = await (supabaseAdmin as any)
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return created ?? null;
  }

  // If we have only email, try to find/create profile.
  if (email) {
    const normalized = email.trim();
    const { data: profile } = await (supabaseAdmin as any)
      .from("profiles")
      .select("*")
      .ilike("email", normalized)
      .maybeSingle();

    if (profile) return profile;

    const userIdFromAuth = await findAuthUserIdByEmail(supabaseAdmin, normalized);
    if (!userIdFromAuth) return null;

    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userIdFromAuth);
    if (authUserError) {
      console.error("getUserById (by email) error:", authUserError);
      return null;
    }

    const authEmail = authUser?.user?.email;
    const meta = authUser?.user?.user_metadata as Record<string, unknown> | null | undefined;
    const fullName = typeof meta?.full_name === "string" ? meta.full_name : null;

    const { error: upsertErr } = await (supabaseAdmin as any)
      .from("profiles")
      .upsert(
        {
          user_id: userIdFromAuth,
          email: authEmail ?? normalized,
          full_name: fullName,
          email_verified: false,
        },
        { onConflict: "user_id" }
      );

    if (upsertErr) {
      console.error("Failed to upsert missing profile (email):", upsertErr);
      return null;
    }

    const { data: created } = await (supabaseAdmin as any)
      .from("profiles")
      .select("*")
      .eq("user_id", userIdFromAuth)
      .maybeSingle();

    return created ?? null;
  }

  return null;
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Quooro <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { user_id, email, is_resend }: VerificationRequest = await req.json();
    console.log("send-verification-email: request received", {
      has_user_id: Boolean(user_id),
      has_email: Boolean(email),
      is_resend: Boolean(is_resend),
    });

    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ error: "user_id or email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile (self-heal if trigger/profile row is missing)
    const profile = await ensureProfileExists(supabaseAdmin, {
      userId: user_id,
      email,
    });

    if (!profile) {
      // Security: don't reveal whether a user exists. Also prevents frontend blank-screen loops.
      console.warn("Verification email requested but profile not found/created", {
        user_id: user_id ? "[provided]" : undefined,
        email: email ? "[provided]" : undefined,
      });
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account exists for this email, a verification email will be sent.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already verified
    if (profile.email_verified) {
      return new Response(
        JSON.stringify({ error: "Email is already verified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check resend rate limit
    if (is_resend) {
      const { data: limitCheck } = await supabaseAdmin.rpc("check_verification_resend_limit", {
        p_user_id: profile.user_id
      });
      
      if (!limitCheck?.allowed) {
        return new Response(
          JSON.stringify({ error: limitCheck?.error || "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate new verification token
    const { data: token, error: tokenError } = await supabaseAdmin.rpc("generate_verification_token", {
      p_user_id: profile.user_id
    });

    if (tokenError || !token) {
      console.error("Error generating token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment resend counter if this is a resend
    if (is_resend) {
      await supabaseAdmin.rpc("increment_verification_resend", {
        p_user_id: profile.user_id
      });
    }

    // Build verification URL (use request origin when available)
    const siteUrl = getBestSiteUrl(req);
    const verificationUrl = `${siteUrl}/verify-email?token=${token}`;

    // Send email via Resend
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Quooro</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>
          <p style="color: #4b5563;">Hi${profile.full_name ? ` ${profile.full_name}` : ''},</p>
          <p style="color: #4b5563;">Thanks for signing up! Please click the button below to verify your email address and activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #667eea; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
            This link expires in 24 hours. If you didn't create an account with Quooro, you can safely ignore this email.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Quooro. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await sendEmail(
      profile.email,
      "Verify your email for Quooro",
      emailHtml
    );

    console.log("Verification email sent:", {
      to: profile.email,
      email_id: (emailResponse as any)?.id,
      siteUrl,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification email sent successfully",
        email_id: emailResponse.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-verification-email:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
