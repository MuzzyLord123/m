import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

/*
 * Everything the Agent Office and the Jarvis console know, in one place.
 *
 * All of it is a view of database state over realtime - two browsers, one
 * truth. Nothing in this hook invokes a model or ever could: the tables it
 * reads are written by the UI (tasks, bridges) and by the bridge daemon on
 * the operator's own machine (runs, events, usage). Idle costs nothing.
 */

/* The row shapes are the generated ones, so a column that moves in the
   database moves here too. Where a query names its columns rather than
   taking `*`, the type is a Pick over exactly that list - widening it
   would promise fields the select never asked for. */
export type BridgeRow = Tables<'bridges'>;
export type AgentRow = Pick<
  Tables<'agents'>,
  'id' | 'role_key' | 'name' | 'role_label' | 'avatar_colour' | 'model_default'
  | 'is_deterministic' | 'floor' | 'capability' | 'model_pin' | 'fallback_chain' | 'strict_pin'
>;
export type FleetRegistryRow = Pick<
  Tables<'model_registry'>,
  'id' | 'display_name' | 'cost_class' | 'capabilities' | 'rpd' | 'is_enabled'
>;
export type FleetHealthRow = Pick<
  Tables<'model_health'>,
  'model_id' | 'parked' | 'cooldown_until' | 'error_rate' | 'median_latency_ms'
>;
export type FleetUsageRow = Pick<Tables<'usage_counters'>, 'model_id' | 'calls' | 'rl_reset_at'>;
export type TaskRow = Tables<'agent_tasks'>;
export type RunRow = Tables<'agent_runs'>;
export type MessageRow = Tables<'agent_messages'>;
export type EventRow = Tables<'agent_events'>;
export type AdviceRow = Tables<'fleet_advice'>;
type UsageLedgerRow = Pick<
  Tables<'usage_ledger'>,
  'agent' | 'model' | 'input_tokens' | 'output_tokens' | 'ts'
>;
export interface TeamRow { id: string; name: string; members: string[] }
/* A type alias rather than an interface on purpose: the RPC is typed as
   `Json`, and only an alias picks up the implicit index signature that lets
   the shape be asserted from Json without laundering it through unknown. */
export type JarvisBudget = {
  budget: number; spent_today: number; remaining: number;
  turns_today: number; off_seat_share: number | null;
};

/* A bridge whose heart stopped beating is offline no matter what its row
   says - the daemon may have been killed without a goodbye. */
export function effectiveBridgeStatus(b: BridgeRow): BridgeRow['status'] {
  if (!b.last_heartbeat) return 'offline';
  if (Date.now() - new Date(b.last_heartbeat).getTime() > 60_000) return 'offline';
  return b.status;
}

