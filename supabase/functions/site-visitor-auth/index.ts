import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SESSION_DAYS = 7;

/**
 * Storefront shopper passwords.
 *
 * These were stored as a single unsalted SHA-256 of `password + site_id`.
 * Two problems with that: SHA-256 is designed to be fast, which is the
 * opposite of what a password hash wants, and the only salt was the site
 * id - shared by every shopper on that store, so two customers who picked
 * the same password had byte-identical hashes, visible at a glance in the
 * table.
 *
 * PBKDF2-SHA256 with a per-user random salt instead. It is in Web Crypto,
 * so no dependency. The stored format carries its own parameters, so the
 * iteration count can be raised later without invalidating what is already
 * stored - `verify` reads the cost from the hash it is checking.
 */
const PBKDF2_ITERATIONS = 210_000; // OWASP's PBKDF2-SHA256 floor

const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt.buffer)}$${b64(bits)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;

  const expected = unb64(parts[3]);
  const actual = new Uint8Array(await pbkdf2(password, unb64(parts[2]), iterations));
  if (actual.length !== expected.length) return false;

  // Constant time: comparing with === would leak how many bytes matched
  // through the time it takes to fail.
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

/**
 * Issue a storefront session and confirm it was actually stored.
 *
 * Both callers used to fire this insert and ignore its result, so when the
 * table was missing they still returned a token that referred to nothing:
 * the shopper appeared to be signed in until the next page load, then
 * silently was not. A token we cannot verify later is worse than an error
 * now, so a failed write fails the request.
 */
async function issueSession(
  supabaseAdmin: ReturnType<typeof createClient>,
  visitorId: string,
): Promise<string> {
  const sessionToken = crypto.randomUUID();
  const { error } = await supabaseAdmin.from("site_visitor_sessions").insert({
    visitor_id: visitorId,
    session_token: sessionToken,
    expires_at: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (error) {
    console.error("[site-visitor-auth] session insert failed:", error);
    throw new Error("Could not start a session. Please try again.");
  }
  return sessionToken;
}

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
    // Read the body ONCE. A Request body is a stream and cannot be consumed
    // twice - the verify branch used to call req.json() a second time, which
    // threw "body already consumed" on every single verification, so no
    // storefront session could ever be validated.
    const { action, site_id, email, password, name, phone, session_token } = await req.json();

    // verify is the one action that identifies a caller by token rather than
    // by site and email, so it is handled before those are required.
    if (action === "verify") {
      const { data: session } = await supabaseAdmin
        .from("site_visitor_sessions")
        .select("*, site_visitors(*)")
        .eq("session_token", session_token)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!session?.site_visitors) {
        return new Response(JSON.stringify({ visitor: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(JSON.stringify({
        visitor: {
          id: session.site_visitors.id,
          email: session.site_visitors.email,
          name: session.site_visitors.full_name,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

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

      if (!password) throw new Error("A password is required");
      const passwordHash = await hashPassword(password);

      // The column is full_name, and there is no `status` column at all.
      // Both were named here regardless, so every storefront signup failed
      // on the insert and the account was never created.
      const { data: visitor, error } = await supabaseAdmin
        .from("site_visitors")
        .insert({
          site_id,
          email,
          password_hash: passwordHash,
          full_name: name || null,
          phone: phone || null,
        })
        .select()
        .single();

      if (error) throw error;

      const sessionToken = await issueSession(supabaseAdmin, visitor.id);

      return new Response(JSON.stringify({
        visitor: { id: visitor.id, email: visitor.email, name: visitor.full_name },
        session_token: sessionToken,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "login") {
      // The account is fetched by email and the password checked in code.
      // It cannot be matched with .eq("password_hash", ...) any more, because
      // each user's salt is their own - which is the point.
      const { data: visitor, error } = await supabaseAdmin
        .from("site_visitors")
        .select("*")
        .eq("site_id", site_id)
        .eq("email", email)
        .maybeSingle();

      const ok = visitor ? await verifyPassword(password, visitor.password_hash) : false;
      // One message for "no such account" and "wrong password" alike, so
      // this cannot be used to find out who has an account on a store.
      if (error || !visitor || !ok) throw new Error("Invalid email or password");
      // There was a `visitor.status === "blocked"` check here. site_visitors
      // has no status column, so it read undefined and blocked nobody. It is
      // gone rather than left as reassuring dead code - if blocking shoppers
      // is wanted, it needs a column and a screen that sets it.

      await supabaseAdmin
        .from("site_visitors")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", visitor.id);

      const sessionToken = await issueSession(supabaseAdmin, visitor.id);

      return new Response(JSON.stringify({
        visitor: { id: visitor.id, email: visitor.email, name: visitor.full_name },
        session_token: sessionToken,
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
