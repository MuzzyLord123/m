import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Cloud, ArrowLeft, Search, List,
  FileText, Sheet, Presentation, BookOpen, File, MoreHorizontal,
  Trash2, Star, StarOff, Clock, HardDrive,
  SortAsc, SortDesc, ChevronDown, Plus, ExternalLink,
  LayoutGrid, ShieldCheck, PenTool, Globe, FileCode, Palette, Frame, ClipboardList,
  BarChart3, Receipt, Menu, X
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import VaultContent from '@/components/vault/VaultContent';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageHeader, EmptyState, RelativeTime, SkeletonLedger, FIELD } from '@/components/platform';

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

const APP_META: Record<string, { icon: any; label: string; openLabel: string }> = {
  docs:           { icon: FileText,       label: 'Docs',       openLabel: 'Open in Docs' },
  sheets:         { icon: Sheet,          label: 'Sheets',     openLabel: 'Open in Sheets' },
  slides:         { icon: Presentation,   label: 'Slides',     openLabel: 'Open in Slides' },
  notes:          { icon: BookOpen,       label: 'Notes',      openLabel: 'Open in Notes' },
  files:          { icon: File,           label: 'Files',      openLabel: 'Open' },
  workshop:       { icon: Globe,          label: 'Workshop',   openLabel: 'Open in Workshop' },
  'cad-studio':   { icon: PenTool,        label: 'CAD',        openLabel: 'Open in CAD Studio' },
  'pdf-studio':   { icon: FileCode,       label: 'PDF',        openLabel: 'Open in PDF Studio' },
  'design-studio':{ icon: Palette,        label: 'Design',     openLabel: 'Open in Design Studio' },
  whiteboard:     { icon: Frame,          label: 'Whiteboard', openLabel: 'Open in Whiteboard' },
  polls:          { icon: BarChart3,      label: 'Polls',      openLabel: 'Open in Polls' },
  tasks:          { icon: ClipboardList,  label: 'Tasks',      openLabel: 'Open in Tasks' },
  invoices:       { icon: Receipt,        label: 'Invoices',   openLabel: 'Open in Invoices' },
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
  { id: 'cad-studio',label: 'CAD projects',    icon: PenTool },
  { id: 'pdf-studio',label: 'PDFs',            icon: FileCode },
  { id: 'design-studio', label: 'Designs',     icon: Palette },
  { id: 'invoices',  label: 'Invoices',        icon: Receipt },
  { id: 'vault',     label: 'Secure vault',    icon: ShieldCheck },
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
    <div className={cn('flex flex-col bg-card overflow-auto', isMobile ? 'flex-1' : 'w-52 border-r border-border/60 shrink-0 p-2 space-y-0.5')}>
      {isMobile && (
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Categories</span>
          <Button variant="ghost" size="icon" aria-label="Close" className="h-8 w-8 rounded-lg" onClick={() => setShowSidebar(false)}><X className="h-4 w-4" /></Button>
        </div>
      )}
      <div className={cn(isMobile ? 'p-2 space-y-0.5' : '')}>
        {NAV_ITEMS.map(item => {
          if (item.id === 'vault') {
            return (
              <button key={item.id} onClick={() => handleNavClick('vault')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors duration-150',
                  activeNav === 'vault' ? 'bg-foreground/[0.05]' : 'hover:bg-foreground/[0.025]',
                  isMobile && 'py-3'
                )}>
                <item.icon className={cn('h-4 w-4', activeNav === 'vault' ? 'text-foreground' : 'text-muted-foreground')} strokeWidth={1.7} />
                <span className={cn('text-xs font-medium flex-1', activeNav === 'vault' ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
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
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors duration-150',
                activeNav === item.id ? 'bg-foreground/[0.05]' : 'hover:bg-foreground/[0.025]',
                isMobile && 'py-3'
              )}>
              <item.icon className={cn('h-4 w-4', activeNav === item.id ? 'text-foreground' : 'text-muted-foreground')} strokeWidth={1.7} />
              <span className={cn('text-xs font-medium flex-1', activeNav === item.id ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
              {count > 0 && <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">{count}</span>}
            </button>
          );
        })}

        {/* Storage */}
        <div className="px-3 pt-6">
          <div className="mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Storage</div>
          <div className="h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (stats.total / 50) * 100)}%` }} />
          </div>
          <span className="mt-1.5 block font-mono text-[9px] tabular-nums text-muted-foreground">{stats.total} files</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border/60">
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" aria-label="Back to Office" className="mt-0.5 h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {isMobile && (
              <Button variant="ghost" size="icon" aria-label="Categories" className="mt-0.5 h-8 w-8 shrink-0 rounded-lg" onClick={() => setShowSidebar(true)}>
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <PageHeader
              className="min-w-0 flex-1"
              kicker="Quooro Office · Files"
              title="Files"
              description="All your work across the platform"
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs">
                      <Plus className="h-3.5 w-3.5" /> New
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 rounded-[10px]" align="end">
                    {['docs', 'sheets', 'slides', 'notes'].map(key => {
                      const m = getMeta(key);
                      return (
                        <DropdownMenuItem key={key} onClick={() => quickCreate(key)} className="gap-2.5 text-xs">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-foreground/[0.04]">
                            <m.icon className="h-3 w-3 text-ink-2" />
                          </span>
                          New {m.label.replace(/s$/, '')}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          </div>

          {/* Fact line */}
          <div className="mt-3 flex items-center gap-x-4 gap-y-1 overflow-x-auto scrollbar-none font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
            <span className="shrink-0 tabular-nums">{stats.total} files</span>
            <span className="shrink-0 tabular-nums">{stats.docs} docs</span>
            <span className="shrink-0 tabular-nums">{stats.websites} websites</span>
            <span className="shrink-0 tabular-nums">{stats.cad} CAD</span>
            <span className="shrink-0 tabular-nums">{stats.starred} starred</span>
          </div>

          {/* Mobile: active category */}
          {isMobile && (
            <button onClick={() => setShowSidebar(true)} className="mt-2.5 flex w-full items-center gap-2 rounded-[10px] border border-border/60 bg-card px-3 py-2 transition-colors duration-150 hover:bg-foreground/[0.025]">
              {(() => { const navItem = NAV_ITEMS.find(n => n.id === activeNav); return navItem ? <navItem.icon className="h-3.5 w-3.5 text-ink-2" /> : null; })()}
              <span className="text-xs font-medium text-foreground">{NAV_ITEMS.find(n => n.id === activeNav)?.label || 'All files'}</span>
              <ChevronDown className="ml-auto h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        {!isMobile && sidebarContent}

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {isMobile && showSidebar && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-background/60" onClick={() => setShowSidebar(false)} />
              <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
                className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-card">
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
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Search & controls */}
          <div className="flex items-center gap-2 px-4 py-2.5 sm:px-6">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all files"
                className={cn(FIELD, 'h-9 pl-9 text-xs')} />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 shrink-0 gap-1 rounded-lg text-[11px]">
                  {sortAsc ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                  {!isMobile && 'Sort'} <ChevronDown className="h-2.5 w-2.5 opacity-40" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 rounded-[10px]">
                {[
                  { field: 'modified' as SortField, label: 'Last modified' },
                  { field: 'created' as SortField, label: 'Date created' },
                  { field: 'name' as SortField, label: 'Name' },
                  { field: 'app' as SortField, label: 'App type' },
                ].map(s => (
                  <DropdownMenuItem key={s.field} onClick={() => { if (sortField === s.field) setSortAsc(!sortAsc); else { setSortField(s.field); setSortAsc(false); } }}
                    className={cn('text-xs', sortField === s.field && 'font-semibold')}>
                    {s.label} {sortField === s.field && (sortAsc ? '↑' : '↓')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
              <button aria-label="Grid view" onClick={() => setViewMode('grid')} className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150', viewMode === 'grid' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button aria-label="List view" onClick={() => setViewMode('list')} className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150', viewMode === 'list' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-auto px-4 pb-6 sm:px-6">
            {loading ? (
              <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
                <SkeletonLedger rows={5} />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No files found"
                body="Save work from any app to see it here."
              />
            ) : viewMode === 'list' ? (
              <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
                {/* Header row — hide extra cols on mobile */}
                <div className="flex items-center gap-3 border-b border-border/60 bg-sunken px-4 py-2">
                  <span className="flex-1 font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">Name</span>
                  <span className="hidden w-20 text-center font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground sm:block">Source</span>
                  <span className="hidden w-20 text-right font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground md:block">Details</span>
                  <span className="hidden w-24 text-right font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground sm:block">Modified</span>
                  <span className="w-8 sm:w-28" />
                </div>
                {filtered.map((file, i) => {
                  const meta = getMeta(file.app);
                  return (
                    <div key={file.id}
                      onClick={() => openFile(file)}
                      className={cn(
                        'group flex h-11 cursor-pointer items-center gap-3 px-4 transition-colors duration-150 hover:bg-foreground/[0.025]',
                        i > 0 && 'border-t border-border/60'
                      )}>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                        <meta.icon className="h-3.5 w-3.5 text-ink-2" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-[450] text-foreground">{file.name}</span>
                        {/* Mobile: show source + time inline */}
                        {isMobile && (
                          <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                            {meta.label} · <RelativeTime date={file.modified} className="text-[10px]" />
                          </span>
                        )}
                        {!isMobile && file.folderPath && file.folderPath !== '/' && (
                          <span className="font-mono text-[9px] text-muted-foreground/60">{file.folderPath}</span>
                        )}
                      </div>

                      <div className="hidden w-20 justify-center sm:flex">
                        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                          {meta.label}
                        </span>
                      </div>

                      <span className="hidden w-20 text-right font-mono text-[10px] tabular-nums text-muted-foreground md:block">{file.meta || '–'}</span>
                      <span className="hidden w-24 text-right sm:block">
                        <RelativeTime date={file.modified} />
                      </span>

                      {/* Actions */}
                      <div className={cn('flex shrink-0 items-center justify-end gap-0.5', isMobile ? 'w-8' : 'w-28 opacity-0 transition-opacity duration-150 group-hover:opacity-100')}>
                        {!isMobile && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={e => { e.stopPropagation(); toggleStar(file); }}>
                            {file.starred ? <Star className="h-3.5 w-3.5 fill-gold text-gold" /> : <StarOff className="h-3 w-3 text-muted-foreground/40" />}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={e => e.stopPropagation()}>
                              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-52 rounded-[10px]" align="end">
                            {file.route && (
                              <DropdownMenuItem onClick={() => openFile(file)} className="gap-2.5 text-xs font-medium">
                                <ExternalLink className="h-3.5 w-3.5" />
                                {meta.openLabel}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleStar(file)} className="gap-2.5 text-xs">
                              {file.starred ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                              {file.starred ? 'Remove star' : 'Add star'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => moveToVault(file)} className="gap-2.5 text-xs">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Move to vault
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {file.isPlatformFile && (
                              <DropdownMenuItem onClick={() => trashFile(file)} className="gap-2.5 text-xs text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                                Move to trash
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Grid View */
              <div className={cn('grid gap-2.5', isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5')}>
                {filtered.map((file) => {
                  const meta = getMeta(file.app);
                  return (
                    <div key={file.id}
                      onClick={() => openFile(file)}
                      className="group cursor-pointer overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:border-border">
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-sunken/50">
                        <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-foreground/[0.04]">
                          <meta.icon className="h-5 w-5 text-ink-2" strokeWidth={1.7} />
                        </span>
                        {file.starred && (
                          <div className="absolute right-2 top-2">
                            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                          </div>
                        )}
                        <div className="absolute left-2 top-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md border border-border/60 bg-card" onClick={e => e.stopPropagation()}>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-52 rounded-[10px]">
                              {file.route && (
                                <DropdownMenuItem onClick={() => openFile(file)} className="gap-2.5 text-xs font-medium">
                                  <ExternalLink className="h-3.5 w-3.5" /> {meta.openLabel}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleStar(file)} className="gap-2.5 text-xs">
                                {file.starred ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                                {file.starred ? 'Remove star' : 'Add star'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => moveToVault(file)} className="gap-2.5 text-xs">
                                <ShieldCheck className="h-3.5 w-3.5" /> Move to vault
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {file.isPlatformFile && (
                                <DropdownMenuItem onClick={() => trashFile(file)} className="gap-2.5 text-xs text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" /> Move to trash
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="border-t border-border/60 p-3">
                        <h3 className="truncate text-[12px] font-medium text-foreground">{file.name}</h3>
                        <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-muted-foreground">
                          <span className="uppercase tracking-[0.13em]">{meta.label}</span>
                          <span className="tabular-nums">{file.meta}</span>
                        </div>
                        <RelativeTime date={file.modified} className="mt-1 block text-[9px]" />
                      </div>
                    </div>
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
