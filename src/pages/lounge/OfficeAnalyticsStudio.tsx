import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, TrendingUp, DollarSign,
  Download, Plus, RefreshCw,
  Layers, Globe, Zap,
  Search, Star, Trash2, Edit2, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart
} from 'recharts';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  TemperamentProvider, Panel, PanelHeader, PanelRow, StatusDot, StatusBadge,
  DataTable, Money, type Column, type Tone,
} from '@/components/platform';

/* ─── Chart tokens: every series resolves to the platform palette ─── */
const C = {
  primary: 'hsl(var(--primary))',
  gold: 'hsl(var(--gold))',
  ok: 'hsl(var(--ok))',
  attend: 'hsl(var(--attend))',
  risk: 'hsl(var(--risk))',
  muted: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
};
const TICK = { fontSize: 10, fill: C.muted };
const TICK_SM = { fontSize: 9, fill: C.muted };
const TOOLTIP_STYLE = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '10px',
  fontSize: '11px',
};

/* ─── Data generators per time range ─── */
function generateRevenueData(range: TimeRange) {
  const seed = range === '24h' ? 0.3 : range === '7d' ? 0.5 : range === '30d' ? 0.7 : range === '90d' ? 0.85 : 1;
  const labels = range === '24h'
    ? Array.from({ length: 24 }, (_, i) => `${i}:00`)
    : range === '7d'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : range === '30d'
    ? Array.from({ length: 8 }, (_, i) => `W${i + 1}`)
    : range === '90d'
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
    : ['Q1 23', 'Q2 23', 'Q3 23', 'Q4 23', 'Q1 24', 'Q2 24', 'Q3 24', 'Q4 24', 'Q1 25'];
  return labels.map((label, i) => {
    const base = 30000 + i * 4000 * seed + Math.sin(i) * 8000;
    const revenue = Math.round(base + Math.random() * 5000);
    const costs = Math.round(revenue * (0.5 + Math.random() * 0.15));
    return { label, revenue, costs, profit: revenue - costs };
  });
}

function generateTrafficData(range: TimeRange) {
  const len = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 8 : range === '90d' ? 12 : 12;
  const labels = range === '24h'
    ? Array.from({ length: 24 }, (_, i) => `${i}:00`)
    : range === '7d'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : range === '30d'
    ? Array.from({ length: 8 }, (_, i) => `W${i + 1}`)
    : Array.from({ length: len }, (_, i) => `P${i + 1}`);
  return labels.map((day, i) => ({
    day,
    direct: Math.floor(2000 + Math.random() * 4000 + Math.sin(i) * 1500),
    organic: Math.floor(4000 + Math.random() * 5000 + Math.cos(i) * 2000),
    referral: Math.floor(1000 + Math.random() * 3000),
    social: Math.floor(2000 + Math.random() * 4000),
  }));
}

function generateConversionData(range: TimeRange) {
  const len = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 12 : 12;
  return Array.from({ length: len }, (_, i) => ({
    hour: range === '24h' ? `${i}:00` : range === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] : `${i + 1}`,
    rate: +(2.1 + Math.sin(i / 3) * 1.8 + Math.random() * 0.5).toFixed(2),
    sessions: Math.floor(200 + Math.sin(i / 4) * 150 + Math.random() * 80),
  }));
}

function generateKPIs(range: TimeRange): KPI[] {
  const mult = range === '24h' ? 0.03 : range === '7d' ? 0.2 : range === '30d' ? 1 : range === '90d' ? 3 : 12;
  const rev = Math.round(478230 * mult);
  const users = Math.round(12847 * (range === '24h' ? 0.08 : range === '7d' ? 0.3 : range === '30d' ? 1 : range === '90d' ? 1.5 : 2));
  return [
    { label: 'Total revenue', value: `£${rev.toLocaleString()}`, change: 12.5 },
    { label: 'Active users', value: users.toLocaleString(), change: 8.3 },
    { label: 'Conversion rate', value: '3.24%', change: -0.8 },
    { label: 'Avg order value', value: '£127.50', change: 5.2 },
    { label: 'Page views', value: `${(2.4 * mult).toFixed(1)}M`, change: 18.7 },
    { label: 'Bounce rate', value: '34.2%', change: -3.1 },
  ];
}

