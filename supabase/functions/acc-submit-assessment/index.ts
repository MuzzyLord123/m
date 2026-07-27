// Handles the "send my books to be assessed" hand-off.
//   target='accountant' -> lock the period (acc_accounting_periods) + notify accountant users
//   target='email'      -> send the PDF pack from the caller's connected email account
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) return j({ error: 'unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return j({ error: 'unauthorized' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = await req.json();
    const {
      orgId, target, period, note, email, sendingAccountId, filename,
      pdfBase64, attachmentBase64, contentType,
      summary = [],
    } = body || {};
    const attachB64: string | null = attachmentBase64 || pdfBase64 || null;
    const attachType: string = contentType || 'application/pdf';

    if (!orgId || !target || !period?.from || !period?.to || !filename || !attachB64) {
      return j({ error: 'Missing required fields' }, 400);
    }
    if (target !== 'accountant' && target !== 'email') return j({ error: 'Invalid target' }, 400);

    // Verify caller is owner/admin of this org
    const { data: caller } = await admin.from('acc_org_members')
      .select('role').eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
    if (!caller || !['owner', 'admin'].includes(caller.role)) {
      return j({ error: 'Only the org owner can submit for assessment' }, 403);
    }

    const { data: org } = await admin.from('acc_organizations')
      .select('id, name').eq('id', orgId).maybeSingle();
    if (!org) return j({ error: 'org not found' }, 404);

    const summaryHtml = Array.isArray(summary) && summary.length
      ? `<ul style="padding-left:18px;color:#333;font-size:13px">
          ${(summary as any[]).map((c) => `<li>${c.ok ? '✅' : '⚠️'} ${escapeHtml(c.label)}${c.detail ? ` — <span style="color:#888">${escapeHtml(c.detail)}</span>` : ''}</li>`).join('')}
        </ul>`
      : '';

    /* ---------- Path A: in-app accountant ---------- */
    if (target === 'accountant') {
      // Lock the period as closed for review
      const { error: pErr } = await admin.from('acc_accounting_periods').upsert({
        org_id: orgId, start_date: period.from, end_date: period.to,
        status: 'closed', closed_by: user.id, closed_at: new Date().toISOString(),
      } as any, { onConflict: 'org_id,start_date,end_date' } as any);
      if (pErr) console.warn('[acc-submit-assessment] period lock warn', pErr);

      const { data: accountants } = await admin.from('acc_org_members')
        .select('user_id').eq('org_id', orgId).eq('role', 'accountant');
      if (!accountants || accountants.length === 0) {
        return j({ error: 'No accountant is linked to this organisation' }, 400);
      }

      const rows = accountants.map(a => ({
        user_id: a.user_id,
        type: 'accountant_submission',
        title: `${org.name}: books submitted for review`,
        message: `Period ${period.from} → ${period.to} has been sent for assessment${note ? ` — “${String(note).slice(0, 200)}”` : ''}.`,
        icon: 'FileText',
        link: `/lounge/accounting`,
        metadata: {
          orgId, period, note: note || null,
          summary, filename, submittedBy: user.id,
        },
      }));
      const { error: nErr } = await admin.from('notifications').insert(rows);
      if (nErr) return j({ error: nErr.message }, 400);

      return j({ ok: true, notified: accountants.length, periodLocked: true });
    }

    /* ---------- Path B: email PDF ---------- */
    if (!email || !sendingAccountId) return j({ error: 'Email + sending account required' }, 400);

    const { data: acct } = await admin.from('email_accounts')
      .select('id, user_id, provider, email_address, display_name, access_token')
      .eq('id', sendingAccountId).eq('user_id', user.id).maybeSingle();
    if (!acct) return j({ error: 'Sending account not found' }, 404);
    if (!acct.access_token) return j({ error: 'Reconnect your email account first' }, 400);

    const subject = `${org.name} — Accountant Pack (${period.from} to ${period.to})`;
    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#111">
        <h2 style="margin:0 0 8px">Accountant Pack — ${escapeHtml(org.name)}</h2>
        <p style="color:#555;margin:0 0 12px">Period: <strong>${escapeHtml(period.from)}</strong> → <strong>${escapeHtml(period.to)}</strong></p>
        ${note ? `<p style="background:#f7f7fb;border-left:3px solid #10b981;padding:8px 12px;border-radius:4px">${escapeHtml(String(note))}</p>` : ''}
        <p>The full pack (Trial Balance, P&amp;L, Balance Sheet, Cash Flow, VAT summary, AR/AP, journals) is attached as a PDF.</p>
        <h4 style="margin:20px 0 6px">Automated checks</h4>
        ${summaryHtml}
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="font-size:11px;color:#999">Generated by Quooro Accounting from the live ledger.</p>
      </div>`.trim();

    if (acct.provider === 'google') {
      // Build a RFC 2822 multipart message with a base64 PDF attachment
      const boundary = `qb_${crypto.randomUUID().replace(/-/g, '')}`;
      const from = acct.display_name ? `${acct.display_name} <${acct.email_address}>` : acct.email_address;
      const raw = [
        `From: ${from}`,
        `To: ${email}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        htmlBody,
        '',
        `--${boundary}`,
        `Content-Type: ${attachType}; name="${filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${filename}"`,
        '',
        (attachB64 as string).match(/.{1,76}/g)?.join('\n') || attachB64,
        '',
        `--${boundary}--`,
      ].join('\r\n');

      // Gmail expects url-safe base64 of the raw MIME
      const rawB64 = btoa(unescape(encodeURIComponent(raw)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${acct.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: rawB64 }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.error('[acc-submit-assessment] gmail send failed', resp.status, t);
        let detail = t; try { detail = JSON.parse(t)?.error?.message || t; } catch {}
        const hint = resp.status === 401 ? 'Your Gmail token has expired — reconnect the account in Settings → Email.'
          : resp.status === 403 ? 'Gmail rejected the send. The connected account may be missing the gmail.send scope — reconnect to grant it.'
          : resp.status === 413 ? 'Attachment too large for Gmail (25 MB max). Try the PDF-only format or a shorter period.'
          : 'Gmail refused the message. Check the recipient address and try again.';
        return j({ error: `Gmail send failed (${resp.status})`, detail, hint, provider: 'gmail', status: resp.status }, 400);
      }
      return j({ ok: true, via: 'gmail', recipient: email, from: acct.email_address });
    }

    if (acct.provider === 'microsoft' || acct.provider === 'outlook') {
      const resp = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: { Authorization: `Bearer ${acct.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: 'HTML', content: htmlBody },
            toRecipients: [{ emailAddress: { address: email } }],
            attachments: [{
              '@odata.type': '#microsoft.graph.fileAttachment',
              name: filename,
              contentType: attachType,
              contentBytes: attachB64,
            }],
          },
          saveToSentItems: true,
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.error('[acc-submit-assessment] graph send failed', resp.status, t);
        let detail = t; try { detail = JSON.parse(t)?.error?.message || t; } catch {}
        const hint = resp.status === 401 ? 'Your Microsoft token has expired — reconnect the account in Settings → Email.'
          : resp.status === 403 ? 'Outlook rejected the send. The connected account may be missing Mail.Send — reconnect to grant it.'
          : resp.status === 413 ? 'Attachment too large for Outlook. Try the PDF-only format or a shorter period.'
          : 'Outlook refused the message. Check the recipient address and try again.';
        return j({ error: `Outlook send failed (${resp.status})`, detail, hint, provider: 'microsoft', status: resp.status }, 400);
      }
      return j({ ok: true, via: 'microsoft', recipient: email, from: acct.email_address });
    }

    return j({ error: `Provider "${acct.provider}" not supported for sending. Connect Gmail or Microsoft.` }, 400);
  } catch (e: any) {
    console.error('[acc-submit-assessment] unexpected', e);
    return j({ error: e?.message || 'Unexpected error' }, 500);
  }
});
