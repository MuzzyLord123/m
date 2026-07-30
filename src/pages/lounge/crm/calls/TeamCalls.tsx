import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PhoneCall, FileText, Crown, Users, Search, RefreshCw, Loader2, Check, StickyNote,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Panel, PanelHeader, EmptyState, SkeletonLedger, RelativeTime, StatusBadge, AvatarID,
} from '@/components/platform';
import { BottomSheet } from '@/components/platform/crm';
import { CallNoteEditor } from './QuickNotes';
import { OUTCOMES, OUTCOME_TONE, outcomeLabel } from './callNotePresets';

/**
 * Team calls. One page, one tab per person: the team board compares
 * everybody side by side, then each admin's own tab holds their figures
 * and their calls - never one long scattered list. Owners can open any
 * call to read the note and the transcript; a sub-admin sees the team
 * board and their own calls. Notes stay editable on your own calls.
 */

interface TeamStat {
  user_id: string;
  email: string;
  full_name: string | null;
  is_owner: boolean;
  is_me: boolean;
  last_sign_in_at: string | null;
  calls_today: number;
  calls_week: number;
  calls_total: number;
  talk_seconds: number;
  avg_duration_seconds: number | null;
  connected: number;
  callback: number;
  voicemail: number;
  no_answer: number;
  wrong_number: number;
  notes_logged: number;
  transcripts: number;
  conversions: number;
  last_call_at: string | null;
}

interface TeamCall {
  call_id: string;
  admin_id: string;
  admin_name: string | null;
  admin_email: string;
  entity_name: string | null;
  phone: string;
  source: string;
  started_at: string;
  duration_seconds: number | null;
  outcome: string | null;
  notes: string | null;
  transcript: string | null;
}

function fmtDur(s: number | null) {
  if (s == null) return '–';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fmtTalk(seconds: number) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

const displayName = (s: { full_name: string | null; email: string }) =>
  s.full_name || s.email.split('@')[0];

const connectRate = (s: TeamStat) => {
  const decided = s.connected + s.callback + s.voicemail + s.no_answer + s.wrong_number;
  return decided ? Math.round(((s.connected + s.callback) / decided) * 100) : null;
};

/** A compact figure, used in both the board and the per-admin header. */
function Figure({ label, value, meta, tone }: { label: string; value: string | number; meta?: string; tone?: 'ok' | 'primary' }) {
  return (
    <div className="min-w-0 rounded-[10px] border border-border/60 bg-card px-3 py-2.5">
      <p className="font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn(
        'mt-1 font-display text-[19px] font-semibold tabular-nums leading-none tracking-[-0.01em]',
        tone === 'ok' && 'text-ok', tone === 'primary' && 'text-primary',
      )}>
        {value}
      </p>
      {meta && <p className="mt-1 truncate text-[10.5px] text-muted-foreground">{meta}</p>}
    </div>
  );
}

