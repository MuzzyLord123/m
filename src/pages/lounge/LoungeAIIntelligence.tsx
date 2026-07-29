import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Brain, Send, Plus, Sparkles, Trash2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';
import {
  PageHeader, Panel, PanelHeader, EmptyState, SkeletonBlock,
} from '@/components/platform';

/* ─── Types ─── */
interface KPIGoal {
  id: string;
  metric_name: string;
  target_value: number;
  current_value: number;
  unit: string;
  period: string;
  status: string;
}

interface BusinessReport {
  id: string;
  title: string;
  report_type: string;
  content: string | null;
  ai_analysis: any;
  charts_data: any;
  created_at: string;
}

interface BIMetrics {
  totalRevenue: number;
  activeProjects: number;
  openDeals: number;
  contentRequests: number;
  revenueByMonth: { month: string; revenue: number }[];
  projectsByStatus: { name: string; value: number }[];
  dealsByStage: { stage: string; count: number; value: number }[];
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--gold))',
  'hsl(var(--ok))',
  'hsl(var(--attend))',
  'hsl(var(--muted-foreground))',
];

const TAB_TRIGGER =
  'relative -mb-px gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] text-muted-foreground shadow-none transition-colors duration-150 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none';

function LoungeAIIntelligenceInner() {
  const { user, session } = useAuth();
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [kpis, setKpis] = useState<KPIGoal[]>([]);
  const [reports, setReports] = useState<BusinessReport[]>([]);
  const [metrics, setMetrics] = useState<BIMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [newKPI, setNewKPI] = useState({ metric_name: '', target_value: '', unit: '' });
  const [showAddKPI, setShowAddKPI] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoadingMetrics(true);
    try {
      const [projectsRes, dealsRes, invoicesRes, contentRes, kpiRes, reportsRes] = await Promise.all([
        supabase.from('app_projects').select('status, created_at').eq('user_id', user.id),
        supabase.from('crm_deals').select('stage, deal_value, created_at').eq('user_id', user.id),
        supabase.from('client_invoices').select('total_amount, status, created_at'),
        supabase.from('content_requests').select('status, created_at').eq('user_id', user.id),
        supabase.from('kpi_goals').select('*').eq('user_id', user.id),
        supabase.from('business_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ]);

      const projects = projectsRes.data || [];
      const deals = dealsRes.data || [];
      const invoices = invoicesRes.data || [];
      const content = contentRes.data || [];

      // Revenue by month (from invoices)
      const monthMap: Record<string, number> = {};
      invoices.forEach(inv => {
        const m = format(new Date(inv.created_at), 'MMM yyyy');
        monthMap[m] = (monthMap[m] || 0) + (inv.total_amount || 0);
      });
      const revenueByMonth = Object.entries(monthMap).slice(-6).map(([month, revenue]) => ({ month, revenue }));

      // Projects by status
      const statusMap: Record<string, number> = {};
      projects.forEach(p => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
      const projectsByStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      // Deals by stage
      const stageMap: Record<string, { count: number; value: number }> = {};
      deals.forEach(d => {
        if (!stageMap[d.stage]) stageMap[d.stage] = { count: 0, value: 0 };
        stageMap[d.stage].count++;
        stageMap[d.stage].value += d.deal_value || 0;
      });
      const dealsByStage = Object.entries(stageMap).map(([stage, data]) => ({ stage, ...data }));

      setMetrics({
        totalRevenue: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
        activeProjects: projects.filter(p => p.status === 'in_progress' || p.status === 'active').length,
        openDeals: deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length,
        contentRequests: content.length,
        revenueByMonth,
        projectsByStatus,
        dealsByStage,
      });
      setKpis((kpiRes.data as any) || []);
      setReports((reportsRes.data as any) || []);
    } catch {
      toast.error('Failed to load metrics');
    } finally {
      setLoadingMetrics(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAIQuery = async () => {
    if (!query.trim() || !session) return;
    setIsQuerying(true);
    setAiResponse('');
    try {
      const contextData = JSON.stringify({
        totalRevenue: metrics?.totalRevenue,
        activeProjects: metrics?.activeProjects,
        openDeals: metrics?.openDeals,
        contentRequests: metrics?.contentRequests,
        dealsByStage: metrics?.dealsByStage,
        projectsByStatus: metrics?.projectsByStatus,
      });

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quooro-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `You are a business intelligence analyst for the Quooro platform. Analyse the following business data and answer the user's question concisely. Data: ${contextData}` },
            { role: 'user', content: query },
          ],
        }),
      });

      if (!resp.ok) throw new Error('AI query failed');
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) { fullText += content; setAiResponse(fullText); }
            } catch { /* partial */ }
          }
        }
      }
    } catch {
      toast.error('AI query failed');
    } finally {
      setIsQuerying(false);
    }
  };

  const addKPI = async () => {
    if (!user || !newKPI.metric_name || !newKPI.target_value) return;
    const { error } = await supabase.from('kpi_goals').insert({
      user_id: user.id,
      metric_name: newKPI.metric_name,
      target_value: parseFloat(newKPI.target_value),
      unit: newKPI.unit || '',
    } as any);
    if (error) { toast.error('Failed to add KPI'); return; }
    toast.success('KPI goal added');
    setNewKPI({ metric_name: '', target_value: '', unit: '' });
    setShowAddKPI(false);
    fetchData();
  };

  const deleteKPI = async (id: string) => {
    await supabase.from('kpi_goals').delete().eq('id', id);
    setKpis(prev => prev.filter(k => k.id !== id));
    toast.success('KPI removed');
  };

  return (
    <div className="mx-auto max-w-[1024px] space-y-5 px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Quooro AI"
        title="Business intelligence"
        description="Ask questions of your own data and track the numbers that matter"
      />

      {/* Quiet stat strip */}
      {loadingMetrics ? (
        <SkeletonBlock className="h-[72px] rounded-[10px]" />
      ) : (
        <Panel as="div">
          <div className="grid grid-cols-2 divide-x divide-border/60 lg:grid-cols-4">
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Revenue</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {`£${(metrics?.totalRevenue || 0).toLocaleString('en-GB')}`}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Active projects</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{metrics?.activeProjects || 0}</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Open deals</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{metrics?.openDeals || 0}</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Content requests</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{metrics?.contentRequests || 0}</p>
            </div>
          </div>
        </Panel>
      )}

      <Tabs defaultValue="insights" className="space-y-4">
        <div className="flex items-center gap-1 border-b border-border/60">
          <TabsList className="h-auto gap-1 rounded-none border-0 bg-transparent p-0">
            <TabsTrigger value="insights" className={TAB_TRIGGER}>Ask your data</TabsTrigger>
            <TabsTrigger value="charts" className={TAB_TRIGGER}>Charts</TabsTrigger>
            <TabsTrigger value="kpis" className={TAB_TRIGGER}>KPI goals</TabsTrigger>
          </TabsList>
        </div>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="mt-0">
          <Panel as="div">
            <PanelHeader label={
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" aria-hidden />
                Ask your data
              </span>
            } />
            <div className="space-y-3 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Which projects are behind schedule?"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAIQuery()}
                  className="bg-background/50"
                />
                <Button onClick={handleAIQuery} disabled={isQuerying} size="icon" className="shrink-0" aria-label="Ask">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isQuerying && !aiResponse && (
                <p className="text-[12.5px] text-muted-foreground">Analysing your data</p>
              )}
              {aiResponse && (
                <div className="whitespace-pre-wrap border-l-2 border-border pl-4 text-[13px] leading-relaxed text-foreground">
                  {aiResponse}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {['Top clients by revenue', 'Projects behind schedule', 'Deal pipeline summary', 'Content request breakdown'].map(q => (
                  <button
                    key={q}
                    type="button"
                    className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-colors duration-150 hover:border-primary/50 hover:text-foreground"
                    onClick={() => { setQuery(q); }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="mt-0">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel as="div">
              <PanelHeader label="Revenue trend" />
              <div className="p-4">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics?.revenueByMonth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.12} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Panel>

            <Panel as="div">
              <PanelHeader label="Projects by status" />
              <div className="p-4">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metrics?.projectsByStatus || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {(metrics?.projectsByStatus || []).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Panel>

            <Panel as="div" className="lg:col-span-2">
              <PanelHeader label="Deal pipeline" />
              <div className="p-4">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics?.dealsByStage || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Panel>
          </div>
        </TabsContent>

        {/* KPI Goals Tab */}
        <TabsContent value="kpis" className="mt-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">Track progress towards your business goals</p>
            <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowAddKPI(!showAddKPI)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add KPI
            </Button>
          </div>

          {showAddKPI && (
            <Panel as="div" className="space-y-3 p-4">
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="Metric name" value={newKPI.metric_name} onChange={e => setNewKPI(p => ({ ...p, metric_name: e.target.value }))} />
                <Input placeholder="Target" type="number" value={newKPI.target_value} onChange={e => setNewKPI(p => ({ ...p, target_value: e.target.value }))} />
                <Input placeholder="Unit (e.g. £, %)" value={newKPI.unit} onChange={e => setNewKPI(p => ({ ...p, unit: e.target.value }))} />
              </div>
              <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={addKPI}>Save KPI</Button>
            </Panel>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {kpis.map(kpi => {
              const pct = kpi.target_value > 0 ? Math.min(100, (kpi.current_value / kpi.target_value) * 100) : 0;
              return (
                <Panel as="div" key={kpi.id} className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-foreground">{kpi.metric_name}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Remove KPI" onClick={() => deleteKPI(kpi.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-semibold tabular-nums">{kpi.unit}{kpi.current_value}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">/ {kpi.unit}{kpi.target_value}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-[11px] tabular-nums text-muted-foreground">{pct.toFixed(0)}% complete · {kpi.period}</p>
                </Panel>
              );
            })}
            {kpis.length === 0 && (
              <EmptyState
                compact
                className="col-span-full"
                title="No KPI goals yet"
                body="Add a goal to start tracking progress against a target."
                action={{ label: 'Add KPI', onClick: () => setShowAddKPI(true) }}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LoungeAIIntelligence() {
  return (
    <SubscriptionPaywall
      featureKey="ai-intelligence"
      featureDescription="AI-powered business analytics, natural language data queries, KPI tracking, and auto-generated charts."
      icon={Brain}
    >
      <LoungeAIIntelligenceInner />
    </SubscriptionPaywall>
  );
}
