import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart,
  Eye, Download, Plus, Filter, Calendar, RefreshCw, Maximize2, Settings,
  PieChart, Activity, Layers, Globe, Target, Zap, ArrowUpRight, ArrowDownRight,
  ChevronDown, Search, Star, Clock, MoreHorizontal, Share2, Bell, Palette,
  Trash2, Edit2, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, Treemap,
  ComposedChart
} from 'recharts';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';

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
    { label: 'Total Revenue', value: `£${rev.toLocaleString()}`, change: 12.5, icon: DollarSign, color: '#10b981', sparkline: [42, 48, 55, 51, 63, 72, 68, 78].map(v => v * mult) },
    { label: 'Active Users', value: users.toLocaleString(), change: 8.3, icon: Users, color: '#6366f1', sparkline: [8200, 9100, 9800, 10200, 11000, 11800, 12200, 12847].map(v => Math.round(v * mult / 10)) },
    { label: 'Conversion Rate', value: '3.24%', change: -0.8, icon: Target, color: '#f59e0b', sparkline: [3.8, 3.5, 3.2, 3.4, 3.1, 3.3, 3.0, 3.24] },
    { label: 'Avg Order Value', value: '£127.50', change: 5.2, icon: ShoppingCart, color: '#06b6d4', sparkline: [105, 110, 115, 118, 120, 122, 125, 127.5] },
    { label: 'Page Views', value: `${(2.4 * mult).toFixed(1)}M`, change: 18.7, icon: Eye, color: '#ec4899', sparkline: [1.6, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4].map(v => v * mult) },
    { label: 'Bounce Rate', value: '34.2%', change: -3.1, icon: Activity, color: '#ef4444', sparkline: [40, 38, 37, 36, 35.5, 35, 34.5, 34.2] },
  ];
}

const PIE_DATA = [
  { name: 'Enterprise', value: 42, color: '#6366f1' },
  { name: 'Growth', value: 28, color: '#06b6d4' },
  { name: 'Professional', value: 18, color: '#10b981' },
  { name: 'Starter', value: 12, color: '#f59e0b' },
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
    { stage: 'Leads', value: 10000, color: '#6366f1' },
    { stage: 'Qualified', value: 6200, color: '#06b6d4' },
    { stage: 'Proposal', value: 3800, color: '#10b981' },
    { stage: 'Negotiation', value: 2100, color: '#f59e0b' },
    { stage: 'Closed Won', value: 1400, color: '#22c55e' },
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
  { name: 'Organic Search', value: 38, color: '#10b981' },
  { name: 'Paid Social', value: 22, color: '#6366f1' },
  { name: 'Direct', value: 18, color: '#06b6d4' },
  { name: 'Referral', value: 12, color: '#f59e0b' },
  { name: 'Email', value: 10, color: '#ec4899' },
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
      { category: 'Salaries', value: 45, color: '#6366f1' },
      { category: 'Marketing', value: 18, color: '#ec4899' },
      { category: 'Infrastructure', value: 15, color: '#06b6d4' },
      { category: 'Office', value: 10, color: '#f59e0b' },
      { category: 'Other', value: 12, color: '#94a3b8' },
    ],
  };
}

type KPI = { label: string; value: string; change: number; icon: any; color: string; sparkline: number[] };
type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y';

interface DashboardItem {
  id: string;
  name: string;
  icon: any;
  starred: boolean;
}

function MiniSparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  );
}

const formatCurrency = (v: number) => `£${(v / 1000).toFixed(0)}k`;

/* ─── Dashboard Content Components ─── */

