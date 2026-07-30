import { useCallback, useEffect, useMemo, useState } from 'react';
import { PhoneCall, Upload, UserPlus, Loader2, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AvatarID, Panel, PanelHeader, EmptyState, SkeletonLedger, RelativeTime, StatusBadge,
} from '@/components/platform';
import { ReportTiles, BottomSheet } from '@/components/platform/crm';
import type { EntityType } from './useCRMData';

/**
 * The owners' desk: Finley and Zak's command room inside the CRM. Every
 * admin's calling, sign-ins and conversion in one ledger, the full call
 * feed with transcripts, and the assignment desk that hands leads to an
 * admin in bulk (or imports a file straight into their book). Every
 * figure comes from the owner_admin_stats and owner_call_feed rpcs -
 * nothing invented, owners only.
 */

interface AdminStat {
  user_id: string;
  email: string;
  full_name: string | null;
  is_owner: boolean;
  last_sign_in_at: string | null;
  calls_today: number;
  calls_week: number;
  calls_total: number;
  avg_duration_seconds: number | null;
  connected: number;
  no_answer: number;
  companies_assigned: number;
  contacts_assigned: number;
  conversions: number;
}

interface FeedRow {
  call_id: string;
  admin_id: string;
  admin_email: string;
  admin_name: string | null;
  entity_name: string | null;
  phone: string;
  source: string;
  started_at: string;
  duration_seconds: number | null;
  outcome: string | null;
  notes: string | null;
  transcript: string | null;
}

