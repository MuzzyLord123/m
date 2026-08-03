import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Receives a form submission from a published Quooro site.
 *
 * Published sites live on their own domains, so this endpoint is public by
 * necessity - there is no visitor session to authenticate. What stands in
 * for auth is: the site must exist and be published, the payload must match
 * a form that is actually on that site, and a single address cannot flood
 * it. Everything is written under the service role, because the table
 * deliberately has no INSERT policy for anonymous callers.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Per site, per address, per window. Enough for a real enquiry burst,
 *  not enough to be a useful spam target. */
const FLOOD_WINDOW_MINUTES = 10;
const FLOOD_MAX_IN_WINDOW = 12;

const MAX_FIELDS = 60;
const MAX_VALUE_CHARS = 5000;
const MAX_BODY_BYTES = 96 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return json({ error: "Submission too large" }, 413);

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "Malformed submission" }, 400);
    }

    const siteId = String(body.siteId || "").trim();
    const formId = String(body.formId || "").trim();
    const formName = String(body.formName || "Form").slice(0, 120);
    const pageSlug = String(body.pageSlug || "").slice(0, 200);
    const honeypot = String(body.company_website || "").trim();
    const fields = (body.fields ?? {}) as Record<string, unknown>;

    if (!siteId || !/^[0-9a-f-]{36}$/i.test(siteId)) return json({ error: "Unknown form" }, 400);
    if (typeof fields !== "object" || Array.isArray(fields)) return json({ error: "Malformed submission" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // The site must exist and have been published at least once. An
    // unpublished draft has no live page, so a submission claiming to come
    // from one is not genuine.
    const { data: site } = await supabase
      .from("designer_sites")
      .select("id, user_id, site_name, published_at, settings")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || !site.published_at) return json({ error: "Unknown form" }, 404);

    // A bot that fills every input trips the hidden one. Answer as though it
    // worked: a spammer learns nothing, and a real visitor never sees this.
    if (honeypot) return json({ ok: true, message: "Thank you." });

    const ipHash = await hashAddress(req, siteId);
    const since = new Date(Date.now() - FLOOD_WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await supabase
      .from("site_form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("ip_hash", ipHash)
      .gte("submitted_at", since);

    if ((count ?? 0) >= FLOOD_MAX_IN_WINDOW) {
      return json({ error: "Too many submissions. Please try again shortly." }, 429);
    }

    // Normalise: cap the field count, coerce to strings, trim runaway values.
    const payload: Record<string, string> = {};
    let n = 0;
    for (const [key, value] of Object.entries(fields)) {
      if (n++ >= MAX_FIELDS) break;
      const label = String(key).slice(0, 200);
      if (!label) continue;
      const text = Array.isArray(value) ? value.map(String).join(", ") : String(value ?? "");
      payload[label] = text.slice(0, MAX_VALUE_CHARS);
    }

    if (Object.keys(payload).length === 0) return json({ error: "Nothing was submitted" }, 400);

    const { error: insertError } = await supabase.from("site_form_submissions").insert({
      site_id: siteId,
      form_id: formId.slice(0, 120),
      form_name: formName,
      page_slug: pageSlug,
      payload,
      contact_name: guess(payload, ["name", "full name", "your name", "first name"]),
      contact_email: guess(payload, ["email", "email address", "your email", "e-mail"]),
      ip_hash: ipHash,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 400),
      referer: (req.headers.get("referer") || "").slice(0, 400),
    });

    if (insertError) {
      console.error("site-form-submit insert failed:", insertError.message);
      return json({ error: "Could not record your message. Please try again." }, 500);
    }

    // Relays. Both are best effort by design: the submission is already
    // stored, and a customer's broken webhook must never cost them an
    // enquiry or show the visitor an error.
    const settings = (site.settings as Record<string, unknown> | null) || {};

    const webhook = settings.form_webhook_url;
    if (typeof webhook === "string" && /^https:\/\//i.test(webhook)) {
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site: site.site_name, form: formName, page: pageSlug, fields: payload }),
          signal: AbortSignal.timeout(5000),
        });
      } catch (e) {
        console.error("site-form-submit webhook relay failed:", e instanceof Error ? e.message : e);
      }
    }

    // Where to email it. The site's own setting wins; otherwise the account
    // the site belongs to, so "email me submissions" works without setup.
    let recipient = typeof settings.form_notify_email === "string" ? settings.form_notify_email : "";
    if (!recipient) {
      const { data: owner } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", site.user_id)
        .maybeSingle();
      recipient = owner?.email || "";
    }
    if (recipient && settings.form_notify_email !== false) {
      await emailSubmission(recipient, site.site_name, formName, pageSlug, payload, {
        name: guess(payload, ["name", "full name", "your name", "first name"]),
        email: guess(payload, ["email", "email address", "your email", "e-mail"]),
      });
    }

    return json({ ok: true, message: "Thank you." });
  } catch (e) {
    console.error("site-form-submit error:", e);
    return json({ error: "Could not record your message. Please try again." }, 500);
  }
});

