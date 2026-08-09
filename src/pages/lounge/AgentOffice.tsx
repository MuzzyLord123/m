import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwner } from '@/hooks/usePlatformOwner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { mountOfficeScene, type OfficeSceneHandle } from './agent-office/officeScene';
import { JarvisConsole } from './agent-office/JarvisConsole';
import { MemoryTree } from './agent-office/MemoryTree';
import { BrainRoom } from './agent-office/BrainRoom';
import { Menu, X as XIcon, Terminal, MessageSquare, GitBranch, Brain } from 'lucide-react';
import { useAgentOfficeData, effectiveBridgeStatus } from './agent-office/useAgentOfficeData';

/*
 * The Agent Office. Two people use it: the founder and Zak. Nobody else,
 * ever - the client-side gate below is convenience; the real gate is RLS,
 * where every agent table answers only to platform owners.
 *
 * Two surfaces, two deliberate visual languages:
 *   the Office  - light, architectural, the world view (officeScene)
 *   the Console - dark cyan HUD, Quooro's chat surface (JarvisConsole)
 *
 * And one load-bearing fact, stated here because it is the design: the
 * office animation is a local loop with zero connection to model
 * invocation. A Claude process exists only while a bridge daemon on the
 * operator's own machine is running a claimed task. Idle is free.
 */

