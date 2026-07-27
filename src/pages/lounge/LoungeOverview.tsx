import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Layout, FileText, Calendar, HardDrive, MessageSquare,
  CreditCard, Clock, TrendingUp, Bell, Sparkles, Target,
  ArrowLeft, ChevronRight, Megaphone, Share2, Zap,
  Users, Briefcase, Code, Rocket, Eye, Activity,
  LayoutDashboard, Grid3X3, BarChart3, Settings, Ticket,
  RefreshCw, ArrowUpRight, ExternalLink,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import ClientHealthScore from '@/components/lounge/ClientHealthScore';
import { OnboardingWizard } from '@/components/lounge/OnboardingWizard';
import DashboardCharts from '@/components/lounge/DashboardCharts';
import LiveActivityFeed from '@/components/lounge/LiveActivityFeed';
import KPICardWithTrend from '@/components/lounge/KPICardWithTrend';
import UsageInsights from '@/components/lounge/UsageInsights';
import ActivityHeatmap from '@/components/lounge/ActivityHeatmap';
import GreetingBanner from '@/components/lounge/GreetingBanner';
import { useActivityLogger } from '@/hooks/useActivityLogger';

/* ─────────── Types ─────────── */
interface UserProfile {
  full_name: string | null;
  company: string | null;
  plan: string | null;
  website_status: string | null;
  preview_url: string | null;
  customer_id: string | null;
}

interface ProjectCounts {
  websites: { total: number; live: number };
  apps: { total: number; inProgress: number };
  content: { pending: number; delivered: number };
}

interface RecentActivity {
  id: string;
  type: 'content' | 'app' | 'social' | 'ad' | 'message';
  title: string;
  date: string;
  status?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

/* ─────────── Config ─────────── */
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  design: { label: 'Design Phase', color: '#a78bfa' },
  development: { label: 'In Development', color: '#60a5fa' },
  review: { label: 'Under Review', color: '#fbbf24' },
  live: { label: 'Live', color: '#34d399' },
  not_published: { label: 'Not Published', color: '#666' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#666',
  normal: '#60a5fa',
  high: '#fbbf24',
  urgent: '#ef4444',
};

type ViewMode = 'overview' | 'activity' | 'updates' | 'health' | 'analytics';

/* ─────────── Component ─────────── */
export default function LoungeOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [counts, setCounts] = useState<ProjectCounts>({ websites: { total: 0, live: 0 }, apps: { total: 0, inProgress: 0 }, content: { pending: 0, delivered: 0 } });
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [leadCount, setLeadCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [hasOverduePayments, setHasOverduePayments] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [contentByStatus, setContentByStatus] = useState<Record<string, number>>({});
  const [appsByStatus, setAppsByStatus] = useState<Record<string, number>>({});
  const [weeklyActivity, setWeeklyActivity] = useState<{ day: string; content: number; apps: number; messages: number }[]>([]);
  const [prevWeekCounts, setPrevWeekCounts] = useState({ content: 0, apps: 0, leads: 0, messages: 0 });
  const { log: logActivity } = useActivityLogger();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [profileRes, appsRes, contentRes, announcementsRes, leadsRes, messagesRes, billingRes] = await Promise.all([
        supabase.from('profiles').select('full_name, company, plan, website_status, preview_url, customer_id').eq('user_id', user!.id).maybeSingle(),
        supabase.from('app_projects').select('id, status, project_name, updated_at').order('created_at', { ascending: false }),
        supabase.from('content_requests').select('id, status, title, updated_at'),
        supabase.from('announcements').select('id, title, content, priority, created_at').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('customer_id', user!.id),
        supabase.from('client_billing').select('payment_status').eq('user_id', user!.id).maybeSingle(),
      ]);

      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data);
      setAnnouncements(announcementsRes.data || []);
      setLeadCount(leadsRes.count || 0);
      setMessageCount(messagesRes.count || 0);
      setHasOverduePayments(billingRes.data?.payment_status === 'overdue');

