import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Smartphone, PhoneCall, Unplug, FileText } from 'lucide-react';
import qrcode from 'qrcode-generator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Panel, PanelHeader, EmptyState, SkeletonLedger, RelativeTime, StatusBadge,
} from '@/components/platform';
import { ReportTiles, BottomSheet } from '@/components/platform/crm';

/**
 * The Calls workspace: an admin's own calling desk. Connect a phone by
 * QR so any Call press can ring from the handset, see honest personal
 * figures (every number here is your own logged calls), and review past
 * calls with their transcripts. Owners see the whole team's calling on
 * the Team desk.
 */

interface CallRow {
  id: string;
  entity_type: string | null;
  entity_name: string | null;
  phone: string;
  source: string;
  started_at: string;
  duration_seconds: number | null;
  outcome: string | null;
  notes: string | null;
}

const OUTCOME_TONE: Record<string, 'ok' | 'attend' | 'risk' | 'neutral'> = {
  connected: 'ok', callback: 'attend', voicemail: 'neutral', no_answer: 'attend', wrong_number: 'risk',
};

const outcomeLabel = (o: string | null) =>
  o ? o.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) : 'Not set';

function fmtDur(s: number | null) {
  if (s == null) return '–';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function CallsWorkspace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState<any | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [openCall, setOpenCall] = useState<CallRow | null>(null);
  const [openTranscript, setOpenTranscript] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const [c, l] = await Promise.all([
      supabase.from('crm_call_logs' as any).select('*').order('started_at', { ascending: false }).limit(300),
      supabase.from('crm_phone_links' as any).select('*').order('created_at', { ascending: false }).limit(1),
    ]);
    setCalls(((c.data as any[]) || []) as CallRow[]);
    const latest = ((l.data as any[]) || [])[0] || null;
    setLink(latest && latest.claimed_at ? latest : null);
    if (latest && !latest.claimed_at) setPendingToken(latest.token);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // While a QR is showing, watch for the phone claiming it.
  useEffect(() => {
    if (!pendingToken) { if (pollRef.current) clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('crm_phone_links' as any)
        .select('*').eq('token', pendingToken).limit(1);
      const row = ((data as any[]) || [])[0];
      if (row?.claimed_at) {
        setLink(row);
        setPendingToken(null);
        toast({ title: 'Phone connected', description: 'Call pushes now ring on your phone.' });
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pendingToken, toast]);

  async function generateLink() {
    if (!user) return;
    const token = crypto.randomUUID().replace(/-/g, '');
    // One pending link at a time: clear stale unclaimed rows first.
    await supabase.from('crm_phone_links' as any).delete().is('claimed_at', null);
    const { error } = await supabase.from('crm_phone_links' as any).insert({ user_id: user.id, token } as any);
    if (error) { toast({ title: 'Could not create the link', description: error.message, variant: 'destructive' }); return; }
    setPendingToken(token);
  }

  async function disconnect() {
    await supabase.from('crm_phone_links' as any).delete().not('id', 'is', null);
    setLink(null);
    setPendingToken(null);
    toast({ title: 'Phone disconnected' });
  }

  const qrSvg = useMemo(() => {
    if (!pendingToken) return null;
    const qr = qrcode(0, 'M');
    qr.addData(`${window.location.origin}/call-companion?token=${pendingToken}`);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }, [pendingToken]);

  const stats = useMemo(() => {
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const weekStart = Date.now() - 7 * 86400e3;
    const today = calls.filter(c => new Date(c.started_at) >= dayStart).length;
    const week = calls.filter(c => new Date(c.started_at).getTime() >= weekStart).length;
    const withDur = calls.filter(c => c.duration_seconds != null);
    const avg = withDur.length ? Math.round(withDur.reduce((s, c) => s + (c.duration_seconds || 0), 0) / withDur.length) : null;
    const connected = calls.filter(c => c.outcome === 'connected').length;
    const outcomes = calls.filter(c => c.outcome).length;
    return { today, week, total: calls.length, avg, rate: outcomes ? Math.round((connected / outcomes) * 100) : null };
  }, [calls]);

  async function viewCall(c: CallRow) {
    setOpenCall(c);
    setOpenTranscript(null);
    const { data } = await supabase.from('crm_call_transcripts' as any).select('content').eq('call_id', c.id).limit(1);
    setOpenTranscript(((data as any[]) || [])[0]?.content ?? '');
  }

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-6xl space-y-5 p-4 sm:p-6">
        <div>
          <h1 className="text-[17px] font-semibold tracking-[-0.01em]">Calls</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Your calling desk. Every Call press in the CRM lands here with its outcome and transcript.</p>
        </div>

        <ReportTiles
          tiles={[
            { label: 'Today', value: stats.today, meta: 'Calls started' },
            { label: 'This week', value: stats.week, meta: 'Last 7 days' },
            { label: 'All time', value: stats.total, meta: 'Logged calls' },
            { label: 'Connect rate', value: stats.rate != null ? `${stats.rate}%` : '–', meta: stats.avg != null ? `Avg ${fmtDur(stats.avg)}` : 'No outcomes yet' },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* Phone pairing */}
          <Panel className="h-fit">
            <PanelHeader label="Your phone" />
            <div className="p-4">
              {link ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border/60 bg-sunken">
                      <Smartphone className="h-4 w-4 text-ok" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">Phone connected</p>
                      <p className="text-[11px] text-muted-foreground">
                        Connected <RelativeTime date={link.claimed_at} />
                      </p>
                    </div>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                    Any Call press can now be sent to your phone: it opens the dialler with the lead's number, and the call is logged here.
                  </p>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={disconnect}>
                    <Unplug className="h-3.5 w-3.5" /> Disconnect
                  </Button>
                </div>
              ) : pendingToken && qrSvg ? (
                <div className="space-y-3 text-center">
                  <div
                    className="mx-auto w-44 rounded-lg bg-white p-2.5 [&_svg]:h-auto [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                    Scan with your phone while signed in to Quooro on it. Waiting for the phone…
                  </p>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setPendingToken(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                    Connect your phone by QR. Calls you start on desktop then ring from your handset, and everything still logs here.
                  </p>
                  <Button size="sm" className="h-9 gap-1.5 rounded-lg text-xs" onClick={generateLink}>
                    <Smartphone className="h-3.5 w-3.5" /> Connect your phone
                  </Button>
                </div>
              )}
            </div>
          </Panel>

          {/* Call history */}
          <Panel>
            <PanelHeader label={`${calls.length} logged calls`} />
            {loading ? (
              <SkeletonLedger rows={4} />
            ) : calls.length === 0 ? (
              <EmptyState
                compact
                title="No calls yet"
                body="Press Call on any lead. The call is timed, its outcome recorded, and the transcript kept if you turn it on."
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {calls.slice(0, 40).map(c => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => viewCall(c)}
                      className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.025]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-border/60 bg-sunken">
                        <PhoneCall className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{c.entity_name || c.phone}</span>
                        <span className="block font-mono text-[10.5px] tabular-nums text-muted-foreground">
                          {c.phone} · {c.source}
                        </span>
                      </span>
                      <StatusBadge tone={OUTCOME_TONE[c.outcome || ''] ?? 'neutral'} label={outcomeLabel(c.outcome)} />
                      <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                        {fmtDur(c.duration_seconds)}
                      </span>
                      <RelativeTime date={c.started_at} className="w-20 shrink-0 text-right" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* Call detail + transcript */}
      <BottomSheet
        open={!!openCall}
        onOpenChange={(v) => { if (!v) setOpenCall(null); }}
        kicker="Call"
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
                <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Notes</span>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">{openCall.notes}</p>
              </div>
            )}
            <div>
              <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <FileText className="h-3 w-3" /> Transcript
              </span>
              {openTranscript === null ? (
                <SkeletonLedger rows={2} className="mt-1.5" />
              ) : openTranscript ? (
                <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-2">{openTranscript}</p>
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