const PIE_DATA = [
  { name: 'Enterprise', value: 42, color: C.primary },
  { name: 'Growth', value: 28, color: C.gold },
  { name: 'Professional', value: 18, color: C.ok },
  { name: 'Starter', value: 12, color: C.muted },
];

/* ─── Sales data ─── */
function generateSalesData() {
  return [
    { rep: 'Sarah K.', deals: 24, revenue: 142000, winRate: 68, pipeline: 285000 },
    { rep: 'James M.', deals: 19, revenue: 118000, winRate: 62, pipeline: 210000 },
    { rep: 'Ava T.', deals: 22, revenue: 135000, winRate: 71, pipeline: 190000 },
    { rep: 'Liam R.', deals: 15, revenue: 97000, winRate: 55, pipeline: 310000 },
    { rep: 'Emma B.', deals: 28, revenue: 168000, winRate: 74, pipeline: 225000 },
  ];
}

function generateFunnelData() {
  return [
    { stage: 'Leads', value: 10000, color: 'hsl(var(--primary))' },
    { stage: 'Qualified', value: 6200, color: 'hsl(var(--primary) / 0.8)' },
    { stage: 'Proposal', value: 3800, color: 'hsl(var(--primary) / 0.65)' },
    { stage: 'Negotiation', value: 2100, color: 'hsl(var(--primary) / 0.5)' },
    { stage: 'Closed won', value: 1400, color: 'hsl(var(--ok))' },
  ];
}

/* ─── Marketing data ─── */
function generateCampaignData() {
  return [
    { campaign: 'Google Ads', spend: 12000, leads: 340, cpl: 35.3, conversions: 48, roi: 3.2 },
    { campaign: 'Facebook Ads', spend: 8500, leads: 280, cpl: 30.4, conversions: 35, roi: 2.8 },
    { campaign: 'LinkedIn', spend: 6000, leads: 120, cpl: 50.0, conversions: 22, roi: 4.1 },
    { campaign: 'Email Marketing', spend: 2000, leads: 450, cpl: 4.4, conversions: 62, roi: 8.5 },
    { campaign: 'Content/SEO', spend: 4500, leads: 680, cpl: 6.6, conversions: 45, roi: 5.7 },
  ];
}

const CHANNEL_PIE = [
  { name: 'Organic search', value: 38, color: C.primary },
  { name: 'Paid social', value: 22, color: C.gold },
  { name: 'Direct', value: 18, color: C.ok },
  { name: 'Referral', value: 12, color: C.attend },
  { name: 'Email', value: 10, color: C.muted },
];

/* ─── Product data ─── */
function generateProductMetrics() {
  return [
    { feature: 'Dashboard', usage: 92, satisfaction: 4.5, errors: 12 },
    { feature: 'Reports', usage: 78, satisfaction: 4.2, errors: 8 },
    { feature: 'Analytics', usage: 65, satisfaction: 4.7, errors: 3 },
    { feature: 'Integrations', usage: 45, satisfaction: 3.8, errors: 22 },
    { feature: 'API', usage: 38, satisfaction: 4.1, errors: 15 },
    { feature: 'Mobile', usage: 55, satisfaction: 3.5, errors: 28 },
  ];
}

/* ─── Finance data ─── */
function generateFinanceData() {
  return {
    cashflow: [
      { month: 'Sep', inflow: 62000, outflow: 45000, net: 17000 },
      { month: 'Oct', inflow: 68000, outflow: 48000, net: 20000 },
      { month: 'Nov', inflow: 75000, outflow: 50000, net: 25000 },
      { month: 'Dec', inflow: 82000, outflow: 55000, net: 27000 },
      { month: 'Jan', inflow: 71000, outflow: 52000, net: 19000 },
      { month: 'Feb', inflow: 88000, outflow: 54000, net: 34000 },
    ],
    expenses: [
      { category: 'Salaries', value: 45, color: C.primary },
      { category: 'Marketing', value: 18, color: C.gold },
      { category: 'Infrastructure', value: 15, color: C.ok },
      { category: 'Office', value: 10, color: C.attend },
      { category: 'Other', value: 12, color: C.muted },
    ],
  };
}

type KPI = { label: string; value: string; change: number };
type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y';

interface DashboardItem {
  id: string;
  name: string;
  icon: any;
  starred: boolean;
}

const formatCurrency = (v: number) => `£${(v / 1000).toFixed(0)}k`;