const OUTCOME_TONE: Record<string, 'ok' | 'attend' | 'risk' | 'neutral'> = {
  connected: 'ok', callback: 'attend', voicemail: 'neutral', no_answer: 'attend', wrong_number: 'risk',
};
const outcomeLabel = (o: string | null) => (o ? o.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) : 'Not set');
const fmtDur = (s: number | null) => (s == null ? '–' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

export function OwnersDesk({
  companies,
  contacts,
  onAssigned,
  onImportForAdmin,
}: {
  companies: any[];
  contacts: any[];
  onAssigned: () => void;
  onImportForAdmin: (adminId: string, target: 'company' | 'contact') => void;
}) {
  const { toast } = useToast();
  const [seg, setSeg] = useState<'performance' | 'calls' | 'assign'>('performance');
  const [stats, setStats] = useState<AdminStat[]>([]);
  const [feed, setFeed] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCall, setOpenCall] = useState<FeedRow | null>(null);

  // Assignment desk state
  const [assignAdmin, setAssignAdmin] = useState('');
  const [assignScope, setAssignScope] = useState<EntityType>('company');
  const [assignCount, setAssignCount] = useState('50');
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    const [s, f] = await Promise.all([
      supabase.rpc('owner_admin_stats' as any),
      supabase.rpc('owner_call_feed' as any, { _limit: 80 } as any),
    ]);
    setStats(((s.data as any[]) || []) as AdminStat[]);
    setFeed(((f.data as any[]) || []) as FeedRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => ({
    admins: stats.length,
    callsToday: stats.reduce((s, a) => s + Number(a.calls_today || 0), 0),
    callsWeek: stats.reduce((s, a) => s + Number(a.calls_week || 0), 0),
    conversions: stats.reduce((s, a) => s + Number(a.conversions || 0), 0),
  }), [stats]);

  const unassigned = useMemo(() => ({
    company: companies.filter((c: any) => !c.owner_id),
    contact: contacts.filter((c: any) => !c.owner_id),
  }), [companies, contacts]);

  async function bulkAssign() {
    if (!assignAdmin) { toast({ title: 'Pick an admin first', variant: 'destructive' }); return; }
    const pool = assignScope === 'company' ? unassigned.company : unassigned.contact;
    const n = Math.min(Math.max(parseInt(assignCount) || 0, 1), pool.length);
    if (!n) { toast({ title: 'Nothing to assign', description: 'No unassigned leads in that book.', variant: 'destructive' }); return; }
    setAssigning(true);
    // Oldest first, chunked through the same owner_id update the CRM uses.
    const ids = [...pool]
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, n)
      .map((r: any) => r.id);
    const table = assignScope === 'company' ? 'crm_companies' : 'crm_contacts';
    let failed = 0;
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await supabase.from(table).update({ owner_id: assignAdmin } as any).in('id', ids.slice(i, i + 200));
      if (error) failed++;
    }
    setAssigning(false);
    const who = stats.find(a => a.user_id === assignAdmin);
    if (failed) toast({ title: 'Some batches failed', description: 'Refresh and check the remaining unassigned count.', variant: 'destructive' });
    else toast({ title: `${ids.length} leads assigned`, description: `Now in ${who?.full_name || who?.email || 'their'} CRM under Mine.` });
    onAssigned();
    load();
  }

  const seg3 = (on: boolean) =>
    cn('h-9 rounded-lg px-4 text-xs transition-colors', on ? 'bg-foreground/[0.06] font-medium text-foreground' : 'text-muted-foreground hover:text-foreground');
  const label = 'font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]';

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-6xl space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={label}>Owners only</p>
            <h1 className="text-[17px] font-semibold tracking-[-0.01em]">Team desk</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Your admins' calling, conversion and workload, without leaving the CRM.</p>
          </div>
          <div className="flex gap-1 rounded-[11px] border border-border/60 p-1">
            <button type="button" className={seg3(seg === 'performance')} onClick={() => setSeg('performance')}>Performance</button>
            <button type="button" className={seg3(seg === 'calls')} onClick={() => setSeg('calls')}>Calls</button>
            <button type="button" className={seg3(seg === 'assign')} onClick={() => setSeg('assign')}>Assign leads</button>
          </div>
        </div>

        <ReportTiles
          tiles={[
            { label: 'Admins', value: totals.admins, meta: 'On the platform' },
            { label: 'Calls today', value: totals.callsToday, meta: 'Across the team' },
            { label: 'Calls this week', value: totals.callsWeek, meta: 'Last 7 days' },
            { label: 'Conversions', value: totals.conversions, meta: 'Moves into won stages' },
          ]}
        />

        {loading ? (
          <Panel><SkeletonLedger rows={4} /></Panel>
        ) : seg === 'performance' ? (
          <Panel>
            <PanelHeader label="Admin performance" />
            <ul className="divide-y divide-border/60">
              {stats.map(a => {
                const outcomes = Number(a.connected) + Number(a.no_answer);
                const rate = outcomes ? Math.round((Number(a.connected) / outcomes) * 100) : null;
                return (
                  <li key={a.user_id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarID name={a.full_name} email={a.email} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[13.5px] font-medium">
                          <span className="truncate">{a.full_name || a.email}</span>
                          {a.is_owner && <StatusBadge tone="attend" label="Owner" />}
                        </p>
                        <p className="font-mono text-[10.5px] text-muted-foreground">
                          {a.email} · {a.last_sign_in_at ? <>signed in <RelativeTime date={a.last_sign_in_at} /></> : 'never signed in'}
                        </p>
                      </div>
                      <div className="hidden shrink-0 gap-5 text-right sm:flex">
                        {[
                          ['Today', a.calls_today],
                          ['Week', a.calls_week],
                          ['Total', a.calls_total],
                          ['Avg', fmtDur(a.avg_duration_seconds == null ? null : Number(a.avg_duration_seconds))],
                          ['Connect', rate != null ? `${rate}%` : '–'],
                          ['Converted', a.conversions],
                        ].map(([k, v]) => (
                          <div key={k as string}>
                            <p className="font-mono text-[8.5px] uppercase tracking-[0.13em] text-muted-foreground">{k}</p>
                            <p className="font-mono text-[13px] font-medium tabular-nums">{v as any}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 pl-[44px]">
                      <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                        Book {Number(a.companies_assigned).toLocaleString('en-GB')} companies · {Number(a.contacts_assigned).toLocaleString('en-GB')} contacts
                      </span>
                      <div className="relative h-1.5 flex-1" aria-hidden>
                        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                        <div
                          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-foreground/45"
                          style={{ width: `${Math.min(100, ((Number(a.companies_assigned) + Number(a.contacts_assigned)) / Math.max(1, companies.length + contacts.length)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : seg === 'calls' ? (
          <Panel>
            <PanelHeader label="Every call across the team" />
            {feed.length === 0 ? (
              <EmptyState compact title="No calls logged yet" body="Calls appear here the moment any admin presses Call in the CRM." />
            ) : (
              <ul className="divide-y divide-border/60">
                {feed.map(c => (
                  <li key={c.call_id}>
                    <button
                      type="button"
                      onClick={() => setOpenCall(c)}
                      className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.025]"
                    >
                      <AvatarID name={c.admin_name} email={c.admin_email} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px]">
                          <span className="font-medium">{(c.admin_name || c.admin_email).split(' ')[0]}</span>
                          <span className="text-muted-foreground"> called </span>
                          <span className="font-medium">{c.entity_name || c.phone}</span>
                        </span>
                        <span className="block font-mono text-[10.5px] tabular-nums text-muted-foreground">{c.phone} · {c.source}</span>
                      </span>
                      {c.transcript && <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Has transcript" />}
                      <StatusBadge tone={OUTCOME_TONE[c.outcome || ''] ?? 'neutral'} label={outcomeLabel(c.outcome)} />
                      <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{fmtDur(c.duration_seconds)}</span>
                      <RelativeTime date={c.started_at} className="w-20 shrink-0 text-right" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
            <Panel className="h-fit">
              <PanelHeader label="Bulk assign" />
              <div className="space-y-3.5 p-4">
                <div>
                  <span className={label}>Assign to</span>
                  <Select value={assignAdmin} onValueChange={setAssignAdmin}>
                    <SelectTrigger className="mt-1.5 h-10"><SelectValue placeholder="Choose an admin" /></SelectTrigger>
                    <SelectContent>
                      {stats.map(a => (
                        <SelectItem key={a.user_id} value={a.user_id}>{a.full_name || a.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className={label}>From</span>
                    <Select value={assignScope} onValueChange={(v) => setAssignScope(v as EntityType)}>
                      <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Companies ({unassigned.company.length.toLocaleString('en-GB')} unassigned)</SelectItem>
                        <SelectItem value="contact">Contacts ({unassigned.contact.length.toLocaleString('en-GB')} unassigned)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <span className={label}>How many</span>
                    <Input
                      inputMode="numeric"
                      value={assignCount}
                      onChange={(e) => setAssignCount(e.target.value.replace(/\D/g, ''))}
                      className="mt-1.5 h-10 font-mono tabular-nums"
                    />
                  </div>
                </div>
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                  Takes the oldest unassigned leads and puts them straight into that admin's CRM under Mine, ready to call.
                </p>
                <Button className="h-10 w-full gap-1.5 rounded-[11px] text-xs" disabled={assigning || !assignAdmin} onClick={bulkAssign}>
                  {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  Assign leads
                </Button>
                <div className="border-t border-border/60 pt-3">
                  <span className={label}>Or import a file to them</span>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                    CSV, Excel, JSON or HTML. Same import engine, every lead lands already assigned.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2 h-9 w-full gap-1.5 rounded-lg text-xs"
                    disabled={!assignAdmin}
                    onClick={() => onImportForAdmin(assignAdmin, assignScope === 'contact' ? 'contact' : 'company')}
                  >
                    <Upload className="h-3.5 w-3.5" /> Import file to this admin
                  </Button>
                </div>
              </div>
            </Panel>

            <Panel className="h-fit">
              <PanelHeader label="Current workload" />
              <ul className="divide-y divide-border/60">
                {stats.map(a => (
                  <li key={a.user_id} className="flex items-center gap-3 px-4 py-2.5">
                    <AvatarID name={a.full_name} email={a.email} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[13px]">{a.full_name || a.email}</span>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {Number(a.companies_assigned).toLocaleString('en-GB')} co · {Number(a.contacts_assigned).toLocaleString('en-GB')} ct
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                      <PhoneCall className="h-3 w-3" /> {a.calls_week}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}
      </div>

      {/* Call detail with transcript */}
      <BottomSheet
        open={!!openCall}
        onOpenChange={(v) => { if (!v) setOpenCall(null); }}
        kicker={openCall ? (openCall.admin_name || openCall.admin_email) : ''}
        title={openCall?.entity_name || openCall?.phone || ''}
        tall
      >
        {openCall && (
          <div className="space-y-4">
            <dl>
              {[
                ['Number', openCall.phone],
                ['Placed', new Date(openCall.started_at).toLocaleString('en-GB')],
                ['Duration', fmtDur(openCall.duration_seconds)],
                ['Outcome', outcomeLabel(openCall.outcome)],
                ['From', openCall.source === 'phone' ? 'Connected phone' : 'Desktop'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between border-b border-border/50 py-2 text-xs last:border-b-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono text-[11.5px] tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            {openCall.notes && (
              <div>
                <span className={label}>Notes</span>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">{openCall.notes}</p>
              </div>
            )}
            <div>
              <span className={label}>Transcript</span>
              {openCall.transcript ? (
                <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-2">{openCall.transcript}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">No transcript was captured for this call.</p>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </ScrollArea>
  );
}
