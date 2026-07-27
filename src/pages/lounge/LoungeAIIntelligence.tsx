import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  BarChart3, Brain, TrendingUp, Target, Send, Loader2, Plus,
  FileText, Sparkles, RefreshCw, Trash2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';

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

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(190, 80%, 50%)', 'hsl(142, 60%, 50%)', 'hsl(48, 96%, 53%)', 'hsl(330, 80%, 55%)'];

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

  const statCards = [
    { label: 'Total Revenue', value: `£${(metrics?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, trend: '+12%', up: true },
    { label: 'Active Projects', value: metrics?.activeProjects || 0, icon: BarChart3, trend: '+3', up: true },
    { label: 'Open Deals', value: metrics?.openDeals || 0, icon: Target, trend: '-2', up: false },
    { label: 'Content Requests', value: metrics?.contentRequests || 0, icon: FileText, trend: '+5', up: true },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <LoungePageHeader
        title="AI Business Intelligence"
        description="Natural language analytics and KPI tracking powered by AI"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <card.icon className="w-4 h-4 text-muted-foreground" />
                  <Badge variant="outline" className={`text-[10px] ${card.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {card.up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {card.trend}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <div className="overflow-x-auto">
        <TabsList className="w-max bg-muted/50">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="kpis">KPI Goals</TabsTrigger>
        </TabsList>
        </div>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                Ask Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Which projects are behind schedule?"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAIQuery()}
                  className="bg-background/50"
                />
                <Button onClick={handleAIQuery} disabled={isQuerying} size="icon" className="shrink-0">
                  {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              {aiResponse && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-sm leading-relaxed whitespace-pre-wrap">
                  {aiResponse}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {['Top clients by revenue', 'Projects behind schedule', 'Deal pipeline summary', 'Content request breakdown'].map(q => (
                  <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => { setQuery(q); }}>
                    {q}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics?.revenueByMonth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(190, 80%, 50%)" fill="hsl(190, 80%, 50%)" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Projects by Status</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card className="border-border/40 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Deal Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* KPI Goals Tab */}
        <TabsContent value="kpis" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Track progress towards your business goals</p>
            <Button size="sm" onClick={() => setShowAddKPI(!showAddKPI)}>
              <Plus className="w-4 h-4 mr-1" /> Add KPI
            </Button>
          </div>

          {showAddKPI && (
            <Card className="border-border/40">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Metric name" value={newKPI.metric_name} onChange={e => setNewKPI(p => ({ ...p, metric_name: e.target.value }))} />
                  <Input placeholder="Target" type="number" value={newKPI.target_value} onChange={e => setNewKPI(p => ({ ...p, target_value: e.target.value }))} />
                  <Input placeholder="Unit (e.g. £, %)" value={newKPI.unit} onChange={e => setNewKPI(p => ({ ...p, unit: e.target.value }))} />
                </div>
                <Button size="sm" onClick={addKPI}>Save KPI</Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {kpis.map(kpi => {
              const pct = kpi.target_value > 0 ? Math.min(100, (kpi.current_value / kpi.target_value) * 100) : 0;
              return (
                <Card key={kpi.id} className="border-border/40">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{kpi.metric_name}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteKPI(kpi.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold">{kpi.unit}{kpi.current_value}</span>
                      <span className="text-xs text-muted-foreground">/ {kpi.unit}{kpi.target_value}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-[11px] text-muted-foreground">{pct.toFixed(0)}% complete · {kpi.period}</p>
                  </CardContent>
                </Card>
              );
            })}
            {kpis.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No KPI goals yet. Add one to start tracking.</p>
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
