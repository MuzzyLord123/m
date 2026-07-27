import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Cloud, ArrowLeft, Search, Upload, FolderPlus, Grid3X3, List,
  FileText, Sheet, Presentation, BookOpen, Image, File, MoreHorizontal,
  Trash2, Download, Star, StarOff, Clock, HardDrive, Users, Trash,
  SortAsc, SortDesc, ChevronDown, Plus, Edit3, ExternalLink,
  LayoutGrid, Filter, Hash, Layers, FolderOpen, Sparkles, Activity,
  ShieldCheck, PenTool, Globe, FileCode, Palette, Frame, ClipboardList,
  BarChart3, FolderInput, Receipt, Menu, X
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import VaultContent from '@/components/vault/VaultContent';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// Unified file type across all Quooro apps
interface UnifiedFile {
  id: string;
  name: string;
  type: 'document' | 'spreadsheet' | 'presentation' | 'notebook' | 'image' | 'file' | 'folder' | 'website' | 'cad_project' | 'pdf' | 'design' | 'whiteboard' | 'poll' | 'task';
  app: string;
  size?: string;
  meta?: string;
  modified: Date;
  created: Date;
  starred: boolean;
  route?: string;
  color?: string;
  sourceId?: string;
  folderPath?: string;
  isPlatformFile?: boolean; // from platform_files table
  platformFileId?: string;
}