      const apps = appsRes.data || [];
      const content = contentRes.data || [];

      setCounts({
        websites: { total: profileRes.data?.website_status ? 1 : 0, live: profileRes.data?.website_status === 'live' ? 1 : 0 },
        apps: { total: apps.length, inProgress: apps.filter(a => ['development', 'design', 'testing'].includes(a.status)).length },
        content: { pending: content.filter(c => c.status === 'pending' || c.status === 'in_progress').length, delivered: content.filter(c => c.status === 'delivered').length },
      });

      // Chart data: content by status
      const cByStatus: Record<string, number> = {};
      content.forEach(c => { cByStatus[c.status] = (cByStatus[c.status] || 0) + 1; });
      setContentByStatus(cByStatus);

      // Chart data: apps by status
      const aByStatus: Record<string, number> = {};
      apps.forEach(a => { aByStatus[a.status] = (aByStatus[a.status] || 0) + 1; });
      setAppsByStatus(aByStatus);

      // Weekly activity (mock from actual data timestamps)
      const days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        days.push(format(subDays(new Date(), i), 'EEE'));
      }
      const weekly = days.map((day, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
        return {
          day,
          content: content.filter(c => { const d = new Date(c.updated_at); return d >= dayStart && d <= dayEnd; }).length,
          apps: apps.filter(a => { const d = new Date(a.updated_at); return d >= dayStart && d <= dayEnd; }).length,
          messages: 0,
        };
      });
      setWeeklyActivity(weekly);

      // Prev week counts for trend comparison
      const oneWeekAgo = subDays(new Date(), 7);
      const twoWeeksAgo = subDays(new Date(), 14);
      setPrevWeekCounts({
        content: content.filter(c => { const d = new Date(c.updated_at); return d >= twoWeeksAgo && d < oneWeekAgo; }).length,
        apps: apps.filter(a => { const d = new Date(a.updated_at); return d >= twoWeeksAgo && d < oneWeekAgo; }).length,
        leads: 0,
        messages: 0,
      });

      const acts: RecentActivity[] = [];
      apps.slice(0, 4).forEach(a => acts.push({ id: `app-${a.id}`, type: 'app', title: a.project_name, date: a.updated_at, status: a.status }));
      content.slice(0, 4).forEach(c => acts.push({ id: `content-${c.id}`, type: 'content', title: c.title, date: c.updated_at, status: c.status }));
      acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivity(acts.slice(0, 8));
    } catch {
      setError(true);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
      logActivity('dashboard');
    }
  }, [user, fetchData, logActivity]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const statusCfg = STATUS_MAP[profile?.website_status || 'design'] || STATUS_MAP.design;

  const activityIcon = (type: string) => {
    const cls = 'w-3.5 h-3.5';
    switch (type) {
      case 'app': return <Code className={cls} />;
      case 'content': return <FileText className={cls} />;
      case 'social': return <Share2 className={cls} />;
      case 'ad': return <Megaphone className={cls} />;
      case 'message': return <MessageSquare className={cls} />;
      default: return <Clock className={cls} />;
    }
  };

  const kpiStats = useMemo(() => {
    const thisWeekContent = counts.content.pending + counts.content.delivered;
    const thisWeekApps = counts.apps.total;

    function trend(curr: number, prev: number): 'up' | 'down' | 'flat' {
      if (curr > prev) return 'up';
      if (curr < prev) return 'down';
      return 'flat';
    }
    function trendVal(curr: number, prev: number): string | undefined {
      const diff = curr - prev;
      if (diff === 0) return undefined;
      return `${diff > 0 ? '+' : ''}${diff}`;
    }

    return [
      { label: 'Website', value: counts.websites.total, sub: statusCfg.label, color: statusCfg.color, path: '/lounge/website', trend: counts.websites.live > 0 ? 'up' as const : 'flat' as const, sparkline: weeklyActivity.map(w => w.content) },
      { label: 'App Projects', value: thisWeekApps, sub: `${counts.apps.inProgress} in progress`, color: '#60a5fa', path: '/lounge/apps', trend: trend(thisWeekApps, prevWeekCounts.apps), trendValue: trendVal(thisWeekApps, prevWeekCounts.apps), sparkline: weeklyActivity.map(w => w.apps) },
      { label: 'Content', value: thisWeekContent, sub: `${counts.content.pending} pending`, color: '#fbbf24', path: '/lounge/content', trend: trend(thisWeekContent, prevWeekCounts.content), trendValue: trendVal(thisWeekContent, prevWeekCounts.content), sparkline: weeklyActivity.map(w => w.content) },
      { label: 'CRM Contacts', value: leadCount, sub: 'Total leads', color: '#34d399', path: '/lounge/crm', trend: 'flat' as const },
    ];
  }, [counts, statusCfg, leadCount, weeklyActivity, prevWeekCounts]);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-background text-foreground font-body text-xs">
        {/* Skeleton Top Bar */}
        <div className="flex flex-col shrink-0 bg-card/80 backdrop-blur-xl border-b border-border/30">
          <div className="h-11 sm:h-12 flex items-center justify-between px-3 sm:px-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-muted/50 animate-pulse" />
              <div className="w-px h-4 bg-border/20" />
              <div className="h-4 w-20 rounded-lg bg-muted/50 animate-pulse" />
            </div>
            <div className="flex items-center gap-1 rounded-xl p-0.5 bg-accent/30 border border-border/20">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 w-14 rounded-lg bg-muted/50 animate-pulse" />
              ))}
            </div>
            <div className="h-7 w-7 rounded-lg bg-muted/50 animate-pulse" />
          </div>
        </div>
        {/* Skeleton Content */}
        <div className="flex-1 overflow-hidden p-4 lg:p-6 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/40 bg-card p-4 space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-6 rounded-lg bg-muted/50" />
                  <div className="h-5 w-12 rounded-full bg-muted/50" />
                </div>
                <div className="h-7 w-12 rounded bg-muted/50" />
                <div className="h-2 w-24 rounded bg-muted/50" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 rounded-xl bg-card border border-border/40 p-4 space-y-3 animate-pulse">
              <div className="h-4 w-24 rounded bg-muted/50" />
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 py-3">
                    <div className="w-9 h-9 rounded-xl bg-muted/50" />
                    <div className="h-2 w-10 rounded bg-muted/50" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-card border border-border/40 p-4 space-y-2 animate-pulse">
              <div className="h-4 w-24 rounded bg-muted/50" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2">
                  <div className="w-6 h-6 rounded-lg bg-muted/50" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-3/4 rounded bg-muted/50" />
                    <div className="h-2 w-1/2 rounded bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────── Data ─────────── */
  const stats = [
    { label: 'Website', value: counts.websites.total, sub: statusCfg.label, color: statusCfg.color, path: '/lounge/website' },
    { label: 'App Projects', value: counts.apps.total, sub: `${counts.apps.inProgress} in progress`, color: '#60a5fa', path: '/lounge/apps' },
    { label: 'Content', value: counts.content.pending + counts.content.delivered, sub: `${counts.content.pending} pending`, color: '#fbbf24', path: '/lounge/content' },
    { label: 'CRM Contacts', value: leadCount, sub: 'Total leads', color: '#34d399', path: '/lounge/crm' },
  ];

  const quickActions = [
    { label: 'Website', icon: Globe, path: '/lounge/website', color: '#a78bfa' },
    { label: 'App Projects', icon: Layout, path: '/lounge/apps', color: '#60a5fa' },
    { label: 'CRM', icon: Target, path: '/lounge/crm', color: '#34d399' },
    { label: 'Content', icon: FileText, path: '/lounge/content', color: '#fbbf24' },
    { label: 'AI Assistant', icon: Sparkles, path: '/lounge/ai', color: '#c084fc' },
    { label: 'Calendar', icon: Calendar, path: '/lounge/calendar', color: '#f472b6' },
    { label: 'Assets', icon: HardDrive, path: '/lounge/assets', color: '#2dd4bf' },
    { label: 'Messages', icon: MessageSquare, path: '/lounge/messages', color: '#fb923c' },
    { label: 'Billing', icon: CreditCard, path: '/lounge/billing', color: '#f97316' },
    { label: 'Team', icon: Users, path: '/lounge/team', color: '#a78bfa' },
    { label: 'Settings', icon: Settings, path: '/lounge/settings', color: '#888' },
    { label: 'Support', icon: Ticket, path: '/lounge/tickets', color: '#60a5fa' },
  ];

  const viewTabs = [
    { key: 'overview' as ViewMode, icon: <LayoutDashboard className="h-3 w-3" />, label: 'Overview' },
    { key: 'analytics' as ViewMode, icon: <BarChart3 className="h-3 w-3" />, label: 'Analytics' },
    { key: 'activity' as ViewMode, icon: <TrendingUp className="h-3 w-3" />, label: 'Activity' },
    { key: 'updates' as ViewMode, icon: <Bell className="h-3 w-3" />, label: 'Updates' },
    { key: 'health' as ViewMode, icon: <Activity className="h-3 w-3" />, label: 'Health' },
  ];

  return (
   <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-background text-foreground font-body text-xs">
      <GreetingBanner />
      {/* ─── Top Bar ─── */}
      <div className="flex flex-col shrink-0 select-none bg-card/80 backdrop-blur-xl border-b border-border/30">
        {/* Row 1: Nav + View Toggle */}
        <div className="h-11 sm:h-12 flex items-center justify-between px-3 sm:px-4">
          {/* Left */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => navigate('/lounge')}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors duration-150"
              title="Back to Lounge"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <div className="w-px h-4 bg-border/30" />
            <div className="flex items-center gap-1.5">
              <Rocket className="h-3.5 w-3.5 text-brand" />
              <span className="text-[11px] font-display font-semibold text-foreground/80 tracking-wide">Dashboard</span>
            </div>
            {/* Stats pills - hidden on small screens */}
            <div className="hidden lg:flex items-center gap-1.5 ml-1">
              <div className="w-px h-4 bg-border/20" />
              {stats.map(s => (
                <button
                  key={s.label}
                  onClick={() => navigate(s.path)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-accent/40 transition-colors duration-150 bg-accent/20 border border-border/20"
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[9px] font-medium text-muted-foreground">{s.label}</span>
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Center: View toggle */}
          <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl p-0.5 bg-accent/30 border border-border/20">
            {viewTabs.map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`min-h-[44px] sm:min-h-0 h-7 sm:h-7 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-lg text-[10px] font-medium transition-all duration-150 ${
                  viewMode === v.key
                    ? 'bg-brand text-white shadow-glow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
              >
                {v.icon}
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground hidden lg:inline mr-2">
              {greeting}, {profile?.full_name?.split(' ')[0] || 'there'}
            </span>
            {profile?.plan && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/20 border border-border/20">
                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                <span className="text-[9px] font-medium text-muted-foreground">{profile.plan} Plan</span>
              </div>
            )}
            <button
              onClick={fetchData}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors duration-150"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Row 2: Stats pills on mobile/tablet only */}
        <div className="lg:hidden flex items-center gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          {stats.map(s => (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className="flex items-center gap-1 px-2.5 py-1 min-h-[36px] rounded-lg hover:bg-accent/40 transition-colors duration-150 shrink-0 bg-accent/20 border border-border/20 snap-start"
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[9px] font-medium text-muted-foreground">{s.label}</span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
            >
              <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
                {/* Onboarding Wizard */}
                <OnboardingWizard />
                {/* KPI Stats Row with Trends */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {kpiStats.map(s => (
                    <KPICardWithTrend
                      key={s.label}
                      label={s.label}
                      value={s.value}
                      sub={s.sub}
                      color={s.color}
                      trend={s.trend}
                      trendValue={s.trendValue}
                      sparkline={s.sparkline}
                      onClick={() => navigate(s.path)}
                      pulse={s.label === 'Content' && counts.content.pending > 3}
                    />
                  ))}
                </div>

                {/* Quick Actions + Activity Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Quick Actions */}
                  <div className="lg:col-span-2 rounded-xl bg-card border border-border/40">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                      <Grid3X3 className="w-3.5 h-3.5 text-brand" />
                      <span className="text-[11px] font-display font-semibold text-foreground/80">Quick Actions</span>
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-2 min-[360px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1">
                        {quickActions.map(a => (
                          <button
                            key={a.path}
                            onClick={() => navigate(a.path)}
                            className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-all duration-150 hover:bg-accent/40 group"
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-sm"
                              style={{ backgroundColor: `${a.color}12` }}
                            >
                              <a.icon className="w-4 h-4" style={{ color: a.color }} />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{a.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-xl bg-card border border-border/40">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                      <TrendingUp className="w-3.5 h-3.5 text-brand" />
                      <span className="text-[11px] font-display font-semibold text-foreground/80">Recent Activity</span>
                    </div>
                    <ScrollArea className="h-[280px]">
                      <div className="p-2">
                        {activity.length > 0 ? activity.map(a => (
                          <div key={a.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors">
                            <div className="p-1 rounded bg-secondary text-muted-foreground">
                              {activityIcon(a.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-foreground/80 truncate">{a.title}</p>
                              <p className="text-[9px] text-muted-foreground">{formatDistanceToNow(new Date(a.date), { addSuffix: true })}</p>
                            </div>
                            {a.status && (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize shrink-0">
                                {a.status}
                              </span>
                            )}
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Clock className="w-5 h-5 text-muted-foreground/40 mb-2" />
                            <p className="text-[11px] text-muted-foreground">No recent activity</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {/* Health + Announcements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Health Score Mini */}
                  <div className="rounded-xl overflow-hidden bg-card border border-border/40">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] font-display font-semibold text-foreground/80">Client Health</span>
                      </div>
                      <button
                        onClick={() => setViewMode('health')}
                        className="text-[9px] font-medium text-brand hover:text-brand/80 transition-colors"
                      >
                        View Details →
                      </button>
                    </div>
                    <div className="p-4">
                      <ClientHealthScore data={{
                        lastLogin: user?.last_sign_in_at || null,
                        contentPending: counts.content.pending,
                        contentDelivered: counts.content.delivered,
                        appProjects: counts.apps.total,
                        activeProjects: counts.apps.inProgress,
                        messageCount,
                        hasOverduePayments,
                        websiteStatus: profile?.website_status || null,
                      }} />
                    </div>
                  </div>

                  {/* Announcements Mini */}
                  <div className="rounded-xl bg-card border border-border/40">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[11px] font-display font-semibold text-foreground/80">Platform Updates</span>
                        {announcements.length > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand/15 text-brand">
                            {announcements.length}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setViewMode('updates')}
                        className="text-[9px] font-medium text-brand hover:text-brand/80 transition-colors"
                      >
                        View All →
                      </button>
                    </div>
                    <ScrollArea className="h-[220px]">
                      <div className="p-2">
                        {announcements.length > 0 ? announcements.slice(0, 5).map(a => (
                          <div key={a.id} className="px-3 py-2.5 rounded-md hover:bg-accent transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.normal }} />
                              <span className="text-[11px] font-semibold text-foreground/80 truncate">{a.title}</span>
                              <span className="text-[9px] text-muted-foreground/60 ml-auto shrink-0">{format(new Date(a.created_at), 'MMM d')}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 pl-3.5">{a.content}</p>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Bell className="w-5 h-5 text-muted-foreground/40 mb-2" />
                            <p className="text-[11px] text-muted-foreground">No announcements</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
            >
              <div className="p-4 lg:p-6 max-w-[900px] mx-auto">
                <div className="rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <TrendingUp className="w-3.5 h-3.5 text-[#60a5fa]" />
                    <span className="text-[11px] font-semibold text-foreground/80">All Recent Activity</span>
                    <span className="text-[9px] text-muted-foreground ml-auto">{activity.length} items</span>
                  </div>
                  <div className="p-2">
                    {activity.length > 0 ? activity.map(a => (
                      <div key={a.id} className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent transition-colors">
                        <div className="p-1.5 rounded-md bg-secondary text-muted-foreground">
                          {activityIcon(a.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground/80">{a.title}</p>
                          <p className="text-[9px] text-muted-foreground">{format(new Date(a.date), 'MMM d, yyyy · h:mm a')}</p>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-secondary" style={{
                          color: a.type === 'app' ? '#60a5fa' : a.type === 'content' ? '#fbbf24' : undefined,
                        }}>
                          <span className={a.type !== 'app' && a.type !== 'content' ? 'text-muted-foreground' : ''}>{a.type}</span>
                        </span>
                        {a.status && (
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-secondary text-muted-foreground capitalize">
                            {a.status}
                          </span>
                        )}
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Clock className="w-6 h-6 text-muted-foreground/40 mb-3" />
                        <p className="text-[11px] text-muted-foreground">No activity yet</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-1">Activity will appear here as you use the platform</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'updates' && (
            <motion.div
              key="updates"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
            >
              <div className="p-4 lg:p-6 max-w-[900px] mx-auto">
                <div className="rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <Bell className="w-3.5 h-3.5 text-[#fbbf24]" />
                    <span className="text-[11px] font-semibold text-foreground/80">Platform Updates & Announcements</span>
                    <span className="text-[9px] text-muted-foreground ml-auto">{announcements.length} updates</span>
                  </div>
                  <div className="p-3">
                    {announcements.length > 0 ? (
                      <div className="space-y-2">
                        {announcements.map(a => (
                          <div key={a.id} className="rounded-lg p-4 hover:bg-accent transition-colors bg-secondary/50 border border-border">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.normal }} />
                                <h4 className="text-[12px] font-semibold text-foreground/90">{a.title}</h4>
                              </div>
                              <span className="text-[9px] text-muted-foreground/60 shrink-0">{format(new Date(a.created_at), 'MMM d, yyyy')}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed pl-4">{a.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Bell className="w-6 h-6 text-muted-foreground/40 mb-3" />
                        <p className="text-[11px] text-muted-foreground">No announcements yet</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-1">Updates and news will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
            >
              <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {kpiStats.map(s => (
                    <KPICardWithTrend
                      key={s.label}
                      label={s.label}
                      value={s.value}
                      sub={s.sub}
                      color={s.color}
                      trend={s.trend}
                      trendValue={s.trendValue}
                      sparkline={s.sparkline}
                      onClick={() => navigate(s.path)}
                    />
                  ))}
                </div>

                {/* Charts */}
                <DashboardCharts
                  contentByStatus={contentByStatus}
                  appsByStatus={appsByStatus}
                  weeklyActivity={weeklyActivity}
                />

                {/* Activity Heatmap */}
                <ActivityHeatmap />

                {/* Live Feed + Usage Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2">
                    <LiveActivityFeed />
                  </div>
                  <UsageInsights />
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'health' && (
            <motion.div
              key="health"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
            >
              <div className="p-4 lg:p-6 max-w-[700px] mx-auto">
                <div className="rounded-lg overflow-hidden bg-card border border-border">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <Activity className="w-3.5 h-3.5 text-[#34d399]" />
                    <span className="text-[11px] font-semibold text-foreground/80">Client Health Score</span>
                  </div>
                  <div className="p-5">
                    <ClientHealthScore data={{
                      lastLogin: user?.last_sign_in_at || null,
                      contentPending: counts.content.pending,
                      contentDelivered: counts.content.delivered,
                      appProjects: counts.apps.total,
                      activeProjects: counts.apps.inProgress,
                      messageCount,
                      hasOverduePayments,
                      websiteStatus: profile?.website_status || null,
                    }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
