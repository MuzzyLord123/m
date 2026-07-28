import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const storagePath = `sites/${siteId}/v${versionNumber}`;

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

    log("Compiling", "running", `Building ${pages.length} page(s)...`);

    // Step 3: Compile pages
    const compiledPages = compilePages(pages, siteName || "My Website");

    // Step 4: Upload — try Cloudflare R2 first, fallback to Supabase Storage
    log("Uploading", "running", "Uploading compiled assets...");

    const cfAccountId = await getCloudflareCredential(supabase, user.id, "account_id");
    const cfApiToken = await getCloudflareCredential(supabase, user.id, "api_token");
    const cfR2Bucket = await getCloudflareCredential(supabase, user.id, "r2_bucket_name");
    const cfCustomDomain = await getCloudflareCredential(supabase, user.id, "site_domain");

    const useCloudflare = !!(cfAccountId && cfApiToken && cfR2Bucket);

    let totalSize = 0;
    let fileCount = 0;

    if (useCloudflare) {
      log("Uploading", "running", "Deploying to Cloudflare R2...");
      const uploadResult = await uploadToCloudflareR2(
        cfAccountId!, cfApiToken!, cfR2Bucket!, storagePath, compiledPages
      );
      totalSize = uploadResult.totalSize;
      fileCount = uploadResult.fileCount;
    } else {
      log("Uploading", "running", "Deploying to storage...");
      const uploadResult = await uploadToSupabaseStorage(supabase, storagePath, compiledPages);
      totalSize = uploadResult.totalSize;
      fileCount = uploadResult.fileCount;
    }

    log("Uploading", "complete", `${fileCount} files uploaded (${formatBytes(totalSize)})`);

    // Step 5: Generate live URL
    let liveUrl: string;
    if (useCloudflare && cfCustomDomain) {
      liveUrl = `https://${subdomain}.${cfCustomDomain}`;
    } else if (useCloudflare) {
      // R2 public URL via custom domain or pub bucket endpoint
      liveUrl = `https://pub-${cfR2Bucket}.r2.dev/${storagePath}/index.html`;
    } else {
      liveUrl = `${supabaseUrl}/storage/v1/object/public/site-files/${storagePath}/index.html`;
    }

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

// ─── Compiler ───────────────────────────────────────────

function compilePages(pages: PageInput[], siteName: string): CompiledOutput {
  const allElements = pages.flatMap(p => p.elements);
  const sharedCSS = buildCSSFromElements(allElements);
  const sharedJS = generateBasicJS();

  const pageFiles = pages.map(page => {
    const cleanSlug = (page.slug || "").replace(/^\/+/, "");
    const filename = page.is_homepage || cleanSlug === "" || cleanSlug === "/" ? "index.html" : `${cleanSlug}.html`;
    const bodyContent = page.elements.map((el: any) => elementToHTML(el, 2)).join("\n\n");
    const title = page.seo_title || page.page_name;
    const desc = page.seo_description || `${page.page_name} — ${siteName}`;
    const ps = page.page_settings || {};

    let head = `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHTML(desc)}">
    <title>${escapeHTML(title)} — ${escapeHTML(siteName)}</title>
    <link rel="stylesheet" href="styles.css">`;

    if (ps.favicon_url) head += `\n    <link rel="icon" href="${escapeHTML(ps.favicon_url)}">`;
    if (ps.head_code) head += `\n    ${ps.head_code}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>
<body>

${bodyContent}

    <script src="script.js" defer></script>${ps.body_code ? `\n    ${ps.body_code}` : ""}
</body>
</html>`;

    return { filename, html };
  });

  return { sharedCSS, sharedJS, pageFiles };
}

function buildCSSFromElements(elements: any[]): string {
  const rules: string[] = [
    `/* Auto-generated by Quooro Site Deployment Engine */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
img { max-width: 100%; height: auto; display: block; }
a { text-decoration: none; color: inherit; }
`,
  ];
  collectCSS(elements, rules);
  return rules.join("\n");
}

