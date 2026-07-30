import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';
import { type CRMDeal } from '@/hooks/useCRMDeals';
import { cn } from '@/lib/utils';
import {
  EmptyState, Money, Panel, PanelHeader, PanelRow, StatusDot, type Tone,
} from '@/components/platform';
import { ReportTiles } from '@/components/platform/crm';

/* Compressed £ for chart axes and tooltips only; ledgers use Money. */
const formatCurrency = (v: number) => {
  if (v >= 1000000) return `£${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `£${(v / 1000).toFixed(1)}K`;
  return `£${v.toFixed(0)}`;
};

/* Deal stages resolve to the platform tone vocabulary at the render site —
   the DEAL_STAGES hex rainbow in the hook is no longer read for colour. */
const STAGE_TONES: Record<string, Tone> = {
  qualification: 'neutral',
  discovery: 'neutral',
  proposal: 'attend',
  negotiation: 'attend',
  closing: 'accent',
  won: 'ok',
  lost: 'risk',
};

const TONE_BAR: Record<Tone, string> = {
  ok: 'bg-ok/60', attend: 'bg-attend/60', risk: 'bg-risk/60',
  neutral: 'bg-foreground/25', accent: 'bg-primary/60',
};

/* Series colours come from the token palette, not hex. */
const CHART = {
  projected: 'hsl(var(--primary))',
  weighted: 'hsl(var(--ok))',
  won: 'hsl(var(--ok))',
  lost: 'hsl(var(--risk))',
  grid: 'hsl(var(--border))',
  tick: 'hsl(var(--muted-foreground))',
};

interface ForecastProps {
  analytics: {
    totalPipeline: number;
    weightedPipeline: number;
    totalWon: number;
    totalLost: number;
    winRate: number;
    avgDealSize: number;
    activeCount: number;
    wonCount: number;
    lostCount: number;
    forecast: { month: string; projected: number; weighted: number }[];
    stageDistribution: { stage: string; key: string; color: string; count: number; value: number }[];
    winLossHistory: { month: string; won: number; lost: number; wonValue: number; lostValue: number }[];
  };
  deals: CRMDeal[];
}

export function DealForecast({ analytics, deals }: ForecastProps) {
  // Cashflow calendar (deals with expected close dates in next 90 days)
  const cashflowDeals = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 90);
    return deals
      .filter(d => d.expected_close_date && d.stage !== 'lost' && d.stage !== 'won')
      .filter(d => {
        const close = new Date(d.expected_close_date!);
        return close >= now && close <= end;
      })
      .sort((a, b) => new Date(a.expected_close_date!).getTime() - new Date(b.expected_close_date!).getTime());
  }, [deals]);

  const tiles = [
    { label: 'Pipeline value', value: <Money value={analytics.totalPipeline} whole />, meta: `${analytics.activeCount} active deals` },
    { label: 'Weighted forecast', value: <Money value={Math.round(analytics.weightedPipeline)} whole />, meta: 'Probability-adjusted' },
    { label: 'Won revenue', value: <Money value={analytics.totalWon} whole />, meta: `${analytics.wonCount} deals closed` },
    { label: 'Win rate', value: `${analytics.winRate.toFixed(0)}%`, meta: `${analytics.wonCount} won, ${analytics.lostCount} lost` },
    { label: 'Avg deal size', value: <Money value={Math.round(analytics.avgDealSize)} whole />, meta: 'From won deals' },
    { label: 'Lost revenue', value: <Money value={analytics.totalLost} whole />, meta: `${analytics.lostCount} deals lost` },
  ];

  const stageTotal = analytics.stageDistribution.reduce((s, d) => s + d.value, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-border/60 bg-popover px-3 py-2">
        <p className="mb-1 text-[10px] font-medium text-foreground">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-[10px]" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4" style={{ minHeight: 0 }}>
      {/* Metric tiles */}
      <ReportTiles tiles={tiles} className="sm:grid-cols-3 lg:grid-cols-6" />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Revenue forecast chart */}
        <Panel>
          <PanelHeader label="Revenue forecast (6 months)" />
          <div className="p-4" style={{ height: 252 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.forecast}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.projected} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART.projected} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wgtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.weighted} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART.weighted} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="month" tick={{ fill: CHART.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: CHART.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="projected" name="Projected" stroke={CHART.projected} fill="url(#projGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="weighted" name="Weighted" stroke={CHART.weighted} fill="url(#wgtGrad)" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 10, color: CHART.tick }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Won and lost chart */}
        <Panel>
          <PanelHeader label="Won and lost (6 months)" />
          <div className="p-4" style={{ height: 252 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.winLossHistory} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="month" tick={{ fill: CHART.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: CHART.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }} />
                <Bar dataKey="wonValue" name="Won" fill={CHART.won} radius={[4, 4, 0, 0]} />
                <Bar dataKey="lostValue" name="Lost" fill={CHART.lost} radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 10, color: CHART.tick }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Pipeline by stage */}
        <Panel>
          <PanelHeader label="Pipeline by stage" />
          <div className="space-y-3 p-4">
            {analytics.stageDistribution.map(s => {
              const tone = STAGE_TONES[s.key] ?? 'neutral';
              const share = stageTotal > 0 ? (s.value / stageTotal) * 100 : 0;
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <StatusDot tone={tone} />
                      <span className="text-[11px] text-foreground">{s.stage}</span>
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{s.count}</span>
                    </div>
                    <Money value={s.value} whole className="font-mono text-[10.5px] text-ink-2" />
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div className={cn('h-full rounded-full', TONE_BAR[tone])} style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Expected cashflow */}
        <Panel>
          <PanelHeader label="Expected cashflow (90 days)" />
          <div className="max-h-[220px] overflow-y-auto">
            {cashflowDeals.length === 0 && (
              <EmptyState
                compact
                title="No expected closes"
                body="Deals with an expected close date in the next 90 days will appear here."
              />
            )}
            {cashflowDeals.map(deal => {
              const close = new Date(deal.expected_close_date!);
              const daysUntil = Math.ceil((close.getTime() - Date.now()) / 86400000);
              const tone = STAGE_TONES[deal.stage] ?? 'neutral';
              return (
                <PanelRow
                  key={deal.id}
                  leading={<StatusDot tone={tone} />}
                  title={deal.deal_name}
                  meta={deal.company_name || 'No company'}
                  trailing={
                    <span className="flex shrink-0 items-center gap-4">
                      <span className="text-right">
                        <Money value={Number(deal.deal_value)} whole className="block font-mono text-[11px] text-foreground" />
                        <span className="font-mono text-[9px] tabular-nums text-muted-foreground">{deal.probability}% likely</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-mono text-[10px] tabular-nums text-ink-2">
                          {close.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className={cn(
                          'font-mono text-[9px] tabular-nums',
                          daysUntil <= 7 ? 'text-risk' : daysUntil <= 30 ? 'text-attend' : 'text-muted-foreground',
                        )}>
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                        </span>
                      </span>
                    </span>
                  }
                />
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
