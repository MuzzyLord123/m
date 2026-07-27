import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401, corsHeaders);

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const svc  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401, corsHeaders);

    // Caller must be an admin
    const { data: role } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Only admins can create admin accounts' }, 403, corsHeaders);

    const body = await req.json();
    const action = body.action || 'create';

    if (action === 'create') {
      const { email, password, fullName } = body;
      if (!email || !password) return json({ error: 'email and password required' }, 400, corsHeaders);

      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: fullName || email.split('@')[0] },
      });
      if (cErr || !created.user) return json({ error: cErr?.message || 'Create failed' }, 400, corsHeaders);

      // Upsert admin role (profile is created by handle_new_user trigger)
      await admin.from('user_roles').upsert({ user_id: created.user.id, role: 'admin' } as any, { onConflict: 'user_id,role' });
      if (fullName) await admin.from('profiles').update({ full_name: fullName }).eq('user_id', created.user.id);

      return json({ ok: true, user_id: created.user.id }, 200, corsHeaders);
    }

    if (action === 'revoke') {
      const { userId } = body;
      if (!userId) return json({ error: 'userId required' }, 400, corsHeaders);
      // Protect owners
      const { data: prof } = await admin.from('profiles').select('is_owner').eq('user_id', userId).maybeSingle();
      if (prof?.is_owner) return json({ error: 'Owners cannot be demoted' }, 403, corsHeaders);
      await admin.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      return json({ ok: true }, 200, corsHeaders);
    }

    return json({ error: 'Unknown action' }, 400, corsHeaders);
  } catch (e: any) {
    return json({ error: e?.message || 'Server error' }, 500, getCorsHeaders(req));
  }
});

function json(body: any, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}
