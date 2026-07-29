import { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { composeOfficeBriefing } from '@/lib/greetings';
import {
  GreetingHeader, Panel, PanelHeader, PanelRow, StatusBadge, Money,
  EmptyState, ErrorState, SkeletonBlock, SkeletonLedger, type Tone,
} from '@/components/platform';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';

interface DashboardData {
  // Revenue
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  revenueByMonth: { month: string; revenue: number; projected: number }[];
  // Pipeline
  pipelineValue: number;
  weightedPipeline: number;
  dealsByStage: { stage: string; count: number; value: number }[];
  // Projects
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  // Platform usage
  totalClients: number;
  activeClients: number;
  totalConversations: number;
  totalContentRequests: number;
  // Lead velocity
  newLeadsThisMonth: number;
  newLeadsLastMonth: number;
  leadVelocity: number;
  leadsBySource: { source: string; count: number }[];
  // Alerts
  overdueInvoices: number;
  pendingEnquiries: number;
  openTickets: number;
  expiringSoon: number;
}

export default function AdminCommandCenter() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        invoicesRes,
        dealsRes,
        projectsRes,
        clientsRes,
        leadsRes,
        enquiriesRes,
        contentRes,
        conversationsRes,
        ticketsRes,
      ] = await Promise.all([
        supabase.from('client_invoices').select('*'),
        supabase.from('crm_deals').select('*'),
        supabase.from('app_projects').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('leads').select('id, created_at, source, status'),
        supabase.from('enquiries').select('id, status, created_at'),
        supabase.from('content_requests').select('id, status'),
        supabase.from('conversations').select('id'),
        supabase.from('support_tickets' as any).select('id, status').then(r => {
          if (r.error) return { data: [], error: null };
          return r;
        }),
      ]);

      const invoices = invoicesRes.data || [];
      const deals = dealsRes.data || [];
      const projects = projectsRes.data || [];
      const clients = clientsRes.data || [];
      const leads = leadsRes.data || [];
      const enquiries = enquiriesRes.data || [];
      const content = contentRes.data || [];
      const conversations = conversationsRes.data || [];
      const tickets = (ticketsRes as any).data || [];

      // Revenue calculations
      const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const monthlyPaid = paidInvoices.filter((i: any) => {
        const d = new Date(i.paid_at || i.created_at);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });
      const monthlyRevenue = monthlyPaid.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);

      const lastMonthPaid = paidInvoices.filter((i: any) => {
        const d = new Date(i.paid_at || i.created_at);
        const lm = thisMonth === 0 ? 11 : thisMonth - 1;
        const ly = thisMonth === 0 ? thisYear - 1 : thisYear;
        return d.getMonth() === lm && d.getFullYear() === ly;
      });
      const lastMonthRevenue = lastMonthPaid.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
      const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Revenue by month (last 6)
      const revenueByMonth: { month: string; revenue: number; projected: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = new Date(thisYear, thisMonth - i, 1);
        const mEnd = new Date(thisYear, thisMonth - i + 1, 0);
        const label = m.toLocaleDateString('en-US', { month: 'short' });
        const mPaid = paidInvoices.filter((inv: any) => {
          const d = new Date(inv.paid_at || inv.created_at);
          return d >= m && d <= mEnd;
        });
        const rev = mPaid.reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0);
        revenueByMonth.push({ month: label, revenue: rev, projected: rev * 1.1 });
      }

      // Pipeline
      const activeDeals = deals.filter((d: any) => d.stage !== 'won' && d.stage !== 'lost');
      const pipelineValue = activeDeals.reduce((s: number, d: any) => s + Number(d.deal_value || 0), 0);
      const weightedPipeline = activeDeals.reduce((s: number, d: any) => s + Number(d.deal_value || 0) * (Number(d.probability || 0) / 100), 0);

      const stages = ['qualification', 'discovery', 'proposal', 'negotiation', 'closing'];
      const dealsByStage = stages.map(stage => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count: activeDeals.filter((d: any) => d.stage === stage).length,
        value: activeDeals.filter((d: any) => d.stage === stage).reduce((s: number, d: any) => s + Number(d.deal_value || 0), 0),
      }));

      // Projects
      const activeProjects = projects.filter((p: any) => p.status === 'in_progress' || p.status === 'active').length;
      const completedProjects = projects.filter((p: any) => p.status === 'completed').length;
      const pendingProjects = projects.filter((p: any) => p.status === 'pending' || p.status === 'planning').length;

      // Platform usage
      const totalClients = clients.length;
      const activeClients = clients.filter((c: any) => c.status === 'active').length;
      const totalConversations = conversations.length;
      const totalContentRequests = content.length;

      // Lead velocity
      const thisMonthLeads = leads.filter((l: any) => {
        const d = new Date(l.created_at);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      const lastMonthLeads = leads.filter((l: any) => {
        const d = new Date(l.created_at);
        return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
      });
      const leadVelocity = lastMonthLeads.length > 0
        ? ((thisMonthLeads.length - lastMonthLeads.length) / lastMonthLeads.length) * 100
        : thisMonthLeads.length > 0 ? 100 : 0;

      // Lead sources
      const sourceMap: Record<string, number> = {};
      leads.forEach((l: any) => {
        const src = l.source || 'Unknown';
        sourceMap[src] = (sourceMap[src] || 0) + 1;
      });
      const leadsBySource = Object.entries(sourceMap).map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count).slice(0, 5);

      // Alerts
      const overdueInvoices = invoices.filter((i: any) => {
        if (i.status === 'paid') return false;
        if (!i.due_date) return false;
        return new Date(i.due_date) < now;
      }).length;
      const pendingEnquiries = enquiries.filter((e: any) => e.status === 'new').length;
      const openTickets = tickets.filter((t: any) => t.status === 'open' || t.status === 'pending').length;

      setData({
        totalRevenue, monthlyRevenue, revenueGrowth, revenueByMonth,
        pipelineValue, weightedPipeline, dealsByStage,
        activeProjects, completedProjects, pendingProjects,
        totalClients, activeClients, totalConversations, totalContentRequests,
        newLeadsThisMonth: thisMonthLeads.length,
        newLeadsLastMonth: lastMonthLeads.length,
        leadVelocity,
        leadsBySource,
        overdueInvoices, pendingEnquiries, openTickets, expiringSoon: 0,
      });
    } catch (err) {
      console.error('Command center fetch error:', err);
    }
    setLoading(false);
  };

  const generateAiSummary = async () => {
    if (!data) return;
    setAiLoading(true);
    // Generate a local summary from the data
    const parts: string[] = [];

    if (data.monthlyRevenue > 0) {
      parts.push(`This month's revenue is £${data.monthlyRevenue.toLocaleString()}${data.revenueGrowth > 0 ? `, up ${data.revenueGrowth.toFixed(0)}% from last month` : data.revenueGrowth < 0 ? `, down ${Math.abs(data.revenueGrowth).toFixed(0)}% from last month` : ''}.`);
    }

    if (data.pipelineValue > 0) {
      parts.push(`Your pipeline holds £${data.pipelineValue.toLocaleString()} across ${data.dealsByStage.reduce((s, d) => s + d.count, 0)} active deals (£${data.weightedPipeline.toLocaleString()} weighted).`);
    }

    if (data.activeProjects > 0) {
      parts.push(`${data.activeProjects} projects are in progress with ${data.pendingProjects} pending kickoff.`);
    }

    if (data.newLeadsThisMonth > 0) {
      parts.push(`${data.newLeadsThisMonth} new leads this month${data.leadVelocity > 0 ? `, velocity up ${data.leadVelocity.toFixed(0)}%` : ''}.`);
    }

    const alerts: string[] = [];
    if (data.overdueInvoices > 0) alerts.push(`${data.overdueInvoices} overdue invoice${data.overdueInvoices > 1 ? 's' : ''}`);
    if (data.pendingEnquiries > 0) alerts.push(`${data.pendingEnquiries} pending enquir${data.pendingEnquiries > 1 ? 'ies' : 'y'}`);
    if (data.openTickets > 0) alerts.push(`${data.openTickets} open ticket${data.openTickets > 1 ? 's' : ''}`);
    if (alerts.length > 0) parts.push(`Action needed: ${alerts.join(', ')}.`);

    if (parts.length === 0) parts.push('No significant activity to report. Your platform is running smoothly.');

    setAiSummary(parts.join(' '));
    setAiLoading(false);
  };

  useEffect(() => {
    if (data && !aiSummary) generateAiSummary();
  }, [data]);

  const alerts = useMemo(() => {
    if (!data) return [];
    const items: { label: string; count: number; tone: Tone; badge: string }[] = [];
    if (data.overdueInvoices > 0) items.push({ label: 'Overdue invoices', count: data.overdueInvoices, tone: 'risk', badge: 'Overdue' });
    if (data.pendingEnquiries > 0) items.push({ label: 'Pending enquiries', count: data.pendingEnquiries, tone: 'attend', badge: 'Pending' });
    if (data.openTickets > 0) items.push({ label: 'Open tickets', count: data.openTickets, tone: 'attend', badge: 'Open' });
    if (data.pendingProjects > 0) items.push({ label: 'Pending projects', count: data.pendingProjects, tone: 'neutral', badge: 'Queued' });
    return items;
  }, [data]);

  // The office briefing: composed only from counts this screen already fetches.
  const briefing = useMemo(
    () =>
      composeOfficeBriefing({
        firstName: (user?.user_metadata?.full_name as string) || null,
        newEnquiries: data?.pendingEnquiries ?? 0,
      }),
    [user, data],
  );

  const chartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
    projected: { label: 'Projected', color: 'hsl(var(--primary))' },
  };

  const stats = data
    ? [
        {
          label: 'Total revenue',
          value: <Money value={data.totalRevenue} whole />,
          sub: <><Money value={data.monthlyRevenue} whole /> this month</>,
          trend: data.revenueGrowth,
        },
        {
          label: 'Pipeline value',
          value: <Money value={data.pipelineValue} whole />,
          sub: <><Money value={data.weightedPipeline} whole /> weighted</>,
          trend: null,
        },
        {
          label: 'Active projects',
          value: String(data.activeProjects),
          sub: `${data.completedProjects} completed`,
          trend: null,
        },
        {
          label: 'Leads this month',
          value: String(data.newLeadsThisMonth),
          sub: `${data.newLeadsLastMonth} last month`,
          trend: data.leadVelocity,
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <GreetingHeader
        salutation={briefing.salutation}
        line={data ? briefing.line : undefined}
        meta={
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {format(new Date(), 'EEE d MMM yyyy')}
          </span>
        }
      />

      {loading ? (
        <div className="space-y-3" aria-busy>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SkeletonBlock className="h-[88px] rounded-[10px]" />
            <SkeletonBlock className="h-[88px] rounded-[10px]" />
            <SkeletonBlock className="h-[88px] rounded-[10px]" />
            <SkeletonBlock className="h-[88px] rounded-[10px]" />
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <SkeletonBlock className="h-[260px] rounded-[10px] lg:col-span-2" />
            <SkeletonBlock className="h-[260px] rounded-[10px]" />
          </div>
          <Panel>
            <SkeletonLedger rows={4} />
          </Panel>
        </div>
      ) : !data ? (
        <Panel>
          <ErrorState compact onRetry={fetchAllData} />
        </Panel>
      ) : (
        <>
          {/* Day summary, composed locally from the same fetch */}
          <Panel>
            <PanelHeader label="Day summary">
              <button
                type="button"
                onClick={generateAiSummary}
                disabled={aiLoading}
                aria-label="Refresh summary"
                className="rounded p-1 text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.04] hover:text-foreground"
              >
                <RefreshCw className={aiLoading ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} />
              </button>
            </PanelHeader>
            <p className="px-4 py-3 text-[13px] leading-relaxed text-ink-2">
              {aiLoading ? 'Composing summary' : aiSummary}
            </p>
          </Panel>

          {/* Stat row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <Panel key={s.label} className="p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {s.label}
                  </span>
                  {s.trend !== null && (
                    <span
                      className={
                        'font-mono text-[10.5px] tabular-nums ' +
                        (s.trend >= 0 ? 'text-ok' : 'text-risk')
                      }
                    >
                      {s.trend >= 0 ? '+' : ''}
                      {s.trend.toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-foreground">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</p>
              </Panel>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader label="Revenue, last 6 months" />
              <div className="h-[200px] p-3">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={data.revenueByMonth} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.08}
                      strokeWidth={1.5}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </Panel>

            <Panel>
              <PanelHeader label="Pipeline">
                <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                  {data.dealsByStage.reduce((s, d) => s + d.count, 0)} active deals
                </span>
              </PanelHeader>
              <div className="space-y-3 p-3">
                {data.dealsByStage.map((stage) => (
                  <div key={stage.stage}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[12px] text-ink-2">{stage.stage}</span>
                      <span className="font-mono text-[11px] tabular-nums text-foreground">
                        {stage.count} · <Money value={stage.value} whole />
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-sunken">
                      <div
                        className="h-full rounded-full bg-foreground/30"
                        style={{
                          width: `${data.pipelineValue > 0 ? (stage.value / data.pipelineValue) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Panel>
              <PanelHeader label="Platform usage" />
              {[
                { label: 'Total clients', value: data.totalClients },
                { label: 'Active clients', value: data.activeClients },
                { label: 'Conversations', value: data.totalConversations },
                { label: 'Content requests', value: data.totalContentRequests },
              ].map((item) => (
                <PanelRow
                  key={item.label}
                  title={item.label}
                  trailing={
                    <span className="font-mono text-[12px] tabular-nums text-foreground">
                      {item.value}
                    </span>
                  }
                />
              ))}
            </Panel>

            <Panel>
              <PanelHeader label="Lead sources" />
              {data.leadsBySource.length > 0 ? (
                data.leadsBySource.map((src) => (
                  <PanelRow
                    key={src.source}
                    title={<span className="capitalize">{src.source.replace(/_/g, ' ')}</span>}
                    trailing={
                      <span className="font-mono text-[12px] tabular-nums text-foreground">
                        {src.count}
                      </span>
                    }
                  />
                ))
              ) : (
                <EmptyState compact title="No lead data yet" body="Sources appear as leads arrive." />
              )}
            </Panel>

            <Panel>
              <PanelHeader label="Needs attention" />
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <PanelRow
                    key={alert.label}
                    leading={<StatusBadge tone={alert.tone} label={alert.badge} className="w-20" />}
                    title={alert.label}
                    trailing={
                      <span className="font-mono text-[12px] tabular-nums text-foreground">
                        {alert.count}
                      </span>
                    }
                  />
                ))
              ) : (
                <EmptyState compact title="All clear" body="Nothing needs attention right now." />
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
