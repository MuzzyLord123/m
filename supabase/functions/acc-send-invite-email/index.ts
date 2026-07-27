// Sends an accountant invite email using the user's connected email account
// (Gmail or Microsoft Graph). Uses the stored OAuth access_token.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) return json({ error: 'unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: userRes } = await userClient.auth.getUser(jwt);
    const user = userRes?.user;
    if (!user) return json({ error: 'unauthorized' }, 401);

    const { inviteId, accountId } = await req.json();
    if (!inviteId || !accountId) return json({ error: 'inviteId & accountId required' }, 400);

    // Load invite + org
    const { data: invite } = await admin.from('acc_accountant_invites')
      .select('id, email, token, org_id, status').eq('id', inviteId).maybeSingle();
    if (!invite) return json({ error: 'invite not found' }, 404);
    if (invite.status !== 'pending') return json({ error: `invite is ${invite.status}` }, 400);

    const { data: org } = await admin.from('acc_organizations')
      .select('id, name, owner_user_id').eq('id', invite.org_id).maybeSingle();
    if (!org || org.owner_user_id !== user.id) return json({ error: 'forbidden' }, 403);

    // Load the sending account (must belong to the caller)
    const { data: acct } = await admin.from('email_accounts')
      .select('id, user_id, provider, email_address, display_name, access_token')
      .eq('id', accountId).eq('user_id', user.id).maybeSingle();
    if (!acct) return json({ error: 'email account not found' }, 404);
    if (!acct.access_token) return json({ error: 'account has no send token — reconnect it' }, 400);

    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || '';
    const inviteUrl = `${origin || 'https://app.quooro.com'}/accountant/accept/${invite.token}`;

    const subject = `You've been invited as accountant for ${org.name}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 12px">You're invited</h2>
        <p>${escapeHtml(acct.display_name || acct.email_address)} has invited you to manage the books for <strong>${escapeHtml(org.name)}</strong> on Quooro.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;background:#10b981;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Accept invite</a></p>
        <p style="font-size:12px;color:#666">Or paste this link into your browser:<br/>${inviteUrl}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:11px;color:#999">Invite expires in 14 days. If you weren't expecting this, ignore this email.</p>
      </div>`.trim();

    if (acct.provider === 'google') {
      await sendViaGmail(acct.access_token, acct.email_address, invite.email, subject, html);
    } else if (acct.provider === 'microsoft' || acct.provider === 'outlook') {
      await sendViaGraph(acct.access_token, invite.email, subject, html);
    } else {
      return json({ error: `Provider "${acct.provider}" not supported for sending. Use a Google or Microsoft account.` }, 400);
    }

    return json({ ok: true });
  } catch (e: any) {
    console.error('acc-send-invite-email error', e);
    return json({ error: e?.message || 'internal error' }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

async function sendViaGmail(token: string, from: string, to: string, subject: string, html: string) {
  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');
  const b64 = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: b64 }),
  });
  if (!r.ok) throw new Error(`Gmail send failed [${r.status}]: ${await r.text()}`);
}

async function sendViaGraph(token: string, to: string, subject: string, html: string) {
  const r = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!r.ok && r.status !== 202) throw new Error(`Graph send failed [${r.status}]: ${await r.text()}`);
}
