import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText, Sheet, Presentation, BookOpen, Cloud, Search,
  Palette, ArrowLeft, Home, Grid3X3,
  PenLine, FileCheck, Layout, Calculator, Timer,
  BarChart3, StickyNote, Globe,
  Briefcase, Receipt, Users, BookMarked, ClipboardList,
  TrendingUp, Clock, FileSignature, KeyRound,
  Star, ChevronRight, Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OfficeSplash } from '@/components/splash/OfficeSplash';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { OfficeQuickActions } from '@/components/office/OfficeQuickActions';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  PageHeader, Panel, SectionHeader, RelativeTime, EmptyState, SkeletonLedger, FIELD,
} from '@/components/platform';

/* ─── App registry ─── */
type AppItem = { id: string; name: string; desc: string; icon: any; route: string };

const APPS: AppItem[] = [
  { id: 'docs', name: 'Docs', desc: 'Word processing', icon: FileText, route: '/lounge/office/word-home' },
  { id: 'sheets', name: 'Sheets', desc: 'Spreadsheets', icon: Sheet, route: '/lounge/office/sheets-home' },
  { id: 'slides', name: 'Slides', desc: 'Presentations', icon: Presentation, route: '/lounge/office/powerpoint-home' },
  { id: 'notes', name: 'Notes', desc: 'Notebooks', icon: BookOpen, route: '/lounge/office/onenote-home' },
  { id: 'files', name: 'Files', desc: 'Cloud storage', icon: Cloud, route: '/lounge/office/onedrive' },
  { id: 'operations', name: 'Operations', desc: 'Jobs and meetings', icon: Briefcase, route: '/lounge/office/operations' },
  { id: 'invoices', name: 'Invoices', desc: 'Billing', icon: Receipt, route: '/lounge/office/invoices' },
  { id: 'accounting', name: 'Accounting', desc: 'Ledger and reports', icon: Calculator, route: '/lounge/office/accounting' },
  { id: 'ecommerce', name: 'E-commerce', desc: 'Client sites and hosting', icon: Globe, route: '/lounge/office/ecommerce' },

  { id: 'hr', name: 'HR', desc: 'People', icon: Users, route: '/lounge/office/hr' },
  { id: 'tasks', name: 'Tasks', desc: 'To-dos', icon: Layout, route: '/lounge/office/tasks' },
  { id: 'expenses', name: 'Expenses', desc: 'Receipts', icon: Receipt, route: '/lounge/office/expenses' },
  { id: 'contracts', name: 'Contracts', desc: 'CLM', icon: FileSignature, route: '/lounge/office/contracts' },
  { id: 'time-tracker', name: 'Time', desc: 'Billable hours', icon: Clock, route: '/lounge/office/time-tracker' },
  { id: 'analytics', name: 'Analytics', desc: 'BI', icon: TrendingUp, route: '/lounge/office/analytics' },
  { id: 'wiki', name: 'Wiki', desc: 'Knowledge', icon: BookMarked, route: '/lounge/office/wiki' },
  { id: 'forms', name: 'Forms', desc: 'Surveys', icon: ClipboardList, route: '/lounge/office/forms-home' },
  { id: 'polls', name: 'Polls', desc: 'Voting', icon: BarChart3, route: '/lounge/office/polls-home' },
  { id: 'pdf', name: 'PDF', desc: 'Edit and sign', icon: FileCheck, route: '/lounge/office/pdf-home' },
  { id: 'design', name: 'Design', desc: 'Graphics', icon: Palette, route: '/lounge/office/design-studio' },
  { id: 'whiteboard', name: 'Whiteboard', desc: 'Sketch', icon: PenLine, route: '/lounge/office/whiteboard-home' },
  { id: 'sticky', name: 'Sticky wall', desc: 'Visual notes', icon: StickyNote, route: '/lounge/office/sticky-wall-home' },
  { id: 'passwords', name: 'Passwords', desc: 'Vault', icon: KeyRound, route: '/lounge/office/passwords' },
  { id: 'calculator', name: 'Calculator', desc: 'Maths', icon: Calculator, route: '/lounge/office/calculator' },
  { id: 'pomodoro', name: 'Pomodoro', desc: 'Focus', icon: Timer, route: '/lounge/office/pomodoro' },
];

