import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Checks whether a custom domain's DNS has actually been set up.
 *
 * Adding a domain used to write the instructions and leave the row on
 * "pending_dns" for ever - nothing ever looked. A customer could point their
 * DNS correctly and have no way to find out, short of asking someone.
 *
 * This resolves the domain over DNS-over-HTTPS and only marks it verified
 * when a record genuinely matches. A failure explains which record is
 * missing rather than saying "not verified".
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } =
      await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { domainId } = await req.json();
    if (!domainId) return json({ error: "Missing domainId" }, 400);

    const { data: domain } = await supabase
      .from("site_domains")
      .select("id, site_id, domain_name, domain_type, dns_instructions, status")
      .eq("id", domainId)
      .maybeSingle();
    if (!domain) return json({ error: "Domain not found" }, 404);

    // Ownership, via the site the domain belongs to.
    const { data: site } = await supabase
      .from("designer_sites")
      .select("id")
      .eq("id", domain.site_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!site) return json({ error: "Domain not found" }, 404);

    const records = ((domain.dns_instructions as any)?.records || []) as
      { type: string; name: string; value: string }[];
    if (records.length === 0) {
      return json({ error: "This domain has no DNS instructions to check against." }, 409);
    }

    const checks: { type: string; host: string; expected: string; found: string[]; ok: boolean }[] = [];

    for (const rec of records) {
      const host = rec.name === "@" || !rec.name
        ? domain.domain_name
        : rec.name.includes(".") ? rec.name : `${rec.name}.${domain.domain_name}`;
      const found = await resolve(host, rec.type);
      const expected = rec.value.replace(/\.$/, "").toLowerCase();
      const ok = found.some(v => v.replace(/\.$/, "").toLowerCase() === expected);
      checks.push({ type: rec.type, host, expected: rec.value, found, ok });
    }

    // The TXT token proves control of the domain; that is the one that must
    // pass. A CNAME may legitimately be proxied or flattened to an A record,
    // so it is reported but not made a hard gate.
    const txt = checks.filter(c => c.type.toUpperCase() === "TXT");
    const verified = txt.length > 0 ? txt.every(c => c.ok) : checks.every(c => c.ok);

    if (verified) {
      await supabase
        .from("site_domains")
        .update({
          status: "active",
          dns_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq("id", domainId);
    }

    return json({
      verified,
      checks,
      message: verified
        ? "DNS verified. This domain is now active."
        : describeFailure(checks),
    });
  } catch (e) {
    console.error("verify-site-domain error:", e);
    return json({ error: e instanceof Error ? e.message : "Verification failed" }, 500);
  }
});

/** DNS-over-HTTPS against Cloudflare's resolver. */
async function resolve(host: string, type: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${encodeURIComponent(type)}`,
      { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return [];
    const body = await res.json();
    return (body.Answer || [])
      .map((a: { data?: string }) => String(a.data ?? "").replace(/^"|"$/g, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function describeFailure(checks: { type: string; host: string; expected: string; found: string[]; ok: boolean }[]) {
  const missing = checks.filter(c => !c.ok);
  if (missing.length === 0) return "DNS is not verified yet.";
  const first = missing[0];
  if (first.found.length === 0) {
    return `No ${first.type} record found at ${first.host}. DNS changes can take up to 48 hours to spread.`;
  }
  return `The ${first.type} record at ${first.host} is "${first.found[0]}" but should be "${first.expected}".`;
}
