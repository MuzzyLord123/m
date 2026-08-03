import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Puts an earlier deployment back on the live address.
 *
 * Rollback used to be a database flip: the chosen row was marked live and
 * the rest archived. On a bare storage URL that changed what the dashboard
 * reported; on a custom domain pointed at a fixed path it changed nothing at
 * all, so a customer could "roll back" a broken site and still be serving
 * the broken one. That is the worst possible moment to be misled.
 *
 * This copies the chosen version's files from its archive back over the live
 * path, so the address really does serve that version again.
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

/** The complete set of files a deployment writes. */
const ASSETS = ["index.html", "styles.css", "script.js", "sitemap.xml", "robots.txt", "404.html"];

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

    const { deploymentId } = await req.json();
    if (!deploymentId) return json({ error: "Missing deploymentId" }, 400);

    // The deployment must belong to a site this caller owns.
    const { data: deployment } = await supabase
      .from("site_deployments")
      .select("id, site_id, version_number, storage_path, live_url, page_count")
      .eq("id", deploymentId)
      .maybeSingle();
    if (!deployment) return json({ error: "Deployment not found" }, 404);

    const { data: site } = await supabase
      .from("designer_sites")
      .select("id, site_name")
      .eq("id", deployment.site_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!site) return json({ error: "Deployment not found" }, 404);

    if (!deployment.storage_path) {
      return json({ error: "This deployment has no archived files to restore." }, 409);
    }

    const livePath = `sites/${deployment.site_id}/live`;

    // Cloudflare, if this customer publishes there; storage otherwise. The
    // same choice the deploy made, read from the same place.
    const cf = await cloudflareCredentials(supabase, user.id);
    let restored = 0;

    if (cf) {
      restored = await copyInR2(cf, deployment.storage_path, livePath);
    } else {
      restored = await copyInStorage(supabase, deployment.storage_path, livePath);
    }

    if (restored === 0) {
      return json({
        error: "The archived files for that version could not be found. It may predate versioned archives.",
      }, 409);
    }

    // Only once the files are actually back does the record change.
    await supabase
      .from("site_deployments")
      .update({ status: "archived" })
      .eq("site_id", deployment.site_id)
      .eq("status", "live");

    await supabase
      .from("site_deployments")
      .update({ status: "live", deployed_at: new Date().toISOString() })
      .eq("id", deploymentId);

    await supabase
      .from("designer_sites")
      .update({ published_at: new Date().toISOString(), published_url: deployment.live_url })
      .eq("id", deployment.site_id);

    return json({
      success: true,
      versionNumber: deployment.version_number,
      filesRestored: restored,
      liveUrl: deployment.live_url,
    });
  } catch (e) {
    console.error("rollback-site error:", e);
    return json({ error: e instanceof Error ? e.message : "Rollback failed" }, 500);
  }
});

async function cloudflareCredentials(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_connections")
    .select("credentials")
    .eq("user_id", userId)
    .eq("provider", "cloudflare")
    .eq("is_connected", true)
    .maybeSingle();
  const c = data?.credentials as Record<string, string> | undefined;
  if (!c?.account_id || !c?.api_token || !c?.r2_bucket_name) return null;
  return { accountId: c.account_id, apiToken: c.api_token, bucket: c.r2_bucket_name };
}

/** Read each archived object and write it back over the live path. */
async function copyInR2(
  cf: { accountId: string; apiToken: string; bucket: string },
  from: string, to: string,
): Promise<number> {
  const base = `https://api.cloudflare.com/client/v4/accounts/${cf.accountId}/r2/buckets/${cf.bucket}/objects`;
  let copied = 0;
  for (const asset of ASSETS) {
    const res = await fetch(`${base}/${from}/${asset}`, {
      headers: { Authorization: `Bearer ${cf.apiToken}` },
    });
    if (!res.ok) continue; // an older version may not have every file
    const body = await res.arrayBuffer();
    const put = await fetch(`${base}/${to}/${asset}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cf.apiToken}`,
        "Content-Type": res.headers.get("content-type") || contentTypeFor(asset),
      },
      body,
    });
    if (put.ok) copied++;
  }
  return copied;
}

async function copyInStorage(supabase: any, from: string, to: string): Promise<number> {
  let copied = 0;
  for (const asset of ASSETS) {
    const { data, error } = await supabase.storage.from("site-files").download(`${from}/${asset}`);
    if (error || !data) continue;
    const bytes = new Uint8Array(await data.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("site-files")
      .upload(`${to}/${asset}`, bytes, { contentType: contentTypeFor(asset), upsert: true });
    if (!upErr) copied++;
  }
  return copied;
}

function contentTypeFor(name: string): string {
  if (name.endsWith(".css")) return "text/css";
  if (name.endsWith(".js")) return "application/javascript";
  if (name.endsWith(".xml")) return "application/xml";
  if (name.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "text/html; charset=utf-8";
}
