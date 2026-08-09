import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwner } from '@/hooks/usePlatformOwner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

/*
 * The door to the Agent Office, inside the admin dashboard.
 *
 * Two people hold keys - the founder and Zak - and walking through it
 * should feel like entering the most serious room in the building. So
 * the entry sequence is theatre built ONLY from real checks: the owner
 * key is the live am_i_platform_owner rpc, the roster line is a live
 * count of seats and teams, and nothing animates that is not true. A
 * non-owner gets the honest lock, not an error.
 *
 * The office itself (three.js scene + Jarvis console) loads lazily
 * behind the ENTER press, so the gate paints instantly.
 */

const AgentOffice = lazy(() => import('@/pages/lounge/AgentOffice'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string) => (supabase as any).from(table);

type Check = 'pending' | 'ok' | 'failed';

export default function AgentOfficeGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOwner, loading: ownerLoading } = usePlatformOwner();
  const [roster, setRoster] = useState<{ seats: number; teams: number } | null>(null);
  const [rosterState, setRosterState] = useState<Check>('pending');
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  /* The roster line is a real read, gated on the real key. */
  useEffect(() => {
    if (ownerLoading || !isOwner) return;
    let alive = true;
    (async () => {
      const [a, t] = await Promise.all([
        from('agents').select('id').eq('is_active', true),
        from('agent_teams').select('id'),
      ]);
      if (!alive) return;
      if (a.error || t.error) { setRosterState('failed'); return; }
      setRoster({ seats: (a.data ?? []).length, teams: (t.data ?? []).length });
      setRosterState('ok');
    })();
    return () => { alive = false; };
  }, [ownerLoading, isOwner]);

  const keyState: Check = ownerLoading ? 'pending' : isOwner ? 'ok' : 'failed';
  const armed = keyState === 'ok' && rosterState !== 'pending';

  const enter = () => {
    if (!armed) return;
    if (reduced) { setEntered(true); return; }
    setLeaving(true);
    setTimeout(() => setEntered(true), 650);
  };

  if (entered) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#050b16]">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-200/60" />
        </div>
      }>
        <AgentOffice />
      </Suspense>
    );
  }

  const Row = ({ label, state, detail }: { label: string; state: Check; detail: string }) => (
    <div className="flex items-center justify-between border-b border-cyan-300/[0.07] py-2.5 last:border-0">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className={cn('flex items-center gap-2 font-mono text-[10.5px] tracking-[0.04em]',
        state === 'ok' ? 'text-cyan-200' : state === 'failed' ? 'text-rose-300' : 'text-slate-500')}>
        {state === 'pending' && <Loader2 className="h-3 w-3 animate-spin" />}
        {state === 'ok' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
        {state === 'failed' && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
        {detail}
      </span>
    </div>
  );

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#050b16] text-slate-200',
      'transition-opacity duration-500', leaving && 'opacity-0',
    )}>
      {/* the room behind the glass: a faint grid, one slow scan */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.045) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      <div aria-hidden className={cn(
        'pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent',
        !reduced && 'animate-[gate-scan_5s_ease-in-out_infinite]',
      )} style={{ top: '30%' }} />
      <style>{'@keyframes gate-scan { 0%,100% { transform: translateY(-120px); opacity:.0 } 12% { opacity:.8 } 50% { transform: translateY(160px); opacity:.25 } 88% { opacity:.8 } }'}</style>

      <button onClick={() => navigate('/dashboard?tab=command-center')}
        className="absolute left-5 top-5 flex items-center gap-1.5 rounded-[8px] border border-cyan-300/15 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-cyan-200/70 hover:bg-cyan-300/10">
        <ArrowLeft className="h-3 w-3" /> Admin
      </button>

      <div className={cn('relative w-[420px] max-w-[92vw]', !reduced && 'animate-in fade-in slide-in-from-bottom-2 duration-700')}>
        <div className="mb-7 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-[12px] border border-cyan-300/25 bg-cyan-400/[0.07] text-[19px] font-bold text-cyan-100 shadow-[0_0_50px_-8px_rgba(34,211,238,0.45)]">Q</div>
          <h1 className="mt-4 text-[21px] font-bold tracking-[0.22em] text-cyan-50">AGENT OFFICE</h1>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">
            restricted · platform owners · one seat, one lane
          </p>
        </div>

        <div className="rounded-[12px] border border-cyan-300/10 bg-[#0a1526]/85 px-4 py-2 backdrop-blur-sm">
          <Row label="Owner key" state={keyState}
            detail={keyState === 'pending' ? 'verifying' : keyState === 'ok'
              ? (user?.email || 'verified').toUpperCase() : 'NOT ON THE LIST'} />
          <Row label="Office backend" state={keyState === 'failed' ? 'failed' : rosterState}
            detail={rosterState === 'ok' && roster ? `${roster.seats} SEATS · ${roster.teams} TEAMS` : keyState === 'failed' ? 'UNAVAILABLE' : 'reading'} />
          <Row label="Model policy" state={keyState === 'failed' ? 'failed' : 'ok'}
            detail="RUNS ON YOUR MACHINE ONLY" />
        </div>

        {keyState === 'failed' ? (
          <div className="mt-5 rounded-[12px] border border-rose-300/15 bg-rose-500/[0.05] p-4 text-center">
            <p className="text-[13px] font-semibold text-rose-100">This room is owners-only.</p>
            <p className="mx-auto mt-1 max-w-xs text-[11.5px] leading-relaxed text-slate-400">
              Two people hold keys. If you should be one of them, ask a platform owner to add you.
            </p>
          </div>
        ) : (
          <button onClick={enter} disabled={!armed} aria-label="Enter the Agent Office"
            className={cn(
              'mt-5 w-full rounded-[12px] border py-3.5 font-mono text-[11px] uppercase tracking-[0.3em] transition-all duration-300',
              armed
                ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100 shadow-[0_0_44px_-10px_rgba(34,211,238,0.55)] hover:bg-cyan-400/20'
                : 'cursor-default border-cyan-300/10 text-slate-600',
            )}>
            {armed ? 'Enter the office' : 'Preparing…'}
          </button>
        )}

        <p className="mt-4 text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-slate-600">
          idle costs nothing · a model runs only while your bridge holds a task
        </p>
      </div>
    </div>
  );
}
