import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Briefcase, CheckCircle2,
  Activity, UserPlus, Target, ArrowUpRight, ArrowDownRight, Minus,
  BarChart3, PieChart as PieChartIcon, AlertTriangle, Clock, FileText,
  Zap, Bell, ChevronRight, Building2, LayoutDashboard, LogOut,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ThemeToggle } from '@/components/ThemeToggle';

// ── Chart colors ──
const COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  sky: '#0ea5e9',
  slate: '#64748b',
};

const PIE_COLORS = [COLORS.blue, COLORS.emerald, COLORS.amber, COLORS.violet, COLORS.rose, COLORS.sky];

// ── Tooltip ──
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-foreground">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── KPI Card ──
function KPICard({ label, value, trend, trendValue, icon: Icon, color, prefix = '', suffix = '' }: {
  label: string; value: string | number; trend: 'up' | 'down' | 'flat';
  trendValue: string; icon: any; color: string; prefix?: string; suffix?: string;
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 hover:shadow-lg transition-shadow group cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
          <TrendIcon className="w-3.5 h-3.5" />
          {trendValue}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

// ── Alert Card ──
function AlertCard({ title, message, severity }: { title: string; message: string; severity: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: 'border-emerald-500/30 bg-emerald-500/5',
    yellow: 'border-amber-500/30 bg-amber-500/5',
    red: 'border-rose-500/30 bg-rose-500/5',
  };
  const icons = {
    green: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    yellow: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    red: <Bell className="w-4 h-4 text-rose-500" />,
  };

  return (
    <div className={cn("rounded-lg border p-3 flex items-start gap-3", colors[severity])}>
      <div className="mt-0.5">{icons[severity]}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// ── Activity Item ──
function ActivityItem({ action, detail, time, icon: Icon }: { action: string; detail: string; time: string; icon: any }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium truncate">{action}</p>
        <p className="text-xs text-muted-foreground truncate">{detail}</p>
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // ── Live data queries ──
  const { data: clients } = useQuery({
    queryKey: ['exec-clients'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: invoiceData } = useQuery({
    queryKey: ['exec-invoices'],
    queryFn: async () => {
      const { data } = await supabase.from('client_invoices').select('amount, total_amount, status, created_at, paid_at');
      if (!data) return { total: 0, paid: 0, outstanding: 0, paidCount: 0, totalCount: 0 };
      const paid = data.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
      const outstanding = data.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (i.total_amount || 0), 0);
      return { total: paid + outstanding, paid, outstanding, paidCount: data.filter(i => i.status === 'paid').length, totalCount: data.length };
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['exec-projects'],
    queryFn: async () => {
      const { data } = await supabase.from('app_projects').select('status, created_at');
      if (!data) return { active: 0, completed: 0, total: 0, byStatus: {} as Record<string, number> };
      const byStatus: Record<string, number> = {};
      data.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
      return {
        active: data.filter(p => !['completed', 'deployed'].includes(p.status)).length,
        completed: data.filter(p => ['completed', 'deployed'].includes(p.status)).length,
        total: data.length,
        byStatus,
      };
    },
  });

  const { data: leads } = useQuery({
    queryKey: ['exec-leads'],
    queryFn: async () => {
      const { data } = await supabase.from('leads').select('status, created_at');
      if (!data) return { total: 0, thisWeek: 0, converted: 0, rate: 0 };
      const weekAgo = subDays(new Date(), 7);
      const thisWeek = data.filter(l => new Date(l.created_at) > weekAgo).length;
      const converted = data.filter(l => l.status === 'contacted' || l.status === 'engaged').length;
      return { total: data.length, thisWeek, converted, rate: data.length ? Math.round((converted / data.length) * 100) : 0 };
    },
  });

  const { data: deals } = useQuery({
    queryKey: ['exec-deals'],
    queryFn: async () => {
      const { data } = await supabase.from('crm_deals').select('deal_value, stage, won, created_at');
      if (!data) return { pipeline: 0, won: 0, count: 0, byStage: {} as Record<string, number> };
      const byStage: Record<string, number> = {};
      data.forEach(d => { byStage[d.stage] = (byStage[d.stage] || 0) + 1; });
      return {
        pipeline: data.filter(d => !d.won).reduce((s, d) => s + (d.deal_value || 0), 0),
        won: data.filter(d => d.won).reduce((s, d) => s + (d.deal_value || 0), 0),
        count: data.length,
        byStage,
      };
    },
  });

  const { data: contentRequests } = useQuery({
    queryKey: ['exec-content'],
    queryFn: async () => {
      const { data } = await supabase.from('content_requests').select('status, created_at');
      if (!data) return { total: 0, pending: 0, delivered: 0 };
      return {
        total: data.length,
        pending: data.filter(c => c.status === 'pending' || c.status === 'in_progress').length,
        delivered: data.filter(c => c.status === 'delivered' || c.status === 'completed').length,
      };
    },
  });

  const { data: teamMembers } = useQuery({
    queryKey: ['exec-team'],
    queryFn: async () => {
      const { count } = await supabase.from('team_memberships').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // ── Mock data for charts (will be wired to live data in Phase 2) ──
  const revenueChart = Array.from({ length: 12 }, (_, i) => ({
    month: format(new Date(2026, i, 1), 'MMM'),
    revenue: Math.round(8000 + Math.random() * 15000),
    expenses: Math.round(3000 + Math.random() * 6000),
  }));

  const projectStatusData = projects?.byStatus
    ? Object.entries(projects.byStatus).map(([name, value]) => ({ name, value }))
    : [{ name: 'planning', value: 3 }, { name: 'in_progress', value: 5 }, { name: 'review', value: 2 }, { name: 'completed', value: 8 }];

  const dealStageData = deals?.byStage
    ? Object.entries(deals.byStage).map(([name, value]) => ({ name, value }))
    : [{ name: 'discovery', value: 4 }, { name: 'proposal', value: 6 }, { name: 'negotiation', value: 3 }, { name: 'closed', value: 8 }];

  const weeklyActivity = Array.from({ length: 7 }, (_, i) => ({
    day: format(subDays(new Date(), 6 - i), 'EEE'),
    logins: Math.round(5 + Math.random() * 20),
    actions: Math.round(20 + Math.random() * 80),
  }));

  // ── Alerts ──
  const alerts: { title: string; message: string; severity: 'green' | 'yellow' | 'red' }[] = [];
  if ((invoiceData?.outstanding || 0) > 0) {
    alerts.push({ title: 'Outstanding Invoices', message: `£${invoiceData?.outstanding.toLocaleString()} in unpaid invoices`, severity: 'yellow' });
  }
  if ((projects?.active || 0) > 10) {
    alerts.push({ title: 'High Project Load', message: `${projects?.active} active projects in pipeline`, severity: 'yellow' });
  }
  if (alerts.length === 0) {
    alerts.push({ title: 'All Systems Healthy', message: 'No critical alerts at this time', severity: 'green' });
  }

  const paymentRate = invoiceData?.totalCount ? Math.round((invoiceData.paidCount / invoiceData.totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Executive Dashboard</h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">Quooro Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Time range selector */}
            <div className="flex bg-muted rounded-lg p-0.5">
              {(['7d', '30d', '90d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    timeRange === range ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
            <ThemeToggle />
            <button onClick={() => navigate(-1)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" /> Exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* ── KPI Grid ── */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPICard label="Total Clients" value={clients || 0} trend="up" trendValue="+12%" icon={Users} color="bg-blue-500" />
            <KPICard label="Revenue Generated" value={`£${((invoiceData?.paid || 0) / 1000).toFixed(1)}k`} trend="up" trendValue="+8.3%" icon={DollarSign} color="bg-emerald-500" />
            <KPICard label="Active Projects" value={projects?.active || 0} trend="flat" trendValue="0%" icon={Briefcase} color="bg-violet-500" />
            <KPICard label="New Leads" value={leads?.thisWeek || 0} trend="up" trendValue={`+${leads?.thisWeek || 0}`} icon={UserPlus} color="bg-amber-500" suffix="/wk" />
            <KPICard label="Conversion Rate" value={`${leads?.rate || 0}%`} trend={leads?.rate && leads.rate > 20 ? 'up' : 'down'} trendValue={`${leads?.rate || 0}%`} icon={Target} color="bg-rose-500" />
          </div>
        </section>

        {/* ── Financial + Operations Row ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart (2/3) */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-foreground">Revenue vs Expenses</span>
              </div>
              <span className="text-xs text-muted-foreground">Last 12 months</span>
            </div>
            <div className="p-5 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.rose} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={COLORS.rose} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.emerald} fill="url(#gRev)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke={COLORS.rose} fill="url(#gExp)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Financial Summary (1/3) */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-foreground">Financial Summary</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total Revenue</span>
                  <span className="text-sm font-bold text-foreground">£{(invoiceData?.paid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Outstanding</span>
                  <span className="text-sm font-bold text-amber-500">£{(invoiceData?.outstanding || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Payment Rate</span>
                  <span className="text-sm font-bold text-foreground">{paymentRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${paymentRate}%` }} />
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Pipeline Value</span>
                  <span className="text-sm font-bold text-foreground">£{(deals?.pipeline || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Deals Won</span>
                  <span className="text-sm font-bold text-emerald-500">£{(deals?.won || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Team Members</span>
                  <span className="text-sm font-bold text-foreground">{teamMembers || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Operations + Sales Row ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Project Status Donut */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <PieChartIcon className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-semibold text-foreground">Project Status</span>
            </div>
            <div className="p-5 h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {projectStatusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="px-5 pb-4 flex flex-wrap gap-3">
              {projectStatusData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-[10px] text-muted-foreground capitalize">{s.name.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Pipeline */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Target className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">Sales Pipeline</span>
            </div>
            <div className="p-5 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealStageData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill={COLORS.amber} radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="px-5 pb-4 flex gap-4 text-xs text-muted-foreground">
              <span>Total Deals: <strong className="text-foreground">{deals?.count || 0}</strong></span>
              <span>Converted: <strong className="text-foreground">{leads?.converted || 0}</strong></span>
            </div>
          </div>

          {/* Platform Activity */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Activity className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-semibold text-foreground">Platform Activity</span>
            </div>
            <div className="p-5 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="logins" name="Logins" stroke={COLORS.sky} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actions" name="Actions" stroke={COLORS.violet} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="px-5 pb-4 flex gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> Logins</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Actions</span>
            </div>
          </div>
        </section>

        {/* ── Alerts + Activity Feed Row ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Executive Alerts */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Bell className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-semibold text-foreground">Executive Alerts</span>
            </div>
            <div className="p-5 space-y-3">
              {alerts.map((a, i) => (
                <AlertCard key={i} {...a} />
              ))}
              {(contentRequests?.pending || 0) > 0 && (
                <AlertCard title="Pending Content" message={`${contentRequests?.pending} content requests awaiting delivery`} severity="yellow" />
              )}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">Live Activity Feed</span>
            </div>
            <div className="p-5 max-h-[300px] overflow-y-auto">
              <ActivityItem action="New lead added" detail="Sarah Thompson via website enquiry" time="2m ago" icon={UserPlus} />
              <ActivityItem action="Invoice paid" detail="INV-2026-00042 — £2,400" time="15m ago" icon={DollarSign} />
              <ActivityItem action="Project updated" detail="Acme Corp Website → In Review" time="32m ago" icon={Briefcase} />
              <ActivityItem action="Content delivered" detail="Monthly blog package — 4 articles" time="1h ago" icon={FileText} />
              <ActivityItem action="Contract signed" detail="Premium Support Agreement — TechStart Ltd" time="2h ago" icon={CheckCircle2} />
              <ActivityItem action="Team member joined" detail="Alex Rodriguez — Designer" time="3h ago" icon={Users} />
              <ActivityItem action="Deal won" detail="£8,500 — Digital Transformation Package" time="5h ago" icon={TrendingUp} />
            </div>
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Quick Actions</span>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'View CRM', icon: Users, path: '/lounge/crm' },
              { label: 'Invoices', icon: FileText, path: '/lounge/billing' },
              { label: 'Projects', icon: Briefcase, path: '/lounge/apps' },
              { label: 'Analytics', icon: BarChart3, path: '/lounge/office/analytics' },
              { label: 'Team', icon: Building2, path: '/lounge/team' },
              { label: 'Admin Panel', icon: LayoutDashboard, path: '/dashboard' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-border bg-muted/30 hover:bg-muted transition-colors text-sm text-foreground font-medium group"
              >
                <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                {action.label}
                <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