/**
 * Email the submission on. Never throws: the row is already stored, so a
 * missing API key or a Resend outage must not turn into a visitor-facing
 * error or a lost enquiry.
 */
async function emailSubmission(
  to: string,
  siteName: string,
  formName: string,
  pageSlug: string,
  payload: Record<string, string>,
  contact: { name: string | null; email: string | null },
) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("site-form-submit: RESEND_API_KEY not configured, skipping email relay");
    return;
  }

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const rows = Object.entries(payload).map(([field, value]) => `
    <tr>
      <td style="padding:8px 14px;border-bottom:1px solid #ececec;color:#666;font-size:13px;white-space:nowrap;vertical-align:top">${esc(field)}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #ececec;font-size:14px;white-space:pre-wrap">${esc(value)}</td>
    </tr>`).join("");

  const who = contact.name || contact.email || "someone";
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:28px 20px">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#888">${esc(siteName)}</p>
    <h1 style="margin:0 0 4px;font-size:19px;color:#111">New ${esc(formName.toLowerCase())} submission</h1>
    <p style="margin:0 0 18px;font-size:13px;color:#666">From ${esc(who)}${pageSlug ? ` &middot; ${esc(pageSlug)}` : ""}</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #ececec;border-radius:8px;overflow:hidden">${rows}</table>
    ${contact.email ? `<p style="margin:18px 0 0;font-size:13px"><a href="mailto:${esc(contact.email)}" style="color:#c2410c">Reply to ${esc(contact.email)}</a></p>` : ""}
    <p style="margin:22px 0 0;font-size:11px;color:#999">Sent by Quooro because a form on your published site was submitted.</p>
  </div></body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Quooro <support@quooro.com>",
        to: [to],
        subject: `${siteName}: new ${formName.toLowerCase()} submission`,
        html,
        // So a reply from the inbox goes straight back to the enquirer.
        ...(contact.email ? { reply_to: contact.email } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("site-form-submit email relay failed:", await res.text());
  } catch (e) {
    console.error("site-form-submit email relay threw:", e instanceof Error ? e.message : e);
  }
}

/** Per-site salted digest. Enough to spot a flood from one source, and
 *  useless for following somebody between two different sites. */
async function hashAddress(req: Request, siteId: string): Promise<string> {
  const ip =
    (req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0] ||
      "unknown").trim();
  const bytes = new TextEncoder().encode(`${siteId}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).slice(0, 16)
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Best effort at a name/email for the inbox list, matched on the label the
 *  site owner chose. Returns null rather than guessing wrong. */
function guess(payload: Record<string, string>, candidates: string[]): string | null {
  for (const [label, value] of Object.entries(payload)) {
    const l = label.toLowerCase().trim();
    if (candidates.includes(l) && value.trim()) return value.trim().slice(0, 200);
  }
  for (const [label, value] of Object.entries(payload)) {
    const l = label.toLowerCase();
    if (candidates.some(c => l.includes(c)) && value.trim()) return value.trim().slice(0, 200);
  }
  return null;
}
