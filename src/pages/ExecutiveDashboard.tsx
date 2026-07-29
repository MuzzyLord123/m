import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, DollarSign, Briefcase, CheckCircle2, UserPlus, TrendingUp,
  BarChart3, FileText, ChevronRight, Building2, LayoutDashboard, LogOut,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Panel, PanelHeader } from '@/components/platform';

// ── Chart colours: tokens only ──
const CHART = {
  primary: 'hsl(var(--primary))',
  gold: 'hsl(var(--gold))',
  ok: 'hsl(var(--ok))',
  attend: 'hsl(var(--attend))',
  risk: 'hsl(var(--risk))',
  muted: 'hsl(var(--muted-foreground))',
};

const PIE_COLORS = [CHART.primary, CHART.gold, CHART.ok, CHART.attend, CHART.muted, CHART.risk];

// ── Tooltip ──
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-mono tabular-nums text-foreground">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Fact row: label left, mono tabular value right, delta as quiet text ──
function FactRow({ label, value, delta }: { label: string; value: string | number; delta?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border/60 px-4 py-2 first:border-t-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-2">
        {delta && <span className="text-[11px] tabular-nums text-muted-foreground">{delta}</span>}
        <span className="font-mono text-[13px] font-medium tabular-nums text-foreground">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </span>
    </div>
  );
}

