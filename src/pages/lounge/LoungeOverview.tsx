import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Layout, FileText, Calendar, HardDrive, MessageSquare,
  CreditCard, Target, Sparkles, Users, Settings, Ticket,
  RefreshCw, ArrowUpRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import ClientHealthScore from '@/components/lounge/ClientHealthScore';
import { OnboardingWizard } from '@/components/lounge/OnboardingWizard';
import DashboardCharts from '@/components/lounge/DashboardCharts';
import LiveActivityFeed from '@/components/lounge/LiveActivityFeed';
import UsageInsights from '@/components/lounge/UsageInsights';
import ActivityHeatmap from '@/components/lounge/ActivityHeatmap';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import {
  GreetingHeader, Panel, PanelHeader, PanelRow, SectionHeader,
  StatusBadge, statusLabel, RelativeTime, EmptyState, ErrorState, SkeletonLedger,
} from '@/components/platform';
import { composePortalGreeting } from '@/lib/greetings';
import { cn } from '@/lib/utils';

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

  /* ─────────── Derived (presentation only) ─────────── */
  const deliveredThisWeek = useMemo(
    () => weeklyActivity.reduce((sum, d) => sum + d.content, 0),
    [weeklyActivity],
  );

  const greeting = useMemo(
    () =>
      composePortalGreeting({
        firstName: profile?.full_name,
        billingOverdue: hasOverduePayments,
        websiteStatus: profile?.website_status,
        deliveredThisWeek,
        hasRecentActivity: weeklyActivity.some(d => d.content + d.apps > 0),
      }),
    [profile, hasOverduePayments, deliveredThisWeek, weeklyActivity],
  );

  // The build rail: the four stages a site moves through.
  const RAIL_STAGES = ['design', 'development', 'review', 'live'] as const;
  const railIndex = RAIL_STAGES.indexOf((profile?.website_status || '') as (typeof RAIL_STAGES)[number]);

  const healthData = {
    lastLogin: user?.last_sign_in_at || null,
    contentPending: counts.content.pending,
    contentDelivered: counts.content.delivered,
    appProjects: counts.apps.total,
    activeProjects: counts.apps.inProgress,
    messageCount,
    hasOverduePayments,
    websiteStatus: profile?.website_status || null,
  };

  const goTo = [
    { label: 'Website', icon: Globe, path: '/lounge/website' },
    { label: 'Apps', icon: Layout, path: '/lounge/apps' },
    { label: 'Content', icon: FileText, path: '/lounge/content' },
    { label: 'CRM', icon: Target, path: '/lounge/crm' },
    { label: 'Quooro AI', icon: Sparkles, path: '/lounge/ai' },
    { label: 'Calendar', icon: Calendar, path: '/lounge/calendar' },
    { label: 'Assets', icon: HardDrive, path: '/lounge/assets' },
    { label: 'Messages', icon: MessageSquare, path: '/lounge/messages' },
    { label: 'Billing', icon: CreditCard, path: '/lounge/billing' },
    { label: 'Team', icon: Users, path: '/lounge/team' },
    { label: 'Support', icon: Ticket, path: '/lounge/tickets' },
    { label: 'Settings', icon: Settings, path: '/lounge/settings' },
  ];

  const viewTabs: { key: ViewMode; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'activity', label: 'Activity' },
    { key: 'updates', label: 'Updates' },
    { key: 'health', label: 'Health' },
  ];

  const announcementTone = (priority: string) =>
    priority === 'urgent' ? 'risk' : priority === 'high' ? 'attend' : 'neutral';

  /* ─────────── Loading / error ─────────── */
  if (loading) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-8 w-64 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-4 w-80 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-7 h-44 animate-pulse rounded-[10px] border border-border/60 bg-foreground/[0.02]" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="rounded-[10px] border border-border/60"><SkeletonLedger rows={3} /></div>
          <div className="rounded-[10px] border border-border/60"><SkeletonLedger rows={3} /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
        <ErrorState
          title="Your dashboard didn't load"
          body="Check your connection and try again. If it keeps happening, message the studio."
          onRetry={fetchData}
        />
      </div>
    );
  }

  /* ─────────── Render ─────────── */
  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      {/* Greeting — the one display moment */}
      <GreetingHeader
        salutation={greeting.salutation}
        line={greeting.line}
        meta={
          <>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
              {format(new Date(), 'EEE d MMM')}
            </span>
            {profile?.customer_id && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {profile.customer_id}
              </span>
            )}
          </>
        }
      />

      {/* View tabs — quiet segmented control; scrolls on phones */}
      <div className="mt-5 flex items-center border-b border-border/60">
        <div className="scrollbar-hide flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {viewTabs.map(v => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={cn(
                'relative -mb-px shrink-0 whitespace-nowrap px-3 py-2 text-[13px] transition-colors duration-150',
                viewMode === v.key
                  ? 'border-b-2 border-primary font-medium text-foreground'
                  : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchData}
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
          aria-label="Refresh dashboard"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {viewMode === 'overview' && (
        <div className="space-y-4 pt-5">
          <OnboardingWizard />

          {/* The build rail */}
          <Panel>
            <PanelHeader label="Your build">
              {profile?.preview_url ? (
                <a
                  href={/^https?:\/\//i.test(profile.preview_url) ? profile.preview_url : `https://${profile.preview_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105"
                >
                  Open preview <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : (
                <button
                  onClick={() => navigate('/lounge/website')}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  View website
                </button>
              )}
            </PanelHeader>
            <div className="px-5 pb-5 pt-6 max-sm:pt-4">
              {/* Desktop: horizontal rail. Phones: a ladder, never a squash. */}
              <div className="relative sm:grid sm:grid-cols-4">
                <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[5px] hidden h-px bg-border sm:block" />
                <span aria-hidden className="absolute bottom-3 left-[5px] top-3 w-px bg-border sm:hidden" />
                {RAIL_STAGES.map((stage, i) => {
                  const done = railIndex > i;
                  const now = railIndex === i;
                  return (
                    <div
                      key={stage}
                      className="relative flex items-center gap-3 py-1.5 sm:flex-col sm:gap-2 sm:py-0"
                    >
                      <span
                        className={cn(
                          'z-10 h-[11px] w-[11px] shrink-0 rounded-full border-[1.5px]',
                          done && 'border-transparent bg-foreground/45',
                          now && 'border-transparent bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.18)]',
                          !done && !now && 'border-border bg-background',
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs',
                          now ? 'font-medium text-foreground' : done ? 'text-ink-2' : 'text-muted-foreground',
                        )}
                      >
                        {statusLabel(stage)}
                      </span>
                      {now && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary max-sm:ml-auto">
                          In progress
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-col gap-1 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[13px] text-ink-2">
                  {railIndex >= 0
                    ? `Your website, currently in ${statusLabel(RAIL_STAGES[railIndex]).toLowerCase()}`
                    : profile?.website_status
                      ? `Your website: ${statusLabel(profile.website_status).toLowerCase()}`
                      : 'Your website project has not started yet'}
                </span>
                {hasOverduePayments && (
                  <button onClick={() => navigate('/lounge/billing')} className="text-left">
                    <StatusBadge tone="risk" label="Invoice overdue, see Billing" />
                  </button>
                )}
              </div>
            </div>
          </Panel>

          {/* Working now + studio column */}
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <Panel>
              <PanelHeader label="With the studio" />
              <PanelRow
                leading={<StatusBadge tone={counts.content.pending > 0 ? 'accent' : 'neutral'} label="" className="gap-0" />}
                title="Content requests"
                meta={`${counts.content.delivered} delivered in total`}
                trailing={
                  <span className="font-mono text-[11px] tabular-nums text-ink-2">
                    {String(counts.content.pending).padStart(2, '0')} in progress
                  </span>
                }
                onClick={() => navigate('/lounge/content')}
              />
              <PanelRow
                leading={<StatusBadge tone={counts.apps.inProgress > 0 ? 'accent' : 'neutral'} label="" className="gap-0" />}
                title="App projects"
                meta={`${counts.apps.total} in total`}
                trailing={
                  <span className="font-mono text-[11px] tabular-nums text-ink-2">
                    {String(counts.apps.inProgress).padStart(2, '0')} active
                  </span>
                }
                onClick={() => navigate('/lounge/apps')}
              />
              <PanelRow
                leading={<StatusBadge tone="neutral" label="" className="gap-0" />}
                title="Leads in your CRM"
                meta="Across all sources"
                trailing={
                  <span className="font-mono text-[11px] tabular-nums text-ink-2">
                    {leadCount}
                  </span>
                }
                onClick={() => navigate('/lounge/crm')}
              />
            </Panel>

            <div className="flex min-w-0 flex-col gap-4">
              {/* From the studio: latest announcement */}
              <Panel>
                {announcements.length > 0 ? (
                  <div className="border-l-2 border-primary px-4 py-3.5">
                    <p className="text-[13px] font-medium text-foreground">{announcements[0].title}</p>
                    <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
                      {announcements[0].content}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                        From the studio · {format(new Date(announcements[0].created_at), 'd MMM')}
                      </span>
                      {announcements.length > 1 && (
                        <button
                          onClick={() => setViewMode('updates')}
                          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          All updates
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-l-2 border-border px-4 py-3.5">
                    <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                      No studio updates right now. Anything that needs you will appear here first.
                    </p>
                  </div>
                )}
              </Panel>

              {/* Health mini */}
              <Panel>
                <PanelHeader label="Account health">
                  <button
                    onClick={() => setViewMode('health')}
                    className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Details
                  </button>
                </PanelHeader>
                <div className="p-4">
                  <ClientHealthScore data={healthData} />
                </div>
              </Panel>
            </div>
          </div>

          {/* Quick destinations — phones only; desktop has the sidebar and ⌘K */}
          <Panel className="lg:hidden">
            <PanelHeader label="Go to" />
            <div className="grid grid-cols-4 gap-1 p-2">
              {goTo.map(a => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-center transition-colors duration-150 hover:bg-foreground/[0.03]"
                >
                  <a.icon className="h-[18px] w-[18px] text-ink-2" />
                  <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
                </button>
              ))}
            </div>
          </Panel>

          {/* Activity ledger */}
          <section className="pt-2">
            <SectionHeader title="Recent activity">
              <button
                onClick={() => setViewMode('activity')}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
              </button>
            </SectionHeader>
            {activity.length > 0 ? (
              <div>
                {activity.slice(0, 5).map(a => (
                  <div
                    key={a.id}
                    className="grid h-10 grid-cols-[64px_1fr_auto] items-center gap-3 border-t border-border/60 px-0.5 transition-colors duration-150 hover:bg-foreground/[0.02] sm:grid-cols-[76px_1fr_auto]"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                      {a.type}
                    </span>
                    <span className="truncate text-[13px]">{a.title}</span>
                    <RelativeTime date={a.date} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                title="Nothing yet"
                body="Work on your projects will appear here as it happens."
              />
            )}
          </section>
        </div>
      )}

      {viewMode === 'analytics' && (
        <div className="space-y-4 pt-5">
          {/* The numbers, as a ledger — not a card row */}
          <Panel>
            <PanelHeader label="This period" />
            <PanelRow
              title="Website"
              meta={profile?.website_status ? statusLabel(profile.website_status) : 'Not started'}
              trailing={<span className="font-mono text-sm tabular-nums">{counts.websites.total}</span>}
              onClick={() => navigate('/lounge/website')}
            />
            <PanelRow
              title="App projects"
              meta={`${counts.apps.inProgress} in progress`}
              trailing={
                <span className="font-mono text-sm tabular-nums">
                  {counts.apps.total}
                  {counts.apps.total !== prevWeekCounts.apps && (
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {counts.apps.total > prevWeekCounts.apps ? '+' : ''}
                      {counts.apps.total - prevWeekCounts.apps} wk
                    </span>
                  )}
                </span>
              }
              onClick={() => navigate('/lounge/apps')}
            />
            <PanelRow
              title="Content"
              meta={`${counts.content.pending} pending`}
              trailing={
                <span className="font-mono text-sm tabular-nums">
                  {counts.content.pending + counts.content.delivered}
                </span>
              }
              onClick={() => navigate('/lounge/content')}
            />
            <PanelRow
              title="CRM leads"
              meta="All sources"
              trailing={<span className="font-mono text-sm tabular-nums">{leadCount}</span>}
              onClick={() => navigate('/lounge/crm')}
            />
          </Panel>

          <DashboardCharts
            contentByStatus={contentByStatus}
            appsByStatus={appsByStatus}
            weeklyActivity={weeklyActivity}
          />

          <ActivityHeatmap />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LiveActivityFeed />
            </div>
            <UsageInsights />
          </div>
        </div>
      )}

      {viewMode === 'activity' && (
        <div className="pt-5">
          <Panel>
            <PanelHeader label="All recent activity">
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {activity.length} items
              </span>
            </PanelHeader>
            {activity.length > 0 ? (
              activity.map(a => (
                <PanelRow
                  key={a.id}
                  title={a.title}
                  meta={format(new Date(a.date), 'EEE d MMM yyyy, HH:mm')}
                  leading={
                    <span className="w-14 shrink-0 font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                      {a.type}
                    </span>
                  }
                  trailing={a.status ? <StatusBadge status={a.status} /> : undefined}
                />
              ))
            ) : (
              <EmptyState
                compact
                title="No activity yet"
                body="Activity appears here as your projects move."
              />
            )}
          </Panel>
        </div>
      )}

      {viewMode === 'updates' && (
        <div className="pt-5">
          <Panel>
            <PanelHeader label="Studio updates">
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {announcements.length}
              </span>
            </PanelHeader>
            {announcements.length > 0 ? (
              announcements.map(a => (
                <div key={a.id} className="border-t border-border/60 px-4 py-3.5 first:border-t-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                      <StatusBadge tone={announcementTone(a.priority)} label="" className="gap-0" />
                      {a.title}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                      {format(new Date(a.created_at), 'd MMM yyyy')}
                    </span>
                  </div>
                  <p className="mt-1 pl-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {a.content}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                compact
                title="No updates yet"
                body="News from the studio lands here."
              />
            )}
          </Panel>
        </div>
      )}

      {viewMode === 'health' && (
        <div className="pt-5">
          <Panel className="mx-auto max-w-[640px]">
            <PanelHeader label="Account health" />
            <div className="p-5">
              <ClientHealthScore data={healthData} />
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
