import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Mic, MicOff, Send, Plus, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  type BridgeRow, type AgentRow, type TaskRow, type RunRow, type MessageRow, type EventRow,
  type AdviceRow, type JarvisBudget,
  effectiveBridgeStatus,
} from './useAgentOfficeData';

/*
 * The Console - Quooro's HUD. Reference 2: dark navy field, cyan and
 * white, one warm accent for alerts only. It slides over the office and
 * is the surface you talk to Quooro on.
 *
 * Honesty rules baked in rather than remembered:
 *  - A conversational turn is a model call, and a model call belongs to a
 *    seat. With no bridge online the composer queues and SAYS it queues.
 *  - The rings are not decoration: nodes are the roster, lit when a run
 *    says an agent is working. The system topology, not a screensaver.
 *  - Usage is measured token counts from stream-json, attributed per
 *    agent. Percentages appear only when a cap is configured; a flat-rate
 *    seat gets no invented pounds.
 */

const STATUS_TONE: Record<string, string> = {
  online: '#34d399', offline: '#64748b', needs_login: '#fbbf24', throttled: '#fb923c',
};
const STATUS_LABEL: Record<string, string> = {
  online: 'ONLINE', offline: 'OFFLINE', needs_login: 'NEEDS LOGIN', throttled: 'THROTTLED',
};

function Rings({ agents, working }: { agents: AgentRow[]; working: Set<string> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const g = canvas.getContext('2d'); if (!g) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0; let disposed = false;
    const draw = (t: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(draw);
      const w = canvas.width = canvas.offsetWidth * 2;
      const h = canvas.height = canvas.offsetHeight * 2;
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .40;
      g.clearRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        const r = R * (.45 + i * .27);
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2);
        g.strokeStyle = `rgba(56,189,248,${.16 - i * .04})`; g.lineWidth = 2;
        g.setLineDash(i === 1 ? [4, 10] : []); g.stroke(); g.setLineDash([]);
      }
      const sweep = reduced ? 0 : (t / 6000) % (Math.PI * 2);
      g.beginPath(); g.arc(cx, cy, R * .99, sweep, sweep + .7);
      g.strokeStyle = 'rgba(34,211,238,.5)'; g.lineWidth = 3; g.stroke();
      agents.forEach((a, i) => {
        const ang = (i / Math.max(agents.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const r = R * (a.floor === 2 ? .72 : .99);
        const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
        const on = working.has(a.role_key);
        const pulse = on && !reduced ? 1 + Math.sin(t / 250 + i) * .3 : 1;
        g.beginPath(); g.arc(x, y, (on ? 7 : 4.5) * pulse, 0, Math.PI * 2);
        g.fillStyle = on ? '#22d3ee' : 'rgba(148,163,184,.55)'; g.fill();
        if (on) {
          g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y);
          g.strokeStyle = 'rgba(34,211,238,.22)'; g.lineWidth = 1.5; g.stroke();
        }
      });
      g.beginPath(); g.arc(cx, cy, 8, 0, Math.PI * 2); g.fillStyle = '#e0f2fe'; g.fill();
    };
    raf = requestAnimationFrame(draw);
    return () => { disposed = true; cancelAnimationFrame(raf); };
  }, [agents, working]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full opacity-70" aria-hidden />;
}

const PANEL = 'rounded-[10px] border border-cyan-300/10 bg-[#0a1526]/80';
const HD = 'font-mono text-[8.5px] uppercase tracking-[0.16em] text-cyan-200/50';