function collectCSS(elements: any[], rules: string[]) {
  for (const el of elements) {
    const className = `el-${el.id?.replace(/[^a-zA-Z0-9-_]/g, "") || "unknown"}`;
    const desktop = el.styles?.desktop;
    if (desktop && Object.keys(desktop).length > 0) {
      const props = Object.entries(desktop).map(([k, v]) => `  ${camelToKebab(k)}: ${v};`).join("\n");
      rules.push(`.${className} {\n${props}\n}`);
    }
    const tablet = el.styles?.tablet;
    if (tablet && Object.keys(tablet).length > 0) {
      const props = Object.entries(tablet).map(([k, v]) => `  ${camelToKebab(k)}: ${v};`).join("\n");
      rules.push(`@media (max-width: 768px) {\n  .${className} {\n  ${props}\n  }\n}`);
    }
    const mobile = el.styles?.mobile;
    if (mobile && Object.keys(mobile).length > 0) {
      const props = Object.entries(mobile).map(([k, v]) => `  ${camelToKebab(k)}: ${v};`).join("\n");
      rules.push(`@media (max-width: 480px) {\n  .${className} {\n  ${props}\n  }\n}`);
    }
    const hover = el.hoverStyles;
    if (hover && Object.keys(hover).length > 0) {
      const props = Object.entries(hover).map(([k, v]) => `  ${camelToKebab(k)}: ${v};`).join("\n");
      rules.push(`.${className}:hover {\n${props}\n}`);
    }
    if (el.children?.length) collectCSS(el.children, rules);
  }
}

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

function getTag(el: any): string {
  const map: Record<string, string> = {
    section: "section", container: "div", columns: "div", grid: "div",
    text: "p", button: "button", image: "img", video: "video",
    navbar: "nav", footer: "footer", link: "a", form: "form",
    input: "input", textarea: "textarea", card: "article",
    spacer: "div", divider: "hr", quote: "blockquote",
    list: "ul", code: "pre", table: "table",
  };
  if (el.type === "heading") {
    const level = el.props?.level || "h2";
    return ["h1", "h2", "h3", "h4", "h5", "h6"].includes(level) ? level : "h2";
  }
  return map[el.type] || "div";
}

function elementToHTML(el: any, indent: number): string {
  const pad = "  ".repeat(indent);
  const tag = getTag(el);
  const className = `el-${el.id?.replace(/[^a-zA-Z0-9-_]/g, "") || "unknown"}`;
  const selfClosing = ["img", "input", "hr"].includes(tag);

  let attrs = ` class="${className}"`;
  if (el.type === "image") attrs += ` src="${el.props?.src || ""}" alt="${el.props?.alt || ""}" loading="lazy"`;
  if (el.type === "video") attrs += ` src="${el.props?.src || ""}" controls playsinline`;
  if ((el.type === "button" || el.type === "link") && el.props?.href) {
    const href = el.props.href.startsWith("#") ? `${el.props.href.slice(1) || "index"}.html` : el.props.href;
    attrs += ` href="${href}"`;
  }
  if (el.type === "input") attrs += ` type="${el.props?.inputType || "text"}" placeholder="${el.props?.placeholder || ""}"`;
  if (el.props?.anchorId) attrs += ` id="${el.props.anchorId}"`;

  if (selfClosing) return `${pad}<${tag}${attrs} />`;

  let content = "";
  if (["heading", "text", "button", "link", "badge"].includes(el.type)) {
    content = escapeHTML(el.props?.text || "");
  } else if (el.type === "quote") {
    content = `<p>${escapeHTML(el.props?.text || "")}</p>`;
  } else if (el.type === "list") {
    const items = el.props?.items || ["Item 1"];
    content = items.map((i: string) => `<li>${escapeHTML(i)}</li>`).join("\n    ");
  }

  const children = el.children?.length
    ? "\n" + el.children.map((c: any) => elementToHTML(c, indent + 1)).join("\n")
    : "";

  const inner = content ? `\n${pad}  ${content}` : "";
  return `${pad}<${tag}${attrs}>${inner}${children}\n${pad}</${tag}>`;
}

function generateBasicJS(): string {
  return `// Quooro Site Engine
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
  var animEls = document.querySelectorAll('[data-animate]');
  if (animEls.length > 0 && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.1 });
    animEls.forEach(function(el) { obs.observe(el); });
  }
});`;
}