// ── Alert row ──
function AlertCard({ title, message, severity }: { title: string; message: string; severity: 'green' | 'yellow' | 'red' }) {
  const dots = { green: 'bg-ok', yellow: 'bg-attend', red: 'bg-risk' };
  return (
    <div className="flex items-start gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
      <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', dots[severity])} />
      <div className="min-w-0">
        <p className="text-[13px] font-[450] text-foreground">{title}</p>
        <p className="text-[11.5px] text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// ── Activity row ──
function ActivityItem({ action, detail, time, icon: Icon }: { action: string; detail: string; time: string; icon: any }) {
  return (
    <div className="flex items-start gap-3 border-t border-border/60 px-4 py-2 first:border-t-0">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-[13px] font-[450] text-foreground">{action}</p>
        <p className="truncate text-[11.5px] text-muted-foreground">{detail}</p>
      </div>
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground whitespace-nowrap">{time}</span>
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
    alerts.push({ title: 'Outstanding invoices', message: `£${invoiceData?.outstanding.toLocaleString()} in unpaid invoices`, severity: 'yellow' });
  }
  if ((projects?.active || 0) > 10) {
    alerts.push({ title: 'High project load', message: `${projects?.active} active projects in pipeline`, severity: 'yellow' });
  }
  if (alerts.length === 0) {
    alerts.push({ title: 'All systems healthy', message: 'No critical alerts at this time', severity: 'green' });
  }

  const paymentRate = invoiceData?.totalCount ? Math.round((invoiceData.paidCount / invoiceData.totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 h-12 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="hidden sm:block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Quooro office</span>
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-foreground">Executive dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Time range selector */}
            <div className="flex rounded-lg border border-border/60 p-0.5">
              {(['7d', '30d', '90d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-2.5 py-1 font-mono text-[11px] rounded-md transition-colors duration-150",
                    timeRange === range ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground"
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

      <main className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4 space-y-4">
        {/* ── Fact ledgers ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel>
            <PanelHeader label="Key figures" />
            <FactRow label="Total clients" value={clients || 0} delta="+12%" />
            <FactRow label="Revenue generated" value={`£${((invoiceData?.paid || 0) / 1000).toFixed(1)}k`} delta="+8.3%" />
            <FactRow label="Active projects" value={projects?.active || 0} delta="0%" />
            <FactRow label="New leads this week" value={leads?.thisWeek || 0} delta={`+${leads?.thisWeek || 0}`} />
            <FactRow label="Conversion rate" value={`${leads?.rate || 0}%`} />
          </Panel>

          <Panel>
            <PanelHeader label="Financial summary" />
            <FactRow label="Total revenue" value={`£${(invoiceData?.paid || 0).toLocaleString()}`} />
            <FactRow label="Outstanding" value={`£${(invoiceData?.outstanding || 0).toLocaleString()}`} />
            <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-2">
              <span className="text-[13px] text-muted-foreground">Payment rate</span>
              <span className="flex items-center gap-3">
                <span className="h-1 w-24 rounded-full bg-muted">
                  <span className="block h-1 rounded-full bg-ok transition-all" style={{ width: `${paymentRate}%` }} />
                </span>
                <span className="font-mono text-[13px] font-medium tabular-nums text-foreground">{paymentRate}%</span>
              </span>
            </div>
            <FactRow label="Pipeline value" value={`£${(deals?.pipeline || 0).toLocaleString()}`} />
            <FactRow label="Deals won" value={`£${(deals?.won || 0).toLocaleString()}`} />
            <FactRow label="Team members" value={teamMembers || 0} />
          </Panel>
        </section>

        {/* ── Revenue chart ── */}
        <Panel>
          <PanelHeader label="Revenue vs expenses">
            <span className="text-[11px] text-muted-foreground">Last 12 months</span>
          </PanelHeader>
          <div className="p-3 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART.primary} fill={CHART.primary} fillOpacity={0.08} strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke={CHART.muted} fill={CHART.muted} fillOpacity={0.06} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* ── Operations + sales ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Project status donut */}
          <Panel>
            <PanelHeader label="Project status" />
            <div className="p-3 h-[200px] flex items-center justify-center">
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
            <div className="px-4 pb-3 flex flex-wrap gap-3">
              {projectStatusData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-[10px] text-muted-foreground capitalize">{s.name.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Sales pipeline */}
          <Panel>
            <PanelHeader label="Sales pipeline" />
            <div className="p-3 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealStageData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill={CHART.gold} radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="px-4 pb-3 flex gap-4 text-[11px] text-muted-foreground">
              <span>Total deals: <span className="font-mono font-medium tabular-nums text-foreground">{deals?.count || 0}</span></span>
              <span>Converted: <span className="font-mono font-medium tabular-nums text-foreground">{leads?.converted || 0}</span></span>
            </div>
          </Panel>

          {/* Platform activity */}
          <Panel>
            <PanelHeader label="Platform activity" />
            <div className="p-3 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="logins" name="Logins" stroke={CHART.primary} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actions" name="Actions" stroke={CHART.muted} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="px-4 pb-3 flex gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Logins</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Actions</span>
            </div>
          </Panel>
        </section>

        {/* ── Alerts + activity feed ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel>
            <PanelHeader label="Alerts" />
            <div className="pb-1">
              {alerts.map((a, i) => (
                <AlertCard key={i} {...a} />
              ))}
              {(contentRequests?.pending || 0) > 0 && (
                <AlertCard title="Pending content" message={`${contentRequests?.pending} content requests awaiting delivery`} severity="yellow" />
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader label="Activity feed" />
            <div className="max-h-[300px] overflow-y-auto pb-1">
              <ActivityItem action="New lead added" detail="Sarah Thompson via website enquiry" time="2m ago" icon={UserPlus} />
              <ActivityItem action="Invoice paid" detail="INV-2026-00042 · £2,400" time="15m ago" icon={DollarSign} />
              <ActivityItem action="Project updated" detail="Acme Corp Website → In Review" time="32m ago" icon={Briefcase} />
              <ActivityItem action="Content delivered" detail="Monthly blog package · 4 articles" time="1h ago" icon={FileText} />
              <ActivityItem action="Contract signed" detail="Premium Support Agreement · TechStart Ltd" time="2h ago" icon={CheckCircle2} />
              <ActivityItem action="Team member joined" detail="Alex Rodriguez · Designer" time="3h ago" icon={Users} />
              <ActivityItem action="Deal won" detail="£8,500 · Digital Transformation Package" time="5h ago" icon={TrendingUp} />
            </div>
          </Panel>
        </section>

        {/* ── Quick actions ── */}
        <Panel>
          <PanelHeader label="Quick actions" />
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'View CRM', icon: Users, path: '/lounge/crm' },
              { label: 'Invoices', icon: FileText, path: '/lounge/billing' },
              { label: 'Projects', icon: Briefcase, path: '/lounge/apps' },
              { label: 'Analytics', icon: BarChart3, path: '/lounge/office/analytics' },
              { label: 'Team', icon: Building2, path: '/lounge/team' },
              { label: 'Admin panel', icon: LayoutDashboard, path: '/dashboard' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex h-10 items-center gap-2.5 px-3 rounded-lg border border-border/60 hover:bg-foreground/[0.025] transition-colors duration-150 text-[13px] text-foreground font-medium group"
              >
                <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                {action.label}
                <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </Panel>
      </main>
    </div>
  );
}