export default function AgentOffice() {
  const { user } = useAuth();
  const { isOwner, loading } = usePlatformOwner();
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OfficeSceneHandle | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  /* One drawer, four rooms. 'office' is the room itself, so closing any
     view returns here rather than stacking overlays. */
  const [view, setView] = useState<'office' | 'console' | 'jarvis' | 'tree' | 'brain'>('office');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; preselect: string | null }>({ open: false, preselect: null });
  const [assignee, setAssignee] = useState('team:Site Squad');
  const [brief, setBrief] = useState('');
  const data = useAgentOfficeData(isOwner);

  /* Callback refs: the scene mounts once, but model writes need current
     data. The writes themselves are plain owner-RLS table updates. */
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const teamsRef = useRef<{ id: string; name: string; members: string[] }[]>([]);
  refreshRef.current = data.refresh;
  teamsRef.current = data.teams;

  /* mount the office once, after the gate answers */
  useEffect(() => {
    if (!isOwner || !hostRef.current || sceneRef.current) return;
    const setModelFor = async (roleKeys: string[], patch: { pin: string | null; strict?: boolean; chain?: string[] }) => {
      const update: TablesUpdate<'agents'> = { model_pin: patch.pin };
      if (patch.strict !== undefined) update.strict_pin = patch.strict;
      if (patch.chain !== undefined) update.fallback_chain = patch.chain;
      const { error } = await supabase.from('agents')
        .update(update).in('role_key', roleKeys);
      if (error) toast.error('Model not set', { description: error.message });
      else {
        toast.success(roleKeys.length > 1 ? `Model set for ${roleKeys.length} agents` : 'Model set', {
          description: 'Takes effect on the next task, never mid-run.',
        });
        void refreshRef.current();
      }
    };
    sceneRef.current = mountOfficeScene(hostRef.current, {
      userInitial: (user?.email?.[0] || 'Q').toUpperCase(),
      onNewTask: preselect => setModal({ open: true, preselect }),
      onOpenConsole: () => { setConsoleOpen(true); setView('console'); },
      onSetModel: (roleKey, patch) => { void setModelFor([roleKey], patch); },
      onSetGroupModel: (teamName, pin) => {
        const team = teamsRef.current.find(t => t.name === teamName);
        if (!team || !team.members.length) { toast.error('No agents in that group'); return; }
        void setModelFor(team.members, { pin });
      },
    });
    return () => { sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [isOwner, user?.email]);

  /* real state → the animation layer */
  const anyOnline = data.bridges.some(b => effectiveBridgeStatus(b) === 'online');
  useEffect(() => {
    const s = sceneRef.current; if (!s) return;
    const activeRun = data.runs.find(r => !['done', 'failed', 'cancelled', 'live'].includes(r.status));
    s.setBridgeLine(
      data.bridges.length === 0 ? 'No bridge connected — tasks queue only'
        : anyOnline ? `Bridge online · run: ${activeRun ? (activeRun.current_agent || activeRun.status) : 'none'}`
          : 'Bridge offline — tasks queue until your machine reconnects');
    /* The whole room used to ghost whenever the Claude bridge was down.
       That rule predates the mesh running cloud-side: the office works
       perfectly well without the seat, so ghosting everyone said
       something untrue. Only an agent whose OWN lane is down goes
       translucent now - that happens per-agent below. */
    s.setTranslucent(false);

    /* per-agent state: a queued/claimed task pins its agents to 'assigned',
       a live run pins current_agent to 'working'; everyone else simulates. */
    const byId = new Map(data.agents.map(a => [a.id, a.role_key]));
    const teamKeys = new Map(data.teams.map(t => [t.id, t.members]));
    const pinned = new Map<string, 'assigned' | 'working' | 'failed'>();
    data.tasks.forEach(t => {
      if (t.status !== 'queued' && t.status !== 'claimed' && t.status !== 'running') return;
      const keys = t.agent_id ? [byId.get(t.agent_id) || ''] : (t.team_id ? (teamKeys.get(t.team_id) || []) : []);
      keys.filter(Boolean).forEach(k => pinned.set(k, 'assigned'));
    });
    data.runs.forEach(r => {
      if (['done', 'failed', 'cancelled', 'live'].includes(r.status)) return;
      if (r.current_agent) pinned.set(r.current_agent, 'working');
    });

    /* The mesh on the desks: what each agent resolves to, what it costs,
       and whether its lane can currently think. All database rows. */
    const regById = new Map(data.fleet.registry.map(r => [r.id, r]));
    data.agents.forEach(a => {
      const resolved = a.model_pin ?? a.model_default;
      const reg = resolved ? regById.get(resolved) : undefined;
      const health = resolved ? data.fleet.health[resolved] : undefined;
      const usage = resolved ? data.fleet.usage[resolved] : undefined;
      const cooling = !!(health?.cooldown_until && new Date(health.cooldown_until) > new Date());
      const spent = !!(reg?.rpd && usage && usage.calls >= reg.rpd);
      const throttled = !!resolved && (cooling || !!health?.parked || spent);
      const offline = resolved === 'claude/subscription-bridge' && !anyOnline;
      s.setAgentMesh(a.role_key, {
        model: resolved,
        costClass: a.is_deterministic ? 'script' : (reg?.cost_class ?? null),
        pin: a.model_pin, strict: a.strict_pin === true, chain: a.fallback_chain ?? [],
        throttledUntil: throttled
          ? (health?.cooldown_until ?? usage?.rl_reset_at ?? new Date(new Date().setHours(24, 0, 0, 0)).toISOString())
          : null,
        offline,
      });
      /* a live run outranks a throttle; a throttle outranks idle */
      const runState = pinned.get(a.role_key) ?? null;
      s.setAgentState(a.role_key, runState ?? (offline ? 'offline' : throttled ? 'throttled' : null));
    });
    s.setRegistry(data.fleet.registry.filter(r => r.is_enabled).map(r => {
      const h = data.fleet.health[r.id]; const u = data.fleet.usage[r.id];
      return {
        id: r.id, costClass: r.cost_class,
        healthy: !h?.parked && !(h?.cooldown_until && new Date(h.cooldown_until) > new Date()),
        remaining: r.rpd === null ? null : Math.max(r.rpd - (u?.calls ?? 0), 0),
      };
    }));
    s.setTeams(data.teams.map(t => ({ name: t.name, members: t.members })));
    s.setFleetWall(data.fleet.registry.filter(r => r.is_enabled)
      .map(r => {
        const h = data.fleet.health[r.id]; const u = data.fleet.usage[r.id];
        return {
          id: r.id, costClass: r.cost_class,
          health: h && h.error_rate !== null && (u?.calls ?? 0) > 0 ? 1 - (h.error_rate ?? 0) : null,
          calls: u?.calls ?? null, cap: r.rpd, parked: h?.parked === true,
          cooling: !!(h?.cooldown_until && new Date(h.cooldown_until) > new Date()),
        };
      })
      .sort((x, y) => (y.calls ?? 0) - (x.calls ?? 0)));
    s.setAgentTokens(data.tokensToday);
    /* No caps configured yet, so the meters say so rather than invent. */
    s.setMeters({ fiveHourPct: null, weeklyPct: null });
  }, [data.bridges, data.tasks, data.runs, data.agents, data.teams, data.tokensToday, data.fleet, anyOnline]);

  /* The feed and the visible cascade: real bus lines land in the room's
     terminal, and a tagged fallback shows the switch on the floor. */
  const seenFeed = useRef<Set<string>>(new Set());
  useEffect(() => {
    const s = sceneRef.current; if (!s) return;
    data.messages.slice(-25).forEach(m => {
      if (seenFeed.current.has(m.id)) return;
      seenFeed.current.add(m.id);
      const p = m.payload as { text?: string; fallback_reason?: string };
      if (!p.text || (m.template_key !== 'line' && m.template_key !== 'handoff')) return;
      const toKey = m.to_agent && data.agents.some(a => a.role_key === m.to_agent) ? m.to_agent : null;
      if (p.fallback_reason || /fallback_model|took over/.test(p.text)) s.cascade(p.text, toKey);
      else s.feed(p.text);
    });
  }, [data.messages, data.agents]);

  const options = useMemo(() => ([
    ...data.teams.map(t => ({ value: `team:${t.name}`, label: `Team — ${t.name}` })),
    ...data.agents.map(a => ({ value: `agent:${a.role_key}`, label: `${a.name} — ${a.role_label}` })),
  ]), [data.teams, data.agents]);

  useEffect(() => {
    if (modal.open && modal.preselect) setAssignee(`agent:${modal.preselect}`);
  }, [modal]);

  /* Confirm & dispatch: writes ONE row. No model is called from here -
     the bridge on the operator's machine claims it, or it waits. */
  const dispatch = useCallback(async () => {
    const text = brief.trim();
    if (!text) { toast.error('Write the brief first'); return; }
    try {
      const [kind, name] = assignee.split(':');
      const team = kind === 'team' ? data.teams.find(t => t.name === name) : null;
      const agent = kind === 'agent' ? data.agents.find(a => a.role_key === name) : null;
      await data.queueTask({
        kind: team ? 'group' : 'individual',
        teamId: team?.id ?? null,
        agentId: agent?.id ?? null,
        brief: text,
      });
      const keys = team ? team.members : agent ? [agent.role_key] : [];
      sceneRef.current?.assignMoment(keys);
      sceneRef.current?.feed(`task queued · ${text.slice(0, 46)}`);
      toast.success('Task queued', {
        description: anyOnline ? 'The bridge will claim it now.' : 'It runs when your bridge is next online.',
      });
      setModal({ open: false, preselect: null }); setBrief('');
    } catch (e) {
      toast.error('Not queued', { description: e instanceof Error ? e.message : undefined });
    }
  }, [brief, assignee, data, anyOnline]);

  /* A chat turn goes through the jarvis function, where the three-tier
     cost rule lives: routine turns answered by a free model NOW, decision
     turns queued for the Claude seat behind the daily budget. The
     function writes both sides of the conversation to agent_messages, so
     realtime paints them here - this callback sends and steps back. */
  const sendChat = useCallback(async (text: string) => {
    const { data: out, error } = await supabase.functions.invoke('jarvis', { body: { text } });
    if (error) throw new Error(error.message ?? 'Jarvis unreachable');
    const o = out as { ok?: boolean; error?: string } | null;
    if (o && o.ok === false && o.error) toast.error('Jarvis', { description: o.error });
  }, []);

  /* Start Build: Jarvis declared a brief ready; the HUMAN dispatches.
     The click lands in the existing New Task sheet, prefilled - the
     confirm there stays the one and only dispatch gate. */
  const startBuild = useCallback((briefText: string, assign: string | null) => {
    setBrief(briefText);
    if (assign) {
      const match = options.find(o => o.value.toLowerCase().includes(assign.toLowerCase())
        || o.label.toLowerCase().includes(assign.toLowerCase()));
      if (match) setAssignee(match.value);
    }
    setModal({ open: true, preselect: null });
  }, [options]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isOwner) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-background p-8 text-center">
        <div>
          <p className="text-[15px] font-semibold">The Agent Office is owners-only.</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
            Two people hold keys to this room. If you should be one of them,
            ask a platform owner to add you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div ref={hostRef} className="h-full w-full" />

      {/* The drawer. White on purpose - it belongs to the building, not to
          any one room's palette, so it reads the same over the bright
          office and the black brain room alike. */}
      <button
        onClick={() => setMenuOpen(o => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        className="absolute left-3 top-3 z-[80] flex h-10 w-10 items-center justify-center rounded-[10px] border border-black/10 bg-white text-[#0f1524] shadow-[0_10px_30px_-12px_rgba(16,22,44,.5)] transition hover:bg-white/90"
      >
        {menuOpen ? <XIcon className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <aside
        className={cn(
          'absolute left-0 top-0 z-[75] flex h-full w-[230px] flex-col border-r border-black/10 bg-white transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!menuOpen}
      >
        <div className="flex h-[58px] shrink-0 items-center px-4 pl-16">
          <span className="text-[13.5px] font-bold tracking-tight text-[#0f1524]">
            Quooro <span className="font-medium text-[#97a0b5]">/ Office</span>
          </span>
        </div>
        <nav className="flex flex-col gap-0.5 px-2.5 py-2">
          {([
            { k: 'office', label: 'Office', hint: 'the room', Icon: Menu },
            { k: 'console', label: 'Console', hint: 'runs, queue, feed', Icon: Terminal },
            { k: 'jarvis', label: 'Jarvis', hint: 'talk to the orchestrator', Icon: MessageSquare },
            { k: 'tree', label: 'Tree memory', hint: 'every movement, one line', Icon: GitBranch },
            { k: 'brain', label: 'Brain memory', hint: 'live, per agent', Icon: Brain },
          ] as const).map(({ k, label, hint, Icon }) => (
            <button
              key={k}
              onClick={() => {
                setView(k);
                setConsoleOpen(k === 'console' || k === 'jarvis');
                setMenuOpen(false);
              }}
              className={cn(
                'flex items-start gap-2.5 rounded-[9px] px-2.5 py-2 text-left transition',
                view === k ? 'bg-[#0f1524] text-white' : 'text-[#0f1524] hover:bg-[#f4f6fa]',
              )}
            >
              <Icon className={cn('mt-[2px] h-4 w-4 shrink-0', view === k ? 'text-white' : 'text-[#97a0b5]')} />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold leading-tight">{label}</span>
                <span className={cn('block truncate font-mono text-[8px] uppercase tracking-[0.1em]',
                  view === k ? 'text-white/50' : 'text-[#97a0b5]')}>{hint}</span>
              </span>
            </button>
          ))}
        </nav>
        <p className="mt-auto px-4 pb-4 text-[10px] leading-relaxed text-[#97a0b5]">
          Memory is written by the database from real rows — nothing on these
          pages is a model describing itself.
        </p>
      </aside>

      {menuOpen && (
        <div className="absolute inset-0 z-[70] bg-[#0e1220]/20" onClick={() => setMenuOpen(false)} aria-hidden />
      )}

      <MemoryTree open={view === 'tree'} onClose={() => setView('office')} />
      <BrainRoom
        open={view === 'brain'}
        onClose={() => setView('office')}
        agents={data.agents.map(a => ({ role_key: a.role_key, name: a.name, avatar_colour: a.avatar_colour }))}
      />

      <JarvisConsole
        open={consoleOpen}
        onClose={() => { setConsoleOpen(false); setView('office'); }}
        me={data.me}
        bridges={data.bridges}
        agents={data.agents}
        tasks={data.tasks}
        runs={data.runs}
        messages={data.messages}
        events={data.events}
        totals={data.totals}
        advice={data.advice}
        jarvisBudget={data.jarvisBudget}
        onSendChat={sendChat}
        onCancelTask={data.cancelTask}
        onCreateBridge={data.createBridge}
        onDeleteBridge={data.deleteBridge}
        onNewTask={() => setModal({ open: true, preselect: null })}
        onStartBuild={startBuild}
      />

      {/* New task — Quooro restates nothing here yet; the confirmation
          click IS the dispatch gate, and it writes a queue row only. */}
      {modal.open && (
        <div className="absolute inset-0 z-[70] grid place-items-center bg-[#0e1220]/40 backdrop-blur-[3px]"
          onClick={e => { if (e.target === e.currentTarget) setModal({ open: false, preselect: null }); }}>
          <div className="w-[450px] max-w-[92vw] rounded-[15px] bg-white p-5 text-[#0f1524] shadow-2xl">
            <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">New task</h3>
            <p className="mt-0.5 text-[10.5px] text-[#97a0b5]">
              Queued to your own seat. A model runs only when your bridge claims it.
            </p>
            <label className="mt-4 block font-mono text-[8px] uppercase tracking-[0.12em] text-[#97a0b5]">Assign to</label>
            <select value={assignee} onChange={e => setAssignee(e.target.value)}
              className="mt-1 w-full rounded-[9px] border border-[#e3e7ef] bg-[#fbfcfe] px-2.5 py-2 text-[12px] outline-none focus:border-blue-600">
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <label className="mt-3 block font-mono text-[8px] uppercase tracking-[0.12em] text-[#97a0b5]">Brief</label>
            <textarea value={brief} onChange={e => setBrief(e.target.value)} rows={3}
              placeholder="Five-page site for The Paint Man — painter & decorator, wants enquiries. Home, About, Services, Gallery, Contact."
              className="mt-1 w-full resize-none rounded-[9px] border border-[#e3e7ef] bg-[#fbfcfe] px-2.5 py-2 text-[12px] outline-none focus:border-blue-600" />
            <p className="mt-2.5 rounded-[9px] border border-[#eef1f6] bg-[#f7f9fc] p-2.5 text-[10px] leading-relaxed text-[#97a0b5]">
              <b className="text-[#59637a]">What happens</b> · one row lands in the queue,
              authorised to your seat. {anyOnline ? 'Your bridge is online and will claim it.' : 'No bridge is online — it waits, visibly, and costs nothing while it does.'}
            </p>
            <div className="mt-3.5 flex justify-end gap-2">
              <button onClick={() => setModal({ open: false, preselect: null })}
                className="rounded-[9px] border border-[#e3e7ef] px-3.5 py-2 text-[12px] font-semibold hover:border-[#a9b3c7]">Cancel</button>
              <button onClick={() => void dispatch()}
                className="rounded-[9px] bg-[#0f1524] px-3.5 py-2 text-[12px] font-semibold text-white">Confirm &amp; queue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
