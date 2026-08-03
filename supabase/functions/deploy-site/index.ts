import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// The one site compiler, shared with the editor. Publishing used to run a
// weaker private copy of this, so 75 of the 102 element types - accordions,
// tabs, carousels, pricing cards, timelines - rendered correctly in exported
// code and came out as empty <div>s on the site that actually went live.
import { generateBodyHTML } from "../_shared/site/htmlExporter.ts";
import { buildCSS } from "../_shared/site/cssCompiler.ts";
import { generateJS } from "../_shared/site/jsGenerator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { siteId, siteName, pages, action } = await req.json();

    if (!siteId || !pages || pages.length === 0) {
      throw new Error("Missing siteId or pages");
    }

    // H2 fix: the JWT was verified but siteId was never checked against it, so
    // any authenticated user could publish arbitrary pages to any other
    // tenant's site - overwriting a live website on a domain they do not own.
    // The deployment row was even stamped with the *caller's* user_id, so the
    // hijack looked legitimate afterwards.
    const { data: ownedSite } = await supabase
      .from("designer_sites")
      .select("id")
      .eq("id", siteId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!ownedSite) {
      return new Response(
        JSON.stringify({ error: "Site not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const buildLog: BuildLogEntry[] = [];
    const log = (step: string, status: string, details?: string) => {
      buildLog.push({ step, status, timestamp: new Date().toISOString(), details });
    };

    // Step 1: Get next version number
    log("Initializing", "running", "Preparing deployment...");
    const { data: lastDeploy } = await supabase
      .from("site_deployments")
      .select("version_number")
      .eq("site_id", siteId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const versionNumber = (lastDeploy?.version_number || 0) + 1;
    const subdomain = generateSubdomain(siteName || "site", siteId);
    // Two destinations. The versioned path is the archive a rollback reads
    // from; the live path is the one the address actually serves. Publishing
    // to a versioned URL meant a rollback could only change what the
    // dashboard *said* was live, never what a visitor was served.
    const storagePath = `sites/${siteId}/v${versionNumber}`;
    const livePath = `sites/${siteId}/live`;

    // Step 2: Create deployment record
    const { data: deployment, error: insertError } = await supabase
      .from("site_deployments")
      .insert({
        site_id: siteId,
        user_id: user.id,
        version_number: versionNumber,
        status: "building",
        subdomain,
        storage_path: storagePath,
        page_count: pages.length,
        build_log: buildLog,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(`Failed to create deployment: ${insertError.message}`);
    const deploymentId = deployment.id;

    // Step 3: Work out where the site will answer from *before* compiling.
    // Canonical tags, the sitemap and the social cards all have to name the
    // real address, so the destination has to be known while the HTML is
    // still being written rather than after it has been uploaded.
    const cfAccountId = await getCloudflareCredential(supabase, user.id, "account_id");
    const cfApiToken = await getCloudflareCredential(supabase, user.id, "api_token");
    const cfR2Bucket = await getCloudflareCredential(supabase, user.id, "r2_bucket_name");
    const cfCustomDomain = await getCloudflareCredential(supabase, user.id, "site_domain");

    const useCloudflare = !!(cfAccountId && cfApiToken && cfR2Bucket);

    // A verified custom domain is the address people will actually see, so
    // it outranks the generated subdomain everywhere the URL is written down.
    const { data: verifiedDomain } = await supabase
      .from("site_domains")
      .select("domain_name")
      .eq("site_id", siteId)
      .eq("domain_type", "custom")
      .eq("status", "active")
      .eq("dns_verified", true)
      .maybeSingle();

    const onOwnDomain = !!verifiedDomain?.domain_name || !!(useCloudflare && cfCustomDomain);
    let siteOrigin: string;
    if (verifiedDomain?.domain_name) {
      siteOrigin = `https://${verifiedDomain.domain_name}`;
    } else if (useCloudflare && cfCustomDomain) {
      siteOrigin = `https://${subdomain}.${cfCustomDomain}`;
    } else if (useCloudflare) {
      siteOrigin = `https://pub-${cfR2Bucket}.r2.dev/${livePath}`;
    } else {
      siteOrigin = `${supabaseUrl}/storage/v1/object/public/site-files/${livePath}`;
    }

    log("Compiling", "running", `Building ${pages.length} page(s)...`);

    // Step 4: Compile pages
    const compiledPages = compilePages(
      pages, siteName || "My Website", siteOrigin, siteId, supabaseUrl,
    );

    // Step 5: Upload — try Cloudflare R2 first, fallback to Supabase Storage
    log("Uploading", "running", "Uploading compiled assets...");

    let totalSize = 0;
    let fileCount = 0;

    // Written twice: once to the version's own archive, once to the live
    // path the address serves.
    if (useCloudflare) {
      log("Uploading", "running", "Deploying to Cloudflare R2...");
      const uploadResult = await uploadToCloudflareR2(
        cfAccountId!, cfApiToken!, cfR2Bucket!, storagePath, compiledPages
      );
      await uploadToCloudflareR2(cfAccountId!, cfApiToken!, cfR2Bucket!, livePath, compiledPages);
      totalSize = uploadResult.totalSize;
      fileCount = uploadResult.fileCount;
    } else {
      log("Uploading", "running", "Deploying to storage...");
      const uploadResult = await uploadToSupabaseStorage(supabase, storagePath, compiledPages);
      await uploadToSupabaseStorage(supabase, livePath, compiledPages);
      totalSize = uploadResult.totalSize;
      fileCount = uploadResult.fileCount;
    }

    log("Uploading", "complete", `${fileCount} files uploaded (${formatBytes(totalSize)})`);

    // Step 6: The address to hand back. On a real domain the root serves the
    // homepage; on a bare bucket the file has to be named.
    const liveUrl = onOwnDomain ? siteOrigin : `${siteOrigin}/index.html`;

    log("Deploying", "running", "Activating deployment...");

    // Step 6: DNS management (Cloudflare)
    if (useCloudflare && cfCustomDomain) {
      const cfZoneId = await getCloudflareCredential(supabase, user.id, "zone_id");
      if (cfZoneId) {
        await ensureCloudflareDNS(cfApiToken!, cfZoneId, subdomain, cfCustomDomain, cfR2Bucket!);
        log("DNS", "complete", `${subdomain}.${cfCustomDomain} configured`);
      }
    }

    // Step 7: Ensure subdomain record
    await supabase.from("site_domains").upsert(
      {
        site_id: siteId,
        user_id: user.id,
        domain_type: "subdomain",
        domain_name: useCloudflare && cfCustomDomain ? `${subdomain}.${cfCustomDomain}` : subdomain,
        status: "active",
        dns_verified: true,
        ssl_active: useCloudflare,
        verified_at: new Date().toISOString(),
      },
      { onConflict: "domain_name" }
    );

    log("Deploying", "complete", "Site is now live!");

    // Step 8: Update deployment record
    await supabase
      .from("site_deployments")
      .update({
        status: "live",
        live_url: liveUrl,
        file_count: fileCount,
        total_size_bytes: totalSize,
        deployed_at: new Date().toISOString(),
        build_log: buildLog,
      })
      .eq("id", deploymentId);

    // Archive previous live deployments
    await supabase
      .from("site_deployments")
      .update({ status: "archived" })
      .eq("site_id", siteId)
      .neq("id", deploymentId)
      .eq("status", "live");

    // Mark the site itself as published. The dashboard reads this to tell a
    // draft from a live site, and the form endpoint refuses submissions that
    // claim to come from a site which was never published.
    await supabase
      .from("designer_sites")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        published_url: liveUrl,
      })
      .eq("id", siteId);

    return new Response(
      JSON.stringify({
        success: true,
        deploymentId,
        versionNumber,
        liveUrl,
        subdomain: useCloudflare && cfCustomDomain ? `${subdomain}.${cfCustomDomain}` : subdomain,
        fileCount,
        totalSize,
        buildLog,
        provider: useCloudflare ? "cloudflare" : "supabase",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("deploy-site error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Types ──────────────────────────────────────────────

interface BuildLogEntry {
  step: string;
  status: string;
  timestamp: string;
  details?: string;
}

interface PageInput {
  page_name: string;
  slug: string;
  is_homepage: boolean;
  elements: any[];
  seo_title?: string;
  seo_description?: string;
  page_settings?: any;
}

interface CompiledOutput {
  sharedCSS: string;
  sharedJS: string;
  pageFiles: { filename: string; html: string }[];
  /** sitemap.xml, robots.txt, 404.html — everything a real site needs that
   *  is not one of its own pages. */
  extraFiles: { path: string; content: string; contentType: string }[];
}

// ─── Cloudflare Credentials ─────────────────────────────

async function getCloudflareCredential(
  supabase: any, userId: string, field: string
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("user_connections")
      .select("credentials")
      .eq("user_id", userId)
      .eq("provider", "cloudflare")
      .eq("is_connected", true)
      .maybeSingle();
    if (!data?.credentials) return null;
    return (data.credentials as Record<string, string>)[field] || null;
  } catch {
    return null;
  }
}

// ─── Cloudflare R2 Upload ───────────────────────────────

async function uploadToCloudflareR2(
  accountId: string, apiToken: string, bucketName: string,
  storagePath: string, compiled: CompiledOutput
): Promise<{ totalSize: number; fileCount: number }> {
  let totalSize = 0;
  let fileCount = 0;

  const files: { path: string; content: string; contentType: string }[] = [
    { path: `${storagePath}/styles.css`, content: compiled.sharedCSS, contentType: "text/css" },
    { path: `${storagePath}/script.js`, content: compiled.sharedJS, contentType: "application/javascript" },
    ...compiled.pageFiles.map(p => ({
      path: `${storagePath}/${p.filename}`,
      content: p.html,
      contentType: "text/html; charset=utf-8",
    })),
    ...compiled.extraFiles.map(f => ({
      path: `${storagePath}/${f.path}`,
      content: f.content,
      contentType: f.contentType,
    })),
  ];

  for (const file of files) {
    const body = new TextEncoder().encode(file.content);
    totalSize += body.length;
    fileCount++;

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${file.path}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": file.contentType,
        },
        body,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`R2 upload failed for ${file.path}: ${err}`);
    }
  }

  return { totalSize, fileCount };
}

// ─── Supabase Storage Upload (fallback) ─────────────────

async function uploadToSupabaseStorage(
  supabase: any, storagePath: string, compiled: CompiledOutput
): Promise<{ totalSize: number; fileCount: number }> {
  let totalSize = 0;
  let fileCount = 0;

  const uploads: { path: string; content: string; contentType: string }[] = [
    { path: `${storagePath}/styles.css`, content: compiled.sharedCSS, contentType: "text/css" },
    { path: `${storagePath}/script.js`, content: compiled.sharedJS, contentType: "application/javascript" },
    ...compiled.pageFiles.map(p => ({
      path: `${storagePath}/${p.filename}`,
      content: p.html,
      contentType: "text/html",
    })),
    ...compiled.extraFiles.map(f => ({
      path: `${storagePath}/${f.path}`,
      content: f.content,
      contentType: f.contentType,
    })),
  ];

  for (const file of uploads) {
    const bytes = new TextEncoder().encode(file.content);
    totalSize += bytes.length;
    fileCount++;
    await supabase.storage
      .from("site-files")
      .upload(file.path, bytes, { contentType: file.contentType, upsert: true });
  }

  return { totalSize, fileCount };
}

// ─── Cloudflare DNS ─────────────────────────────────────

async function ensureCloudflareDNS(
  apiToken: string, zoneId: string, subdomain: string,
  domain: string, r2Bucket: string
) {
  const recordName = `${subdomain}.${domain}`;

  // Check if record exists
  const listRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${recordName}&type=CNAME`,
    { headers: { "Authorization": `Bearer ${apiToken}` } }
  );
  const listData = await listRes.json();

  if (listData.result?.length > 0) {
    // Update existing
    const recordId = listData.result[0].id;
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CNAME",
          name: subdomain,
          content: `pub-${r2Bucket}.r2.dev`,
          proxied: true,
        }),
      }
    );
  } else {
    // Create new
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CNAME",
          name: subdomain,
          content: `pub-${r2Bucket}.r2.dev`,
          proxied: true,
          ttl: 1,
        }),
      }
    );
  }
}

// ─── Helpers ────────────────────────────────────────────

function generateSubdomain(siteName: string, siteId: string): string {
  const clean = siteName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const suffix = siteId.slice(0, 6);
  return `${clean || "site"}-${suffix}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHTML(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** For anything going inside an attribute. Single quotes matter here too -
 *  an unescaped alt text or placeholder used to be able to close the
 *  attribute and inject markup into the published page. */
function escapeAttr(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Only URL schemes that are safe to put behind a link or an image.
 *  Blocks javascript: and data: (bar images) from user-entered fields. */
function safeURL(value: unknown, allowData = false): string {
  const url = String(value ?? "").trim();
  if (!url) return "";
  const scheme = url.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (!scheme) return url; // relative path or anchor
  if (["http", "https", "mailto", "tel"].includes(scheme)) return url;
  if (allowData && scheme === "data" && /^data:image\//i.test(url)) return url;
  return "";
}

/** A plain pixel dimension, if the element states one. Percentages, autos
 *  and anything else return null rather than a misleading attribute. */

/** A stable form field name derived from its label. */
function fieldName(label: string, index: number): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
  return slug || `field_${index}`;
}

/**
 * A "#something" link is ambiguous: it can mean jump to another page, or
 * scroll to a section of this one. Previously every one of them was rewritten
 * to "something.html", which silently broke every in-page anchor on every
 * published site - and left the smooth-scroll handler with nothing to match.
 * Now the page list decides: a slug that names a real page navigates, and
 * anything else stays the anchor the author wrote.
 */

// ─── Compiler ───────────────────────────────────────────

function compilePages(
  pages: PageInput[],
  siteName: string,
  siteOrigin: string,
  siteId: string,
  supabaseUrl: string,
): CompiledOutput {
  const allElements = pages.flatMap(p => p.elements);
  const sharedCSS = minifyCSS(BASE_CSS + "\n" + buildCSS(allElements as never));
  const sharedJS = minifyJS(generateJS(allElements as never) + "\n" + formRuntime(siteId, supabaseUrl));

  const fileNameFor = (page: PageInput) => {
    const cleanSlug = (page.slug || "").replace(/^\/+/, "");
    return page.is_homepage || cleanSlug === "" || cleanSlug === "/" ? "index.html" : `${cleanSlug}.html`;
  };

  // Which "#slug" links are page navigation rather than in-page anchors.
  const pageSlugs = new Set(
    pages.map(p => (p.slug || "").replace(/^\/+/, "").toLowerCase()).filter(Boolean),
  );

  const pageFiles = pages.map(page => {
    const filename = fileNameFor(page);
    const bodyContent = generateBodyHTML(page.elements as never);
    const title = page.seo_title || page.page_name;
    const desc = page.seo_description || `${page.page_name} — ${siteName}`;
    const ps = page.page_settings || {};
    const canonical = `${siteOrigin}/${filename === "index.html" ? "" : filename}`;
    const lang = ps.lang || "en";
    // A social card needs an absolute image URL; a relative one renders blank.
    const ogImage = absolutise(ps.og_image_url || ps.share_image_url || "", siteOrigin);

    let head = `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(title)} — ${escapeHTML(siteName)}</title>
    <meta name="description" content="${escapeHTML(desc)}">
    <link rel="canonical" href="${escapeAttr(canonical)}">
    <meta name="robots" content="${ps.no_index ? "noindex, nofollow" : "index, follow"}">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${escapeAttr(siteName)}">
    <meta property="og:title" content="${escapeAttr(title)}">
    <meta property="og:description" content="${escapeAttr(desc)}">
    <meta property="og:url" content="${escapeAttr(canonical)}">${
      ogImage ? `\n    <meta property="og:image" content="${escapeAttr(ogImage)}">` : ""
    }

    <meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">
    <meta name="twitter:title" content="${escapeAttr(title)}">
    <meta name="twitter:description" content="${escapeAttr(desc)}">${
      ogImage ? `\n    <meta name="twitter:image" content="${escapeAttr(ogImage)}">` : ""
    }

    <link rel="stylesheet" href="styles.css">`;

    if (ps.favicon_url) head += `\n    <link rel="icon" href="${escapeAttr(ps.favicon_url)}">`;
    if (ps.head_code) head += `\n    ${ps.head_code}`;

    const html = `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head>
${head}
</head>
<body>

${bodyContent}

    <script src="script.js" defer></script>${ps.body_code ? `\n    ${ps.body_code}` : ""}
</body>
</html>`;

    return { filename, html: minifyHTML(html) };
  });

  // Anything indexable goes in the sitemap; a page marked noindex does not.
  const indexable = pages.filter(p => !(p.page_settings || {}).no_index);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map(p => {
    const f = fileNameFor(p);
    return `  <url>
    <loc>${escapeHTML(`${siteOrigin}/${f === "index.html" ? "" : f}`)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p.is_homepage ? "1.0" : "0.8"}</priority>
  </url>`;
  }).join("\n")}
</urlset>`;

  const robots = `User-agent: *
Allow: /
${pages.filter(p => (p.page_settings || {}).no_index).map(p => `Disallow: /${fileNameFor(p)}`).join("\n")}
Sitemap: ${siteOrigin}/sitemap.xml`;

  const notFound = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page not found — ${escapeHTML(siteName)}</title>
    <meta name="robots" content="noindex">
    <link rel="stylesheet" href="styles.css">
    <style>
      .q404 { min-height: 70vh; display: flex; flex-direction: column;
        align-items: center; justify-content: center; text-align: center;
        padding: 2rem; gap: .75rem; }
      .q404 h1 { font-size: clamp(1.5rem, 4vw, 2.25rem); }
      .q404 p { color: #555; max-width: 34rem; }
      .q404 a { display: inline-block; margin-top: .5rem; padding: .65rem 1.15rem;
        border: 1px solid currentColor; border-radius: .5rem; }
    </style>
</head>
<body>
    <main class="q404">
      <h1>That page isn't here</h1>
      <p>The link may be out of date, or the page may have moved.</p>
      <a href="/">Back to ${escapeHTML(siteName)}</a>
    </main>
</body>
</html>`;

  return {
    sharedCSS,
    sharedJS,
    pageFiles,
    extraFiles: [
      { path: "sitemap.xml", content: sitemap, contentType: "application/xml" },
      { path: "robots.txt", content: robots, contentType: "text/plain; charset=utf-8" },
      { path: "404.html", content: notFound, contentType: "text/html; charset=utf-8" },
    ],
  };
}

/** Social cards need absolute URLs. A path is resolved against the site's
 *  own origin; anything already absolute is left alone. */
function absolutise(url: string, origin: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${origin}/${url.replace(/^\/+/, "")}`;
}

/**
 * The reset, plus the chrome the compiler adds that no author draws: the bot
 * trap, the form status line and the choice controls. Element styling itself
 * now comes from the shared cssCompiler, the same one the editor uses.
 */
const BASE_CSS = `/* Auto-generated by Quooro Site Deployment Engine */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
img { max-width: 100%; height: auto; display: block; }
a { text-decoration: none; color: inherit; }

/* The bot trap. Off-screen rather than display:none, which some bots skip. */
.quooro-hp { position: absolute !important; left: -9999px !important; top: auto !important;
  width: 1px !important; height: 1px !important; overflow: hidden !important; }

/* Where a form reports back. Empty until it has something to say. */
.quooro-form-status { margin-top: .75rem; font-size: .925rem; line-height: 1.5; }
.quooro-form-status:empty { display: none; }
.quooro-form-status[data-state="ok"] { color: #15803d; }
.quooro-form-status[data-state="error"] { color: #b91c1c; }
form[data-quooro-form] button[disabled] { opacity: .65; cursor: progress; }

/* Choices. Enough shape to be usable; the author's own styles win. */
.quooro-choice { display: flex; align-items: center; gap: .5rem; cursor: pointer; }
.quooro-choice input { width: auto; margin: 0; }
.quooro-choice-group { border: 0; padding: 0; margin: 0; display: grid; gap: .4rem; }
.quooro-choice-group legend { padding: 0; margin-bottom: .35rem; font-weight: 600; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto !important; }
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}`;



/**
 * Minify the generated stylesheet.
 *
 * Walks the string rather than running regexes over it, because a CSS value
 * can legitimately contain quotes, braces and even the characters that start
 * a comment - content: "a/*b" would be mangled by the naive version. Inside
 * a quoted string nothing is touched.
 */
function minifyCSS(css: string): string {
  let out = "";
  let quote: string | null = null;
  // Whether we are inside a declaration block. It matters: ".a :hover" is a
  // descendant selector and its space is load-bearing, while "color: red"
  // inside a block can lose the space safely.
  let inBlock = false;
  // Parenthesis depth, so the colon in "@media (max-width: 480px)" is
  // recognised as a feature separator even though no block is open yet.
  let parens = 0;

  for (let i = 0; i < css.length; i++) {
    const c = css[i];

    if (quote) {
      out += c;
      if (c === "\\") { out += css[++i] ?? ""; continue; }
      if (c === quote) quote = null;
      continue;
    }

    if (c === '"' || c === "'") { quote = c; out += c; continue; }

    // Comment - drop it entirely.
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 1;
      continue;
    }

    // Collapse any run of whitespace to a single space.
    if (/\s/.test(c)) {
      if (!/\s/.test(out[out.length - 1] ?? " ")) out += " ";
      continue;
    }

    // Punctuation that never needs a space before it. A colon only qualifies
    // inside a block, and inside parentheses like @media (max-width: 480px).
    const colonIsSeparator = c === ":" && (inBlock || parens > 0);
    const tightBefore = "{};,>)".includes(c) || colonIsSeparator;
    if (tightBefore && out.endsWith(" ")) out = out.slice(0, -1);

    out += c;
    if (c === "{") inBlock = true;
    if (c === "}") inBlock = false;
    if (c === "(") parens++;
    if (c === ")") parens = Math.max(0, parens - 1);

    // ...and no space after it either.
    if (c === ";" || c === "{" || c === "}" || c === "," || c === ">" || c === "(" || colonIsSeparator) {
      while (i + 1 < css.length && /\s/.test(css[i + 1])) i++;
    }
  }
  return out.replace(/;\}/g, "}").trim();
}

/**
 * Minify the generated HTML.
 *
 * The reason this was left undone for so long is that whitespace between
 * inline elements is rendered - "<a>one</a> <a>two</a>" is not the same as
 * "<a>one</a><a>two</a>" - so a blanket collapse silently welds words and
 * links together. This only removes whitespace where BOTH sides are
 * block-level tags, which is never rendered, and never touches the inside
 * of pre, textarea, script or style.
 */
const BLOCK_TAGS = new Set([
  'html', 'head', 'body', 'div', 'section', 'article', 'aside', 'header',
  'footer', 'nav', 'main', 'form', 'fieldset', 'ul', 'ol', 'li', 'table',
  'thead', 'tbody', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'blockquote', 'pre', 'figure', 'figcaption', 'hr', 'details',
  'summary', 'dialog', 'meta', 'link', 'title', 'script', 'style',
]);

function minifyHTML(html: string): string {
  // Protect anything whose whitespace is load-bearing.
  const guarded: string[] = [];
  let src = html.replace(/<(pre|textarea|script|style)\b[\s\S]*?<\/\1>/gi, m => {
    guarded.push(m);
    return `\u0000${guarded.length - 1}\u0000`;
  });

  const tagName = (tag: string) => (tag.match(/^<\/?\s*([a-z0-9-]+)/i)?.[1] || '').toLowerCase();

  src = src.replace(/(<[^>]+>)(\s+)(<[^>]+>)/g, (whole, a, _ws, b) =>
    BLOCK_TAGS.has(tagName(a)) && BLOCK_TAGS.has(tagName(b)) ? `${a}${b}` : whole);
  // Repeat: removing one gap creates new adjacencies.
  for (let i = 0; i < 4; i++) {
    src = src.replace(/(<[^>]+>)(\s+)(<[^>]+>)/g, (whole, a, _ws, b) =>
      BLOCK_TAGS.has(tagName(a)) && BLOCK_TAGS.has(tagName(b)) ? `${a}${b}` : whole);
  }
  // Comments the author did not write.
  src = src.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');

  return src.replace(/\u0000(\d+)\u0000/g, (_m, i) => guarded[Number(i)]);
}

/**
 * Minify the generated script. Conservative on purpose: this only removes
 * whole-line comments and leading indentation, which is safe because the
 * script is generated here and contains no multi-line string literals.
 */
function minifyJS(js: string): string {
  return js
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("//"))
    .join("\n");
}


/**
 * Choices - dropdowns, tick boxes, radio groups. These need markup a plain
 * tag map cannot express (options inside a select, an input wrapped in its
 * own label), so they are rendered before the generic path. Without this
 * they came out as empty <div>s and the answers were simply lost.
 */


function formRuntime(siteId: string, supabaseUrl: string): string {
  const endpoint = `${supabaseUrl}/functions/v1/site-form-submit`;
  return `// Quooro Site Engine
(function () {
  'use strict';
  var SITE_ID = ${JSON.stringify(siteId)};
  var ENDPOINT = ${JSON.stringify(endpoint)};

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // Smooth scrolling for genuine in-page anchors.
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = this.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.getElementById(id.slice(1));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (history.replaceState) history.replaceState(null, '', id);
        }
      });
    });

    // Reveal-on-scroll.
    var animEls = document.querySelectorAll('[data-animate]');
    if (animEls.length && 'IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      animEls.forEach(function (el) { obs.observe(el); });
    }

    // Forms. Every field is sent under the label the site owner gave it, so
    // the inbox reads the way the form looks.
    document.querySelectorAll('form[data-quooro-form]').forEach(function (form) {
      var status = form.querySelector('.quooro-form-status');
      var submitBtn = form.querySelector('button, input[type="submit"]');
      var busy = false;

      function say(message, kind) {
        if (!status) return;
        status.textContent = message;
        status.setAttribute('data-state', kind);
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) return;

        if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;

        var fields = {};
        var honeypot = '';
        var data = new FormData(form);
        data.forEach(function (value, key) {
          if (key === 'company_website') { honeypot = String(value); return; }
          var el = form.querySelector('[name="' + CSS.escape(key) + '"]');
          var label = (el && (el.getAttribute('data-field-label')
            || el.getAttribute('aria-label') || el.getAttribute('placeholder'))) || key;
          // Checkbox groups arrive as repeats; keep them together.
          fields[label] = fields[label] ? fields[label] + ', ' + value : String(value);
        });

        busy = true;
        var originalLabel = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
        say('', 'sending');

        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: SITE_ID,
            formId: form.getAttribute('data-form-id') || '',
            formName: form.getAttribute('data-form-name') || 'Form',
            pageSlug: location.pathname.replace(/^\\/+/, '') || 'index.html',
            company_website: honeypot,
            fields: fields
          })
        })
          .then(function (res) { return res.json().then(function (b) { return { ok: res.ok, body: b }; }); })
          .then(function (r) {
            if (!r.ok) throw new Error((r.body && r.body.error) || 'Something went wrong.');
            var redirect = form.getAttribute('data-redirect');
            if (redirect) { location.href = redirect; return; }
            form.reset();
            say(form.getAttribute('data-success') || 'Thank you — we have received your message.', 'ok');
          })
          .catch(function (err) {
            say(err.message || 'Could not send. Please try again.', 'error');
          })
          .then(function () {
            busy = false;
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
          });
      });
    });
  });
})();`;
}
