import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { Panel, PanelHeader, EmptyState, SkeletonBlock } from '@/components/platform';

/**
 * Foot traffic to the public site.
 *
 * The window is fetched twice over - the period asked for and the one
 * before it - so every movement shown is measured against the same
 * length of time rather than asserted. Nothing here is estimated: a
 * visitor is a session, a view is a row.
 */

type Row = { path: string; referrer: string | null; session_id: string | null; created_at: string };

const RANGES = [
  { label: '24 hours', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const KICKER = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

function sourceOf(referrer: string | null) {
  if (!referrer) return 'Direct';
  try { return new URL(referrer).hostname.replace(/^www\./, ''); }
  catch { return referrer.slice(0, 40); }
}

/** Movement against the previous window of the same length. */
function Delta({ now, before }: { now: number; before: number }) {
  if (!before && !now) return <span className="text-[11px] text-muted-foreground">No traffic yet</span>;
  if (!before) return <span className="text-[11px] text-muted-foreground">No earlier period to compare</span>;
  const pct = Math.round(((now - before) / before) * 100);
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px]',
      pct > 0 ? 'text-ok' : pct < 0 ? 'text-risk' : 'text-muted-foreground',
    )}>
      <Icon className="h-3 w-3" />
      <span className="tabular-nums">{Math.abs(pct)}%</span>
      <span className="text-muted-foreground">on the period before</span>
    </span>
  );
}

/** A ledger row with its share drawn behind it. */
function ShareRow({ label, value, total, mono }: { label: string; value: number; total: number; mono?: boolean }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <li className="relative flex items-center gap-3 px-4 py-2.5">
      {/* The share as a rule along the foot of the row: readable at a
          glance without a block edge cutting through the label. */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-[2px] bg-primary/70"
        style={{ width: `${Math.max(pct, 1)}%` }}
      />
      <span className={cn('relative min-w-0 flex-1 truncate text-[12.5px]', mono && 'font-mono text-[11.5px]')}>
        {label}
      </span>
      <span className="relative shrink-0 font-mono text-[12px] tabular-nums">{value.toLocaleString()}</span>
      <span className="relative w-11 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-muted-foreground">
        {pct.toFixed(1)}%
      </span>
    </li>
  );
}

