import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

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

    const { action, accountId, messageId, updates } = await req.json();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "sync": {
        // Get the account
        const { data: account, error: accErr } = await adminClient
          .from("email_accounts")
          .select("*")
          .eq("id", accountId)
          .eq("user_id", userId)
          .single();

        if (accErr || !account) {
          return new Response(JSON.stringify({ error: "Account not found" }), { status: 404, headers });
        }

        if (account.provider === "gmail") {
          return await syncGmail(adminClient, account, userId, headers);
        } else if (account.provider === "outlook") {
          return await syncOutlook(adminClient, account, userId, headers);
        } else {
          // For custom IMAP — placeholder
          return new Response(JSON.stringify({ error: "IMAP sync not yet implemented. Use Gmail or Outlook OAuth." }), { status: 400, headers });
        }
      }

      case "send": {
        const { data: account } = await adminClient
          .from("email_accounts")
          .select("*")
          .eq("id", accountId)
          .eq("user_id", userId)
          .single();

        if (!account) {
          return new Response(JSON.stringify({ error: "Account not found" }), { status: 404, headers });
        }

        if (account.provider === "gmail") {
          return await sendGmail(adminClient, account, updates, headers);
        } else if (account.provider === "outlook") {
          return await sendOutlook(adminClient, account, updates, headers);
        }

        return new Response(JSON.stringify({ error: "Send not supported for this provider" }), { status: 400, headers });
      }

      case "mark_read": {
        await adminClient
          .from("email_messages")
          .update({ is_read: updates.is_read })
          .eq("id", messageId)
          .eq("user_id", userId);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      case "star": {
        await adminClient
          .from("email_messages")
          .update({ is_starred: updates.is_starred })
          .eq("id", messageId)
          .eq("user_id", userId);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      case "move": {
        await adminClient
          .from("email_messages")
          .update({ folder: updates.folder })
          .eq("id", messageId)
          .eq("user_id", userId);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      case "delete": {
        await adminClient
          .from("email_messages")
          .update({ folder: "trash" })
          .eq("id", messageId)
          .eq("user_id", userId);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers });
    }
  } catch (err) {
    console.error("email-sync error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});

// ===================== GMAIL SYNC =====================
async function syncGmail(adminClient: any, account: any, userId: string, headers: Record<string, string>) {
  const accessToken = await getValidGmailToken(adminClient, account);
  if (!accessToken) {
    await adminClient.from("email_accounts").update({ status: "error", error_message: "Token expired. Please reconnect." }).eq("id", account.id);
    return new Response(JSON.stringify({ error: "Gmail token expired" }), { status: 401, headers });
  }

  try {
    // Fetch messages list
    const query = account.sync_cursor 
      ? `?maxResults=50&pageToken=${account.sync_cursor}`
      : "?maxResults=50&labelIds=INBOX";

    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      const errBody = await listRes.text();
      throw new Error(`Gmail list failed [${listRes.status}]: ${errBody}`);
    }

    const listData = await listRes.json();
    const messageIds = (listData.messages || []).map((m: any) => m.id);

    // Fetch each message
    let synced = 0;
    for (const msgId of messageIds) {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!msgRes.ok) continue;

      const msg = await msgRes.json();
      const headersList = msg.payload?.headers || [];
      const getHeader = (name: string) => headersList.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      const fromMatch = getHeader("From").match(/^(.+?)\s*<(.+?)>$/) || [null, getHeader("From"), getHeader("From")];
      const toRaw = getHeader("To");
      const toAddresses = toRaw.split(",").map((t: string) => {
        const m = t.trim().match(/^(.+?)\s*<(.+?)>$/);
        return m ? { name: m[1].trim(), email: m[2] } : { name: t.trim(), email: t.trim() };
      });

      // Extract body
      let bodyHtml = "";
      let bodyText = "";
      function extractParts(part: any) {
        if (part.mimeType === "text/html" && part.body?.data) {
          bodyHtml = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
        } else if (part.mimeType === "text/plain" && part.body?.data) {
          bodyText = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
        }
        if (part.parts) part.parts.forEach(extractParts);
      }
      extractParts(msg.payload);

      const labels = msg.labelIds || [];
      let folder = "inbox";
      if (labels.includes("SENT")) folder = "sent";
      else if (labels.includes("DRAFT")) folder = "drafts";
      else if (labels.includes("TRASH")) folder = "trash";
      else if (labels.includes("SPAM")) folder = "spam";

      let category = "primary";
      if (labels.includes("CATEGORY_PROMOTIONS")) category = "promotions";
      else if (labels.includes("CATEGORY_SOCIAL")) category = "social";
      else if (labels.includes("CATEGORY_UPDATES")) category = "updates";

      const attachments = (msg.payload?.parts || [])
        .filter((p: any) => p.filename && p.filename.length > 0)
        .map((p: any) => ({ name: p.filename, size: p.body?.size?.toString() || "0", type: p.mimeType }));

      await adminClient.from("email_messages").upsert({
        account_id: account.id,
        user_id: userId,
        provider_message_id: msgId,
        thread_id: msg.threadId,
        from_name: fromMatch[1]?.trim() || "",
        from_email: fromMatch[2]?.trim() || "",
        to_addresses: toAddresses,
        subject: getHeader("Subject"),
        snippet: msg.snippet || "",
        body_html: bodyHtml,
        body_text: bodyText,
        date: new Date(parseInt(msg.internalDate)).toISOString(),
        is_read: !labels.includes("UNREAD"),
        is_starred: labels.includes("STARRED"),
        is_draft: labels.includes("DRAFT"),
        has_attachments: attachments.length > 0,
        attachments,
        labels,
        folder,
        category,
      }, { onConflict: "account_id,provider_message_id" });

      synced++;
    }

    // Update sync cursor
    await adminClient.from("email_accounts").update({
      last_sync_at: new Date().toISOString(),
      sync_cursor: listData.nextPageToken || null,
      status: "active",
      error_message: null,
    }).eq("id", account.id);

    return new Response(JSON.stringify({ success: true, synced }), { status: 200, headers });
  } catch (err) {
    console.error("Gmail sync error:", err);
    await adminClient.from("email_accounts").update({ status: "error", error_message: err.message }).eq("id", account.id);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

async function getValidGmailToken(adminClient: any, account: any): Promise<string | null> {
  if (account.token_expires_at && new Date(account.token_expires_at) > new Date()) {
    return account.access_token;
  }

  // Refresh token
  const clientId = Deno.env.get("GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  if (!clientId || !clientSecret || !account.refresh_token) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();

  await adminClient.from("email_accounts").update({
    access_token: data.access_token,
    token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }).eq("id", account.id);

  return data.access_token;
}

async function sendGmail(adminClient: any, account: any, email: any, headers: Record<string, string>) {
  const accessToken = await getValidGmailToken(adminClient, account);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Gmail token expired" }), { status: 401, headers });
  }

  const rawEmail = [
    `From: ${account.display_name || account.email_address} <${account.email_address}>`,
    `To: ${email.to}`,
    `Subject: ${email.subject}`,
    `Content-Type: text/html; charset=utf-8`,
    "",
    email.body,
  ].join("\r\n");

  const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: `Send failed: ${err}` }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}

// ===================== OUTLOOK SYNC =====================
async function syncOutlook(adminClient: any, account: any, userId: string, headers: Record<string, string>) {
  const accessToken = await getValidOutlookToken(adminClient, account);
  if (!accessToken) {
    await adminClient.from("email_accounts").update({ status: "error", error_message: "Token expired. Please reconnect." }).eq("id", account.id);
    return new Response(JSON.stringify({ error: "Outlook token expired" }), { status: 401, headers });
  }

  try {
    const url = account.sync_cursor
      ? account.sync_cursor
      : "https://graph.microsoft.com/v1.0/me/messages?$top=50&$orderby=receivedDateTime desc&$select=id,conversationId,from,toRecipients,ccRecipients,subject,bodyPreview,body,receivedDateTime,isRead,flag,hasAttachments,attachments,categories";

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Outlook fetch failed [${res.status}]: ${errBody}`);
    }

    const data = await res.json();
    let synced = 0;

    for (const msg of (data.value || [])) {
      const fromAddr = msg.from?.emailAddress || {};
      const toAddresses = (msg.toRecipients || []).map((r: any) => ({
        name: r.emailAddress?.name || "",
        email: r.emailAddress?.address || "",
      }));

      await adminClient.from("email_messages").upsert({
        account_id: account.id,
        user_id: userId,
        provider_message_id: msg.id,
        thread_id: msg.conversationId,
        from_name: fromAddr.name || "",
        from_email: fromAddr.address || "",
        to_addresses: toAddresses,
        subject: msg.subject || "",
        snippet: msg.bodyPreview || "",
        body_html: msg.body?.contentType === "html" ? msg.body.content : "",
        body_text: msg.body?.contentType === "text" ? msg.body.content : "",
        date: msg.receivedDateTime,
        is_read: msg.isRead || false,
        is_starred: msg.flag?.flagStatus === "flagged",
        has_attachments: msg.hasAttachments || false,
        folder: "inbox",
        category: "primary",
      }, { onConflict: "account_id,provider_message_id" });

      synced++;
    }

    await adminClient.from("email_accounts").update({
      last_sync_at: new Date().toISOString(),
      sync_cursor: data["@odata.nextLink"] || null,
      status: "active",
      error_message: null,
    }).eq("id", account.id);

    return new Response(JSON.stringify({ success: true, synced }), { status: 200, headers });
  } catch (err) {
    console.error("Outlook sync error:", err);
    await adminClient.from("email_accounts").update({ status: "error", error_message: err.message }).eq("id", account.id);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

async function getValidOutlookToken(adminClient: any, account: any): Promise<string | null> {
  if (account.token_expires_at && new Date(account.token_expires_at) > new Date()) {
    return account.access_token;
  }

  const clientId = Deno.env.get("OUTLOOK_CLIENT_ID");
  const clientSecret = Deno.env.get("OUTLOOK_CLIENT_SECRET");
  if (!clientId || !clientSecret || !account.refresh_token) return null;

  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
      scope: "https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();

  await adminClient.from("email_accounts").update({
    access_token: data.access_token,
    refresh_token: data.refresh_token || account.refresh_token,
    token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }).eq("id", account.id);

  return data.access_token;
}

async function sendOutlook(adminClient: any, account: any, email: any, headers: Record<string, string>) {
  const accessToken = await getValidOutlookToken(adminClient, account);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Outlook token expired" }), { status: 401, headers });
  }

  const toRecipients = email.to.split(",").map((e: string) => ({
    emailAddress: { address: e.trim() },
  }));

  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject: email.subject,
        body: { contentType: "HTML", content: email.body },
        toRecipients,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: `Send failed: ${err}` }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}
