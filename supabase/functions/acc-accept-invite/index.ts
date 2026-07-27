// Accepts an accountant invite token. Requires the user's JWT.
// Creates/updates an acc_org_members row (role='accountant'), marks invite accepted.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization' }, 401);

    const supaAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const supaUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: u } = await supaUser.auth.getUser();
    if (!u?.user) return json({ error: 'Not authenticated' }, 401);
    const userId = u.user.id;
    const userEmail = (u.user.email || '').toLowerCase();

    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || '').trim();
    if (!token) return json({ error: 'Missing token' }, 400);

    const { data: invite, error: invErr } = await supaAdmin
      .from('acc_accountant_invites')
      .select('id, org_id, email, status, expires_at')
      .eq('token', token)
      .maybeSingle();
    if (invErr) return json({ error: invErr.message }, 500);
    if (!invite) return json({ error: 'Invite not found' }, 404);
    if (invite.status !== 'pending') return json({ error: `Invite ${invite.status}` }, 400);
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      await supaAdmin.from('acc_accountant_invites').update({ status: 'expired' }).eq('id', invite.id);
      return json({ error: 'Invite expired' }, 400);
    }
    if (invite.email.toLowerCase() !== userEmail) {
      return json({ error: `This invite is for ${invite.email}. Please sign in with that email.` }, 403);
    }

    // Upsert org membership as accountant.
    const { error: memErr } = await supaAdmin
      .from('acc_org_members')
      .upsert(
        { org_id: invite.org_id, user_id: userId, role: 'accountant' },
        { onConflict: 'org_id,user_id' },
      );
    if (memErr) return json({ error: memErr.message }, 500);

    await supaAdmin.from('acc_accountant_invites').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_user_id: userId,
    }).eq('id', invite.id);

    return json({ ok: true, org_id: invite.org_id });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
