// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { orgId, email, password, fullName } = await req.json();
    if (!orgId || !email || !password) return json({ error: 'Missing fields' }, 400);
    if (typeof password !== 'string' || password.length < 12) return json({ error: 'Password must be at least 12 characters' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify caller is an owner/admin of this org
    const { data: caller } = await admin
      .from('acc_org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!caller || !['owner', 'admin'].includes(caller.role)) {
      return json({ error: 'Only the org owner can create accountant logins' }, 403);
    }

    const cleanEmail = String(email).trim().toLowerCase();
    console.log('[acc-create-accountant-login] creating for', { orgId, cleanEmail, caller: user.id });

    // Try to create the auth user first. If it already exists, find & update.
    let accountantUserId: string | null = null;
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName ?? null, role: 'accountant' },
    });

    if (created?.user) {
      accountantUserId = created.user.id;
    } else {
      const msg = (cErr?.message ?? '').toLowerCase();
      const alreadyExists = msg.includes('already') || msg.includes('registered') || msg.includes('exists') || (cErr as any)?.status === 422;
      if (!alreadyExists) {
        console.error('[acc-create-accountant-login] createUser failed', cErr);
        return json({ error: cErr?.message ?? 'Create failed' }, 400);
      }
      // Find existing user by paging through listUsers
      let page = 1;
      let found: any = null;
      while (page <= 20 && !found) {
        const { data: list, error: lErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (lErr) { console.error('[acc-create-accountant-login] listUsers failed', lErr); break; }
        found = list?.users?.find((u: any) => (u.email ?? '').toLowerCase() === cleanEmail);
        if (!list || (list.users?.length ?? 0) < 200) break;
        page++;
      }
      if (!found) return json({ error: 'Login ID exists but user record not found' }, 500);
      accountantUserId = found.id;
      const { error: uErr } = await admin.auth.admin.updateUserById(found.id, { password, email_confirm: true });
      if (uErr) { console.error('[acc-create-accountant-login] updateUser failed', uErr); return json({ error: uErr.message }, 400); }
    }

    // Attach as accountant on this org (idempotent)
    const { error: mErr } = await admin
      .from('acc_org_members')
      .upsert(
        { org_id: orgId, user_id: accountantUserId, role: 'accountant' },
        { onConflict: 'org_id,user_id' },
      );
    if (mErr) { console.error('[acc-create-accountant-login] upsert member failed', mErr); return json({ error: mErr.message }, 400); }

    return json({ ok: true, userId: accountantUserId, email: cleanEmail });
  } catch (e: any) {
    console.error('[acc-create-accountant-login] unexpected', e);
    return json({ error: e?.message ?? 'Unexpected error' }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