export function JarvisConsole({
  open, onClose, me, bridges, agents, tasks, runs, messages, events, totals,
  advice, jarvisBudget,
  onSendChat, onCancelTask, onCreateBridge, onDeleteBridge, onNewTask, onStartBuild,
}: {
  open: boolean;
  onClose: () => void;
  me: string | null;
  bridges: BridgeRow[];
  agents: AgentRow[];
  tasks: TaskRow[];
  runs: RunRow[];
  messages: MessageRow[];
  events: EventRow[];
  totals: { fiveHour: number; weekHeavy: number; today: number };
  advice?: AdviceRow[];
  jarvisBudget?: JarvisBudget | null;
  onSendChat: (text: string) => Promise<void>;
  onCancelTask: (id: string) => Promise<void>;
  onCreateBridge: (label: string) => Promise<string>;
  onDeleteBridge: (id: string) => Promise<void>;
  onNewTask?: () => void;
  onStartBuild?: (brief: string, assign: string | null) => void;
}) {
  const [draft, setDraft] = useState('');
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const recRef = useRef<{ stop(): void } | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const talkRef = useRef<HTMLDivElement>(null);

  const anyOnline = bridges.some(b => effectiveBridgeStatus(b) === 'online');
  const activeRun = runs.find(r => !['done', 'failed', 'cancelled', 'live'].includes(r.status)) ?? null;
  const working = useMemo(() => {
    const s = new Set<string>();
    runs.forEach(r => {
      if (!['done', 'failed', 'cancelled', 'live'].includes(r.status) && r.current_agent) s.add(r.current_agent);
    });
    return s;
  }, [runs]);

  useEffect(() => { feedRef.current?.scrollTo({ top: 1e9 }); }, [events, messages, open]);
  useEffect(() => { talkRef.current?.scrollTo({ top: 1e9 }); }, [messages, open]);

  /* Push-to-talk. Interim transcript shown live; nothing is ever sent
     without the explicit Send - a misheard word must never dispatch. */
  const toggleMic = useCallback(() => {
    if (listening) { recRef.current?.stop(); return; }
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition
      || (window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition;
    if (!SR) { toast.error('Voice input is not available in this browser'); return; }
    const rec = new SR() as {
      continuous: boolean; interimResults: boolean; lang: string;
      onresult: (e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void;
      onend: () => void; start(): void; stop(): void;
    };
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-GB';
    rec.onresult = e => {
      let fin = '', mid = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript; else mid += r[0].transcript;
      }
      if (fin) setDraft(d => (d + ' ' + fin).trim());
      setInterim(mid);
    };
    rec.onend = () => { setListening(false); setInterim(''); };
    recRef.current = rec; setListening(true); rec.start();
  }, [listening]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft(''); setInterim('');
    try { await onSendChat(text); } catch (e) {
      toast.error('Not queued', { description: e instanceof Error ? e.message : undefined });
      setDraft(text);
    }
  }, [draft, onSendChat]);

  /* The conversation pane: model turns from agent_messages, plus advisor
     notices rendered as Tier-0 templated lines - real rows, zero tokens. */
  type PaneItem =
    | { kind: 'msg'; ts: string; m: MessageRow }
    | { kind: 'advice'; ts: string; a: AdviceRow };
  const chat: PaneItem[] = [
    ...messages.filter(m => m.template_key === 'chat' || m.template_key === 'say')
      .map(m => ({ kind: 'msg' as const, ts: m.ts, m })),
    ...(advice ?? []).map(a => ({ kind: 'advice' as const, ts: a.ts, a })),
  ].sort((x, y) => x.ts.localeCompare(y.ts));

  /* Start Build appears under the newest reply that declared a brief
     ready - and dispatch stays a human click, never Jarvis's. */
  const lastSay = [...messages].reverse().find(m => m.template_key === 'say');
  const readyBrief = lastSay && (lastSay.payload as { status?: string }).status === 'brief_ready'
    ? { id: lastSay.id,
        brief: String((lastSay.payload as { brief?: string }).brief ?? ''),
        assign: ((lastSay.payload as { assign?: string | null }).assign ?? null) }
    : null;

  const tierLabel = (p: Record<string, unknown>) => {
    if (p.tier === 2) return 'CLAUDE SEAT · TIER 2';
    if (p.tier === 1) return `${String(p.model_id ?? 'free model')} · TIER 1 FREE`;
    if (p.tier === 0) return 'TEMPLATED · TIER 0 · ZERO TOKENS';
    return null;
  };
  const feedLines = useMemo(() => {
    const fromMsg = messages
      .filter(m => m.template_key !== 'chat' && m.template_key !== 'say')
      .map(m => ({
        ts: m.ts,
        text: `${m.from_agent}${m.to_agent ? ' → ' + m.to_agent : ''}: ${String((m.payload as { text?: string }).text ?? m.template_key)}`,
      }));
    const fromEv = events.map(e => ({
      ts: e.ts,
      text: `${e.agent || 'run'} · ${e.event_type}${(e.payload as { text?: string }).text ? ' · ' + (e.payload as { text?: string }).text : ''}`,
    }));
    return [...fromMsg, ...fromEv]
      .sort((a, b) => a.ts.localeCompare(b.ts))
      .slice(-60);
  }, [messages, events]);

  const queueCols: [string, TaskRow[]][] = [
    ['QUEUED', tasks.filter(t => t.status === 'queued' || t.status === 'draft')],
    ['RUNNING', tasks.filter(t => t.status === 'claimed' || t.status === 'running')],
    ['DONE', tasks.filter(t => t.status === 'done').slice(0, 5)],
  ];

  const fmt = (n: number) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-[#050b16] text-slate-200" role="dialog" aria-label="Jarvis console">
      {/* header */}
      <div className="flex h-[54px] shrink-0 items-center gap-3 border-b border-cyan-300/10 px-4">
        <span className="text-[14px] font-bold tracking-tight text-cyan-50">QUOORO <span className="font-medium text-cyan-200/40">/ JARVIS</span></span>
        <span className="hidden font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-200/40 sm:block">
          idle costs nothing · a model runs only on your machine
        </span>
        <div className="ml-auto flex items-center gap-2">
          {bridges.length === 0 && (
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber-300/90">No bridge — add one below</span>
          )}
          {bridges.map(b => {
            const s = effectiveBridgeStatus(b);
            return (
              <span key={b.id} className="flex items-center gap-1.5 rounded-full border border-cyan-300/15 px-2.5 py-1 font-mono text-[9px] tracking-[0.08em]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_TONE[s] }} />
                {b.label.toUpperCase()} · {STATUS_LABEL[s]}
                {s === 'throttled' && b.throttled_until ? ` UNTIL ${hhmm(b.throttled_until)}` : ''}
              </span>
            );
          })}
          <button onClick={onClose} aria-label="Back to the office"
            className="flex h-8 items-center gap-1.5 rounded-[8px] border border-cyan-300/20 px-3 text-[12px] font-semibold text-cyan-100 hover:bg-cyan-300/10">
            <X className="h-3.5 w-3.5" /> Office view
          </button>
        </div>
      </div>

      {/* body */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[290px_1fr_290px]">
        {/* left: telemetry + queue + bridges */}
        <div className="hidden min-h-0 flex-col gap-3 overflow-y-auto lg:flex">
          <div className={cn(PANEL, 'p-3')}>
            <p className={HD}>Run telemetry</p>
            {activeRun ? (
              <div className="mt-2 space-y-1.5 font-mono text-[11px]">
                <p className="flex justify-between"><span className="text-slate-400">phase</span><span className="text-cyan-200">{activeRun.status}</span></p>
                <p className="flex justify-between"><span className="text-slate-400">agent</span><span>{activeRun.current_agent || '—'}</span></p>
                <p className="flex justify-between"><span className="text-slate-400">turns</span><span>{activeRun.turns_used}</span></p>
                <p className="flex justify-between"><span className="text-slate-400">started</span><span>{activeRun.started_at ? hhmm(activeRun.started_at) : '—'}</span></p>
              </div>
            ) : (
              <p className="mt-2 text-[11.5px] text-slate-500">No run live. Nothing is thinking, and nothing is being spent.</p>
            )}
          </div>

          <div className={cn(PANEL, 'p-3')}>
            <div className="flex items-center justify-between">
              <p className={HD}>Task queue</p>
              {onNewTask && (
                <button onClick={onNewTask}
                  className="flex items-center gap-1 rounded-[7px] border border-cyan-300/20 px-2 py-1 font-mono text-[8.5px] tracking-[0.1em] text-cyan-200 hover:bg-cyan-300/10">
                  <Plus className="h-3 w-3" /> NEW TASK
                </button>
              )}
            </div>
            <div className="mt-2 space-y-2.5">
              {queueCols.map(([label, rows]) => (
                <div key={label}>
                  <p className="flex justify-between font-mono text-[8px] tracking-[0.14em] text-slate-500">
                    <span>{label}</span><span>{rows.length}</span>
                  </p>
                  {rows.slice(0, 4).map(t => (
                    <div key={t.id} className="mt-1 rounded-[7px] border border-cyan-300/10 bg-[#0d1b30] px-2.5 py-1.5">
                      <p className="truncate text-[11px] font-medium text-slate-200">{t.brief}</p>
                      <p className="mt-0.5 flex items-center justify-between font-mono text-[8px] tracking-[0.08em] text-slate-500">
                        <span>{t.kind.toUpperCase()}{t.status === 'draft' ? ' · AWAITING RUN' : ''}</span>
                        {(t.status === 'queued' || t.status === 'draft') && (
                          <button onClick={() => void onCancelTask(t.id)} className="text-rose-300/70 hover:text-rose-300">CANCEL</button>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className={cn(PANEL, 'p-3')}>
            <p className={HD}>Bridges</p>
            {bridges.map(b => (
              <div key={b.id} className="mt-1.5 flex items-center justify-between font-mono text-[10px]">
                <span className="truncate text-slate-300">{b.label}{b.hostname ? ` · ${b.hostname}` : ''}</span>
                <span className="flex items-center gap-2">
                  <span style={{ color: STATUS_TONE[effectiveBridgeStatus(b)] }}>{STATUS_LABEL[effectiveBridgeStatus(b)]}</span>
                  <button aria-label={`Remove ${b.label}`} onClick={() => void onDeleteBridge(b.id)} className="text-slate-500 hover:text-rose-300"><Trash2 className="h-3 w-3" /></button>
                </span>
              </div>
            ))}
            {newToken ? (
              <div className="mt-2 rounded-[7px] border border-amber-300/30 bg-amber-500/[0.06] p-2">
                <p className="text-[10px] leading-relaxed text-amber-200/90">
                  This token is shown once. Put it in the daemon&apos;s .env as BRIDGE_TOKEN.
                </p>
                <p className="mt-1 break-all font-mono text-[9px] text-amber-100">{newToken}</p>
                <button
                  onClick={() => { void navigator.clipboard.writeText(newToken); toast.success('Token copied'); setNewToken(null); }}
                  className="mt-1.5 flex items-center gap-1 font-mono text-[9px] text-amber-200 hover:text-amber-100">
                  <Copy className="h-3 w-3" /> COPY &amp; HIDE
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  try { setNewToken(await onCreateBridge('bridge-' + (bridges.length + 1))); }
                  catch (e) { toast.error('Bridge not created', { description: e instanceof Error ? e.message : undefined }); }
                }}
                className="mt-2 flex items-center gap-1.5 rounded-[7px] border border-cyan-300/20 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.1em] text-cyan-200 hover:bg-cyan-300/10">
                <Plus className="h-3 w-3" /> NEW BRIDGE
              </button>
            )}
          </div>
        </div>

        {/* centre: rings + conversation */}
        <div className={cn(PANEL, 'relative flex min-h-0 flex-col overflow-hidden')}>
          <Rings agents={agents} working={working} />
          <div ref={talkRef} className="relative z-10 min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
            {chat.length === 0 && (
              <p className="mx-auto mt-10 max-w-sm text-center text-[12px] leading-relaxed text-slate-500">
                Talk to Quooro. Every reply is a model call on your own machine&apos;s
                Claude seat, so with no bridge online your message queues and says so.
                Nothing dispatches without a confirmation click.
              </p>
            )}
            {chat.map(item => {
              if (item.kind === 'advice') {
                const a = item.a;
                return (
                  <div key={`adv-${a.id}`} className="max-w-[86%] rounded-[10px] border border-cyan-300/10 bg-[#0b1930]/70 px-3 py-2 text-[11.5px] leading-relaxed text-slate-300">
                    <p className="mb-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-cyan-300/50">
                      jarvis · fleet advisory · templated · tier 0
                    </p>
                    <span className={cn('mr-1.5 font-mono text-[9px]',
                      a.level === 'HEALTHY' ? 'text-emerald-300' : a.level === 'DEGRADED' || a.level === 'SWITCH_NOW' ? 'text-amber-300' : 'text-cyan-200')}>
                      {a.level}
                    </span>
                    {a.recommendation}
                    {a.rationale && <span className="text-slate-500"> — {a.rationale}</span>}
                    {a.acted_automatically && <span className="ml-1 font-mono text-[8.5px] text-cyan-300/70">auto-managed</span>}
                  </div>
                );
              }
              const m = item.m;
              const p = m.payload as Record<string, unknown>;
              const mine = m.from_agent.startsWith('user');
              const label = !mine ? tierLabel(p) : null;
              return (
                <div key={m.id} className={cn('max-w-[78%] rounded-[10px] px-3 py-2 text-[12.5px] leading-relaxed',
                  mine ? 'ml-auto bg-cyan-400/[0.14] text-cyan-50' : 'bg-[#0d1b30] text-slate-200')}>
                  {!mine && (
                    <p className="mb-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-cyan-300/60">
                      {m.from_agent}{label ? <span className="ml-2 text-cyan-200/40">{label}</span> : null}
                    </p>
                  )}
                  {String(p.text ?? '')}
                  {!mine && p.degraded === true && (
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-amber-300/80">claude budget spent · free lane</p>
                  )}
                  {!mine && p.parse_fallback === true && (
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-slate-500">unstructured reply · shown raw</p>
                  )}
                  {mine && p.queued === true && (
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-amber-300/80">queued · bridge offline</p>
                  )}
                  {!mine && readyBrief && readyBrief.id === m.id && onStartBuild && (
                    <button
                      onClick={() => onStartBuild(readyBrief.brief, readyBrief.assign)}
                      className="mt-2 flex items-center gap-1.5 rounded-[8px] bg-cyan-400/90 px-3 py-1.5 text-[11px] font-semibold text-[#04121f] hover:bg-cyan-300">
                      START BUILD
                    </button>
                  )}
                  {!mine && readyBrief && readyBrief.id === m.id && (
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-cyan-300/50">
                      brief ready — you dispatch, jarvis never does
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="relative z-10 border-t border-cyan-300/10 p-3">
            {!anyOnline && (
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-amber-300/80">
                Bridge offline — messages queue and run when your machine reconnects
              </p>
            )}
            {interim && <p className="mb-1.5 text-[11.5px] italic text-cyan-200/50">{interim}…</p>}
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                rows={2}
                placeholder='Ask Quooro — "site for The Paint Man, five pages, wants enquiries"'
                aria-label="Message Quooro"
                className="min-h-[44px] flex-1 resize-none rounded-[9px] border border-cyan-300/15 bg-[#0d1b30] px-3 py-2 text-[12.5px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />
              <button onClick={toggleMic} aria-label={listening ? 'Stop listening' : 'Push to talk'}
                className={cn('flex h-[44px] w-[44px] items-center justify-center rounded-[9px] border',
                  listening ? 'border-rose-400/50 bg-rose-500/15 text-rose-200' : 'border-cyan-300/20 text-cyan-200 hover:bg-cyan-300/10')}>
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button onClick={() => void send()} aria-label="Send"
                className="flex h-[44px] w-[52px] items-center justify-center rounded-[9px] bg-cyan-400/90 text-[#04121f] hover:bg-cyan-300">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* right: comms feed */}
        <div className={cn(PANEL, 'hidden min-h-0 flex-col p-3 lg:flex')}>
          <p className={HD}>Live activity</p>
          <div ref={feedRef} className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto font-mono text-[9.5px] leading-[1.9] text-slate-400">
            {feedLines.length === 0 && (
              <p className="text-slate-600">Quiet. The feed renders from agent_events —
                every line is real, none of it is a model narrating.</p>
            )}
            {feedLines.map((l, i) => (
              <div key={i}><span className="mr-2 text-slate-600">{hhmm(l.ts)}</span>{l.text}</div>
            ))}
          </div>
        </div>
      </div>

      {/* bottom: usage — measured counts; no invented pounds */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1 border-t border-cyan-300/10 px-4 py-2.5 font-mono text-[9.5px] tracking-[0.06em] text-slate-400">
        <span>TODAY <b className="ml-1 text-cyan-200">{fmt(totals.today)}</b> tok</span>
        <span>5-HOUR <b className="ml-1 text-cyan-200">{fmt(totals.fiveHour)}</b> tok</span>
        <span>WEEK · OPUS <b className="ml-1 text-violet-300">{fmt(totals.weekHeavy)}</b> tok</span>
        {jarvisBudget && (
          <span>
            CLAUDE CHAT BUDGET <b className={cn('ml-1', jarvisBudget.remaining === 0 ? 'text-amber-300' : 'text-cyan-200')}>
              {jarvisBudget.spent_today}/{jarvisBudget.budget}
            </b>
            {jarvisBudget.off_seat_share !== null && (
              <span className="ml-2 text-slate-500">{Math.round(jarvisBudget.off_seat_share * 100)}% of turns off-seat</span>
            )}
          </span>
        )}
        <span className="text-slate-600">measured from stream-json · flat-rate seat, so shares not pounds · limits change — never hard-coded</span>
      </div>
    </div>
  );
}