export function useAgentOfficeData(enabled: boolean) {
  const { user } = useAuth();
  const [bridges, setBridges] = useState<BridgeRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tokensToday, setTokensToday] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState<{ fiveHour: number; weekHeavy: number; today: number }>({ fiveHour: 0, weekHeavy: 0, today: 0 });
  const [advice, setAdvice] = useState<AdviceRow[]>([]);
  const [jarvisBudget, setJarvisBudget] = useState<JarvisBudget | null>(null);
  const [fleet, setFleet] = useState<{ registry: FleetRegistryRow[]; health: Record<string, FleetHealthRow>; usage: Record<string, FleetUsageRow> }>({ registry: [], health: {}, usage: {} });
  const tick = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled || !user) return;
    /* Tier-0 material and the budget: advisor rows are templated straight
       into the console pane, and the budget line is a database count. */
    void supabase.from('fleet_advice').select('*').gte('ts', new Date(Date.now() - 86400_000).toISOString())
      .order('ts', { ascending: false }).limit(12)
      .then(({ data }) => setAdvice((data ?? []).reverse()));
    void supabase.rpc('jarvis_budget')
      .then(({ data }) => { if (data) setJarvisBudget(data as JarvisBudget); });
    /* The fleet, for nameplates, pickers and the Fleet wall - registry
       rows plus today's counters and health. All owner-read RLS. */
    void Promise.all([
      supabase.from('model_registry').select('id, display_name, cost_class, capabilities, rpd, is_enabled'),
      supabase.from('model_health').select('model_id, parked, cooldown_until, error_rate, median_latency_ms'),
      supabase.from('usage_counters').select('model_id, calls, rl_reset_at').eq('date', new Date().toISOString().slice(0, 10)),
    ]).then(([reg, hp, us]) => {
      const health: Record<string, FleetHealthRow> = {};
      (hp.data ?? []).forEach(h => { health[h.model_id] = h; });
      const usage: Record<string, FleetUsageRow> = {};
      (us.data ?? []).forEach(u => { usage[u.model_id] = u; });
      setFleet({ registry: reg.data ?? [], health, usage });
    });
    const [b, a, t, m, tk, r, msg, ev, ledger] = await Promise.all([
      supabase.from('bridges').select('*').order('created_at'),
      supabase.from('agents').select('id, role_key, name, role_label, avatar_colour, model_default, is_deterministic, floor, capability, model_pin, fallback_chain, strict_pin').eq('is_active', true),
      supabase.from('agent_teams').select('id, name'),
      supabase.from('agent_team_members').select('team_id, agent_id, position'),
      supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(40),
      supabase.from('agent_runs').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('agent_messages').select('*').order('ts', { ascending: false }).limit(60),
      supabase.from('agent_events').select('*').order('id', { ascending: false }).limit(80),
      supabase.from('usage_ledger').select('agent, model, input_tokens, output_tokens, ts')
        .gte('ts', new Date(Date.now() - 7 * 86400_000).toISOString()),
    ]);
    setBridges(b.data ?? []);
    const agentRows = a.data ?? [];
    setAgents(agentRows);
    const members = m.data ?? [];
    setTeams((t.data ?? []).map(team => ({
      ...team,
      members: members.filter(x => x.team_id === team.id)
        .sort((x, y) => x.position - y.position)
        .map(x => agentRows.find(ag => ag.id === x.agent_id)?.role_key || '')
        .filter(Boolean),
    })));
    setTasks(tk.data ?? []);
    setRuns(r.data ?? []);
    setMessages((msg.data ?? []).reverse());
    setEvents((ev.data ?? []).reverse());

    const rows: UsageLedgerRow[] = ledger.data ?? [];
    const now = Date.now();
    const per: Record<string, number> = {};
    let fiveHour = 0, weekHeavy = 0, today = 0;
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    for (const row of rows) {
      const tokens = (row.input_tokens || 0) + (row.output_tokens || 0);
      const at = new Date(row.ts).getTime();
      if (at >= dayStart.getTime()) { per[row.agent] = (per[row.agent] || 0) + tokens; today += tokens; }
      if (now - at <= 5 * 3600_000) fiveHour += tokens;
      if (/opus/i.test(row.model)) weekHeavy += tokens;
    }
    setTokensToday(per);
    setTotals({ fiveHour, weekHeavy, today });
  }, [enabled, user]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!enabled || !user) return;
    /* One channel for the lot. Inserts land incrementally; anything
       heavier (updates, deletes) just re-pulls - these are small tables
       and correctness beats cleverness here. */
    const ch = supabase.channel('agent-office')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bridges' },
        () => { void refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks' },
        () => { void refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_runs' },
        () => { void refresh(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_messages' },
        payload => setMessages(prev => [...prev.slice(-80), payload.new as MessageRow]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_events' },
        payload => setEvents(prev => [...prev.slice(-120), payload.new as EventRow]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fleet_advice' },
        payload => setAdvice(prev => [...prev.slice(-20), payload.new as AdviceRow]))
      .subscribe();
    /* The heartbeat judgement ("online" older than 60s = offline) has to
       re-run even when no row changes arrive. */
    const iv = setInterval(() => { tick.current++; setBridges(prev => [...prev]); }, 20_000);
    return () => { supabase.removeChannel(ch); clearInterval(iv); };
  }, [enabled, user, refresh]);

  /** Queue a task. authorised_by is ALWAYS the signed-in owner - Mode A.
      A non-owner path (the approval tray) writes status 'draft' instead. */
  const queueTask = useCallback(async (input: {
    kind: 'individual' | 'group' | 'chat' | 'test';
    agentId?: string | null; teamId?: string | null; brief: string;
  }) => {
    if (!user) throw new Error('Not signed in');
    const { data, error } = await supabase.from('agent_tasks').insert({
      kind: input.kind,
      agent_id: input.agentId ?? null,
      team_id: input.teamId ?? null,
      brief: input.brief,
      status: 'queued',
      created_by_user_id: user.id,
      authorised_by_user_id: user.id,
    }).select('*').single();
    if (error) throw error;
    return data;
  }, [user]);

  const cancelTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('agent_tasks')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id).in('status', ['draft', 'queued']);
    if (error) throw error;
  }, []);

  /** Create a bridge. The token exists in the browser for one showing and
      never again - only its hash is stored. */
  const createBridge = useCallback(async (label: string) => {
    if (!user) throw new Error('Not signed in');
    const raw = new Uint8Array(32); crypto.getRandomValues(raw);
    const token = Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join('');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    const { error } = await supabase.from('bridges').insert({
      owner_user_id: user.id, label, token_hash: hash,
    });
    if (error) throw error;
    await refresh();
    return token;
  }, [user, refresh]);

  const deleteBridge = useCallback(async (id: string) => {
    const { error } = await supabase.from('bridges').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  return {
    me: user?.id ?? null,
    bridges, agents, teams, tasks, runs, messages, events, tokensToday, totals,
    advice, jarvisBudget, fleet,
    queueTask, cancelTask, createBridge, deleteBridge, refresh,
  };
}
