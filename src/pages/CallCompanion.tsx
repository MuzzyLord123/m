import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Phone, Radar, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * The phone companion. Opened by scanning the QR in the CRM's Calls
 * workspace while signed in on the phone: it claims the pairing token,
 * then listens for call pushes from the desktop and opens the dialler
 * with the lead's number. Keep the page open while calling.
 */

interface Push {
  id: string;
  phone: string;
  entity_name: string | null;
  created_at: string;
}

export default function CallCompanion() {
  const { user, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'claiming' | 'connected' | 'invalid'>('claiming');
  const [current, setCurrent] = useState<Push | null>(null);
  const handled = useRef<Set<string>>(new Set());

  // Claim the token for this signed-in account.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      if (!token) { setState('invalid'); return; }
      const { data, error } = await supabase.from('crm_phone_links' as any)
        .update({ claimed_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), device_label: 'phone' } as any)
        .eq('token', token)
        .select('id');
      if (cancelled) return;
      if (error || !((data as any[]) || []).length) setState('invalid');
      else setState('connected');
    })();
    return () => { cancelled = true; };
  }, [authLoading, user, token]);

  // Listen for dial requests; open the dialler once per push.
  useEffect(() => {
    if (state !== 'connected' || !user) return;
    const id = setInterval(async () => {
      const { data } = await supabase.from('crm_call_pushes' as any)
        .select('id, phone, entity_name, created_at')
        .is('handled_at', null)
        .gt('created_at', new Date(Date.now() - 10 * 60e3).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      const push = ((data as any[]) || [])[0] as Push | undefined;
      if (push && !handled.current.has(push.id)) {
        handled.current.add(push.id);
        setCurrent(push);
        await supabase.from('crm_call_pushes' as any).update({ handled_at: new Date().toISOString() } as any).eq('id', push.id);
        window.location.href = `tel:${push.phone.replace(/\s+/g, '')}`;
      }
    }, 2500);
    const heartbeat = setInterval(() => {
      supabase.from('crm_phone_links' as any)
        .update({ last_seen_at: new Date().toISOString() } as any)
        .eq('token', token as string);
    }, 30000);
    return () => { clearInterval(id); clearInterval(heartbeat); };
  }, [state, user, token]);

  const kicker = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] text-foreground">
      <header className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-border/60 bg-card">
          <Radar className="h-4 w-4 text-primary" />
        </span>
        <div>
          <p className="font-display text-[15px] font-semibold leading-tight tracking-[-0.01em]">Quooro</p>
          <p className={kicker}>Call companion</p>
        </div>
      </header>
      <div aria-hidden className="mt-4 h-px bg-gradient-to-r from-primary/50 via-border to-transparent" />

      <main className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        {authLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : !user ? (
          <>
            <p className="max-w-xs text-[14px] leading-relaxed text-muted-foreground">
              Sign in to Quooro on this phone first, then scan the QR again.
            </p>
            <Link
              to="/sign-in"
              className="flex h-11 items-center justify-center rounded-[11px] bg-primary px-6 text-[13px] font-medium text-primary-foreground"
            >
              Sign in
            </Link>
          </>
        ) : state === 'claiming' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-[13px] text-muted-foreground">Connecting this phone…</p>
          </>
        ) : state === 'invalid' ? (
          <p className="max-w-xs text-[14px] leading-relaxed text-muted-foreground">
            This link has expired or belongs to another account. Generate a fresh QR from Calls in the CRM and scan again.
          </p>
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ok/10 text-ok">
              <Check className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold tracking-[-0.01em]">Phone connected</p>
              <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
                Keep this page open. When you press Call on desktop, the dialler opens here with the lead's number.
              </p>
            </div>
            {current && (
              <div className="w-full max-w-xs rounded-[12px] border border-border/60 bg-card p-4 text-left">
                <p className={kicker}>Latest call</p>
                <p className="mt-1 truncate text-[15px] font-medium">{current.entity_name || 'Lead'}</p>
                <p className="font-mono text-[12px] tabular-nums text-muted-foreground">{current.phone}</p>
                <a
                  href={`tel:${current.phone.replace(/\s+/g, '')}`}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-primary text-[13px] font-medium text-primary-foreground"
                >
                  <Phone className="h-4 w-4" /> Call again
                </a>
              </div>
            )}
          </>
        )}
      </main>

      <p className="pt-4 text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
        Quooro · Built in Wales
      </p>
    </div>
  );
}