const APP_META: Record<string, { icon: any; label: string; color: string; bg: string; gradient: string; openLabel: string }> = {
  docs:           { icon: FileText,       label: 'Docs',       color: 'text-blue-500',    bg: 'bg-blue-500/10',    gradient: 'from-blue-500 to-indigo-600',    openLabel: 'Open in Docs' },
  sheets:         { icon: Sheet,          label: 'Sheets',     color: 'text-emerald-500', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500 to-teal-600',    openLabel: 'Open in Sheets' },
  slides:         { icon: Presentation,   label: 'Slides',     color: 'text-orange-500',  bg: 'bg-orange-500/10',  gradient: 'from-orange-500 to-rose-600',    openLabel: 'Open in Slides' },
  notes:          { icon: BookOpen,       label: 'Notes',      color: 'text-violet-500',  bg: 'bg-violet-500/10',  gradient: 'from-violet-500 to-purple-600',  openLabel: 'Open in Notes' },
  files:          { icon: File,           label: 'Files',      color: 'text-muted-foreground', bg: 'bg-muted/50', gradient: 'from-slate-400 to-slate-500',     openLabel: 'Open' },
  workshop:       { icon: Globe,          label: 'Workshop',   color: 'text-sky-500',     bg: 'bg-sky-500/10',     gradient: 'from-sky-500 to-blue-600',       openLabel: 'Open in Workshop' },
  'cad-studio':   { icon: PenTool,        label: 'CAD',        color: 'text-cyan-500',    bg: 'bg-cyan-500/10',    gradient: 'from-cyan-500 to-teal-600',      openLabel: 'Open in CAD Studio' },
  'pdf-studio':   { icon: FileCode,       label: 'PDF',        color: 'text-red-500',     bg: 'bg-red-500/10',     gradient: 'from-red-500 to-rose-600',       openLabel: 'Open in PDF Studio' },
  'design-studio':{ icon: Palette,        label: 'Design',     color: 'text-pink-500',    bg: 'bg-pink-500/10',    gradient: 'from-pink-500 to-fuchsia-600',   openLabel: 'Open in Design Studio' },
  whiteboard:     { icon: Frame,          label: 'Whiteboard', color: 'text-amber-500',   bg: 'bg-amber-500/10',   gradient: 'from-amber-500 to-orange-600',   openLabel: 'Open in Whiteboard' },
  polls:          { icon: BarChart3,      label: 'Polls',      color: 'text-indigo-500',  bg: 'bg-indigo-500/10',  gradient: 'from-indigo-500 to-violet-600',  openLabel: 'Open in Polls' },
  tasks:          { icon: ClipboardList,  label: 'Tasks',      color: 'text-teal-500',    bg: 'bg-teal-500/10',    gradient: 'from-teal-500 to-emerald-600',   openLabel: 'Open in Tasks' },
  invoices:       { icon: Receipt,        label: 'Invoices',   color: 'text-green-500',   bg: 'bg-green-500/10',   gradient: 'from-green-500 to-emerald-600',  openLabel: 'Open in Invoices' },
};

const NAV_ITEMS = [
  { id: 'all',       label: 'All files',       icon: HardDrive },
  { id: 'recent',    label: 'Recent',          icon: Clock },
  { id: 'starred',   label: 'Starred',         icon: Star },
  { id: 'docs',      label: 'Documents',       icon: FileText },
  { id: 'sheets',    label: 'Spreadsheets',    icon: Sheet },
  { id: 'slides',    label: 'Presentations',   icon: Presentation },
  { id: 'notes',     label: 'Notebooks',       icon: BookOpen },
  { id: 'workshop',  label: 'Websites',        icon: Globe },
  { id: 'cad-studio',label: 'CAD Projects',    icon: PenTool },
  { id: 'pdf-studio',label: 'PDFs',            icon: FileCode },
  { id: 'design-studio', label: 'Designs',     icon: Palette },
  { id: 'invoices',  label: 'Invoices',        icon: Receipt },
  { id: 'vault',     label: 'Secure Vault',    icon: ShieldCheck },
];

// Demo data
const DEMO_FILES: UnifiedFile[] = [
  { id: 'demo-slide-1', name: 'Q4 Business Review', type: 'presentation', app: 'slides', meta: '18 slides', modified: new Date(2026, 1, 22), created: new Date(2026, 1, 15), starred: true, route: '/lounge/office/slides/edit' },
  { id: 'demo-slide-2', name: 'Product Launch Deck', type: 'presentation', app: 'slides', meta: '24 slides', modified: new Date(2026, 1, 21), created: new Date(2026, 1, 10), starred: false, route: '/lounge/office/slides/edit' },
  { id: 'demo-sheet-1', name: 'Budget 2026', type: 'spreadsheet', app: 'sheets', meta: '3 sheets', modified: new Date(2026, 1, 20), created: new Date(2026, 1, 5), starred: false, route: '/lounge/office/excel-home' },
  { id: 'demo-note-1', name: 'Quick Notes', type: 'notebook', app: 'notes', meta: '3 sections', modified: new Date(2026, 1, 22), created: new Date(2026, 1, 1), starred: false, route: '/lounge/office/onenote-home' },
];

type SortField = 'modified' | 'created' | 'name' | 'app';
type ViewMode = 'grid' | 'list';

export default function OfficeOneDrive() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [dbDocs, setDbDocs] = useState<UnifiedFile[]>([]);
  const [platformFiles, setPlatformFiles] = useState<UnifiedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeNav, setActiveNav] = useState('all');
  const [sortField, setSortField] = useState<SortField>('modified');
  const [sortAsc, setSortAsc] = useState(false);
  const [localStars, setLocalStars] = useState<Record<string, boolean>>({});
  const [showSidebar, setShowSidebar] = useState(false);

  // Fetch real documents from DB + platform files
  useEffect(() => {
    const fetchAll = async () => {
      if (!user) { setLoading(false); return; }

      // Fetch office documents
      const { data: docs } = await supabase
        .from('office_documents')
        .select('id, title, document_type, word_count, is_starred, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (docs) {
        setDbDocs(docs.map(d => ({
          id: d.id,
          name: d.title,
          type: 'document' as const,
          app: 'docs',
          meta: `${d.word_count.toLocaleString()} words`,
          modified: new Date(d.updated_at),
          created: new Date(d.created_at),
          starred: d.is_starred,
          route: `/lounge/office/word/${d.id}`,
        })));
      }

      // Fetch platform files (cross-app)
      const { data: pFiles } = await supabase
        .from('platform_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_trashed', false)
        .order('updated_at', { ascending: false });

      if (pFiles) {
        setPlatformFiles(pFiles.map((f: any) => ({
          id: `pf-${f.id}`,
          platformFileId: f.id,
          name: f.file_name,
          type: f.file_type as any,
          app: f.app_source,
          meta: f.metadata?.meta || '',
          modified: new Date(f.updated_at),
          created: new Date(f.created_at),
          starred: f.is_starred,
          route: f.source_route,
          sourceId: f.source_id,
          folderPath: f.folder_path,
          isPlatformFile: true,
        })));
      }

      setLoading(false);
    };
    fetchAll();
  }, [user]);

  // Merge all files
  const allFiles = useMemo(() => {
    return [...dbDocs, ...platformFiles, ...DEMO_FILES].map(f => ({
      ...f,
      starred: localStars[f.id] !== undefined ? localStars[f.id] : f.starred,
    }));
  }, [dbDocs, platformFiles, localStars]);

  // Filter
  const filtered = useMemo(() => {
    let items = [...allFiles];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(f => f.name.toLowerCase().includes(q) || f.app.includes(q));
    }
    if (activeNav === 'starred') items = items.filter(f => f.starred);
    else if (activeNav === 'recent') items = items.filter(f => Date.now() - f.modified.getTime() < 7 * 24 * 60 * 60 * 1000);
    else if (activeNav !== 'all' && activeNav !== 'vault') items = items.filter(f => f.app === activeNav);

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'app') cmp = a.app.localeCompare(b.app);
      else if (sortField === 'created') cmp = a.created.getTime() - b.created.getTime();
      else cmp = a.modified.getTime() - b.modified.getTime();
      return sortAsc ? cmp : -cmp;
    });
    return items;
  }, [allFiles, search, activeNav, sortField, sortAsc]);

  const toggleStar = async (file: UnifiedFile) => {
    const newVal = !file.starred;
    setLocalStars(prev => ({ ...prev, [file.id]: newVal }));
    if (file.isPlatformFile && file.platformFileId) {
      await supabase.from('platform_files').update({ is_starred: newVal }).eq('id', file.platformFileId);
    } else if (!file.id.startsWith('demo-')) {
      await supabase.from('office_documents').update({ is_starred: newVal }).eq('id', file.id);
    }
  };

  const openFile = (file: UnifiedFile) => {
    if (file.route) navigate(file.route);
  };

  const moveToVault = (file: UnifiedFile) => {
    toast.success(`"${file.name}" moved to Secure Vault`);
  };

  const trashFile = async (file: UnifiedFile) => {
    if (file.isPlatformFile && file.platformFileId) {
      await supabase.from('platform_files').update({ is_trashed: true, trashed_at: new Date().toISOString() }).eq('id', file.platformFileId);
      setPlatformFiles(prev => prev.filter(f => f.platformFileId !== file.platformFileId));
      toast.success(`"${file.name}" moved to trash`);
    }
  };

  const quickCreate = async (app: string) => {
    if (app === 'docs' && user) {
      const { data } = await supabase
        .from('office_documents')
        .insert({ user_id: user.id, title: 'Untitled Document', document_type: 'word' })
        .select('id').single();
      if (data) navigate(`/lounge/office/word/${data.id}`);
    } else if (app === 'slides') navigate('/lounge/office/slides/edit');
    else if (app === 'sheets') navigate('/lounge/office/excel-home');
    else if (app === 'notes') navigate('/lounge/office/onenote-home');
  };

  const stats = useMemo(() => ({
    total: allFiles.length,
    docs: allFiles.filter(f => f.app === 'docs').length,
    slides: allFiles.filter(f => f.app === 'slides').length,
    sheets: allFiles.filter(f => f.app === 'sheets').length,
    notes: allFiles.filter(f => f.app === 'notes').length,
    starred: allFiles.filter(f => f.starred).length,
    websites: allFiles.filter(f => f.app === 'workshop').length,
    cad: allFiles.filter(f => f.app === 'cad-studio').length,
    pdf: allFiles.filter(f => f.app === 'pdf-studio').length,
    design: allFiles.filter(f => f.app === 'design-studio').length,
  }), [allFiles]);

  const getMeta = (app: string) => APP_META[app] || APP_META.files;

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    if (isMobile) setShowSidebar(false);
  };

  const sidebarContent = (
    <div className={cn("flex flex-col bg-card/20 backdrop-blur-sm overflow-auto", isMobile ? "flex-1" : "w-52 border-r border-border/20 shrink-0 p-2 space-y-0.5")}>
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
          <span className="text-sm font-bold">Categories</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setShowSidebar(false)}><X className="h-4 w-4" /></Button>
        </div>
      )}
      <div className={cn(isMobile ? "p-2 space-y-0.5" : "")}>
        {NAV_ITEMS.map(item => {
          if (item.id === 'vault') {
            return (
              <button key={item.id} onClick={() => handleNavClick('vault')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all",
                  activeNav === 'vault' ? "bg-accent/60 shadow-sm" : "hover:bg-accent/30",
                  isMobile && "py-3"
                )}>
                <item.icon className={cn("h-4 w-4", activeNav === 'vault' ? 'text-foreground' : 'text-muted-foreground')} />
                <span className={cn("text-xs font-medium flex-1", activeNav === 'vault' ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
              </button>
            );
          }
          const count = item.id === 'all' ? stats.total
            : item.id === 'recent' ? allFiles.filter(f => Date.now() - f.modified.getTime() < 7 * 24 * 60 * 60 * 1000).length
            : item.id === 'starred' ? stats.starred
            : allFiles.filter(f => f.app === item.id).length;
          return (
            <button key={item.id} onClick={() => handleNavClick(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all",
                activeNav === item.id ? "bg-accent/60 shadow-sm" : "hover:bg-accent/30",
                isMobile && "py-3"
              )}>
              <item.icon className={cn("h-4 w-4", activeNav === item.id ? 'text-foreground' : 'text-muted-foreground')} />
              <span className={cn("text-xs font-medium flex-1", activeNav === item.id ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
              {count > 0 && <span className="text-[10px] text-muted-foreground/60 tabular-nums bg-muted/50 px-1.5 py-0.5 rounded-md">{count}</span>}
            </button>
          );
        })}

        {/* Storage */}
        <div className="pt-6 px-3">
          <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-2">Storage</div>
          <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500" style={{ width: `${Math.min(100, (stats.total / 50) * 100)}%` }} />
          </div>
          <span className="text-[9px] text-muted-foreground/50 mt-1 block">{stats.total} files</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600/8 via-cyan-500/5 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="relative px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {isMobile && (
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setShowSidebar(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-[14px] bg-gradient-to-br from-sky-500 to-cyan-700 flex items-center justify-center shadow-lg shadow-sky-500/25">
                <Cloud className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Files</h1>
                <p className="text-[10px] text-muted-foreground hidden sm:block">All your work across the entire platform</p>
              </div>
            </div>

            {/* Quick Create */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5 rounded-xl shadow-sm font-semibold bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white border-0">
                  <Plus className="h-3.5 w-3.5" /> {!isMobile && 'New'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl w-48" align="end">
                {['docs', 'sheets', 'slides', 'notes'].map(key => {
                  const m = getMeta(key);
                  return (
                    <DropdownMenuItem key={key} onClick={() => quickCreate(key)} className="text-xs gap-2.5">
                      <div className={cn("h-5 w-5 rounded-md flex items-center justify-center", m.bg)}>
                        <m.icon className={cn("h-3 w-3", m.color)} />
                      </div>
                      New {m.label.replace(/s$/, '')}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats — scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {[
              { label: 'Total', value: stats.total, icon: Layers, color: 'text-sky-500' },
              { label: 'Docs', value: stats.docs, icon: FileText, color: 'text-blue-500' },
              { label: 'Websites', value: stats.websites, icon: Globe, color: 'text-sky-500' },
              { label: 'CAD', value: stats.cad, icon: PenTool, color: 'text-cyan-500' },
              { label: 'Starred', value: stats.starred, icon: Star, color: 'text-amber-500' },
            ].map(s => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/70 backdrop-blur-sm border border-border/20 shrink-0">
                <s.icon className={cn("h-3 w-3", s.color)} />
                <span className="text-[10px] font-semibold text-foreground tabular-nums">{s.value}</span>
                <span className="text-[9px] text-muted-foreground">{s.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Mobile: active category pill + nav label */}
          {isMobile && (
            <button onClick={() => setShowSidebar(true)} className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/40 border border-border/20 w-full">
              {(() => { const navItem = NAV_ITEMS.find(n => n.id === activeNav); return navItem ? <navItem.icon className="h-3.5 w-3.5 text-foreground" /> : null; })()}
              <span className="text-xs font-semibold text-foreground">{NAV_ITEMS.find(n => n.id === activeNav)?.label || 'All files'}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        {!isMobile && sidebarContent}

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {isMobile && showSidebar && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
              <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="fixed inset-y-0 left-0 z-50 w-[280px] bg-card border-r border-border flex flex-col shadow-2xl">
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Content area */}
        {activeNav === 'vault' ? (
          <div className="flex-1 overflow-auto">
            <VaultContent />
          </div>
        ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search & controls */}
          <div className="px-4 sm:px-6 py-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all files…"
                className="pl-9 h-9 text-xs bg-card/60 border-border/30 rounded-xl" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 text-[10px] gap-1 rounded-xl shrink-0">
                  {sortAsc ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                  {!isMobile && 'Sort'} <ChevronDown className="h-2.5 w-2.5 opacity-40" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl w-44">
                {[
                  { field: 'modified' as SortField, label: 'Last Modified' },
                  { field: 'created' as SortField, label: 'Date Created' },
                  { field: 'name' as SortField, label: 'Name' },
                  { field: 'app' as SortField, label: 'App Type' },
                ].map(s => (
                  <DropdownMenuItem key={s.field} onClick={() => { if (sortField === s.field) setSortAsc(!sortAsc); else { setSortField(s.field); setSortAsc(false); } }}
                    className={cn("text-xs", sortField === s.field && "font-semibold")}>
                    {s.label} {sortField === s.field && (sortAsc ? '↑' : '↓')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-0.5 bg-secondary/40 rounded-xl p-0.5 border border-border/20 shrink-0">
              <button onClick={() => setViewMode('grid')} className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all", viewMode === 'grid' ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all", viewMode === 'list' ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-auto px-4 sm:px-6 pb-6">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 rounded-xl bg-secondary/20 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-sky-500/40" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">No files found</h3>
                <p className="text-xs text-muted-foreground mb-4">Save work from any app to see it here</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="rounded-xl border border-border/30 overflow-hidden bg-card/40 backdrop-blur-sm">
                {/* Header row — hide extra cols on mobile */}
                <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border/20">
                  <span className="flex-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">Name</span>
                  <span className="w-20 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider text-center hidden sm:block">Source</span>
                  <span className="w-20 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider text-right hidden md:block">Details</span>
                  <span className="w-24 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider text-right hidden sm:block">Modified</span>
                  <span className="w-8 sm:w-28" />
                </div>
                {filtered.map((file, i) => {
                  const meta = getMeta(file.app);
                  return (
                    <motion.div key={file.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                      onClick={() => openFile(file)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 hover:bg-accent/40 cursor-pointer group transition-all",
                        i > 0 && "border-t border-border/15"
                      )}>
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", meta.bg)}>
                        <meta.icon className={cn("h-4 w-4", meta.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate block">{file.name}</span>
                        {/* Mobile: show source + time inline */}
                        {isMobile && (
                          <span className="text-[10px] text-muted-foreground/50 mt-0.5 block">
                            {meta.label} · {formatDistanceToNow(file.modified, { addSuffix: true })}
                          </span>
                        )}
                        {!isMobile && file.folderPath && file.folderPath !== '/' && (
                          <span className="text-[9px] text-muted-foreground/40">{file.folderPath}</span>
                        )}
                      </div>

                      <div className="w-20 justify-center hidden sm:flex">
                        <span className={cn("text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md", meta.bg, meta.color)}>
                          {meta.label}
                        </span>
                      </div>

                      <span className="w-20 text-[10px] text-muted-foreground/60 text-right hidden md:block">{file.meta || '—'}</span>
                      <span className="w-24 text-[10px] text-muted-foreground/60 text-right hidden sm:block">
                        {formatDistanceToNow(file.modified, { addSuffix: true })}
                      </span>

                      {/* Actions */}
                      <div className={cn("flex items-center justify-end gap-0.5 shrink-0", isMobile ? "w-8" : "w-28 opacity-0 group-hover:opacity-100 transition-opacity")}>
                        {!isMobile && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={e => { e.stopPropagation(); toggleStar(file); }}>
                            {file.starred ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : <StarOff className="h-3 w-3 text-muted-foreground/40" />}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={e => e.stopPropagation()}>
                              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-xl w-52" align="end">
                            {file.route && (
                              <DropdownMenuItem onClick={() => openFile(file)} className="text-xs gap-2.5 font-medium">
                                <ExternalLink className="h-3.5 w-3.5" />
                                {meta.openLabel}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleStar(file)} className="text-xs gap-2.5">
                              {file.starred ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                              {file.starred ? 'Remove star' : 'Add star'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => moveToVault(file)} className="text-xs gap-2.5">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Move to Vault
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {file.isPlatformFile && (
                              <DropdownMenuItem onClick={() => trashFile(file)} className="text-xs gap-2.5 text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                                Move to Trash
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Grid View */
              <div className={cn("grid gap-3", isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5")}>
                {filtered.map((file, i) => {
                  const meta = getMeta(file.app);
                  return (
                    <motion.div key={file.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                      onClick={() => openFile(file)}
                      className="group cursor-pointer rounded-xl border border-border/30 bg-card/50 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 hover:border-border/40 transition-all">
                      <div className={cn("aspect-[4/3] flex items-center justify-center relative overflow-hidden", meta.bg.replace('/10', '/5'))}>
                        <div className={cn("h-12 w-12 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/20 flex items-center justify-center group-hover:scale-110 transition-transform", meta.bg)}>
                          <meta.icon className={cn("h-6 w-6", meta.color)} />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/90 text-black text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-lg">
                            <Edit3 className="h-3 w-3" /> {meta.openLabel}
                          </div>
                        </div>
                        {file.starred && (
                          <div className="absolute top-2 right-2">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 drop-shadow-sm" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-black/40 hover:bg-black/60 text-white" onClick={e => e.stopPropagation()}>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-xl w-52">
                              {file.route && (
                                <DropdownMenuItem onClick={() => openFile(file)} className="text-xs gap-2.5 font-medium">
                                  <ExternalLink className="h-3.5 w-3.5" /> {meta.openLabel}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleStar(file)} className="text-xs gap-2.5">
                                {file.starred ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                                {file.starred ? 'Remove star' : 'Add star'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => moveToVault(file)} className="text-xs gap-2.5">
                                <ShieldCheck className="h-3.5 w-3.5" /> Move to Vault
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {file.isPlatformFile && (
                                <DropdownMenuItem onClick={() => trashFile(file)} className="text-xs gap-2.5 text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" /> Move to Trash
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="p-3 border-t border-border/20">
                        <h3 className="text-[11px] font-semibold text-foreground truncate">{file.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className={cn("text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md", meta.bg, meta.color)}>
                            {meta.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground/50">{file.meta}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/40 mt-1 block">
                          {formatDistanceToNow(file.modified, { addSuffix: true })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