export function TeamCalls({ isOwner }: { isOwner: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<TeamStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('board');
  const [calls, setCalls] = useState<TeamCall[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<TeamCall | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [draftOutcome, setDraftOutcome] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  const loadStats = useCallback(async () => {
    const { data, error } = await supabase.rpc('team_call_stats' as any);
    if (error) toast({ title: 'Could not load the team', description: error.message, variant: 'destructive' });
    setStats(((data as any[]) || []) as TeamStat[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Only owners can read another admin's calls; everyone can read their
  // own, so a sub-admin's tab still works.
  const visibleTabs = useMemo(
    () => (isOwner ? stats : stats.filter(s => s.is_me)),
    [stats, isOwner],
  );

  const loadCalls = useCallback(async (adminId: string) => {
    setCallsLoading(true);
    const { data, error } = await supabase.rpc('team_admin_calls' as any, { _admin_id: adminId, _limit: 200 });
    if (error) toast({ title: 'Could not load calls', description: error.message, variant: 'destructive' });
    setCalls(((data as any[]) || []) as TeamCall[]);
    setCallsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (tab === 'board') { setCalls([]); return; }
    loadCalls(tab);
  }, [tab, loadCalls]);

  const active = stats.find(s => s.user_id === tab) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return calls;
    return calls.filter(c =>
      (c.entity_name || '').toLowerCase().includes(q)
      || c.phone.toLowerCase().includes(q)
      || (c.notes || '').toLowerCase().includes(q)
      || outcomeLabel(c.outcome).toLowerCase().includes(q));
  }, [calls, query]);

  const team = useMemo(() => {
    const totals = stats.reduce((acc, s) => ({
      today: acc.today + s.calls_today,
      week: acc.week + s.calls_week,
      total: acc.total + s.calls_total,
      talk: acc.talk + s.talk_seconds,
      conversions: acc.conversions + s.conversions,
    }), { today: 0, week: 0, total: 0, talk: 0, conversions: 0 });
    const best = [...stats].sort((a, b) => b.calls_week - a.calls_week)[0] || null;
    return { ...totals, best };
  }, [stats]);

  function openCall(c: TeamCall) {
    setOpen(c);
    setDraftNote(c.notes || '');
    setDraftOutcome(c.outcome);
  }

  async function saveNote() {
    if (!open || !user || open.admin_id !== user.id) return;
    setSavingNote(true);
    const { error } = await supabase.from('crm_call_logs' as any).update({
      notes: draftNote.trim() || null,
      outcome: draftOutcome,
    } as any).eq('id', open.call_id);
    setSavingNote(false);
    if (error) { toast({ title: 'Note not saved', description: error.message, variant: 'destructive' }); return; }
    setCalls(prev => prev.map(c => (
      c.call_id === open.call_id ? { ...c, notes: draftNote.trim() || null, outcome: draftOutcome } : c
    )));
    setOpen(null);
    toast({ title: 'Call note saved' });
    loadStats();
  }

  const mine = open && user ? open.admin_id === user.id : false;

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-6xl space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[17px] font-semibold tracking-[-0.01em]">Team calls</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {isOwner
                ? 'Every admin on their own tab: their figures, their calls, their notes and transcripts.'
                : 'How the team is calling, and every one of your own calls with its note.'}
            </p>
          </div>
          <Button
            variant="outline" size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs"
            onClick={() => { loadStats(); if (tab !== 'board') loadCalls(tab); }}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {/* Tabs: the team board, then a person per tab. */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max items-center gap-1.5 rounded-[12px] border border-border/60 bg-sunken/40 p-1.5">
            <button
              type="button"
              onClick={() => setTab('board')}
              className={cn(
                'flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-[12.5px] font-medium transition-colors',
                tab === 'board' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Users className="h-3.5 w-3.5" /> Team board
            </button>
            {visibleTabs.map(s => (
              <button
                key={s.user_id}
                type="button"
                onClick={() => setTab(s.user_id)}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-2 rounded-[9px] px-2.5 text-[12.5px] font-medium transition-colors',
                  tab === s.user_id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <AvatarID name={displayName(s)} size="sm" />
                <span className="max-w-[120px] truncate">{displayName(s)}</span>
                {s.is_owner && <Crown className="h-3 w-3 shrink-0 text-primary" />}
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{s.calls_total}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <SkeletonLedger rows={5} />
        ) : tab === 'board' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Figure label="Calls today" value={team.today} meta="Whole team" />
              <Figure label="This week" value={team.week} meta="Last 7 days" />
              <Figure label="Talk time" value={fmtTalk(team.talk)} meta="All logged calls" />
              <Figure label="Conversions" value={team.conversions} tone="ok" meta={team.best ? `Most active · ${displayName(team.best)}` : undefined} />
            </div>

            {/* Side by side: one row per admin, sortable by eye. */}
            <Panel>
              <PanelHeader label={`${stats.length} admins`} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead>
                    <tr className="border-b border-border/60">
                      {['Admin', 'Today', 'Week', 'All time', 'Talk time', 'Avg', 'Connect', 'Notes', 'Conversions'].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            'px-3 py-2 font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground',
                            i === 0 ? 'text-left' : 'text-right',
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map(s => {
                      const rate = connectRate(s);
                      return (
                        <tr
                          key={s.user_id}
                          className={cn(
                            'border-b border-border/40 transition-colors last:border-b-0',
                            (isOwner || s.is_me) && 'cursor-pointer hover:bg-foreground/[0.025]',
                            s.is_me && 'bg-primary/[0.03]',
                          )}
                          onClick={() => { if (isOwner || s.is_me) setTab(s.user_id); }}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <AvatarID name={displayName(s)} size="md" />
                              <div className="min-w-0">
                                <p className="flex items-center gap-1.5 truncate text-[13px] font-medium">
                                  {displayName(s)}
                                  {s.is_owner && <Crown className="h-3 w-3 shrink-0 text-primary" />}
                                  {s.is_me && <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground">You</span>}
                                </p>
                                <p className="truncate text-[10.5px] text-muted-foreground">
                                  {s.last_call_at ? <>Last call <RelativeTime date={s.last_call_at} /></> : 'No calls yet'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums">{s.calls_today}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums">{s.calls_week}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums text-muted-foreground">{s.calls_total}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums text-muted-foreground">{fmtTalk(s.talk_seconds)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums text-muted-foreground">
                            {s.avg_duration_seconds != null ? fmtDur(Math.round(s.avg_duration_seconds)) : '–'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums">
                            {rate != null ? <span className={rate >= 40 ? 'text-ok' : undefined}>{rate}%</span> : '–'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums text-muted-foreground">{s.notes_logged}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums text-ok">{s.conversions}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
            {!isOwner && (
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                Figures for the whole team are shared. Call notes and transcripts stay private to the person who made the call.
              </p>
            )}
          </div>
        ) : active ? (
          <div className="space-y-4">
            {/* This admin's own figures */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              <Figure label="Today" value={active.calls_today} />
              <Figure label="Week" value={active.calls_week} />
              <Figure label="All time" value={active.calls_total} />
              <Figure label="Talk time" value={fmtTalk(active.talk_seconds)} />
              <Figure
                label="Connect"
                value={connectRate(active) != null ? `${connectRate(active)}%` : '–'}
                tone="ok"
              />
              <Figure label="Conversions" value={active.conversions} tone="primary" />
            </div>

            <Panel>
              <PanelHeader label={`${filtered.length} calls`}>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search calls or notes"
                    className="h-8 w-[150px] rounded-lg pl-8 text-xs sm:w-[190px]"
                  />
                </div>
              </PanelHeader>
              {callsLoading ? (
                <SkeletonLedger rows={5} />
              ) : filtered.length === 0 ? (
                <EmptyState
                  compact
                  title={query ? 'Nothing matches' : 'No calls yet'}
                  body={query ? 'Try a different name, number or note.' : 'Calls appear here the moment they are logged, with their notes and transcripts.'}
                />
              ) : (
                /* A fixed, comfortable window: the list scrolls inside
                   its own panel rather than running down the page. */
                <div className="max-h-[420px] overflow-y-auto">
                  <ul className="divide-y divide-border/60">
                    {filtered.map(c => (
                      <li key={c.call_id}>
                        <button
                          type="button"
                          onClick={() => openCall(c)}
                          className="flex min-h-[56px] w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.025]"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-border/60 bg-sunken">
                            <PhoneCall className="h-3.5 w-3.5 text-muted-foreground" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium">{c.entity_name || c.phone}</span>
                            <span className="block font-mono text-[10.5px] tabular-nums text-muted-foreground">
                              {c.phone} · {c.source === 'phone' ? 'phone' : 'desktop'} · {fmtDur(c.duration_seconds)}
                            </span>
                            {c.notes && (
                              <span className="mt-1 flex items-start gap-1.5 text-[11.5px] leading-snug text-ink-2">
                                <StickyNote className="mt-[2px] h-3 w-3 shrink-0 text-muted-foreground" />
                                <span className="line-clamp-2">{c.notes}</span>
                              </span>
                            )}
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <StatusBadge tone={OUTCOME_TONE[c.outcome || ''] ?? 'neutral'} label={outcomeLabel(c.outcome)} />
                            <RelativeTime date={c.started_at} />
                            {c.transcript && (
                              <span className="flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground">
                                <FileText className="h-2.5 w-2.5" /> Transcript
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>
          </div>
        ) : (
          <EmptyState title="Pick a tab" body="Choose the team board or an admin to see their calls." />
        )}
      </div>

      {/* One call: its note (editable when it is yours) and transcript. */}
      <BottomSheet
        open={!!open}
        onOpenChange={(v) => { if (!v) setOpen(null); }}
        kicker={open ? `${open.admin_name || open.admin_email} · call` : 'Call'}
        title={open?.entity_name || open?.phone || ''}
        tall
      >
        {open && (
          <div className="space-y-4">
            <dl>
              {[
                ['Admin', open.admin_name || open.admin_email],
                ['Number', open.phone],
                ['Placed', new Date(open.started_at).toLocaleString('en-GB')],
                ['Duration', fmtDur(open.duration_seconds)],
                ['From', open.source === 'phone' ? 'Connected phone' : 'Desktop'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between border-b border-border/50 py-2 text-xs last:border-b-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="max-w-[60%] truncate text-right font-mono text-[11.5px]">{v}</dd>
                </div>
              ))}
            </dl>

            <div>
              <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {mine ? 'Note' : 'Their note'}
              </span>
              {mine ? (
                <>
                  <CallNoteEditor
                    value={draftNote}
                    onChange={setDraftNote}
                    onOutcome={(o) => setDraftOutcome(prev => prev ?? o)}
                    placeholder="Add detail to this call"
                    className="mt-1.5"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {OUTCOMES.map(o => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setDraftOutcome(o.value)}
                        className={cn(
                          'h-7 rounded-lg border px-2.5 text-[11.5px] transition-colors',
                          draftOutcome === o.value
                            ? 'border-primary/50 bg-primary/[0.08] text-primary'
                            : 'border-border/60 text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <Button className="mt-3 h-10 w-full gap-2 rounded-[10px]" disabled={savingNote} onClick={saveNote}>
                    {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save note
                  </Button>
                </>
              ) : open.notes ? (
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed">{open.notes}</p>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">No note was written for this call.</p>
              )}
            </div>

            <div>
              <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <FileText className="h-3 w-3" /> Transcript
              </span>
              {open.transcript ? (
                <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-2">{open.transcript}</p>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">No transcript was captured for this call.</p>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </ScrollArea>
  );
}