/* ─── Shared presentation pieces ─── */

/** Fact ledger: label left, mono value right, quiet delta. */
function FactLedger({ facts, cols = 3 }: {
  facts: { label: string; value: string; change: number; good?: boolean }[];
  cols?: 2 | 3;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className={cn(
        'grid gap-px bg-border/60',
        cols === 3 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
      )}>
        {facts.map(f => (
          <div key={f.label} className="flex items-center justify-between gap-3 bg-card px-4 py-3">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
              {f.label}
            </span>
            <span className="text-right">
              <span className="block font-mono text-[15px] font-medium tabular-nums leading-tight text-foreground">
                {f.value}
              </span>
              <span className={cn(
                'block font-mono text-[10px] tabular-nums',
                f.good ? 'text-ok' : 'text-risk',
              )}>
                {f.change >= 0 ? '+' : ''}{f.change}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ChartPanel({ title, sub, children, className }: {
  title: string; sub?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <Panel className={cn('p-4', className)}>
      <h3 className="text-[13px] font-[550] tracking-[-0.01em] text-foreground">{title}</h3>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
      <div className="mt-3">{children}</div>
    </Panel>
  );
}

function LegendRow({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-5">
      {items.map(l => (
        <div key={l.label} className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">{l.label}</span>
        </div>
      ))}
    </div>
  );
}

function PieLegend({ items }: { items: { name: string; value: number; color: string }[] }) {
  return (
    <div className="space-y-1.5">
      {items.map(d => (
        <div key={d.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-[3px]" style={{ background: d.color }} />
          <span className="flex-1 text-[11px] text-muted-foreground">{d.name}</span>
          <span className="font-mono text-[11px] font-medium tabular-nums text-foreground">{d.value}%</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Dashboard Content Components ─── */

function OverviewDashboard({ timeRange, kpis, revenueData, trafficData, conversionData }: {
  timeRange: TimeRange; kpis: KPI[]; revenueData: any[]; trafficData: any[]; conversionData: any[];
}) {
  const liveFeed: { event: string; detail: string; time: string; tone: Tone }[] = [
    { event: 'New subscription', detail: 'Enterprise plan, Acme Corp', time: '2s ago', tone: 'ok' },
    { event: 'Goal reached', detail: 'Monthly active users exceeded 12,500', time: '5m ago', tone: 'ok' },
    { event: 'Anomaly detected', detail: 'Bounce rate spike on /pricing page', time: '12m ago', tone: 'risk' },
    { event: 'Report generated', detail: 'Q4 executive summary ready', time: '28m ago', tone: 'neutral' },
    { event: 'A/B test result', detail: 'Variant B: +14% CTR on CTA button', time: '1h ago', tone: 'neutral' },
    { event: 'New milestone', detail: 'Revenue crossed £450k this quarter', time: '2h ago', tone: 'ok' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI fact ledger */}
      <FactLedger cols={3} facts={kpis.map(k => ({ ...k, good: k.change >= 0 }))} />

      {/* Revenue + Pie */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartPanel title="Revenue and profitability" sub="Breakdown with margin analysis" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.primary} stopOpacity={0.25} /><stop offset="100%" stopColor={C.primary} stopOpacity={0} /></linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.ok} stopOpacity={0.2} /><stop offset="100%" stopColor={C.ok} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={0.4} />
              <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="revenue" stroke={C.primary} fill="url(#gradRevenue)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="profit" stroke={C.ok} fill="url(#gradProfit)" strokeWidth={1.5} />
              <Line type="monotone" dataKey="costs" stroke={C.risk} strokeDasharray="4 4" strokeWidth={1} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <LegendRow items={[
            { label: 'Revenue', color: C.primary },
            { label: 'Profit', color: C.ok },
            { label: 'Costs', color: C.risk },
          ]} />
        </ChartPanel>

        <ChartPanel title="Revenue by plan" sub="Subscription tier distribution">
          <ResponsiveContainer width="100%" height={180}>
            <RPieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {PIE_DATA.map(entry => <Cell key={entry.name} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RPieChart>
          </ResponsiveContainer>
          <div className="mt-2">
            <PieLegend items={PIE_DATA} />
          </div>
        </ChartPanel>
      </div>

      {/* Traffic + Conversion */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel title="Traffic sources" sub="Breakdown by acquisition channel">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={0.4} />
              <XAxis dataKey="day" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="organic" stackId="a" fill={C.primary} radius={[0, 0, 0, 0]} />
              <Bar dataKey="direct" stackId="a" fill={C.gold} />
              <Bar dataKey="social" stackId="a" fill={C.muted} />
              <Bar dataKey="referral" stackId="a" fill={C.attend} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <LegendRow items={[
            { label: 'Organic', color: C.primary },
            { label: 'Direct', color: C.gold },
            { label: 'Social', color: C.muted },
            { label: 'Referral', color: C.attend },
          ]} />
        </ChartPanel>

        <ChartPanel title="Conversion tracking" sub="Conversion rate and sessions">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={0.4} />
              <XAxis dataKey="hour" tick={TICK_SM} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(conversionData.length / 8))} />
              <YAxis yAxisId="left" tick={TICK_SM} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis yAxisId="right" orientation="right" tick={TICK_SM} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line yAxisId="left" type="monotone" dataKey="rate" stroke={C.primary} strokeWidth={1.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="sessions" stroke={C.muted} strokeWidth={1} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <LegendRow items={[
            { label: 'Rate', color: C.primary },
            { label: 'Sessions', color: C.muted },
          ]} />
        </ChartPanel>
      </div>

      {/* Live feed */}
      <Panel>
        <PanelHeader label="Live activity">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">Auto-refreshing</span>
        </PanelHeader>
        {liveFeed.map(item => (
          <PanelRow
            key={item.event}
            leading={<StatusDot tone={item.tone} />}
            title={item.event}
            meta={item.detail}
            trailing={<span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">{item.time}</span>}
          />
        ))}
      </Panel>
    </div>
  );
}

function SalesDashboard({ timeRange }: { timeRange: TimeRange }) {
  const salesData = useMemo(() => generateSalesData(), []);
  const funnelData = useMemo(() => generateFunnelData(), []);
  const dealVelocity = useMemo(() => [
    { month: 'Sep', avgDays: 28, deals: 18 },
    { month: 'Oct', avgDays: 24, deals: 22 },
    { month: 'Nov', avgDays: 22, deals: 25 },
    { month: 'Dec', avgDays: 19, deals: 30 },
    { month: 'Jan', avgDays: 21, deals: 27 },
    { month: 'Feb', avgDays: 17, deals: 32 },
  ], []);

  const ranked = salesData.sort((a, b) => b.revenue - a.revenue);
  const repColumns: Column<(typeof ranked)[number]>[] = [
    {
      key: 'rep', header: 'Rep', sortValue: r => r.rep,
      render: r => (
        <span className="flex items-center gap-2.5 font-[450] text-foreground">
          <span className="w-3 font-mono text-[10px] tabular-nums text-muted-foreground">{ranked.indexOf(r) + 1}</span>
          {r.rep}
        </span>
      ),
    },
    { key: 'deals', header: 'Deals', align: 'right', mono: true, sortValue: r => r.deals, render: r => r.deals },
    { key: 'revenue', header: 'Revenue', align: 'right', mono: true, sortValue: r => r.revenue, render: r => <Money value={r.revenue} whole /> },
    {
      key: 'winRate', header: 'Win rate', align: 'right', sortValue: r => r.winRate,
      render: r => (
        <span className={cn('font-mono text-xs tabular-nums', r.winRate >= 70 ? 'text-ok' : r.winRate >= 60 ? 'text-attend' : 'text-risk')}>
          {r.winRate}%
        </span>
      ),
    },
    { key: 'pipeline', header: 'Pipeline', align: 'right', mono: true, hideBelowMd: true, sortValue: r => r.pipeline, render: r => <Money value={r.pipeline} whole /> },
  ];

  return (
    <div className="space-y-4">
      <FactLedger cols={2} facts={[
        { label: 'Total deals', value: '108', change: 15, good: true },
        { label: 'Won revenue', value: '£660k', change: 22, good: true },
        { label: 'Avg win rate', value: '66%', change: 4, good: true },
        { label: 'Avg deal size', value: '£6.1k', change: 8, good: true },
      ]} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Sales funnel */}
        <ChartPanel title="Sales funnel">
          <div className="space-y-2">
            {funnelData.map(stage => {
              const width = (stage.value / funnelData[0].value) * 100;
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <span className="w-20 text-right text-[11px] text-muted-foreground">{stage.stage}</span>
                  <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-sunken">
                    <div className="flex h-full items-center rounded-md px-3" style={{ width: `${width}%`, background: stage.color }}>
                      <span className="font-mono text-[10px] font-medium tabular-nums text-primary-foreground">{stage.value.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="w-10 font-mono text-[10px] tabular-nums text-muted-foreground">{Math.round(width)}%</span>
                </div>
              );
            })}
          </div>
        </ChartPanel>

        {/* Deal velocity */}
        <ChartPanel title="Deal velocity" sub="Average days to close">
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={dealVelocity}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={0.4} />
              <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar yAxisId="right" dataKey="deals" fill={C.primary} radius={[2, 2, 0, 0]} opacity={0.35} />
              <Line yAxisId="left" type="monotone" dataKey="avgDays" stroke={C.ok} strokeWidth={1.5} dot={{ fill: C.ok, r: 2.5 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <LegendRow items={[
            { label: 'Deals', color: C.primary },
            { label: 'Avg days', color: C.ok },
          ]} />
        </ChartPanel>
      </div>

      {/* Rep leaderboard */}
      <Panel className="overflow-hidden">
        <PanelHeader label="Sales rep leaderboard" />
        <DataTable
          rows={ranked}
          columns={repColumns}
          rowKey={r => r.rep}
          defaultSort={{ key: 'revenue', dir: 'desc' }}
          aria-label="Sales rep leaderboard"
        />
      </Panel>
    </div>
  );
}

function MarketingDashboard({ timeRange }: { timeRange: TimeRange }) {
  const campaigns = useMemo(() => generateCampaignData(), []);

  const campaignColumns: Column<(typeof campaigns)[number]>[] = [
    { key: 'campaign', header: 'Campaign', sortValue: c => c.campaign, render: c => <span className="font-[450] text-foreground">{c.campaign}</span> },
    { key: 'spend', header: 'Spend', align: 'right', mono: true, sortValue: c => c.spend, render: c => <Money value={c.spend} whole /> },
    { key: 'leads', header: 'Leads', align: 'right', mono: true, sortValue: c => c.leads, render: c => c.leads },
    { key: 'cpl', header: 'CPL', align: 'right', mono: true, hideBelowMd: true, sortValue: c => c.cpl, render: c => <Money value={c.cpl} /> },
    { key: 'conversions', header: 'Conv.', align: 'right', mono: true, hideBelowMd: true, sortValue: c => c.conversions, render: c => c.conversions },
    {
      key: 'roi', header: 'ROI', align: 'right', sortValue: c => c.roi,
      render: c => (
        <span className={cn('font-mono text-xs tabular-nums', c.roi >= 5 ? 'text-ok' : c.roi >= 3 ? 'text-attend' : 'text-risk')}>
          {c.roi}x
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FactLedger cols={2} facts={[
        { label: 'Total spend', value: '£33k', change: -5, good: false },
        { label: 'Total leads', value: '1,870', change: 18, good: true },
        { label: 'Avg CPL', value: '£17.60', change: -12, good: false },
        { label: 'Best ROI', value: '8.5x', change: 24, good: true },
      ]} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Channel distribution */}
        <ChartPanel title="Channel distribution" sub="Lead acquisition by channel">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <RPieChart>
                <Pie data={CHANNEL_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {CHANNEL_PIE.map(entry => <Cell key={entry.name} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="flex-1">
              <PieLegend items={CHANNEL_PIE} />
            </div>
          </div>
        </ChartPanel>

        {/* Campaign ROI */}
        <ChartPanel title="Campaign ROI" sub="Return on investment per campaign">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={campaigns} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={0.4} />
              <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} tickFormatter={v => `${v}x`} />
              <YAxis type="category" dataKey="campaign" tick={TICK_SM} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="roi" fill={C.primary} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Campaign table */}
      <Panel className="overflow-hidden">
        <PanelHeader label="Campaign performance" />
        <DataTable
          rows={campaigns}
          columns={campaignColumns}
          rowKey={c => c.campaign}
          aria-label="Campaign performance"
        />
      </Panel>
    </div>
  );
}

function ProductDashboard({ timeRange }: { timeRange: TimeRange }) {
  const productMetrics = useMemo(() => generateProductMetrics(), []);
  const radarData = productMetrics.map(p => ({ feature: p.feature, usage: p.usage, satisfaction: p.satisfaction * 20 }));
  const errorTrend = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    day: `D${i + 1}`, errors: Math.floor(15 + Math.random() * 30 - i * 0.8), warnings: Math.floor(40 + Math.random() * 20)
  })), []);

  const featureColumns: Column<(typeof productMetrics)[number]>[] = [
    { key: 'feature', header: 'Feature', sortValue: p => p.feature, render: p => <span className="font-[450] text-foreground">{p.feature}</span> },
    { key: 'usage', header: 'Usage', align: 'right', mono: true, sortValue: p => p.usage, render: p => `${p.usage}%` },
    { key: 'satisfaction', header: 'Satisfaction', align: 'right', mono: true, hideBelowMd: true, sortValue: p => p.satisfaction, render: p => `${p.satisfaction}/5` },
    { key: 'errors', header: 'Errors (7d)', align: 'right', mono: true, sortValue: p => p.errors, render: p => p.errors },
    {
      key: 'health', header: 'Health', align: 'right',
      render: p => {
        const health = p.satisfaction >= 4.2 && p.errors < 15 ? 'Healthy' : p.errors >= 20 ? 'At risk' : 'Stable';
        return <StatusBadge tone={health === 'Healthy' ? 'ok' : health === 'At risk' ? 'risk' : 'attend'} label={health} />;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <FactLedger cols={2} facts={[
        { label: 'DAU', value: '4,280', change: 12, good: true },
        { label: 'Avg session', value: '8m 42s', change: 6, good: true },
        { label: 'NPS score', value: '72', change: 4, good: true },
        { label: 'Error rate', value: '0.3%', change: -18, good: true },
      ]} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Feature usage radar */}
        <ChartPanel title="Feature engagement" sub="Usage against satisfaction">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="feature" tick={TICK_SM} />
              <PolarRadiusAxis tick={{ fontSize: 8, fill: C.muted }} />
              <Radar name="Usage" dataKey="usage" stroke={C.primary} fill={C.primary} fillOpacity={0.12} strokeWidth={1.5} />
              <Radar name="Satisfaction" dataKey="satisfaction" stroke={C.ok} fill={C.ok} fillOpacity={0.08} strokeWidth={1.5} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Error trend */}
        <ChartPanel title="Error and warning trend" sub="14-day rolling window">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={errorTrend}>
              <defs>
                <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.risk} stopOpacity={0.25} /><stop offset="100%" stopColor={C.risk} stopOpacity={0} /></linearGradient>
                <linearGradient id="warnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.attend} stopOpacity={0.15} /><stop offset="100%" stopColor={C.attend} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={0.4} />
              <XAxis dataKey="day" tick={TICK_SM} axisLine={false} tickLine={false} />
              <YAxis tick={TICK_SM} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="warnings" stroke={C.attend} fill="url(#warnGrad)" strokeWidth={1} />
              <Area type="monotone" dataKey="errors" stroke={C.risk} fill="url(#errGrad)" strokeWidth={1.5} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Feature table */}
      <Panel className="overflow-hidden">
        <PanelHeader label="Feature health" />
        <DataTable
          rows={productMetrics}
          columns={featureColumns}
          rowKey={p => p.feature}
          aria-label="Feature health"
        />
      </Panel>
    </div>
  );
}

function FinanceDashboard({ timeRange }: { timeRange: TimeRange }) {
  const { cashflow, expenses } = useMemo(() => generateFinanceData(), []);

  return (
    <div className="space-y-4">
      <FactLedger cols={2} facts={[
        { label: 'Net cash', value: '£142k', change: 28, good: true },
        { label: 'MRR', value: '£68k', change: 14, good: true },
        { label: 'Burn rate', value: '£50.7k', change: -5, good: true },
        { label: 'Runway', value: '18 mo', change: 3, good: true },
      ]} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Cashflow */}
        <ChartPanel title="Cashflow analysis" sub="Inflow against outflow with net position">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={0.4} />
              <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="inflow" fill={C.ok} radius={[2, 2, 0, 0]} opacity={0.6} />
              <Bar dataKey="outflow" fill={C.risk} radius={[2, 2, 0, 0]} opacity={0.4} />
              <Line type="monotone" dataKey="net" stroke={C.primary} strokeWidth={1.5} dot={{ fill: C.primary, r: 2.5 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Expense breakdown */}
        <ChartPanel title="Expense breakdown" sub="Monthly cost distribution">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <RPieChart>
                <Pie data={expenses} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" nameKey="category">
                  {expenses.map(entry => <Cell key={entry.category} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="flex-1">
              <PieLegend items={expenses.map(e => ({ name: e.category, value: e.value, color: e.color }))} />
            </div>
          </div>
        </ChartPanel>
      </div>

      {/* P&L summary */}
      <Panel className="overflow-hidden">
        <PanelHeader label="P&L summary (last 6 months)" />
        <div className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-3">
          {[
            { label: 'Total revenue', value: '£446k', sub: 'Up 22% YoY' },
            { label: 'Total expenses', value: '£304k', sub: 'Up 8% YoY' },
            { label: 'Net profit', value: '£142k', sub: 'Margin 31.8%' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between gap-3 bg-card px-4 py-3">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{item.label}</span>
              <span className="text-right">
                <span className="block font-mono text-[15px] font-medium tabular-nums leading-tight text-foreground">{item.value}</span>
                <span className="block font-mono text-[10px] tabular-nums text-muted-foreground">{item.sub}</span>
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ─── Main Component ─── */
export default function OfficeAnalyticsStudio() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeDashboard, setActiveDashboard] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [dashboards, setDashboards] = useState<DashboardItem[]>([
    { id: 'overview', name: 'Executive overview', icon: Layers, starred: true },
    { id: 'sales', name: 'Sales performance', icon: TrendingUp, starred: true },
    { id: 'marketing', name: 'Marketing analytics', icon: Globe, starred: false },
    { id: 'product', name: 'Product metrics', icon: Zap, starred: false },
    { id: 'finance', name: 'Financial dashboard', icon: DollarSign, starred: false },
  ]);
  const [newDashboardOpen, setNewDashboardOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    toast.success('Dashboard refreshed');
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleDownload = useCallback(() => {
    toast.success('Report exported as PDF');
  }, []);

  const handleCreateDashboard = useCallback(() => {
    if (!newDashboardName.trim()) return;
    const id = `custom-${Date.now()}`;
    setDashboards(prev => [...prev, { id, name: newDashboardName.trim(), icon: BarChart3, starred: false }]);
    setActiveDashboard(id);
    setNewDashboardName('');
    setNewDashboardOpen(false);
    toast.success(`Dashboard "${newDashboardName.trim()}" created`);
  }, [newDashboardName]);

  const toggleStar = useCallback((id: string) => {
    setDashboards(prev => prev.map(d => d.id === id ? { ...d, starred: !d.starred } : d));
  }, []);

  const deleteDashboard = useCallback((id: string) => {
    setDashboards(prev => prev.filter(d => d.id !== id));
    if (activeDashboard === id) setActiveDashboard('overview');
    toast.success('Dashboard deleted');
  }, [activeDashboard]);

  const handleRename = useCallback((id: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    setDashboards(prev => prev.map(d => d.id === id ? { ...d, name: renameValue.trim() } : d));
    setRenamingId(null);
    toast.success('Dashboard renamed');
  }, [renameValue]);

  const filteredDashboards = dashboards.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  // Generate data based on time range
  const kpis = useMemo(() => generateKPIs(timeRange), [timeRange]);
  const revenueData = useMemo(() => generateRevenueData(timeRange), [timeRange]);
  const trafficData = useMemo(() => generateTrafficData(timeRange), [timeRange]);
  const conversionData = useMemo(() => generateConversionData(timeRange), [timeRange]);

  const renderContent = () => {
    switch (activeDashboard) {
      case 'sales': return <SalesDashboard timeRange={timeRange} />;
      case 'marketing': return <MarketingDashboard timeRange={timeRange} />;
      case 'product': return <ProductDashboard timeRange={timeRange} />;
      case 'finance': return <FinanceDashboard timeRange={timeRange} />;
      default: return <OverviewDashboard timeRange={timeRange} kpis={kpis} revenueData={revenueData} trafficData={trafficData} conversionData={conversionData} />;
    }
  };

  const timeRangeControl = (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-sunken p-0.5">
      {(['24h', '7d', '30d', '90d', '1y'] as TimeRange[]).map(r => (
        <button key={r} onClick={() => setTimeRange(r)}
          className={cn('rounded-md px-2.5 py-1 font-mono text-[10px] font-medium tabular-nums transition-colors duration-150',
            timeRange === r ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}>{r}</button>
      ))}
    </div>
  );

  return (
    <TemperamentProvider value="office">
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <OfficeModuleBand appId="analytics" icon={TrendingUp} title="Analytics">

        {/* Time range selector */}
        <div className="hidden sm:block">{timeRangeControl}</div>

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleRefresh} aria-label="Refresh">
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleDownload} aria-label="Export report">
          <Download className="h-3.5 w-3.5" />
        </Button>
      </OfficeModuleBand>

      {/* Mobile: dashboard selector + time range */}
      <div className="md:hidden shrink-0 border-b border-border/60 bg-background">
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-none">
          {filteredDashboards.map(d => (
            <button key={d.id} onClick={() => setActiveDashboard(d.id)}
              className={cn('flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-150',
                activeDashboard === d.id ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}>
              <d.icon className="h-3 w-3" />{d.name}
            </button>
          ))}
        </div>
        <div className="mx-3 mb-2 w-fit">{timeRangeControl}</div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden w-56 shrink-0 flex-col overflow-hidden border-r border-border/60 bg-background md:flex">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dashboards…" className="h-7 rounded-md border-border/60 bg-card pl-7 text-[11px]" />
            </div>
          </div>

          <div className="px-3 pb-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Dashboards</span>
          </div>
          <div className="flex-1 space-y-0.5 overflow-auto px-2">
            {filteredDashboards.map(d => (
              <div key={d.id} className="group relative">
                {renamingId === d.id ? (
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename(d.id)}
                      className="h-6 flex-1 text-[11px]" autoFocus />
                    <button onClick={() => handleRename(d.id)} className="p-0.5" aria-label="Confirm rename"><Check className="h-3 w-3 text-ok" /></button>
                    <button onClick={() => setRenamingId(null)} className="p-0.5" aria-label="Cancel rename"><X className="h-3 w-3 text-muted-foreground" /></button>
                  </div>
                ) : (
                  <button onClick={() => setActiveDashboard(d.id)}
                    className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors duration-150',
                      activeDashboard === d.id ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.025] hover:text-foreground'
                    )}>
                    <d.icon className={cn('h-3.5 w-3.5', activeDashboard === d.id ? 'text-foreground' : '')} />
                    <span className="flex-1 truncate text-[12px] font-medium">{d.name}</span>
                    <button onClick={e => { e.stopPropagation(); toggleStar(d.id); }} className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Star dashboard">
                      <Star className={cn('h-2.5 w-2.5', d.starred ? 'fill-gold text-gold opacity-100' : 'text-muted-foreground')} />
                    </button>
                    {d.starred && <Star className="h-2.5 w-2.5 fill-gold text-gold group-hover:hidden" />}
                  </button>
                )}
                {/* Context actions */}
                {activeDashboard === d.id && d.id !== 'overview' && renamingId !== d.id && (
                  <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={e => { e.stopPropagation(); setRenamingId(d.id); setRenameValue(d.name); }} className="rounded p-1 hover:bg-foreground/[0.05]" aria-label="Rename dashboard"><Edit2 className="h-2.5 w-2.5 text-muted-foreground" /></button>
                    {d.id.startsWith('custom-') && (
                      <button onClick={e => { e.stopPropagation(); deleteDashboard(d.id); }} className="rounded p-1 hover:bg-risk/10" aria-label="Delete dashboard"><Trash2 className="h-2.5 w-2.5 text-risk" /></button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 p-3">
            <Button variant="outline" size="sm" className="h-8 w-full gap-1.5 rounded-lg text-xs" onClick={() => setNewDashboardOpen(true)}>
              <Plus className="h-3 w-3" /> New dashboard
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-3 sm:p-5">
          {renderContent()}
        </div>
      </div>

      {/* New dashboard dialog */}
      <Dialog open={newDashboardOpen} onOpenChange={setNewDashboardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create new dashboard</DialogTitle>
          </DialogHeader>
          <Input value={newDashboardName} onChange={e => setNewDashboardName(e.target.value)} placeholder="Dashboard name…" onKeyDown={e => e.key === 'Enter' && handleCreateDashboard()} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDashboardOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDashboard} disabled={!newDashboardName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TemperamentProvider>
  );
}
