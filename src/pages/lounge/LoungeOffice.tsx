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
import { cn } from '@/lib/utils';
import { OfficeSplash } from '@/components/splash/OfficeSplash';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { OfficeQuickActions } from '@/components/office/OfficeQuickActions';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RelativeTime, SkeletonLedger } from '@/components/platform';

/* ─── App registry ─── */
import { tileStyle, glyphStyle, accentOf, identityFor, OFFICE_FAMILIES } from '@/pages/lounge/office/officeIdentity';

/** The rail shows a few apps from each family, in the order a day runs. */
const RAIL_FAMILIES = ['Documents', 'Money', 'Run', 'Build', 'Think'] as const;

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
  const [appFamily, setAppFamily] = useState<string>('All');
  const [showExitSplash, setShowExitSplash] = useState(false);
  const [showSplash, setShowSplash] = useState(() => !fromOfficeApp);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [loadingRecents, setLoadingRecents] = useState(true);

  const backPath = isAdmin ? '/dashboard' : '/lounge';

  // Persist current view so returning from an office app lands on the same tab
  useEffect(() => {
    sessionStorage.setItem('office:lastView', activeView);
  }, [activeView]);

  /** Tab presses mean "everything"; only the suite index narrows the shelf. */
  const goView = useCallback((view: ActiveView) => {
    if (view === 'apps') setAppFamily('All');
    setActiveView(view);
  }, []);

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
      {/* ─── Left app rail (desktop) ───
          The suite's spine: identity, the three ways through Office, then
          the apps themselves grouped by family, so the rail reads as a
          filing cabinet rather than a row of stickers. */}
      <aside className="hidden w-[72px] shrink-0 flex-col border-r border-border/60 bg-card md:flex">
        {/* Identity, and the way out */}
        <div className="flex h-[52px] items-center justify-center border-b border-border/60">
          <button
            onClick={() => setShowExitSplash(true)}
            aria-label="Leave Office"
            className="group relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-border/60 transition-colors duration-150 hover:border-primary/50"
          >
            <span className="font-display text-[13px] font-semibold leading-none tracking-[-0.03em] transition-opacity duration-150 group-hover:opacity-0">
              Q
            </span>
            <ArrowLeft className="absolute h-4 w-4 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
            <span className="pointer-events-none absolute left-full z-40 ml-2 whitespace-nowrap rounded-md border border-border/60 bg-card px-2 py-1 text-[11px] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              Leave Office
            </span>
          </button>
        </div>

        {/* The three ways through Office */}
        <nav className="flex flex-col items-center gap-0.5 px-2 pt-2.5">
          {[
            { view: 'home' as ActiveView, icon: Home, label: 'Home' },
            { view: 'apps' as ActiveView, icon: Grid3X3, label: 'Apps' },
            { view: 'recents' as ActiveView, icon: Clock, label: 'Recents' },
          ].map(nav => {
            const on = activeView === nav.view;
            return (
              <button
                key={nav.view}
                onClick={() => goView(nav.view)}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'relative flex h-[46px] w-full flex-col items-center justify-center gap-1 rounded-[10px] transition-colors duration-150',
                  on ? 'text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                )}
              >
                {on && (
                  <span aria-hidden className="absolute left-[-8px] h-6 w-[2px] rounded-r-full bg-primary" />
                )}
                <nav.icon className="h-[17px] w-[17px]" strokeWidth={on ? 2 : 1.5} />
                <span className={cn('text-[8.5px] tracking-[0.04em]', on ? 'font-semibold' : 'font-medium')}>
                  {nav.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* The apps, by family */}
        <div className="scrollbar-none mt-2.5 flex flex-1 flex-col items-center gap-1 overflow-y-auto border-t border-border/60 px-2 pt-2.5">
          {RAIL_FAMILIES.map((family, fi) => (
            <div key={family} className="flex w-full flex-col items-center gap-1">
              {fi > 0 && <div className="my-1 h-px w-5 bg-border/60" />}
              {APPS.filter(a => identityFor(a.id).family === family).slice(0, 3).map(app => (
                <button
                  key={app.id}
                  onClick={() => go(app.route)}
                  className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-transform duration-150 hover:scale-105"
                  style={glyphStyle(app.id)}
                >
                  <app.icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
                  <span className="pointer-events-none absolute left-full z-40 ml-2 whitespace-nowrap rounded-md border border-border/60 bg-card px-2 py-1 text-[11px] text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                    {app.name}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Everything else */}
        <div className="flex flex-col items-center gap-1 border-t border-border/60 px-2 py-2.5">
          <button
            onClick={() => goView('apps')}
            aria-label="Every app"
            className="group relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-dashed border-border/70 text-muted-foreground transition-colors duration-150 hover:border-primary/50 hover:text-foreground"
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="pointer-events-none absolute left-full z-40 ml-2 whitespace-nowrap rounded-md border border-border/60 bg-card px-2 py-1 text-[11px] text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              Every app
            </span>
          </button>
          <button
            aria-label="Office settings"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.04] hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ─── Mobile top bar ───
            Just identity and the way out. Navigation lives at the bottom,
            where a thumb actually reaches. */}
        <header className="shrink-0 border-b border-border/60 bg-background md:hidden">
          <div className="flex h-[52px] items-center gap-2.5 px-3.5">
            <button
              onClick={() => setShowExitSplash(true)}
              aria-label="Leave Office"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-border/60 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="font-mono text-[8.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Quooro
              </p>
              <p className="font-display text-[15px] font-semibold leading-none tracking-[-0.025em]">Office</p>
            </div>
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
              onViewApps={(family) => { setAppFamily(family || 'All'); setActiveView('apps'); }}
            />
          )}
          {activeView === 'apps' && (
            <AppsView
              search={search}
              setSearch={setSearch}
              filteredApps={filteredApps}
              go={go}
              family={appFamily}
              setFamily={setAppFamily}
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

        {/* ─── Mobile tab bar ───
            Three destinations, thumb height, with the active one carrying
            a rule above it rather than a coloured pill. */}
        <nav
          className="shrink-0 border-t border-border/60 bg-card md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="grid grid-cols-3">
            {[
              { view: 'home' as ActiveView, icon: Home, label: 'Home' },
              { view: 'apps' as ActiveView, icon: Grid3X3, label: 'Apps' },
              { view: 'recents' as ActiveView, icon: Clock, label: 'Recents' },
            ].map(nav => {
              const on = activeView === nav.view;
              return (
                <button
                  key={nav.view}
                  onClick={() => goView(nav.view)}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'relative flex h-[58px] flex-col items-center justify-center gap-1 transition-colors duration-150',
                    on ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {on && <span aria-hidden className="absolute inset-x-6 top-0 h-[2px] rounded-b-full bg-primary" />}
                  <nav.icon className="h-[18px] w-[18px]" strokeWidth={on ? 2 : 1.5} />
                  <span className={cn('text-[10px] tracking-[0.01em]', on ? 'font-semibold' : 'font-medium')}>
                    {nav.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
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
  onViewApps: (family?: string) => void;
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const q = search.trim().toLowerCase();
  const isSearching = q.length > 0;

  const matchedApps = isSearching
    ? APPS.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)).slice(0, 6)
    : [];
  const matchedFiles = isSearching
    ? recentFiles.filter(f => f.file_name.toLowerCase().includes(q)).slice(0, 6)
    : [];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const starred = recentFiles.filter(f => f.is_starred);
  const editedToday = recentFiles.filter(f => {
    const d = new Date(f.updated_at); const n = new Date();
    return d.toDateString() === n.toDateString();
  }).length;

  // Which apps this workspace actually uses, most-used first.
  const usage = new Map<string, number>();
  recentFiles.forEach(f => usage.set(f.app_source, (usage.get(f.app_source) || 0) + 1));
  const mostUsed = APPS
    .filter(a => usage.has(a.id))
    .sort((a, b) => (usage.get(b.id) || 0) - (usage.get(a.id) || 0))
    .slice(0, 6);

  const CREATE = [
    { id: 'docs', icon: FileText, label: 'Document', route: '/lounge/office/word-home' },
    { id: 'sheets', icon: Sheet, label: 'Spreadsheet', route: '/lounge/office/sheets-home' },
    { id: 'slides', icon: Presentation, label: 'Presentation', route: '/lounge/office/powerpoint-home' },
    { id: 'notes', icon: BookOpen, label: 'Notebook', route: '/lounge/office/onenote-home' },
    { id: 'invoices', icon: Receipt, label: 'Invoice', route: '/lounge/office/invoices' },
    { id: 'design', icon: Palette, label: 'Design', route: '/lounge/office/design-studio' },
  ];

  const KICK = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-5 sm:px-7 sm:pt-8">
      {/* Masthead: the workspace states itself and offers one way in. */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className={KICK}>
            <span className="hidden sm:inline">Quooro Office · </span>{today}
          </p>
          <h1 className="mt-1.5 font-display text-[27px] font-semibold leading-none tracking-[-0.025em] sm:text-[34px]">
            {greeting}
          </h1>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          {[
            ['Documents', String(recentFiles.length)],
            ['Edited today', String(editedToday)],
            ['Starred', String(starred.length)],
          ].map(([label, value]) => (
            <div key={label} className="text-right">
              <p className={KICK}>{label}</p>
              <p className="mt-1 font-display text-[19px] font-semibold tabular-nums leading-none tracking-[-0.02em]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </header>

      {/* The command bar, given the weight it earns. */}
      <div ref={searchRef} className="relative mt-5">
        <div className={cn(
          'flex h-12 items-center gap-3 rounded-[13px] border bg-card px-4 transition-colors',
          searchFocused ? 'border-primary/50' : 'border-border/60',
        )}>
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search everything: apps, documents, files"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded border border-border/60 px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground sm:block">
            ⌘K
          </kbd>
        </div>

        {searchFocused && isSearching && (
          <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[13px] border border-border/60 bg-card shadow-2xl">
            {matchedApps.length === 0 && matchedFiles.length === 0 ? (
              <p className="px-4 py-5 text-center text-[13px] text-muted-foreground">Nothing matches that.</p>
            ) : (
              <div className="max-h-[380px] overflow-y-auto py-1.5">
                {matchedApps.length > 0 && (
                  <>
                    <p className={cn(KICK, 'px-4 py-2')}>Apps</p>
                    {matchedApps.map(app => (
                      <button
                        key={app.id}
                        onClick={() => { go(app.route); setSearch(''); setSearchFocused(false); }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-foreground/[0.03]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={glyphStyle(app.id)}>
                          <app.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">{app.name}</span>
                          <span className="block text-[11px] text-muted-foreground">{app.desc}</span>
                        </span>
                      </button>
                    ))}
                  </>
                )}
                {matchedFiles.length > 0 && (
                  <>
                    {matchedApps.length > 0 && <div className="mx-4 my-1 h-px bg-border/60" />}
                    <p className={cn(KICK, 'px-4 py-2')}>Documents</p>
                    {matchedFiles.map(f => {
                      const Icon = getAppIcon(f.app_source);
                      return (
                        <button
                          key={f.id}
                          onClick={() => { if (f.source_route) go(f.source_route); setSearch(''); setSearchFocused(false); }}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-foreground/[0.03]"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={glyphStyle(f.app_source)}>
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13px]">{f.file_name}</span>
                          <RelativeTime date={f.updated_at} className="shrink-0" />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Start something: the six things people actually make. */}
      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2.5">
          <h2 className={KICK}>Start something</h2>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {CREATE.map(item => (
            <button
              key={item.id}
              onClick={() => go(item.route)}
              style={tileStyle(item.id)}
              className="group relative flex w-[120px] shrink-0 flex-col items-start gap-3 overflow-hidden rounded-[13px] border bg-card p-3.5 text-left transition-all duration-200 hover:-translate-y-[2px] sm:w-auto"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] opacity-70 transition-opacity group-hover:opacity-100"
                style={{ background: accentOf(item.id) }}
              />
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={glyphStyle(item.id)}>
                <item.icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
              </span>
              <span>
                <span className="block text-[12.5px] font-medium leading-tight">{item.label}</span>
                <span className="mt-0.5 flex items-center gap-0.5 text-[10.5px] text-muted-foreground">
                  New <ChevronRight className="h-2.5 w-2.5" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* The workstation: work on the left, the workspace on the right. */}
      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center gap-2.5">
            <h2 className={KICK}>Pick up where you left off</h2>
            <div className="h-px flex-1 bg-border/60" />
            {recentFiles.length > 0 && (
              <button onClick={onViewRecents} className="flex shrink-0 items-center gap-0.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground">
                All work <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {loadingRecents ? (
            <div className="rounded-[13px] border border-border/60 bg-card"><SkeletonLedger rows={5} /></div>
          ) : recentFiles.length === 0 ? (
            <div className="rounded-[13px] border border-dashed border-border/70 px-6 py-12 text-center">
              <p className="text-[14px] font-medium">Nothing open yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
                Everything you make in Office lands here, newest first, so the work you were doing is always one press away.
              </p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-[13px] border border-border/60 bg-card">
              {recentFiles.slice(0, 8).map(f => {
                const Icon = getAppIcon(f.app_source);
                const app = APPS.find(a => a.id === f.app_source);
                return (
                  <li key={f.id} className="border-b border-border/50 last:border-b-0">
                    <button
                      onClick={() => { if (f.source_route) go(f.source_route); }}
                      className="group flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-foreground/[0.025]"
                    >
                      <span
                        aria-hidden
                        className="h-8 w-[3px] shrink-0 rounded-full opacity-80"
                        style={{ background: accentOf(f.app_source) }}
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]" style={glyphStyle(f.app_source)}>
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium">{f.file_name}</span>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {app?.name || f.app_source}
                        </span>
                      </span>
                      {f.is_starred && <Star className="h-3.5 w-3.5 shrink-0 fill-attend text-attend" />}
                      <RelativeTime date={f.updated_at} className="w-20 shrink-0 text-right" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* The apps this workspace actually reaches for. */}
          {mostUsed.length > 0 && (
            <>
              <div className="mb-3 mt-6 flex items-center gap-2.5">
                <h2 className={KICK}>You work in these most</h2>
                <div className="h-px flex-1 bg-border/60" />
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                {mostUsed.map(app => (
                  <button
                    key={app.id}
                    onClick={() => go(app.route)}
                    style={tileStyle(app.id)}
                    className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-[12px] border bg-card p-3 transition-all duration-200 hover:-translate-y-[2px]"
                  >
                    <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] opacity-70" style={{ background: accentOf(app.id) }} />
                    <span className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={glyphStyle(app.id)}>
                      <app.icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="w-full truncate text-center text-[11.5px] font-medium">{app.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* The workspace column */}
        <aside className="space-y-4">
          {/* The suite by family, as an index rather than a repeat of the
              numbers already stated above. */}
          <div className="overflow-hidden rounded-[13px] border border-border/60 bg-card">
            <div className="border-b border-border/60 px-4 py-2.5">
              <p className={KICK}>The suite</p>
            </div>
            <ul className="divide-y divide-border/50">
              {OFFICE_FAMILIES.map(family => {
                const apps = APPS.filter(a => identityFor(a.id).family === family);
                if (apps.length === 0) return null;
                return (
                  <li key={family}>
                    <button
                      onClick={() => onViewApps(family)}
                      className="group flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.025]"
                    >
                      <span className="flex -space-x-1">
                        {apps.slice(0, 3).map(a => (
                          <span
                            key={a.id}
                            aria-hidden
                            className="h-2.5 w-2.5 rounded-full ring-2 ring-card"
                            style={{ background: accentOf(a.id) }}
                          />
                        ))}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px]">{family}</span>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{apps.length}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              onClick={() => onViewApps()}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border/60 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-foreground/[0.03]"
            >
              <Grid3X3 className="h-3.5 w-3.5" /> Every app
            </button>
          </div>

          {starred.length > 0 && (
            <div className="overflow-hidden rounded-[13px] border border-border/60 bg-card">
              <div className="border-b border-border/60 px-4 py-2.5">
                <p className={KICK}>Starred</p>
              </div>
              <ul className="divide-y divide-border/50">
                {starred.slice(0, 5).map(f => {
                  const Icon = getAppIcon(f.app_source);
                  return (
                    <li key={f.id}>
                      <button
                        onClick={() => { if (f.source_route) go(f.source_route); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.025]"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={glyphStyle(f.app_source)}>
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px]">{f.file_name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="rounded-[13px] border border-border/60 bg-sunken/40 px-4 py-3.5">
            <p className={KICK}>Everything in one place</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              Office runs inside Quooro, so a document, an invoice and the client it belongs to are never in different systems.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════
   APPS VIEW
   ═══════════════════════════════════════════════ */

/** What each family is for, said once, above its shelf. */
const FAMILY_NOTE: Record<string, string> = {
  Documents: 'Write it, store it, send it',
  Money: 'Everything that ends in a number',
  Build: 'Make the thing',
  Think: 'Shape a decision',
  Run: 'The business itself',
  Utilities: 'Small tools, always to hand',
};

function AppsView({ search, setSearch, filteredApps, go, family, setFamily }: {
  search: string; setSearch: (v: string) => void; filteredApps: AppItem[]; go: (r: string) => void;
  family: string; setFamily: (v: string) => void;
}) {
  const searching = search.trim().length > 0;

  // Search overrides the shelf; otherwise the wall is filed by family.
  const pool = searching ? filteredApps : APPS;
  const shelves = searching
    ? [{ title: 'Matching apps', note: `${filteredApps.length} of ${APPS.length}`, apps: filteredApps }]
    : OFFICE_FAMILIES
        .filter(f => family === 'All' || f === family)
        .map(f => ({
          title: f as string,
          note: FAMILY_NOTE[f] || '',
          apps: APPS.filter(a => identityFor(a.id).family === f),
        }))
        .filter(s => s.apps.length > 0);

  const KICK = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-5 sm:px-7 sm:pt-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={cn(KICK, 'hidden sm:block')}>Quooro Office</p>
          <h1 className="font-display text-[27px] font-semibold leading-none tracking-[-0.025em] sm:mt-1.5 sm:text-[34px]">
            Every app
          </h1>
        </div>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {APPS.length} apps · {OFFICE_FAMILIES.length} families
        </p>
      </header>

      {/* Search, then the family shelves it files into. */}
      <div className="mt-5 flex h-12 items-center gap-3 rounded-[13px] border border-border/60 bg-card px-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Find an app"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
        />
        {searching && (
          <button onClick={() => setSearch('')} className="shrink-0 text-[11.5px] text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>

      {!searching && (
        <div className="scrollbar-none -mx-4 mt-3.5 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {(['All', ...OFFICE_FAMILIES] as string[]).map(f => {
            const on = family === f;
            const count = f === 'All' ? APPS.length : APPS.filter(a => identityFor(a.id).family === f).length;
            return (
              <button
                key={f}
                onClick={() => setFamily(f)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-150',
                  on
                    ? 'border-primary/50 bg-primary/10 font-medium text-foreground'
                    : 'border-border/60 text-muted-foreground hover:text-foreground',
                )}
              >
                {f}
                <span className="font-mono text-[10px] tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {pool.length === 0 ? (
        <div className="mt-6 rounded-[13px] border border-dashed border-border/70 px-6 py-14 text-center">
          <p className="text-[14px] font-medium">No app by that name</p>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">Try a shorter word, or clear the search to see all {APPS.length}.</p>
        </div>
      ) : (
        shelves.map(shelf => (
          <section key={shelf.title} className="mt-7">
            <div className="mb-3 flex items-baseline gap-2.5">
              <h2 className={KICK}>{shelf.title}</h2>
              <span className="shrink-0 text-[11.5px] text-muted-foreground">{shelf.note}</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shelf.apps.map(app => (
                <button
                  key={app.id}
                  onClick={() => go(app.route)}
                  style={tileStyle(app.id)}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-[13px] border bg-card p-3 text-left transition-all duration-200 hover:-translate-y-[2px]"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-[2px] opacity-70 transition-opacity duration-200 group-hover:opacity-100"
                    style={{ background: accentOf(app.id) }}
                  />
                  <span
                    className="ml-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] sm:h-10 sm:w-10"
                    style={glyphStyle(app.id)}
                  >
                    <app.icon className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-foreground">{app.name}</span>
                    <span className="hidden truncate text-[11.5px] text-muted-foreground sm:block">{app.desc}</span>
                  </span>
                  <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block" />
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RECENTS VIEW
   ═══════════════════════════════════════════════ */

/** Work is remembered by when it happened, so the ledger is cut by day. */
function dayBucket(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  const days = Math.floor((now.getTime() - d.getTime()) / 86400e3);
  if (days < 7) return 'Earlier this week';
  if (days < 30) return 'This month';
  return 'Older';
}

const BUCKET_ORDER = ['Today', 'Yesterday', 'Earlier this week', 'This month', 'Older'];

function RecentsView({ search, setSearch, recentFiles, loadingRecents, go }: {
  search: string; setSearch: (v: string) => void; recentFiles: RecentFile[]; loadingRecents: boolean; go: (r: string) => void;
}) {
  const [starredOnly, setStarredOnly] = useState(false);
  const shown = starredOnly ? recentFiles.filter(f => f.is_starred) : recentFiles;

  const buckets = BUCKET_ORDER
    .map(name => ({ name, files: shown.filter(f => dayBucket(f.updated_at) === name) }))
    .filter(b => b.files.length > 0);

  const KICK = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 pb-16 pt-5 sm:px-7 sm:pt-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={cn(KICK, 'hidden sm:block')}>Quooro Office</p>
          <h1 className="font-display text-[27px] font-semibold leading-none tracking-[-0.025em] sm:mt-1.5 sm:text-[34px]">
            Recent work
          </h1>
        </div>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {shown.length} {shown.length === 1 ? 'item' : 'items'}
        </p>
      </header>

      <div className="mt-5 flex h-12 items-center gap-3 rounded-[13px] border border-border/60 bg-card px-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your work"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={() => setStarredOnly(v => !v)}
          aria-pressed={starredOnly}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors duration-150',
            starredOnly ? 'border-attend/50 bg-attend/10 text-foreground' : 'border-border/60 text-muted-foreground hover:text-foreground',
          )}
        >
          <Star className={cn('h-3 w-3', starredOnly && 'fill-attend text-attend')} /> Starred
        </button>
      </div>

      {loadingRecents ? (
        <div className="mt-6 rounded-[13px] border border-border/60 bg-card"><SkeletonLedger rows={6} /></div>
      ) : buckets.length === 0 ? (
        <div className="mt-6 rounded-[13px] border border-dashed border-border/70 px-6 py-14 text-center">
          <p className="text-[14px] font-medium">
            {search.trim() ? 'Nothing matches that' : starredOnly ? 'Nothing starred yet' : 'No work yet'}
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
            {search.trim()
              ? 'Try a shorter word, or clear the search.'
              : starredOnly
                ? 'Star a document and it will wait for you here.'
                : 'Everything you make in Office lands here, newest first.'}
          </p>
        </div>
      ) : (
        buckets.map(bucket => (
          <section key={bucket.name} className="mt-6">
            <div className="mb-2.5 flex items-baseline gap-2.5">
              <h2 className={KICK}>{bucket.name}</h2>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{bucket.files.length}</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <ul className="overflow-hidden rounded-[13px] border border-border/60 bg-card">
              {bucket.files.map(file => {
                const Icon = getAppIcon(file.app_source);
                const app = APPS.find(a => a.id === file.app_source);
                return (
                  <li key={file.id} className="border-b border-border/50 last:border-b-0">
                    <button
                      onClick={() => file.source_route && go(file.source_route)}
                      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-150 hover:bg-foreground/[0.025]"
                    >
                      <span
                        aria-hidden
                        className="h-8 w-[3px] shrink-0 rounded-full opacity-80"
                        style={{ background: accentOf(file.app_source) }}
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]" style={glyphStyle(file.app_source)}>
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-foreground">{file.file_name}</span>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {app?.name || file.app_source}
                        </span>
                      </span>
                      {file.is_starred && <Star className="h-3.5 w-3.5 shrink-0 fill-attend text-attend" />}
                      <RelativeTime date={file.updated_at} className="w-20 shrink-0 text-right" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
