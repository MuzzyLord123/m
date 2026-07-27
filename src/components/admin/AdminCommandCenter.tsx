import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Briefcase, Users, Zap, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Activity, Target, BarChart3,
  Clock, CheckCircle, XCircle, MessageSquare, Globe, FileText,
  Sparkles, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell
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
  dealsByStage: { stage: string; count: number; value: number; color: string }[];
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

const STAGE_COLORS: Record<string, string> = {
  qualification: '#60a5fa',
  discovery: '#a78bfa',
  proposal: '#fbbf24',
  negotiation: '#f97316',
  closing: '#34d399',
  won: '#22c55e',
  lost: '#ef4444',
};

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
        color: STAGE_COLORS[stage] || '#888',
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
      parts.push(`${data.newLeadsThisMonth} new leads this month${data.leadVelocity > 0 ? ` — velocity is up ${data.leadVelocity.toFixed(0)}%` : ''}.`);
    }

    const alerts: string[] = [];
    if (data.overdueInvoices > 0) alerts.push(`${data.overdueInvoices} overdue invoice${data.overdueInvoices > 1 ? 's' : ''}`);
    if (data.pendingEnquiries > 0) alerts.push(`${data.pendingEnquiries} pending enquir${data.pendingEnquiries > 1 ? 'ies' : 'y'}`);
    if (data.openTickets > 0) alerts.push(`${data.openTickets} open ticket${data.openTickets > 1 ? 's' : ''}`);
    if (alerts.length > 0) parts.push(`⚠️ Action needed: ${alerts.join(', ')}.`);

    if (parts.length === 0) parts.push('No significant activity to report. Your platform is running smoothly.');
    
    setAiSummary(parts.join(' '));
    setAiLoading(false);
  };

  useEffect(() => {
    if (data && !aiSummary) generateAiSummary();
  }, [data]);

  const formatCurrency = (val: number) => `£${val.toLocaleString()}`;

  const alerts = useMemo(() => {
    if (!data) return [];
    const items: { label: string; count: number; severity: 'error' | 'warning' | 'info'; icon: any }[] = [];
    if (data.overdueInvoices > 0) items.push({ label: 'Overdue Invoices', count: data.overdueInvoices, severity: 'error', icon: DollarSign });
    if (data.pendingEnquiries > 0) items.push({ label: 'Pending Enquiries', count: data.pendingEnquiries, severity: 'warning', icon: MessageSquare });
    if (data.openTickets > 0) items.push({ label: 'Open Tickets', count: data.openTickets, severity: 'warning', icon: AlertTriangle });
    if (data.pendingProjects > 0) items.push({ label: 'Pending Projects', count: data.pendingProjects, severity: 'info', icon: Clock });
    return items;
  }, [data]);

  const severityColors = {
    error: { bg: '#2a1a1a', border: '#3d2020', text: '#ef4444', dot: '#ef4444' },
    warning: { bg: '#2a2518', border: '#3d351e', text: '#f59e0b', dot: '#f59e0b' },
    info: { bg: '#1a1f2a', border: '#1e2d3d', text: '#3b82f6', dot: '#3b82f6' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0073E6] border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] text-[#888]">Loading Command Center...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const chartConfig = {
    revenue: { label: 'Revenue', color: '#0073E6' },
    projected: { label: 'Projected', color: '#0073E6' },
  };

  const pieColors = ['#0073E6', '#22c55e', '#f59e0b', '#a78bfa', '#ef4444'];

  return (
    <div className="space-y-4">
      {/* AI Summary Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg p-4 flex items-start gap-3"
        style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
      >
        <div className="p-2 rounded-lg" style={{ backgroundColor: '#252525' }}>
          <Sparkles className="h-4 w-4 text-[#0073E6]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#ccc] uppercase tracking-wider">AI Summary</span>
            <button
              onClick={generateAiSummary}
              className="p-1 rounded hover:bg-[#252525] transition-colors"
              disabled={aiLoading}
            >
              <RefreshCw className={`h-3 w-3 text-[#666] ${aiLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-[12px] text-[#aaa] leading-relaxed">
            {aiLoading ? 'Generating summary...' : aiSummary}
          </p>
        </div>
      </motion.div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Revenue',
            value: formatCurrency(data.totalRevenue),
            sub: `${formatCurrency(data.monthlyRevenue)} this month`,
            icon: DollarSign,
            trend: data.revenueGrowth,
          },
          {
            label: 'Pipeline Value',
            value: formatCurrency(data.pipelineValue),
            sub: `${formatCurrency(data.weightedPipeline)} weighted`,
            icon: Target,
            trend: null,
          },
          {
            label: 'Active Projects',
            value: String(data.activeProjects),
            sub: `${data.completedProjects} completed`,
            icon: Briefcase,
            trend: null,
          },
          {
            label: 'Lead Velocity',
            value: `${data.newLeadsThisMonth}`,
            sub: `${data.newLeadsLastMonth} last month`,
            icon: Zap,
            trend: data.leadVelocity,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg p-4"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-md" style={{ backgroundColor: '#252525' }}>
                <kpi.icon className="h-4 w-4 text-[#0073E6]" />
              </div>
              {kpi.trend !== null && (
                <div className={`flex items-center gap-0.5 text-[10px] font-medium ${kpi.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {kpi.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(kpi.trend).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-xl font-bold text-white">{kpi.value}</p>
            <p className="text-[11px] text-[#888] mt-0.5">{kpi.sub}</p>
            <p className="text-[10px] text-[#555] mt-1 uppercase tracking-wider">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-lg p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[12px] font-semibold text-[#ccc] uppercase tracking-wider">Revenue Trend</h3>
              <p className="text-[11px] text-[#666]">Last 6 months</p>
            </div>
            <BarChart3 className="h-4 w-4 text-[#555]" />
          </div>
          <div className="h-[200px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={data.revenueByMonth} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0073E6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0073E6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#252525" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="#0073E6" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>

        {/* Pipeline Breakdown */}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[12px] font-semibold text-[#ccc] uppercase tracking-wider">Pipeline Stages</h3>
              <p className="text-[11px] text-[#666]">{data.dealsByStage.reduce((s, d) => s + d.count, 0)} active deals</p>
            </div>
            <Target className="h-4 w-4 text-[#555]" />
          </div>
          <div className="space-y-3">
            {data.dealsByStage.map((stage) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#aaa]">{stage.stage}</span>
                  <span className="text-[11px] font-medium text-[#ccc]">{stage.count} · {formatCurrency(stage.value)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#252525' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.pipelineValue > 0 ? (stage.value / data.pipelineValue) * 100 : 0}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Platform Usage */}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <h3 className="text-[12px] font-semibold text-[#ccc] uppercase tracking-wider mb-4">Platform Usage</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Clients', value: data.totalClients, icon: Users, color: '#0073E6' },
              { label: 'Active Clients', value: data.activeClients, icon: CheckCircle, color: '#22c55e' },
              { label: 'Conversations', value: data.totalConversations, icon: MessageSquare, color: '#a78bfa' },
              { label: 'Content Requests', value: data.totalContentRequests, icon: FileText, color: '#f59e0b' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #222' }}>
                <div className="flex items-center gap-2">
                  <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                  <span className="text-[11px] text-[#aaa]">{item.label}</span>
                </div>
                <span className="text-[13px] font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <h3 className="text-[12px] font-semibold text-[#ccc] uppercase tracking-wider mb-4">Lead Sources</h3>
          {data.leadsBySource.length > 0 ? (
            <div className="space-y-3">
              {data.leadsBySource.map((src, i) => (
                <div key={src.source} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #222' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                    <span className="text-[11px] text-[#aaa] capitalize">{src.source.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-[13px] font-semibold text-white">{src.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <span className="text-[11px] text-[#555]">No lead data available</span>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <h3 className="text-[12px] font-semibold text-[#ccc] uppercase tracking-wider mb-4">Alerts & Actions</h3>
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const colors = severityColors[alert.severity];
                return (
                  <div
                    key={alert.label}
                    className="rounded-md p-3 flex items-center justify-between"
                    style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
                  >
                    <div className="flex items-center gap-2">
                      <alert.icon className="h-3.5 w-3.5" style={{ color: colors.text }} />
                      <span className="text-[11px]" style={{ color: colors.text }}>{alert.label}</span>
                    </div>
                    <span className="text-[14px] font-bold" style={{ color: colors.text }}>{alert.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <CheckCircle className="h-6 w-6 text-emerald-500 mb-2" />
              <span className="text-[11px] text-[#888]">All clear — no alerts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
