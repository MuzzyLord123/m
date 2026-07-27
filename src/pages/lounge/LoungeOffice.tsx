import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText, Sheet, Presentation, BookOpen, Cloud, Search, Plus,
  Sparkles, Palette, ArrowLeft, Home, Grid3X3,
  PenLine, FileCheck, Layout, Calculator, Timer,
  BarChart3, Lock, Bot, StickyNote, Globe,
  Briefcase, Receipt, Users, BookMarked, ClipboardList,
  TrendingUp, Clock, FileSignature, KeyRound,
  Star, ChevronRight, Zap, Activity, Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { OfficeSplash } from '@/components/splash/OfficeSplash';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { OfficeQuickActions } from '@/components/office/OfficeQuickActions';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

/* ─── App Registry ─── */
type AppItem = { id: string; name: string; desc: string; icon: any; color: string; route: string };

const APPS: AppItem[] = [
  { id: 'docs', name: 'Docs', desc: 'Word processing', icon: FileText, color: '#3b82f6', route: '/lounge/office/word-home' },
  { id: 'sheets', name: 'Sheets', desc: 'Spreadsheets', icon: Sheet, color: '#10b981', route: '/lounge/office/sheets-home' },
  { id: 'slides', name: 'Slides', desc: 'Presentations', icon: Presentation, color: '#f97316', route: '/lounge/office/powerpoint-home' },
  { id: 'notes', name: 'Notes', desc: 'Notebooks', icon: BookOpen, color: '#8b5cf6', route: '/lounge/office/onenote-home' },
  { id: 'files', name: 'Files', desc: 'Cloud storage', icon: Cloud, color: '#0ea5e9', route: '/lounge/office/onedrive' },
  { id: 'operations', name: 'Operations', desc: 'Jobs & meetings', icon: Briefcase, color: '#f97316', route: '/lounge/office/operations' },
  { id: 'invoices', name: 'Invoices', desc: 'Billing', icon: Receipt, color: '#10b981', route: '/lounge/office/invoices' },
  { id: 'accounting', name: 'Accounting', desc: 'Ledger & reports', icon: Calculator, color: '#0d9488', route: '/lounge/office/accounting' },
  { id: 'ecommerce', name: 'E-commerce', desc: 'Client sites & hosting', icon: Globe, color: '#d946ef', route: '/lounge/office/ecommerce' },

  { id: 'hr', name: 'HR', desc: 'People', icon: Users, color: '#06b6d4', route: '/lounge/office/hr' },
  { id: 'tasks', name: 'Tasks', desc: 'To-dos', icon: Layout, color: '#22c55e', route: '/lounge/office/tasks' },
  { id: 'expenses', name: 'Expenses', desc: 'Receipts', icon: Receipt, color: '#059669', route: '/lounge/office/expenses' },
  { id: 'contracts', name: 'Contracts', desc: 'CLM', icon: FileSignature, color: '#7c3aed', route: '/lounge/office/contracts' },
  { id: 'time-tracker', name: 'Time', desc: 'Billable hours', icon: Clock, color: '#e11d48', route: '/lounge/office/time-tracker' },
  { id: 'analytics', name: 'Analytics', desc: 'BI', icon: TrendingUp, color: '#6366f1', route: '/lounge/office/analytics' },
  { id: 'wiki', name: 'Wiki', desc: 'Knowledge', icon: BookMarked, color: '#a855f7', route: '/lounge/office/wiki' },
  { id: 'forms', name: 'Forms', desc: 'Surveys', icon: ClipboardList, color: '#14b8a6', route: '/lounge/office/forms-home' },
  { id: 'polls', name: 'Polls', desc: 'Voting', icon: BarChart3, color: '#6366f1', route: '/lounge/office/polls-home' },
  { id: 'pdf', name: 'PDF', desc: 'Edit & sign', icon: FileCheck, color: '#ef4444', route: '/lounge/office/pdf-home' },
  { id: 'design', name: 'Design', desc: 'Graphics', icon: Palette, color: '#06b6d4', route: '/lounge/office/design-studio' },
  { id: 'whiteboard', name: 'Whiteboard', desc: 'Sketch', icon: PenLine, color: '#ec4899', route: '/lounge/office/whiteboard-home' },
  { id: 'sticky', name: 'Sticky Wall', desc: 'Visual notes', icon: StickyNote, color: '#eab308', route: '/lounge/office/sticky-wall-home' },
  { id: 'passwords', name: 'Passwords', desc: 'Vault', icon: KeyRound, color: '#334155', route: '/lounge/office/passwords' },
  { id: 'calculator', name: 'Calculator', desc: 'Math', icon: Calculator, color: '#14b8a6', route: '/lounge/office/calculator' },
  { id: 'pomodoro', name: 'Pomodoro', desc: 'Focus', icon: Timer, color: '#f43f5e', route: '/lounge/office/pomodoro' },
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

const APP_SOURCE_COLOR: Record<string, string> = {
  docs: '#3b82f6', word: '#3b82f6', sheets: '#10b981', spreadsheet: '#10b981',
  slides: '#f97316', presentation: '#f97316',
  notes: '#8b5cf6', notebook: '#8b5cf6',
  invoices: '#10b981', invoice: '#10b981',
  pdf: '#ef4444', design: '#06b6d4', whiteboard: '#ec4899',
  wiki: '#a855f7', tasks: '#22c55e', forms: '#14b8a6',
};

function getAppIcon(source: string) {
  const key = source.toLowerCase();
  return APP_SOURCE_ICON[key] || FileText;
}
function getAppColor(source: string) {
  const key = source.toLowerCase();
  return APP_SOURCE_COLOR[key] || '#64748b';
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
      {/* ─── Left App Rail (Desktop) ─── */}
      <aside className="hidden md:flex flex-col w-[68px] border-r border-border/15 bg-card/40 backdrop-blur-2xl shrink-0">
        {/* Back button */}
        <div className="flex items-center justify-center h-[52px] border-b border-border/10">
          <button
            onClick={() => setShowExitSplash(true)}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-all duration-150"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Nav buttons */}
        <div className="flex flex-col items-center gap-1 pt-3 px-2">
          {[
            { view: 'home' as ActiveView, icon: Home, label: 'Home' },
            { view: 'apps' as ActiveView, icon: Grid3X3, label: 'Apps' },
            { view: 'recents' as ActiveView, icon: Clock, label: 'Recents' },
          ].map(nav => (
            <button
              key={nav.view}
              onClick={() => setActiveView(nav.view)}
              className={cn(
                "h-11 w-11 rounded-[13px] flex flex-col items-center justify-center gap-0.5 transition-all duration-200",
                activeView === nav.view
                  ? "bg-brand/10 text-brand shadow-glow-sm"
                  : "text-muted-foreground/40 hover:text-foreground hover:bg-accent/30"
              )}
            >
              <nav.icon className="h-[18px] w-[18px]" strokeWidth={activeView === nav.view ? 2 : 1.5} />
              <span className="text-[8px] font-semibold tracking-wide">{nav.label}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 my-3 h-px bg-border/10" />

        {/* Quick app icons */}
        <div className="flex-1 flex flex-col items-center gap-1.5 px-2 overflow-y-auto scrollbar-none">
          {APPS.slice(0, 12).map(app => (
            <button
              key={app.id}
              onClick={() => go(app.route)}
              title={app.name}
              className="group h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-110"
              style={{ background: 'transparent' }}
            >
              <div
                className="h-8 w-8 rounded-[10px] flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover:shadow-md transition-all duration-200"
                style={{ background: `linear-gradient(145deg, ${app.color}, ${app.color}bb)` }}
              >
                <app.icon className="h-4 w-4 text-white" strokeWidth={1.7} />
              </div>
            </button>
          ))}
        </div>

        {/* Settings at bottom */}
        <div className="flex items-center justify-center pb-3 pt-2">
          <button className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/30 hover:text-foreground hover:bg-accent/30 transition-all duration-150">
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ─── Mobile Top Bar ─── */}
        <header className="md:hidden shrink-0 border-b border-border/15 bg-background/70 backdrop-blur-2xl">
          <div className="flex items-center h-[52px] px-3 gap-2">
            <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs shrink-0" onClick={() => setShowExitSplash(true)}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm font-semibold text-foreground tracking-tight">Office</span>
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
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  activeView === nav.view ? "bg-primary/10 text-primary" : "text-muted-foreground/40"
                )}
              >
                <nav.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </header>

        {/* ─── Content Area ─── */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeView === 'home' && (
              <HomeView
                key="home"
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
                key="apps"
                search={search}
                setSearch={setSearch}
                filteredApps={filteredApps}
                go={go}
              />
            )}
            {activeView === 'recents' && (
              <RecentsView
                key="recents"
                search={search}
                setSearch={setSearch}
                recentFiles={filteredRecents}
                loadingRecents={loadingRecents}
                go={go}
              />
            )}
          </AnimatePresence>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10"
    >
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="pt-10 sm:pt-16 pb-6 text-center"
      >
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-[18px] bg-gradient-to-br from-brand/20 to-brand/5 mb-5 shadow-glow-sm">
          <Sparkles className="h-7 w-7 text-brand" />
        </div>
        <h1 className="text-3xl sm:text-[40px] font-display font-bold text-foreground tracking-[-0.04em] leading-[1.1]">
          Good to see you
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground/50 mt-3 font-medium max-w-md mx-auto leading-relaxed">
          What would you like to work on today?
        </p>
      </motion.div>

      {/* Search with live results dropdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="pb-8 max-w-xl mx-auto"
      >
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-4 top-[13px] h-[18px] w-[18px] text-muted-foreground/25 z-10" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search apps, documents, files…"
            className={cn(
              "pl-12 h-12 text-sm bg-card/50 border-border/15 shadow-sm focus:shadow-lg focus:border-border/30 transition-all duration-300 placeholder:text-muted-foreground/25",
              showDropdown ? "rounded-t-2xl rounded-b-none border-b-0" : "rounded-2xl"
            )}
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline px-2 py-0.5 rounded-md bg-muted/40 border border-border/15 text-[10px] text-muted-foreground/30 font-mono z-10">⌘K</kbd>

          {/* Results dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-50 bg-card border border-border/15 border-t border-t-border/10 rounded-b-2xl shadow-xl max-h-[420px] overflow-auto"
              >
                {!hasResults ? (
                  <div className="px-5 py-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/15 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground/40">No results for "{search}"</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {/* Apps Section */}
                    {matchedApps.length > 0 && (
                      <div>
                        <div className="px-4 py-2 flex items-center gap-2">
                          <Grid3X3 className="h-3 w-3 text-muted-foreground/30" />
                          <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">Apps</span>
                          <span className="text-[10px] text-muted-foreground/25">{matchedApps.length}</span>
                        </div>
                        {matchedApps.map((app) => (
                          <button
                            key={app.id}
                            onClick={() => { go(app.route); setSearch(''); setSearchFocused(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors text-left"
                          >
                            <div
                              className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0"
                              style={{ background: `linear-gradient(145deg, ${app.color}, ${app.color}bb)` }}
                            >
                              <app.icon className="h-3.5 w-3.5 text-white" strokeWidth={1.8} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-medium text-foreground block truncate">{app.name}</span>
                              <span className="text-[10px] text-muted-foreground/30">{app.desc}</span>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/15" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Documents & Files Section */}
                    {matchedFiles.length > 0 && (
                      <div>
                        {matchedApps.length > 0 && <div className="mx-4 my-1 h-px bg-border/10" />}
                        <div className="px-4 py-2 flex items-center gap-2">
                          <FileText className="h-3 w-3 text-muted-foreground/30" />
                          <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">Documents & Files</span>
                          <span className="text-[10px] text-muted-foreground/25">{matchedFiles.length}</span>
                        </div>
                        {matchedFiles.map((file) => {
                          const Icon = getAppIcon(file.app_source);
                          const color = getAppColor(file.app_source);
                          return (
                            <button
                              key={file.id}
                              onClick={() => { if (file.source_route) go(file.source_route); setSearch(''); setSearchFocused(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors text-left"
                            >
                              <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: `${color}0d` }}>
                                <Icon className="h-3.5 w-3.5" style={{ color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[13px] font-medium text-foreground block truncate">{file.file_name}</span>
                                <span className="text-[10px] text-muted-foreground/30 capitalize">
                                  {file.app_source} · {formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}
                                </span>
                              </div>
                              {file.is_starred && <Star className="h-3 w-3 text-amber-500/50 fill-amber-500/50 shrink-0" />}
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/15 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Quick Create Row */}
      {!isSearching && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="pb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-semibold text-foreground/70 tracking-[-0.01em]">Create New</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {[
                { icon: FileText, label: 'Document', color: '#3b82f6', route: '/lounge/office/word-home' },
                { icon: Sheet, label: 'Spreadsheet', color: '#10b981', route: '/lounge/office/sheets-home' },
                { icon: Presentation, label: 'Presentation', color: '#f97316', route: '/lounge/office/powerpoint-home' },
                { icon: BookOpen, label: 'Notebook', color: '#8b5cf6', route: '/lounge/office/onenote-home' },
                { icon: Receipt, label: 'Invoice', color: '#10b981', route: '/lounge/office/invoices' },
                { icon: Palette, label: 'Design', color: '#06b6d4', route: '/lounge/office/design-studio' },
              ].map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                  onClick={() => go(item.route)}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-card/40 border border-border/10 hover:border-border/25 hover:shadow-lg hover:shadow-black/[0.03] dark:hover:shadow-black/20 transition-all duration-300"
                >
                  <div
                    className="h-11 w-11 rounded-[13px] flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300"
                    style={{ background: `linear-gradient(145deg, ${item.color}, ${item.color}bb)` }}
                  >
                    <item.icon className="h-5 w-5 text-white" strokeWidth={1.7} />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground/70 tracking-[-0.01em]">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Recent Work */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="pb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-semibold text-foreground/70 tracking-[-0.01em]">Recent Work</h2>
              <button onClick={onViewRecents} className="text-[11px] font-medium text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {loadingRecents ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-card/30 animate-pulse" />
                ))}
              </div>
            ) : recentFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground/30 text-sm">
                No recent files yet. Create something to get started.
              </div>
            ) : (
              <div className="rounded-2xl border border-border/10 bg-card/30 overflow-hidden divide-y divide-border/[0.06]">
                {recentFiles.slice(0, 8).map((file, i) => {
                  const Icon = getAppIcon(file.app_source);
                  const color = getAppColor(file.app_source);
                  return (
                    <motion.button
                      key={file.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                      onClick={() => file.source_route && go(file.source_route)}
                      className="w-full flex items-center gap-3.5 px-4 sm:px-5 py-3.5 hover:bg-accent/20 transition-colors group text-left"
                    >
                      <div className="h-9 w-9 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: `${color}0d` }}>
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-foreground block truncate">{file.file_name}</span>
                        <span className="text-[10px] text-muted-foreground/35 font-medium capitalize">{file.app_source}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {file.is_starred && <Star className="h-3 w-3 text-amber-500/60 fill-amber-500/60" />}
                        <span className="text-[10px] text-muted-foreground/25 font-medium whitespace-nowrap">
                          {formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-colors" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* All Apps shortcut */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pb-10 text-center"
          >
            <button
              onClick={onViewApps}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card/50 border border-border/15 text-[12px] font-semibold text-muted-foreground/60 hover:text-foreground hover:border-border/30 hover:shadow-md transition-all duration-300"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              Browse All Apps
              <ChevronRight className="h-3 w-3" />
            </button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   APPS VIEW
   ═══════════════════════════════════════════════ */

const APP_GROUPS = [
  { title: 'Documents & Storage', icon: FileText, ids: ['docs', 'sheets', 'slides', 'notes', 'files'] },
  { title: 'Business & Operations', icon: Briefcase, ids: ['operations', 'invoices', 'accounting', 'hr', 'tasks', 'expenses', 'contracts', 'time-tracker'] },
  { title: 'Intelligence & Research', icon: TrendingUp, ids: ['analytics', 'wiki', 'forms', 'polls', 'pdf'] },
  { title: 'Creative & Visual', icon: Palette, ids: ['design', 'whiteboard', 'sticky'] },
  { title: 'Security & Utilities', icon: Lock, ids: ['passwords', 'calculator', 'pomodoro'] },
];

function AppsView({ search, setSearch, filteredApps, go }: {
  search: string; setSearch: (v: string) => void; filteredApps: AppItem[]; go: (r: string) => void;
}) {
  const groups = search.trim()
    ? [{ title: 'Search Results', icon: Search, ids: filteredApps.map(a => a.id) }]
    : APP_GROUPS;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10"
    >
      <div className="pt-8 sm:pt-10 pb-4">
        <h1 className="text-2xl sm:text-[28px] font-bold text-foreground tracking-[-0.03em]">All Apps</h1>
        <p className="text-sm text-muted-foreground/40 mt-1.5">25+ tools to run your business.</p>
      </div>

      {/* Search */}
      <div className="pb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/25" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter apps…"
            className="pl-10 h-10 text-sm bg-card/40 border-border/15 rounded-xl placeholder:text-muted-foreground/25"
          />
        </div>
      </div>

      {/* Groups */}
      {groups.map((group, gi) => {
        const apps = APPS.filter(a => group.ids.includes(a.id));
        if (apps.length === 0) return null;
        const GroupIcon = group.icon;
        return (
          <motion.section
            key={group.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: gi * 0.06 }}
            className="pb-8"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-6 w-6 rounded-lg bg-muted/40 flex items-center justify-center">
                <GroupIcon className="h-3 w-3 text-muted-foreground/50" />
              </div>
              <h2 className="text-[12px] font-semibold text-foreground/60 tracking-[-0.01em] uppercase">{group.title}</h2>
              <div className="flex-1 h-px bg-border/10" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {apps.map((app, i) => (
                <motion.button
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: gi * 0.06 + i * 0.03 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  onClick={() => go(app.route)}
                  className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-2xl bg-card/40 border border-border/10 hover:border-border/25 hover:shadow-lg hover:shadow-black/[0.03] dark:hover:shadow-black/20 transition-all duration-300"
                >
                  <div
                    className="h-11 w-11 sm:h-12 sm:w-12 rounded-[14px] flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-[1.06] transition-all duration-300"
                    style={{ background: `linear-gradient(145deg, ${app.color}, ${app.color}bb)` }}
                  >
                    <app.icon className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" strokeWidth={1.7} />
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <span className="text-[12px] sm:text-[13px] font-semibold text-foreground block tracking-[-0.02em] truncate">{app.name}</span>
                    <span className="text-[10px] text-muted-foreground/35 font-medium hidden sm:block">{app.desc}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>
        );
      })}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   RECENTS VIEW
   ═══════════════════════════════════════════════ */

function RecentsView({ search, setSearch, recentFiles, loadingRecents, go }: {
  search: string; setSearch: (v: string) => void; recentFiles: RecentFile[]; loadingRecents: boolean; go: (r: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10"
    >
      <div className="pt-8 sm:pt-10 pb-4">
        <h1 className="text-2xl sm:text-[28px] font-bold text-foreground tracking-[-0.03em]">Recent Work</h1>
        <p className="text-sm text-muted-foreground/40 mt-1.5">All your recent activity across every app.</p>
      </div>

      {/* Search */}
      <div className="pb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/25" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recent files…"
            className="pl-10 h-10 text-sm bg-card/40 border-border/15 rounded-xl placeholder:text-muted-foreground/25"
          />
        </div>
      </div>

      {loadingRecents ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 rounded-xl bg-card/20 animate-pulse" />
          ))}
        </div>
      ) : recentFiles.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="h-10 w-10 text-muted-foreground/15 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground/30">
            {search.trim() ? 'No files match your search.' : 'No recent activity yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/10 bg-card/25 overflow-hidden divide-y divide-border/[0.06]">
          {recentFiles.map((file, i) => {
            const Icon = getAppIcon(file.app_source);
            const color = getAppColor(file.app_source);
            return (
              <motion.button
                key={file.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => file.source_route && go(file.source_route)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/15 transition-colors group text-left"
              >
                <div className="h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: `${color}0d` }}>
                  <Icon className="h-[18px] w-[18px]" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-foreground block truncate tracking-[-0.01em]">{file.file_name}</span>
                  <span className="text-[11px] text-muted-foreground/30 font-medium capitalize">{file.app_source} · {formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {file.is_starred && <Star className="h-3.5 w-3.5 text-amber-500/50 fill-amber-500/50" />}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