type ActiveView = 'home' | 'apps' | 'recents';

const APP_SOURCE_ICON: Record<string, any> = {
  docs: FileText, word: FileText, sheets: Sheet, spreadsheet: Sheet,
  slides: Presentation, presentation: Presentation,
  notes: BookOpen, notebook: BookOpen,
  invoices: Receipt, invoice: Receipt,
  pdf: FileCheck, design: Palette, whiteboard: PenLine,
  wiki: BookMarked, tasks: Layout, forms: ClipboardList,
};

function getAppIcon(source: string) {
  const key = source.toLowerCase();
  return APP_SOURCE_ICON[key] || FileText;
}

interface RecentFile {
  id: string;
  file_name: string;
  app_source: string;
  source_route: string | null;
  updated_at: string;
  is_starred: boolean;
}

export default function LoungeOffice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const fromOfficeApp = !!(location.state as any)?.fromOfficeApp;
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (fromOfficeApp) {
      const saved = sessionStorage.getItem('office:lastView') as ActiveView | null;
      if (saved === 'apps' || saved === 'recents' || saved === 'home') return saved;
    }
    return 'home';
  });
  const [search, setSearch] = useState('');
  const [showExitSplash, setShowExitSplash] = useState(false);
  const [showSplash, setShowSplash] = useState(() => !fromOfficeApp);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [loadingRecents, setLoadingRecents] = useState(true);

  const backPath = isAdmin ? '/dashboard' : '/lounge';

  // Persist current view so returning from an office app lands on the same tab
  useEffect(() => {
    sessionStorage.setItem('office:lastView', activeView);
  }, [activeView]);

  const go = useCallback((route: string) => {
    sessionStorage.setItem('office:lastView', activeView);
    navigate(route);
  }, [navigate, activeView]);

  // Fetch recent files from platform_files + office_documents
  useEffect(() => {
    if (!user?.id) { setLoadingRecents(false); return; }
    const fetchAll = async () => {
      const [platformRes, docsRes] = await Promise.all([
        supabase
          .from('platform_files')
          .select('id, file_name, app_source, source_route, updated_at, is_starred')
          .eq('user_id', user.id)
          .eq('is_trashed', false)
          .order('updated_at', { ascending: false })
          .limit(30),
        supabase
          .from('office_documents')
          .select('id, title, document_type, is_starred, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(30),
      ]);

      const platformFiles: RecentFile[] = (platformRes.data || []);
      const docFiles: RecentFile[] = (docsRes.data || []).map(d => ({
        id: `doc-${d.id}`,
        file_name: d.title,
        app_source: 'docs',
        source_route: `/lounge/office/word/${d.id}`,
        updated_at: d.updated_at,
        is_starred: d.is_starred,
      }));

      // Merge & deduplicate (skip docs already in platform_files by source_route)
      const platformRoutes = new Set(platformFiles.map(f => f.source_route).filter(Boolean));
      const uniqueDocs = docFiles.filter(d => !platformRoutes.has(d.source_route));
      const merged = [...platformFiles, ...uniqueDocs]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 30);

      setRecentFiles(merged);
      setLoadingRecents(false);
    };
    fetchAll();
  }, [user?.id]);

  const filteredApps = search.trim()
    ? APPS.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()))
    : APPS;

  const filteredRecents = search.trim()
    ? recentFiles.filter(f => f.file_name.toLowerCase().includes(search.toLowerCase()))
    : recentFiles;

  if (showExitSplash) {
    return <ExitSplash moduleName="Quooro Office" onComplete={() => navigate(backPath, { state: { skipSplash: true } })} />;
  }
  if (showSplash) {
    return <OfficeSplash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex overflow-hidden">
      {/* ─── Left app rail (desktop) ─── */}
      <aside className="hidden md:flex flex-col w-[68px] shrink-0 border-r border-border/60 bg-card">
        {/* Back button */}
        <div className="flex h-[52px] items-center justify-center border-b border-border/60">
          <button
            onClick={() => setShowExitSplash(true)}
            aria-label="Leave Office"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.04] hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Nav buttons */}
        <div className="flex flex-col items-center gap-1 px-2 pt-3">
          {[
            { view: 'home' as ActiveView, icon: Home, label: 'Home' },
            { view: 'apps' as ActiveView, icon: Grid3X3, label: 'Apps' },
            { view: 'recents' as ActiveView, icon: Clock, label: 'Recents' },
          ].map(nav => (
            <button
              key={nav.view}
              onClick={() => setActiveView(nav.view)}
              aria-current={activeView === nav.view ? 'page' : undefined}
              className={cn(
                'flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-[10px] transition-colors duration-150',
                activeView === nav.view
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
              )}
            >
              <nav.icon className="h-[18px] w-[18px]" strokeWidth={activeView === nav.view ? 2 : 1.5} />
              <span className="text-[8px] font-medium tracking-wide">{nav.label}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 my-3 h-px bg-border/60" />

        {/* Quick app icons */}
        <div className="scrollbar-none flex flex-1 flex-col items-center gap-1.5 overflow-y-auto px-2">
          {APPS.slice(0, 12).map(app => (
            <button
              key={app.id}
              onClick={() => go(app.route)}
              title={app.name}
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-150 hover:bg-foreground/[0.04]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.04]">
                <app.icon className="h-4 w-4 text-ink-2" strokeWidth={1.7} />
              </span>
            </button>
          ))}
        </div>

        {/* Settings at bottom */}
        <div className="flex items-center justify-center pb-3 pt-2">
          <button
            aria-label="Office settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.04] hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ─── Mobile top bar ─── */}
        <header className="shrink-0 border-b border-border/60 bg-background md:hidden">
          <div className="flex h-[52px] items-center gap-2 px-3">
            <Button variant="ghost" size="sm" className="h-8 shrink-0 rounded-lg text-xs" onClick={() => setShowExitSplash(true)}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm font-semibold tracking-tight text-foreground">Office</span>
            <div className="flex-1" />
            {[
              { view: 'home' as ActiveView, icon: Home },
              { view: 'apps' as ActiveView, icon: Grid3X3 },
              { view: 'recents' as ActiveView, icon: Clock },
            ].map(nav => (
              <button
                key={nav.view}
                onClick={() => setActiveView(nav.view)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150',
                  activeView === nav.view ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                )}
              >
                <nav.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </header>

        {/* ─── Content area ─── */}
        <div className="flex-1 overflow-auto">
          {activeView === 'home' && (
            <HomeView
              search={search}
              setSearch={setSearch}
              recentFiles={recentFiles}
              loadingRecents={loadingRecents}
              go={go}
              onViewRecents={() => setActiveView('recents')}
              onViewApps={() => setActiveView('apps')}
            />
          )}
          {activeView === 'apps' && (
            <AppsView
              search={search}
              setSearch={setSearch}
              filteredApps={filteredApps}
              go={go}
            />
          )}
          {activeView === 'recents' && (
            <RecentsView
              search={search}
              setSearch={setSearch}
              recentFiles={filteredRecents}
              loadingRecents={loadingRecents}
              go={go}
            />
          )}
        </div>
      </div>

      <OfficeQuickActions />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HOME VIEW
   ═══════════════════════════════════════════════ */

function HomeView({
  search, setSearch, recentFiles, loadingRecents, go, onViewRecents, onViewApps,
}: {
  search: string;
  setSearch: (v: string) => void;
  recentFiles: RecentFile[];
  loadingRecents: boolean;
  go: (r: string) => void;
  onViewRecents: () => void;
  onViewApps: () => void;
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const q = search.trim().toLowerCase();
  const isSearching = q.length > 0;

  // Compute search results across all categories
  const matchedApps = isSearching
    ? APPS.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)).slice(0, 5)
    : [];
  const matchedFiles = isSearching
    ? recentFiles.filter(f => f.file_name.toLowerCase().includes(q)).slice(0, 8)
    : [];
  const hasResults = matchedApps.length > 0 || matchedFiles.length > 0;
  const showDropdown = isSearching && searchFocused;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-10">
      {/* Header */}
      <PageHeader
        className="pt-7 sm:pt-9"
        kicker="Quooro Office"
        title="Office"
        description="Documents, business tools and utilities in one place"
      />

      {/* Search with live results dropdown */}
      <div className="pb-8 pt-5">
        <div className="relative max-w-xl" ref={searchRef}>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search apps, documents, files"
            className={cn(FIELD, 'pl-10 pr-14')}
          />
          <kbd className="pointer-events-none absolute right-3.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-md border border-border/60 bg-foreground/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            ⌘K
          </kbd>

          {/* Results dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[420px] overflow-auto rounded-[10px] border border-border/60 bg-popover shadow-lg">
              {!hasResults ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-[13px] text-muted-foreground">No results for "{search}"</p>
                </div>
              ) : (
                <div className="py-1.5">
                  {/* Apps section */}
                  {matchedApps.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2">
                        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Apps</span>
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">{matchedApps.length}</span>
                      </div>
                      {matchedApps.map((app) => (
                        <button
                          key={app.id}
                          onClick={() => { go(app.route); setSearch(''); setSearchFocused(false); }}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-150 hover:bg-foreground/[0.025]"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                            <app.icon className="h-3.5 w-3.5 text-ink-2" strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-foreground">{app.name}</span>
                            <span className="block text-[11px] text-muted-foreground">{app.desc}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Documents and files section */}
                  {matchedFiles.length > 0 && (
                    <div>
                      {matchedApps.length > 0 && <div className="mx-4 my-1 h-px bg-border/60" />}
                      <div className="flex items-center gap-2 px-4 py-2">
                        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Documents and files</span>
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">{matchedFiles.length}</span>
                      </div>
                      {matchedFiles.map((file) => {
                        const Icon = getAppIcon(file.app_source);
                        return (
                          <button
                            key={file.id}
                            onClick={() => { if (file.source_route) go(file.source_route); setSearch(''); setSearchFocused(false); }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-150 hover:bg-foreground/[0.025]"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                              <Icon className="h-3.5 w-3.5 text-ink-2" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium text-foreground">{file.file_name}</span>
                              <span className="block text-[11px] capitalize text-muted-foreground">
                                {file.app_source} · <RelativeTime date={file.updated_at} className="normal-case" />
                              </span>
                            </span>
                            {file.is_starred && <Star className="h-3 w-3 shrink-0 fill-gold text-gold" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick create row */}
      {!isSearching && (
        <>
          <div className="pb-8">
            <SectionHeader title="Create new" />
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              {[
                { icon: FileText, label: 'Document', route: '/lounge/office/word-home' },
                { icon: Sheet, label: 'Spreadsheet', route: '/lounge/office/sheets-home' },
                { icon: Presentation, label: 'Presentation', route: '/lounge/office/powerpoint-home' },
                { icon: BookOpen, label: 'Notebook', route: '/lounge/office/onenote-home' },
                { icon: Receipt, label: 'Invoice', route: '/lounge/office/invoices' },
                { icon: Palette, label: 'Design', route: '/lounge/office/design-studio' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => go(item.route)}
                  className="flex flex-col items-center gap-2.5 rounded-[10px] border border-border/60 bg-card p-4 transition-colors duration-150 hover:bg-foreground/[0.025]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-foreground/[0.04]">
                    <item.icon className="h-[18px] w-[18px] text-ink-2" strokeWidth={1.7} />
                  </span>
                  <span className="text-[11.5px] font-medium text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent work */}
          <div className="pb-8">
            <SectionHeader title="Recent work">
              <button
                onClick={onViewRecents}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </SectionHeader>
            <Panel>
              {loadingRecents ? (
                <SkeletonLedger rows={3} />
              ) : recentFiles.length === 0 ? (
                <EmptyState
                  compact
                  title="No recent files yet"
                  body="Create something to get started."
                />
              ) : (
                recentFiles.slice(0, 8).map((file) => {
                  const Icon = getAppIcon(file.app_source);
                  return (
                    <button
                      key={file.id}
                      onClick={() => file.source_route && go(file.source_route)}
                      className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-2.5 text-left transition-colors duration-150 first:border-t-0 hover:bg-foreground/[0.025]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                        <Icon className="h-4 w-4 text-ink-2" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-foreground">{file.file_name}</span>
                        <span className="block text-[11.5px] capitalize text-muted-foreground">{file.app_source}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {file.is_starred && <Star className="h-3 w-3 fill-gold text-gold" />}
                        <RelativeTime date={file.updated_at} />
                      </span>
                    </button>
                  );
                })
              )}
            </Panel>
          </div>

          {/* All apps shortcut */}
          <div className="pb-10">
            <button
              onClick={onViewApps}
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.025] hover:text-foreground"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              Browse all apps
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   APPS VIEW
   ═══════════════════════════════════════════════ */

const APP_GROUPS = [
  { title: 'Documents and storage', ids: ['docs', 'sheets', 'slides', 'notes', 'files'] },
  { title: 'Business and operations', ids: ['operations', 'invoices', 'accounting', 'hr', 'tasks', 'expenses', 'contracts', 'time-tracker'] },
  { title: 'Intelligence and research', ids: ['analytics', 'wiki', 'forms', 'polls', 'pdf'] },
  { title: 'Creative and visual', ids: ['design', 'whiteboard', 'sticky'] },
  { title: 'Security and utilities', ids: ['passwords', 'calculator', 'pomodoro'] },
];

function AppsView({ search, setSearch, filteredApps, go }: {
  search: string; setSearch: (v: string) => void; filteredApps: AppItem[]; go: (r: string) => void;
}) {
  const groups = search.trim()
    ? [{ title: 'Search results', ids: filteredApps.map(a => a.id) }]
    : APP_GROUPS;

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
      <PageHeader
        className="pt-7 sm:pt-9"
        kicker="Quooro Office"
        title="All apps"
        description="25+ tools to run your business"
      />

      {/* Search */}
      <div className="max-w-md pb-6 pt-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter apps"
            className={cn(FIELD, 'pl-10')}
          />
        </div>
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const apps = APPS.filter(a => group.ids.includes(a.id));
        if (apps.length === 0) return null;
        return (
          <section key={group.title} className="pb-8">
            <div className="mb-3.5 flex items-center gap-2.5">
              <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{group.title}</h2>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6">
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => go(app.route)}
                  className="flex flex-col items-center gap-2 rounded-[10px] border border-border/60 bg-card p-3 transition-colors duration-150 hover:bg-foreground/[0.025] sm:gap-2.5 sm:p-4"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-foreground/[0.04]">
                    <app.icon className="h-[18px] w-[18px] text-ink-2" strokeWidth={1.7} />
                  </span>
                  <span className="w-full min-w-0 text-center">
                    <span className="block truncate text-[13px] font-medium text-foreground">{app.name}</span>
                    <span className="hidden text-[11.5px] text-muted-foreground sm:block">{app.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RECENTS VIEW
   ═══════════════════════════════════════════════ */

function RecentsView({ search, setSearch, recentFiles, loadingRecents, go }: {
  search: string; setSearch: (v: string) => void; recentFiles: RecentFile[]; loadingRecents: boolean; go: (r: string) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-10">
      <PageHeader
        className="pt-7 sm:pt-9"
        kicker="Quooro Office"
        title="Recent work"
        description="Your recent activity across every app"
      />

      {/* Search */}
      <div className="max-w-md pb-6 pt-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recent files"
            className={cn(FIELD, 'pl-10')}
          />
        </div>
      </div>

      <div className="pb-10">
        <Panel>
          {loadingRecents ? (
            <SkeletonLedger rows={5} />
          ) : recentFiles.length === 0 ? (
            <EmptyState
              title={search.trim() ? 'No matching files' : 'No recent activity yet'}
              body={search.trim() ? 'Try a different search.' : 'Files you work on will appear here.'}
            />
          ) : (
            recentFiles.map((file) => {
              const Icon = getAppIcon(file.app_source);
              return (
                <button
                  key={file.id}
                  onClick={() => file.source_route && go(file.source_route)}
                  className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-2.5 text-left transition-colors duration-150 first:border-t-0 hover:bg-foreground/[0.025]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                    <Icon className="h-4 w-4 text-ink-2" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-foreground">{file.file_name}</span>
                    <span className="block text-[11.5px] capitalize text-muted-foreground">{file.app_source}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {file.is_starred && <Star className="h-3.5 w-3.5 fill-gold text-gold" />}
                    <RelativeTime date={file.updated_at} />
                  </span>
                </button>
              );
            })
          )}
        </Panel>
      </div>
    </div>
  );
}
