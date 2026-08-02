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
import { identityFor, OFFICE_FAMILIES } from '@/pages/lounge/office/officeIdentity';
import { AppTile } from '@/pages/lounge/office/AppTile';

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

/** The rail pins the daily drivers, the way a professional pins their tools. */
const PINNED_IDS = ['docs', 'sheets', 'slides', 'notes', 'files', 'invoices', 'accounting', 'operations', 'design', 'analytics'];

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

/* ─── The type system of the surface ───
   Sections speak in normal case at a confident weight; tiny uppercase
   survives only as table furniture. No mono outside of numbers. */
const SECTION = 'text-[13.5px] font-semibold tracking-[-0.01em] text-foreground';
const LABEL = 'text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/90';
const GROUP = 'overflow-hidden rounded-[14px] border border-border/40 bg-card';
const PILL = 'flex h-11 items-center gap-3 rounded-full border border-border/50 bg-foreground/[0.035] px-4 transition-colors';

/** Shared column grid for every file ledger: name, app, modified. */
const LEDGER_COLS = 'grid-cols-[minmax(0,1fr)_88px] sm:grid-cols-[minmax(0,1fr)_120px_96px]';

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

  /** Their office, addressed to them. */
  const firstName = ((user?.user_metadata as any)?.full_name || '').trim().split(/\s+/)[0] || '';

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

  const NAVS = [
    { view: 'home' as ActiveView, icon: Home, label: 'Home' },
    { view: 'apps' as ActiveView, icon: Grid3X3, label: 'Apps' },
    { view: 'recents' as ActiveView, icon: Clock, label: 'Recents' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      {/* ─── Title band ───
          A slim strip of chrome: the way out, the mark, the name. */}
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border/40 bg-card/80 px-2.5 backdrop-blur-xl sm:px-3.5">
        <button
          onClick={() => setShowExitSplash(true)}
          aria-label="Leave Office"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.05] hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span aria-hidden className="h-4 w-px bg-border/50" />
        <div className="flex min-w-0 items-center gap-2 pl-0.5">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18)]">
            <span className="font-display text-[12px] font-bold leading-none">Q</span>
          </span>
          <span className="truncate text-[13.5px] font-semibold tracking-[-0.01em]">
            Office
          </span>
        </div>
        <div className="flex-1" />
        <button
          aria-label="Office settings"
          className="hidden h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.05] hover:text-foreground md:flex"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left rail (desktop) ─── */}
        <aside className="hidden w-[64px] shrink-0 flex-col border-r border-border/40 bg-card md:flex">
          <nav className="flex flex-col items-center gap-0.5 px-1.5 pt-2">
            {NAVS.map(nav => {
              const on = activeView === nav.view;
              return (
                <button
                  key={nav.view}
                  onClick={() => goView(nav.view)}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'relative flex h-[46px] w-full flex-col items-center justify-center gap-[3px] rounded-[10px] transition-colors duration-150',
                    on ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground',
                  )}
                >
                  <nav.icon className="h-[17px] w-[17px]" strokeWidth={on ? 2 : 1.5} />
                  <span className={cn('text-[8.5px] tracking-[0.04em]', on ? 'font-semibold' : 'font-medium')}>
                    {nav.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mx-3.5 my-2 h-px bg-border/50" />

          {/* Pinned apps */}
          <div className="scrollbar-none flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1.5 pb-2">
            {PINNED_IDS.map(id => {
              const app = APPS.find(a => a.id === id);
              if (!app) return null;
              return (
                <button
                  key={id}
                  onClick={() => go(app.route)}
                  className="group relative flex h-10 w-full items-center justify-center rounded-[10px] transition-colors duration-150 hover:bg-foreground/[0.04]"
                >
                  <AppTile id={id} icon={app.icon} size={27} />
                  <span className="pointer-events-none absolute left-full z-40 ml-1.5 whitespace-nowrap rounded-[7px] border border-border/50 bg-card px-2 py-1 text-[11px] text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                    {app.name}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => goView('apps')}
              className="group relative flex h-10 w-full items-center justify-center rounded-[10px] text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.04] hover:text-foreground"
            >
              <span className="flex h-[27px] w-[27px] items-center justify-center rounded-[8px] bg-foreground/[0.05]">
                <Grid3X3 className="h-3.5 w-3.5" />
              </span>
              <span className="pointer-events-none absolute left-full z-40 ml-1.5 whitespace-nowrap rounded-[7px] border border-border/50 bg-card px-2 py-1 text-[11px] text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                All apps
              </span>
            </button>
          </div>
        </aside>

        {/* ─── Main column ─── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {activeView === 'home' && (
              <HomeView
                search={search}
                setSearch={setSearch}
                recentFiles={recentFiles}
                loadingRecents={loadingRecents}
                go={go}
                firstName={firstName}
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
              Frosted, the way a native tab bar sits over content, with
              the active destination tinted rather than boxed. */}
          <nav
            className="shrink-0 border-t border-border/40 bg-card/85 backdrop-blur-xl md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="grid grid-cols-3">
              {NAVS.map(nav => {
                const on = activeView === nav.view;
                return (
                  <button
                    key={nav.view}
                    onClick={() => goView(nav.view)}
                    aria-current={on ? 'page' : undefined}
                    className={cn(
                      'flex h-[56px] flex-col items-center justify-center gap-1 transition-colors duration-150',
                      on ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    <nav.icon className="h-[19px] w-[19px]" strokeWidth={on ? 2 : 1.6} />
                    <span className={cn('text-[10px] tracking-[0.01em]', on ? 'font-semibold' : 'font-medium')}>
                      {nav.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
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
  search, setSearch, recentFiles, loadingRecents, go, firstName, onViewRecents, onViewApps,
}: {
  search: string;
  setSearch: (v: string) => void;
  recentFiles: RecentFile[];
  loadingRecents: boolean;
  go: (r: string) => void;
  firstName: string;
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

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-6 sm:px-8 sm:pt-9">
      {/* Masthead: their office greets them by name. */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className={LABEL}>{today}</p>
          <h1 className="mt-2 font-display text-[27px] font-semibold leading-none tracking-[-0.025em] sm:text-[32px]">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
        <div className="flex items-center gap-5 sm:gap-7">
          {[
            ['Documents', String(recentFiles.length)],
            ['Edited today', String(editedToday)],
            ['Starred', String(starred.length)],
          ].map(([label, value]) => (
            <div key={label} className="text-right">
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold tabular-nums leading-none tracking-[-0.02em]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </header>

      {/* The command bar, as a pill. */}
      <div ref={searchRef} className="relative mt-6">
        <div className={cn(PILL, searchFocused && 'border-primary/40 bg-foreground/[0.05]')}>
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search your office"
            className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded-[5px] border border-border/50 px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground sm:block">
            ⌘K
          </kbd>
        </div>

        {searchFocused && isSearching && (
          <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[16px] border border-border/40 bg-card shadow-2xl">
            {matchedApps.length === 0 && matchedFiles.length === 0 ? (
              <p className="px-4 py-5 text-center text-[13px] text-muted-foreground">Nothing matches that.</p>
            ) : (
              <div className="max-h-[380px] overflow-y-auto py-1.5">
                {matchedApps.length > 0 && (
                  <>
                    <p className={cn(LABEL, 'px-4 py-2')}>Apps</p>
                    {matchedApps.map(app => (
                      <button
                        key={app.id}
                        onClick={() => { go(app.route); setSearch(''); setSearchFocused(false); }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-foreground/[0.03]"
                      >
                        <AppTile id={app.id} icon={app.icon} size={28} />
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
                    {matchedApps.length > 0 && <div className="mx-4 my-1 h-px bg-border/50" />}
                    <p className={cn(LABEL, 'px-4 py-2')}>Documents</p>
                    {matchedFiles.map(f => {
                      const Icon = getAppIcon(f.app_source);
                      return (
                        <button
                          key={f.id}
                          onClick={() => { if (f.source_route) go(f.source_route); setSearch(''); setSearchFocused(false); }}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-foreground/[0.03]"
                        >
                          <AppTile id={f.app_source} icon={Icon} size={28} />
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

      {/* Create: six instruments in a row, no boxes around boxes. */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className={SECTION}>Create</h2>
        </div>
        <div className="scrollbar-none -mx-5 mt-4 flex gap-6 overflow-x-auto px-5 sm:mx-0 sm:gap-8 sm:px-0">
          {CREATE.map(item => (
            <button
              key={item.id}
              onClick={() => go(item.route)}
              className="group flex shrink-0 flex-col items-center gap-2.5"
            >
              <AppTile
                id={item.id}
                icon={item.icon}
                size={54}
                className="transition-all duration-200 group-hover:brightness-125"
              />
              <span className="text-[11.5px] font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* The workstation: work on the left, the suite on the right. */}
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_290px]">
        <section className="min-w-0">
          <div className="mb-3.5 flex items-baseline justify-between gap-3">
            <h2 className={SECTION}>Continue working</h2>
            {recentFiles.length > 0 && (
              <button onClick={onViewRecents} className="shrink-0 text-[12px] font-medium text-primary transition-opacity hover:opacity-80">
                All work
              </button>
            )}
          </div>

          {loadingRecents ? (
            <div className={GROUP}><SkeletonLedger rows={5} /></div>
          ) : recentFiles.length === 0 ? (
            <div className="rounded-[14px] bg-foreground/[0.025] px-6 py-12 text-center">
              <p className="text-[14px] font-medium">Nothing open yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
                Everything you make in Office lands here, newest first, so the work you were doing is always one press away.
              </p>
            </div>
          ) : (
            <div className={GROUP}>
              <div className={cn('hidden gap-3 border-b border-border/40 px-4 py-2 sm:grid', LEDGER_COLS)}>
                <span className={LABEL}>Name</span>
                <span className={LABEL}>App</span>
                <span className={cn(LABEL, 'text-right')}>Modified</span>
              </div>
              <ul>
                {recentFiles.slice(0, 8).map(f => {
                  const Icon = getAppIcon(f.app_source);
                  const app = APPS.find(a => a.id === f.app_source);
                  return (
                    <li key={f.id} className="border-b border-border/30 last:border-b-0">
                      <button
                        onClick={() => { if (f.source_route) go(f.source_route); }}
                        className={cn('grid w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-foreground/[0.03]', LEDGER_COLS)}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <AppTile id={f.app_source} icon={Icon} size={28} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[13px] font-medium">{f.file_name}</span>
                              {f.is_starred && <Star className="h-3 w-3 shrink-0 fill-attend text-attend" />}
                            </span>
                            <span className="block truncate text-[10.5px] text-muted-foreground sm:hidden">
                              {app?.name || f.app_source}
                            </span>
                          </span>
                        </span>
                        <span className="hidden truncate text-[12px] text-muted-foreground sm:block">
                          {app?.name || f.app_source}
                        </span>
                        <RelativeTime date={f.updated_at} className="text-right" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* The apps this workspace actually reaches for. */}
          {mostUsed.length > 0 && (
            <>
              <div className="mb-3.5 mt-8 flex items-baseline justify-between">
                <h2 className={SECTION}>Frequent</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {mostUsed.map(app => (
                  <button
                    key={app.id}
                    onClick={() => go(app.route)}
                    className="flex items-center gap-2 rounded-full bg-foreground/[0.035] py-1.5 pl-1.5 pr-3.5 transition-colors duration-150 hover:bg-foreground/[0.06]"
                  >
                    <AppTile id={app.id} icon={app.icon} size={24} />
                    <span className="text-[12.5px] font-medium">{app.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* The workspace column */}
        <aside className="space-y-5">
          {/* The suite by family, as an index. */}
          <div>
            <div className="mb-3.5 flex items-baseline justify-between">
              <h2 className={SECTION}>The suite</h2>
              <button onClick={() => onViewApps()} className="text-[12px] font-medium text-primary transition-opacity hover:opacity-80">
                Every app
              </button>
            </div>
            <div className={GROUP}>
              <ul className="divide-y divide-border/30">
                {OFFICE_FAMILIES.map(family => {
                  const apps = APPS.filter(a => identityFor(a.id).family === family);
                  if (apps.length === 0) return null;
                  return (
                    <li key={family}>
                      <button
                        onClick={() => onViewApps(family)}
                        className="group flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.025]"
                      >
                        <span className="flex -space-x-1.5">
                          {apps.slice(0, 3).map(a => (
                            <AppTile key={a.id} id={a.id} icon={a.icon} size={20} className="ring-2 ring-card" />
                          ))}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px]">{family}</span>
                        <span className="text-[11px] tabular-nums text-muted-foreground">{apps.length}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/70" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {starred.length > 0 && (
            <div>
              <div className="mb-3.5">
                <h2 className={SECTION}>Starred</h2>
              </div>
              <div className={GROUP}>
                <ul className="divide-y divide-border/30">
                  {starred.slice(0, 5).map(f => {
                    const Icon = getAppIcon(f.app_source);
                    return (
                      <li key={f.id}>
                        <button
                          onClick={() => { if (f.source_route) go(f.source_route); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.025]"
                        >
                          <AppTile id={f.app_source} icon={Icon} size={24} />
                          <span className="min-w-0 flex-1 truncate text-[12.5px]">{f.file_name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          <p className="px-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Office runs inside Quooro, so a document, an invoice and the client it belongs to are never in different systems.
          </p>
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

  return (
    <div className="mx-auto w-full max-w-[860px] px-5 pb-16 pt-6 sm:px-8 sm:pt-9">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[27px] font-semibold leading-none tracking-[-0.025em] sm:text-[32px]">
          Every app
        </h1>
        <p className="text-[12px] tabular-nums text-muted-foreground">
          {APPS.length} apps · {OFFICE_FAMILIES.length} families
        </p>
      </header>

      {/* Search, then the family shelves it files into. */}
      <div className={cn(PILL, 'mt-6')}>
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Find an app"
          className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
        {searching && (
          <button onClick={() => setSearch('')} className="shrink-0 text-[12px] font-medium text-primary transition-opacity hover:opacity-80">
            Clear
          </button>
        )}
      </div>

      {!searching && (
        <div className="scrollbar-none -mx-5 mt-3.5 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
          {(['All', ...OFFICE_FAMILIES] as string[]).map(f => {
            const on = family === f;
            const count = f === 'All' ? APPS.length : APPS.filter(a => identityFor(a.id).family === f).length;
            return (
              <button
                key={f}
                onClick={() => setFamily(f)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors duration-150',
                  on
                    ? 'bg-foreground/[0.08] font-semibold text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f}
                <span className="text-[10.5px] tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {pool.length === 0 ? (
        <div className="mt-7 rounded-[14px] bg-foreground/[0.025] px-6 py-14 text-center">
          <p className="text-[14px] font-medium">No app by that name</p>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">Try a shorter word, or clear the search to see all {APPS.length}.</p>
        </div>
      ) : (
        shelves.map(shelf => (
          <section key={shelf.title} className="mt-7">
            <div className="mb-3 flex items-baseline gap-2.5 px-1">
              <h2 className={SECTION}>{shelf.title}</h2>
              <span className="min-w-0 truncate text-[12px] text-muted-foreground">{shelf.note}</span>
            </div>
            <div className={GROUP}>
              <ul className="divide-y divide-border/30">
                {shelf.apps.map(app => (
                  <li key={app.id}>
                    <button
                      onClick={() => go(app.route)}
                      className="group flex w-full items-center gap-3.5 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-foreground/[0.03]"
                    >
                      <AppTile id={app.id} icon={app.icon} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-foreground">{app.name}</span>
                        <span className="block truncate text-[11.5px] text-muted-foreground">{app.desc}</span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
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

  return (
    <div className="mx-auto w-full max-w-[860px] px-5 pb-16 pt-6 sm:px-8 sm:pt-9">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[27px] font-semibold leading-none tracking-[-0.025em] sm:text-[32px]">
          Recent work
        </h1>
        <p className="text-[12px] tabular-nums text-muted-foreground">
          {shown.length} {shown.length === 1 ? 'item' : 'items'}
        </p>
      </header>

      <div className={cn(PILL, 'mt-6')}>
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your work"
          className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={() => setStarredOnly(v => !v)}
          aria-pressed={starredOnly}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] transition-colors duration-150',
            starredOnly ? 'bg-foreground/[0.08] font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Star className={cn('h-3 w-3', starredOnly && 'fill-attend text-attend')} /> Starred
        </button>
      </div>

      {loadingRecents ? (
        <div className={cn(GROUP, 'mt-7')}><SkeletonLedger rows={6} /></div>
      ) : buckets.length === 0 ? (
        <div className="mt-7 rounded-[14px] bg-foreground/[0.025] px-6 py-14 text-center">
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
          <section key={bucket.name} className="mt-7">
            <div className="mb-3 flex items-baseline gap-2.5 px-1">
              <h2 className={SECTION}>{bucket.name}</h2>
              <span className="text-[11.5px] tabular-nums text-muted-foreground">{bucket.files.length}</span>
            </div>
            <div className={GROUP}>
              <div className={cn('hidden gap-3 border-b border-border/40 px-4 py-2 sm:grid', LEDGER_COLS)}>
                <span className={LABEL}>Name</span>
                <span className={LABEL}>App</span>
                <span className={cn(LABEL, 'text-right')}>Modified</span>
              </div>
              <ul>
                {bucket.files.map(file => {
                  const Icon = getAppIcon(file.app_source);
                  const app = APPS.find(a => a.id === file.app_source);
                  return (
                    <li key={file.id} className="border-b border-border/30 last:border-b-0">
                      <button
                        onClick={() => file.source_route && go(file.source_route)}
                        className={cn('grid w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-foreground/[0.03]', LEDGER_COLS)}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <AppTile id={file.app_source} icon={Icon} size={28} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[13px] font-medium text-foreground">{file.file_name}</span>
                              {file.is_starred && <Star className="h-3 w-3 shrink-0 fill-attend text-attend" />}
                            </span>
                            <span className="block truncate text-[10.5px] text-muted-foreground sm:hidden">
                              {app?.name || file.app_source}
                            </span>
                          </span>
                        </span>
                        <span className="hidden truncate text-[12px] text-muted-foreground sm:block">
                          {app?.name || file.app_source}
                        </span>
                        <RelativeTime date={file.updated_at} className="text-right" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