export default function AdminSiteAnalytics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = async () => {
    setLoading(true);
    // Two windows: the one asked for and the one before it.
    const since = new Date(Date.now() - days * 2 * 86400000).toISOString();
    const { data } = await (supabase as any)
      .from('marketing_page_views')
      .select('path, referrer, session_id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50000);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  const cutoff = useMemo(() => Date.now() - days * 86400000, [days]);
  const current = useMemo(() => rows.filter(r => new Date(r.created_at).getTime() >= cutoff), [rows, cutoff]);
  const previous = useMemo(() => rows.filter(r => new Date(r.created_at).getTime() < cutoff), [rows, cutoff]);

  const stats = useMemo(() => {
    const sessions = (list: Row[]) => new Set(list.map(r => r.session_id).filter(Boolean)).size;
    const visitors = sessions(current);
    const views = current.length;
    return {
      views,
      visitors,
      pages: new Set(current.map(r => r.path)).size,
      perVisit: visitors ? (views / visitors) : 0,
      prevViews: previous.length,
      prevVisitors: sessions(previous),
    };
  }, [current, previous]);

  const series = useMemo(() => {
    const buckets = new Map<string, { views: number; sessions: Set<string> }>();
    const hourly = days <= 1;
    const steps = hourly ? 24 : days;
    for (let i = steps - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * (hourly ? 3600000 : 86400000));
      const key = hourly ? d.toISOString().slice(0, 13) : d.toISOString().slice(0, 10);
      buckets.set(key, { views: 0, sessions: new Set() });
    }
    current.forEach(r => {
      const key = hourly ? r.created_at.slice(0, 13) : r.created_at.slice(0, 10);
      const b = buckets.get(key);
      if (b) { b.views += 1; if (r.session_id) b.sessions.add(r.session_id); }
    });
    return Array.from(buckets.entries()).map(([key, b]) => ({
      label: hourly ? `${key.slice(11)}:00` : key.slice(5),
      views: b.views,
      visitors: b.sessions.size,
    }));
  }, [current, days]);

  const topPages = useMemo(() => {
    const map = new Map<string, number>();
    current.forEach(r => map.set(r.path, (map.get(r.path) || 0) + 1));
    return Array.from(map.entries()).map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views).slice(0, 12);
  }, [current]);

  const topSources = useMemo(() => {
    const map = new Map<string, number>();
    current.forEach(r => { const s = sourceOf(r.referrer); map.set(s, (map.get(s) || 0) + 1); });
    return Array.from(map.entries()).map(([source, views]) => ({ source, views }))
      .sort((a, b) => b.views - a.views).slice(0, 10);
  }, [current]);

  const busiest = useMemo(() => {
    if (!series.length) return null;
    return series.reduce((best, d) => (d.views > best.views ? d : best), series[0]);
  }, [series]);

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={KICKER}>Public website</p>
            <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]">
              Traffic
            </h1>
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
              Who is arriving at quooro.co.uk, where from, and what they read.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-[11px] border border-border/60 bg-sunken/40 p-1">
              {RANGES.map(r => (
                <button
                  key={r.days}
                  type="button"
                  onClick={() => setDays(r.days)}
                  className={cn(
                    'h-8 rounded-[8px] px-3 text-[12px] font-medium transition-colors',
                    days === r.days
                      ? 'border border-border/70 bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-9 w-9 rounded-[10px] p-0" onClick={load} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="mt-6 space-y-4">
            <SkeletonBlock className="h-[300px] rounded-[14px]" />
            <div className="grid gap-4 lg:grid-cols-2">
              <SkeletonBlock className="h-[280px] rounded-[14px]" />
              <SkeletonBlock className="h-[280px] rounded-[14px]" />
            </div>
          </div>
        ) : current.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No traffic in this window"
              body="Nothing has been recorded for the period selected. Try a longer range."
            />
          </div>
        ) : (
          <>
            {/* The headline, with the chart underneath it */}
            <div className="mt-6 overflow-hidden rounded-[14px] border border-border/60 bg-card">
              <div className="grid grid-cols-2 gap-px bg-border/60 sm:grid-cols-4">
                {[
                  { label: 'Visitors', value: stats.visitors.toLocaleString(), delta: <Delta now={stats.visitors} before={stats.prevVisitors} />, lead: true },
                  { label: 'Page views', value: stats.views.toLocaleString(), delta: <Delta now={stats.views} before={stats.prevViews} /> },
                  { label: 'Pages per visit', value: stats.perVisit ? stats.perVisit.toFixed(1) : '–', meta: 'How deep they go' },
                  { label: 'Pages read', value: stats.pages.toLocaleString(), meta: busiest ? `Busiest ${busiest.label}` : undefined },
                ].map(f => (
                  <div key={f.label} className="bg-card px-4 py-3.5">
                    <p className={KICKER}>{f.label}</p>
                    <p className={cn(
                      'mt-1.5 font-display font-semibold leading-none tracking-[-0.02em] tabular-nums',
                      f.lead ? 'text-[30px] text-primary' : 'text-[24px]',
                    )}>
                      {f.value}
                    </p>
                    <div className="mt-1.5 truncate text-[11px] text-muted-foreground">{f.delta || f.meta}</div>
                  </div>
                ))}
              </div>

              <div className="h-[260px] px-1 pb-3 pt-5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: 'hsl(var(--muted-foreground))' }}
                      minTickGap={26}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={34}
                      tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: 'hsl(var(--muted-foreground))' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ stroke: 'hsl(var(--border))' }}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                      labelStyle={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em' }}
                    />
                    <Area
                      type="monotone" dataKey="views" name="Views"
                      stroke="hsl(var(--primary))" strokeWidth={1.75}
                      fill="url(#trafficFill)" dot={false}
                    />
                    <Area
                      type="monotone" dataKey="visitors" name="Visitors"
                      stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="3 3"
                      fill="none" dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Panel>
                <PanelHeader label="Most read">
                  <span className="text-[11px] text-muted-foreground">{topPages.length} pages</span>
                </PanelHeader>
                <ul className="divide-y divide-border/60">
                  {topPages.map(p => (
                    <ShareRow key={p.path} label={p.path} value={p.views} total={stats.views} mono />
                  ))}
                </ul>
              </Panel>

              <Panel>
                <PanelHeader label="Where they came from">
                  <span className="text-[11px] text-muted-foreground">{topSources.length} sources</span>
                </PanelHeader>
                <ul className="divide-y divide-border/60">
                  {topSources.map(s => (
                    <ShareRow key={s.source} label={s.source} value={s.views} total={stats.views} />
                  ))}
                </ul>
              </Panel>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