function OverviewDashboard({ timeRange, kpis, revenueData, trafficData, conversionData }: {
  timeRange: TimeRange; kpis: KPI[]; revenueData: any[]; trafficData: any[]; conversionData: any[];
}) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="relative group p-4 rounded-2xl bg-card/60 border border-border/20 hover:border-border/40 hover:shadow-xl transition-all overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at 30% 30%, ${kpi.color}08, transparent 70%)` }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                  <kpi.icon className="h-3.5 w-3.5" style={{ color: kpi.color }} />
                </div>
                <MiniSparkline data={kpi.sparkline} color={kpi.color} width={50} height={18} />
              </div>
              <div className="text-[18px] font-bold text-foreground tracking-tight">{kpi.value}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] text-muted-foreground/50 font-medium">{kpi.label}</span>
                <span className={cn("text-[9px] font-bold flex items-center gap-0.5", kpi.change >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {kpi.change >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                  {Math.abs(kpi.change)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue + Pie */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="xl:col-span-2 rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground">Revenue & Profitability</h3>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5 mb-4">Breakdown with margin analysis</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#gradRevenue)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#gradProfit)" strokeWidth={2} />
              <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2">
            {[{ label: 'Revenue', color: '#6366f1' }, { label: 'Profit', color: '#10b981' }, { label: 'Costs', color: '#ef4444' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ background: l.color }} /><span className="text-[9px] text-muted-foreground/60 font-medium">{l.label}</span></div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Revenue by Plan</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">Subscription tier distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <RPieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {PIE_DATA.map(entry => <Cell key={entry.name} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
            </RPieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {PIE_DATA.map(d => (
              <div key={d.name} className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} /><span className="text-[10px] text-muted-foreground flex-1">{d.name}</span><span className="text-[10px] font-bold text-foreground">{d.value}%</span></div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Traffic + Conversion */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Traffic Sources</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">Breakdown by acquisition channel</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
              <Bar dataKey="organic" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="direct" stackId="a" fill="#06b6d4" />
              <Bar dataKey="social" stackId="a" fill="#ec4899" />
              <Bar dataKey="referral" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Conversion Tracking</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">Conversion rate & sessions</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(conversionData.length / 8))} />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Live Feed */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl bg-card/60 border border-border/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-[13px] font-bold text-foreground">Live Activity Feed</h3>
          <span className="text-[9px] text-muted-foreground/40 ml-auto">Auto-refreshing</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { event: 'New subscription', detail: 'Enterprise plan — Acme Corp', time: '2s ago', color: '#10b981' },
            { event: 'Goal reached', detail: 'Monthly active users exceeded 12,500', time: '5m ago', color: '#6366f1' },
            { event: 'Anomaly detected', detail: 'Bounce rate spike on /pricing page', time: '12m ago', color: '#ef4444' },
            { event: 'Report generated', detail: 'Q4 Executive Summary ready', time: '28m ago', color: '#06b6d4' },
            { event: 'A/B test result', detail: 'Variant B: +14% CTR on CTA button', time: '1h ago', color: '#f59e0b' },
            { event: 'New milestone', detail: 'Revenue crossed £450k this quarter', time: '2h ago', color: '#ec4899' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/10">
              <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ background: item.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-foreground">{item.event}</div>
                <div className="text-[10px] text-muted-foreground/50 truncate">{item.detail}</div>
              </div>
              <span className="text-[9px] text-muted-foreground/35 shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
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

  return (
    <div className="space-y-6">
      {/* Sales KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Deals', value: '108', change: 15, color: '#6366f1' },
          { label: 'Won Revenue', value: '£660K', change: 22, color: '#10b981' },
          { label: 'Avg Win Rate', value: '66%', change: 4, color: '#f59e0b' },
          { label: 'Avg Deal Size', value: '£6.1K', change: 8, color: '#06b6d4' },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-2xl bg-card/60 border border-border/20">
            <span className="text-[9px] text-muted-foreground/50 font-medium">{k.label}</span>
            <div className="text-[20px] font-bold text-foreground mt-1">{k.value}</div>
            <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5 mt-1"><ArrowUpRight className="h-2.5 w-2.5" />{k.change}%</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Sales Funnel */}
        <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-4">Sales Funnel</h3>
          <div className="space-y-2">
            {funnelData.map((stage, i) => {
              const width = (stage.value / funnelData[0].value) * 100;
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground w-20 text-right">{stage.stage}</span>
                  <div className="flex-1 h-8 rounded-lg overflow-hidden bg-muted/20 relative">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ delay: i * 0.1, duration: 0.6 }}
                      className="h-full rounded-lg flex items-center px-3" style={{ background: stage.color }}>
                      <span className="text-[10px] font-bold text-white">{stage.value.toLocaleString()}</span>
                    </motion.div>
                  </div>
                  <span className="text-[9px] text-muted-foreground/50 w-10">{Math.round(width)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deal Velocity */}
        <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Deal Velocity</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">Average days to close</p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={dealVelocity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
              <Bar yAxisId="right" dataKey="deals" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.6} />
              <Line yAxisId="left" type="monotone" dataKey="avgDays" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rep Leaderboard */}
      <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
        <h3 className="text-[13px] font-bold text-foreground mb-4">Sales Rep Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border/20">
              <th className="text-left pb-2 text-muted-foreground/50 font-medium">Rep</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Deals</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Revenue</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Win Rate</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Pipeline</th>
            </tr></thead>
            <tbody>
              {salesData.sort((a, b) => b.revenue - a.revenue).map((rep, i) => (
                <tr key={rep.rep} className="border-b border-border/10 hover:bg-muted/10">
                  <td className="py-2.5 font-medium text-foreground flex items-center gap-2">
                    <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white",
                      i === 0 ? "bg-amber-500" : i === 1 ? "bg-zinc-400" : i === 2 ? "bg-amber-700" : "bg-muted-foreground/20"
                    )}>{i + 1}</span>
                    {rep.rep}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{rep.deals}</td>
                  <td className="py-2.5 text-right font-semibold text-foreground">£{(rep.revenue / 1000).toFixed(0)}K</td>
                  <td className="py-2.5 text-right"><span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", rep.winRate >= 70 ? "bg-emerald-500/10 text-emerald-500" : rep.winRate >= 60 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500")}>{rep.winRate}%</span></td>
                  <td className="py-2.5 text-right text-muted-foreground">£{(rep.pipeline / 1000).toFixed(0)}K</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MarketingDashboard({ timeRange }: { timeRange: TimeRange }) {
  const campaigns = useMemo(() => generateCampaignData(), []);

  return (
    <div className="space-y-6">
      {/* Marketing KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Spend', value: '£33K', change: -5, color: '#ef4444' },
          { label: 'Total Leads', value: '1,870', change: 18, color: '#6366f1' },
          { label: 'Avg CPL', value: '£17.60', change: -12, color: '#10b981' },
          { label: 'Best ROI', value: '8.5x', change: 24, color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-2xl bg-card/60 border border-border/20">
            <span className="text-[9px] text-muted-foreground/50 font-medium">{k.label}</span>
            <div className="text-[20px] font-bold text-foreground mt-1">{k.value}</div>
            <span className={cn("text-[9px] font-bold flex items-center gap-0.5 mt-1", k.change >= 0 ? "text-emerald-500" : "text-red-500")}>
              {k.change >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}{Math.abs(k.change)}%
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Channel Distribution */}
        <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Channel Distribution</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">Lead acquisition by channel</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <RPieChart>
                <Pie data={CHANNEL_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {CHANNEL_PIE.map(entry => <Cell key={entry.name} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {CHANNEL_PIE.map(d => (
                <div key={d.name} className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} /><span className="text-[10px] text-muted-foreground flex-1">{d.name}</span><span className="text-[10px] font-bold text-foreground">{d.value}%</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* Campaign ROI */}
        <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Campaign ROI</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">Return on investment per campaign</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={campaigns} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}x`} />
              <YAxis type="category" dataKey="campaign" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
              <Bar dataKey="roi" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
        <h3 className="text-[13px] font-bold text-foreground mb-4">Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border/20">
              <th className="text-left pb-2 text-muted-foreground/50 font-medium">Campaign</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Spend</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Leads</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">CPL</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Conversions</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">ROI</th>
            </tr></thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.campaign} className="border-b border-border/10 hover:bg-muted/10">
                  <td className="py-2.5 font-medium text-foreground">{c.campaign}</td>
                  <td className="py-2.5 text-right text-muted-foreground">£{(c.spend / 1000).toFixed(1)}K</td>
                  <td className="py-2.5 text-right text-muted-foreground">{c.leads}</td>
                  <td className="py-2.5 text-right text-muted-foreground">£{c.cpl.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{c.conversions}</td>
                  <td className="py-2.5 text-right"><span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", c.roi >= 5 ? "bg-emerald-500/10 text-emerald-500" : c.roi >= 3 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500")}>{c.roi}x</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductDashboard({ timeRange }: { timeRange: TimeRange }) {
  const productMetrics = useMemo(() => generateProductMetrics(), []);
  const radarData = productMetrics.map(p => ({ feature: p.feature, usage: p.usage, satisfaction: p.satisfaction * 20 }));
  const errorTrend = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    day: `D${i + 1}`, errors: Math.floor(15 + Math.random() * 30 - i * 0.8), warnings: Math.floor(40 + Math.random() * 20)
  })), []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'DAU', value: '4,280', change: 12, color: '#6366f1' },
          { label: 'Avg Session', value: '8m 42s', change: 6, color: '#10b981' },
          { label: 'NPS Score', value: '72', change: 4, color: '#f59e0b' },
          { label: 'Error Rate', value: '0.3%', change: -18, color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-2xl bg-card/60 border border-border/20">
            <span className="text-[9px] text-muted-foreground/50 font-medium">{k.label}</span>
            <div className="text-[20px] font-bold text-foreground mt-1">{k.value}</div>
            <span className={cn("text-[9px] font-bold flex items-center gap-0.5 mt-1", (k.label === 'Error Rate' ? k.change <= 0 : k.change >= 0) ? "text-emerald-500" : "text-red-500")}>
              {k.change >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}{Math.abs(k.change)}%
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Feature Usage Radar */}
        <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Feature Engagement</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">Usage vs Satisfaction radar</p>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="feature" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
              <PolarRadiusAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
              <Radar name="Usage" dataKey="usage" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Satisfaction" dataKey="satisfaction" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Error Trend */}
        <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Error & Warning Trend</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">14-day rolling window</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={errorTrend}>
              <defs>
                <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                <linearGradient id="warnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="warnings" stroke="#f59e0b" fill="url(#warnGrad)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="url(#errGrad)" strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Table */}
      <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
        <h3 className="text-[13px] font-bold text-foreground mb-4">Feature Health</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border/20">
              <th className="text-left pb-2 text-muted-foreground/50 font-medium">Feature</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Usage %</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Satisfaction</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Errors (7d)</th>
              <th className="text-right pb-2 text-muted-foreground/50 font-medium">Health</th>
            </tr></thead>
            <tbody>
              {productMetrics.map(p => {
                const health = p.satisfaction >= 4.2 && p.errors < 15 ? 'Healthy' : p.errors >= 20 ? 'At Risk' : 'Stable';
                return (
                  <tr key={p.feature} className="border-b border-border/10 hover:bg-muted/10">
                    <td className="py-2.5 font-medium text-foreground">{p.feature}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{p.usage}%</td>
                    <td className="py-2.5 text-right text-muted-foreground">{p.satisfaction}/5</td>
                    <td className="py-2.5 text-right text-muted-foreground">{p.errors}</td>
                    <td className="py-2.5 text-right"><span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold",
                      health === 'Healthy' ? "bg-emerald-500/10 text-emerald-500" : health === 'At Risk' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                    )}>{health}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FinanceDashboard({ timeRange }: { timeRange: TimeRange }) {
  const { cashflow, expenses } = useMemo(() => generateFinanceData(), []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Net Cash', value: '£142K', change: 28, color: '#10b981' },
          { label: 'MRR', value: '£68K', change: 14, color: '#6366f1' },
          { label: 'Burn Rate', value: '£50.7K', change: -5, color: '#ef4444' },
          { label: 'Runway', value: '18 mo', change: 3, color: '#06b6d4' },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-2xl bg-card/60 border border-border/20">
            <span className="text-[9px] text-muted-foreground/50 font-medium">{k.label}</span>
            <div className="text-[20px] font-bold text-foreground mt-1">{k.value}</div>
            <span className={cn("text-[9px] font-bold flex items-center gap-0.5 mt-1", (k.label === 'Burn Rate' ? k.change <= 0 : k.change >= 0) ? "text-emerald-500" : "text-red-500")}>
              {k.change >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}{Math.abs(k.change)}%
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Cashflow */}
        <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Cashflow Analysis</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">Inflow vs outflow with net position</p>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
              <Bar dataKey="inflow" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Bar dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.5} />
              <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Expense Breakdown</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">Monthly cost distribution</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <RPieChart>
                <Pie data={expenses} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" nameKey="category">
                  {expenses.map(entry => <Cell key={entry.category} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {expenses.map(d => (
                <div key={d.category} className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} /><span className="text-[10px] text-muted-foreground flex-1">{d.category}</span><span className="text-[10px] font-bold text-foreground">{d.value}%</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="rounded-2xl bg-card/60 border border-border/20 p-5">
        <h3 className="text-[13px] font-bold text-foreground mb-4">P&L Summary (Last 6 Months)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Total Revenue', value: '£446K', sub: 'Up 22% YoY', color: '#10b981' },
            { label: 'Total Expenses', value: '£304K', sub: 'Up 8% YoY', color: '#ef4444' },
            { label: 'Net Profit', value: '£142K', sub: 'Margin: 31.8%', color: '#6366f1' },
          ].map(item => (
            <div key={item.label} className="text-center p-4 rounded-xl bg-background/50 border border-border/10">
              <span className="text-[9px] text-muted-foreground/50 font-medium">{item.label}</span>
              <div className="text-[22px] font-bold mt-1" style={{ color: item.color }}>{item.value}</div>
              <span className="text-[9px] text-muted-foreground/40">{item.sub}</span>
            </div>
          ))}
        </div>
      </div>
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
    { id: 'overview', name: 'Executive Overview', icon: Layers, starred: true },
    { id: 'sales', name: 'Sales Performance', icon: TrendingUp, starred: true },
    { id: 'marketing', name: 'Marketing Analytics', icon: Globe, starred: false },
    { id: 'product', name: 'Product Metrics', icon: Zap, starred: false },
    { id: 'finance', name: 'Financial Dashboard', icon: DollarSign, starred: false },
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

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <BarChart3 className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight">Analytics Studio</span>
        <span className="text-[10px] text-muted-foreground/50 hidden md:inline">— {dashboards.find(d => d.id === activeDashboard)?.name}</span>

        <div className="flex-1" />

        {/* Time range selector */}
        <div className="hidden sm:flex items-center gap-0.5 bg-muted/40 rounded-xl p-0.5 border border-border/20">
          {(['24h', '7d', '30d', '90d', '1y'] as TimeRange[]).map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all",
                timeRange === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60"
              )}>{r}</button>
          ))}
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={handleRefresh}>
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" />
        </Button>
      </header>

      {/* Mobile: dashboard selector + time range */}
      <div className="md:hidden shrink-0 border-b border-border/20 bg-background/60 backdrop-blur-sm">
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-none">
          {filteredDashboards.map(d => (
            <button key={d.id} onClick={() => setActiveDashboard(d.id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all shrink-0",
                activeDashboard === d.id ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:text-foreground"
              )}>
              <d.icon className="h-3 w-3" />{d.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-0.5 border border-border/20 mx-3 mb-2 w-fit">
          {(['24h', '7d', '30d', '90d', '1y'] as TimeRange[]).map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all",
                timeRange === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground"
              )}>{r}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex w-56 border-r border-border/20 bg-card/20 backdrop-blur-sm shrink-0 flex-col overflow-hidden">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dashboards…" className="h-7 pl-7 text-[10px] bg-card/50 border-border/20 rounded-lg" />
            </div>
          </div>

          <div className="px-3 pb-2">
            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Dashboards</span>
          </div>
          <div className="flex-1 overflow-auto px-2 space-y-0.5">
            {filteredDashboards.map(d => (
              <div key={d.id} className="group relative">
                {renamingId === d.id ? (
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename(d.id)}
                      className="h-6 text-[10px] flex-1" autoFocus />
                    <button onClick={() => handleRename(d.id)} className="p-0.5"><Check className="h-3 w-3 text-emerald-500" /></button>
                    <button onClick={() => setRenamingId(null)} className="p-0.5"><X className="h-3 w-3 text-muted-foreground" /></button>
                  </div>
                ) : (
                  <button onClick={() => setActiveDashboard(d.id)}
                    className={cn("w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all",
                      activeDashboard === d.id ? "bg-primary/10 text-foreground" : "hover:bg-accent/30 text-muted-foreground"
                    )}>
                    <d.icon className={cn("h-3.5 w-3.5", activeDashboard === d.id ? "text-primary" : "")} />
                    <span className="text-[11px] font-medium flex-1 truncate">{d.name}</span>
                    <button onClick={e => { e.stopPropagation(); toggleStar(d.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star className={cn("h-2.5 w-2.5", d.starred ? "fill-amber-400 text-amber-400 opacity-100" : "text-muted-foreground")} />
                    </button>
                    {d.starred && <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 group-hover:hidden" />}
                  </button>
                )}
                {/* Context actions */}
                {activeDashboard === d.id && d.id !== 'overview' && renamingId !== d.id && (
                  <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); setRenamingId(d.id); setRenameValue(d.name); }} className="p-1 rounded hover:bg-muted/40"><Edit2 className="h-2.5 w-2.5 text-muted-foreground" /></button>
                    {d.id.startsWith('custom-') && (
                      <button onClick={e => { e.stopPropagation(); deleteDashboard(d.id); }} className="p-1 rounded hover:bg-red-500/10"><Trash2 className="h-2.5 w-2.5 text-red-500" /></button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border/15">
            <Button variant="outline" size="sm" className="w-full h-8 text-[10px] gap-1.5 rounded-xl" onClick={() => setNewDashboardOpen(true)}>
              <Plus className="h-3 w-3" /> New Dashboard
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeDashboard + timeRange} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* New Dashboard Dialog */}
      <Dialog open={newDashboardOpen} onOpenChange={setNewDashboardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
          </DialogHeader>
          <Input value={newDashboardName} onChange={e => setNewDashboardName(e.target.value)} placeholder="Dashboard name…" onKeyDown={e => e.key === 'Enter' && handleCreateDashboard()} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDashboardOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDashboard} disabled={!newDashboardName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
