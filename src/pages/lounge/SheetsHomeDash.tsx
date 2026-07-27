import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet, Plus, Search, Star, Clock, LayoutGrid, List,
  SortAsc, SortDesc, MoreHorizontal, Copy, Trash2, Edit3, FolderOpen,
  Sparkles, Hash, ArrowLeft, BarChart3, Calculator, TrendingUp,
  Table2, FileSpreadsheet, DollarSign, Percent
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SavedSpreadsheet {
  id: string;
  title: string;
  sheetCount: number;
  lastModified: Date;
  createdAt: Date;
  starred: boolean;
  cellCount: number;
  color: string;
}

const DEMO_SPREADSHEETS: SavedSpreadsheet[] = [
  { id: '1', title: 'Budget 2026', sheetCount: 3, cellCount: 245, lastModified: new Date(2026, 1, 22), createdAt: new Date(2026, 1, 5), starred: true, color: 'from-emerald-500/15 to-teal-600/10' },
  { id: '2', title: 'Revenue Tracker', sheetCount: 2, cellCount: 180, lastModified: new Date(2026, 1, 20), createdAt: new Date(2026, 0, 28), starred: true, color: 'from-blue-500/15 to-indigo-600/10' },
  { id: '3', title: 'Employee Roster', sheetCount: 1, cellCount: 96, lastModified: new Date(2026, 1, 18), createdAt: new Date(2026, 1, 1), starred: false, color: 'from-violet-500/15 to-purple-600/10' },
  { id: '4', title: 'Inventory Count', sheetCount: 4, cellCount: 520, lastModified: new Date(2026, 1, 15), createdAt: new Date(2026, 0, 20), starred: false, color: 'from-amber-500/15 to-orange-600/10' },
  { id: '5', title: 'Sales Pipeline', sheetCount: 2, cellCount: 310, lastModified: new Date(2026, 1, 12), createdAt: new Date(2026, 0, 15), starred: false, color: 'from-rose-500/15 to-pink-600/10' },
  { id: '6', title: 'Project Timeline', sheetCount: 1, cellCount: 64, lastModified: new Date(2026, 1, 10), createdAt: new Date(2026, 0, 10), starred: false, color: 'from-cyan-500/15 to-sky-600/10' },
];

const TEMPLATES = [
  { id: 'blank', label: 'Blank Spreadsheet', description: 'Start with an empty grid', icon: Table2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', gradient: 'from-emerald-500/8 to-emerald-600/3' },
  { id: 'budget', label: 'Budget Planner', description: 'Track income & expenses', icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500/8 to-blue-600/3' },
  { id: 'tracker', label: 'Project Tracker', description: 'Milestones & timelines', icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', gradient: 'from-violet-500/8 to-violet-600/3' },
  { id: 'inventory', label: 'Inventory List', description: 'Stock & quantities', icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradient: 'from-amber-500/8 to-amber-600/3' },
  { id: 'invoice', label: 'Invoice Template', description: 'Client billing', icon: FileSpreadsheet, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', gradient: 'from-rose-500/8 to-rose-600/3' },
  { id: 'analytics', label: 'Data Analysis', description: 'Charts & formulas', icon: Calculator, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', gradient: 'from-cyan-500/8 to-cyan-600/3' },
];

type SortField = 'lastModified' | 'createdAt' | 'title' | 'sheetCount';
type ViewMode = 'grid' | 'list';

export default function SheetsHomeDash() {
  const navigate = useNavigate();
  const [spreadsheets, setSpreadsheets] = useState(DEMO_SPREADSHEETS);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('lastModified');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let items = [...spreadsheets];
    if (search) items = items.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortField === 'sheetCount') cmp = a.sheetCount - b.sheetCount;
      else if (sortField === 'createdAt') cmp = a.createdAt.getTime() - b.createdAt.getTime();
      else cmp = a.lastModified.getTime() - b.lastModified.getTime();
      return sortAsc ? cmp : -cmp;
    });
    return items;
  }, [spreadsheets, search, sortField, sortAsc]);

  const toggleStar = (id: string) => setSpreadsheets(prev => prev.map(p => p.id === id ? { ...p, starred: !p.starred } : p));
  const deleteSheet = (id: string) => setSpreadsheets(prev => prev.filter(p => p.id !== id));
  const duplicateSheet = (id: string) => {
    const orig = spreadsheets.find(p => p.id === id);
    if (!orig) return;
    setSpreadsheets(prev => [{ ...orig, id: `dup-${Date.now()}`, title: `${orig.title} (Copy)`, starred: false, createdAt: new Date(), lastModified: new Date() }, ...prev]);
  };

  const openEditor = () => navigate('/lounge/office/excel-home');
  const totalSheets = spreadsheets.reduce((s, p) => s + p.sheetCount, 0);
  const starredCount = spreadsheets.filter(p => p.starred).length;
  const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const starred = filtered.filter(s => s.starred);
  const recent = filtered.filter(s => !s.starred);

  return (
    <div className="h-full flex flex-col overflow-auto bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/8 via-teal-500/5 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative px-4 sm:px-8 pt-5 sm:pt-7 pb-5 sm:pb-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-5 gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-card/80 shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-[14px] bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
                  <Sheet className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">Spreadsheets</h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">Create, analyze, and manage your data</p>
                </div>
              </div>
              <Button onClick={openEditor} className="gap-1.5 sm:gap-2 h-8 sm:h-9 rounded-xl text-[10px] sm:text-xs shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shrink-0 px-2.5 sm:px-4">
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New Spreadsheet</span><span className="sm:hidden">New</span>
              </Button>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
              {[
                { icon: FolderOpen, color: 'text-emerald-500', value: spreadsheets.length, label: 'spreadsheets' },
                { icon: Hash, color: 'text-teal-500', value: totalSheets, label: 'total sheets' },
                { icon: Star, color: 'text-amber-500 fill-amber-500', value: starredCount, label: 'starred' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-card/70 backdrop-blur-sm border border-border/30 shrink-0">
                  <s.icon className={cn("h-3 sm:h-3.5 w-3 sm:w-3.5", s.color)} />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-foreground">{s.value}</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">{s.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Templates */}
      <div className="px-4 sm:px-8 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-primary/60" />
          <h2 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.14em]">Start from template</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {TEMPLATES.map((t, i) => (
            <motion.button key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}
              onClick={openEditor}
              className={cn("flex flex-col items-center gap-2.5 p-4 rounded-xl border bg-gradient-to-b hover:shadow-lg transition-all duration-250 hover:-translate-y-1 group cursor-pointer", t.border, t.gradient)}>
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", t.bg)}>
                <t.icon className={cn("h-5 w-5", t.color)} />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-semibold text-foreground block leading-tight">{t.label}</span>
                <span className="text-[8px] text-muted-foreground/60 leading-tight mt-0.5 block">{t.description}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Search & Controls */}
      <div className="px-4 sm:px-8 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[120px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9 h-8 text-xs bg-card/60 border-border/40 rounded-xl" />
          </div>
          <Select value={sortField} onValueChange={v => setSortField(v as SortField)}>
            <SelectTrigger className="h-8 w-[110px] sm:w-[130px] text-[10px] border-border/40 rounded-xl bg-card/60"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="lastModified" className="text-[10px]">Last modified</SelectItem>
              <SelectItem value="createdAt" className="text-[10px]">Date created</SelectItem>
              <SelectItem value="title" className="text-[10px]">Title</SelectItem>
              <SelectItem value="sheetCount" className="text-[10px]">Sheet count</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setSortAsc(d => !d)}>
            {sortAsc ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />}
          </Button>
          <div className="flex items-center gap-0.5 border border-border/40 rounded-xl p-0.5 bg-card/40">
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg" onClick={() => setView('grid')}><LayoutGrid className="h-3.5 w-3.5" /></Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg" onClick={() => setView('list')}><List className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Spreadsheets */}
      <div className="px-4 sm:px-8 pb-8 flex-1">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mb-5 border border-emerald-500/10">
              <Sheet className="h-10 w-10 text-emerald-500/30" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">No spreadsheets yet</h3>
            <p className="text-xs text-muted-foreground mb-5 max-w-xs">Create your first spreadsheet to start analyzing data</p>
            <Button onClick={openEditor} className="gap-2 rounded-xl h-9 text-xs shadow-md"><Plus className="h-3.5 w-3.5" /> Create Spreadsheet</Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {starred.length > 0 && (
              <div>
                <h2 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Starred
                </h2>
                <SheetGrid items={starred} viewMode={view} onOpen={openEditor} onStar={toggleStar} onDelete={deleteSheet} onDuplicate={duplicateSheet} formatDate={formatDate} />
              </div>
            )}
            <div>
              {starred.length > 0 && (
                <h2 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground/50" /> Recent
                </h2>
              )}
              <SheetGrid items={recent} viewMode={view} onOpen={openEditor} onStar={toggleStar} onDelete={deleteSheet} onDuplicate={duplicateSheet} formatDate={formatDate} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SheetGrid({ items, viewMode, onOpen, onStar, onDelete, onDuplicate, formatDate }: {
  items: SavedSpreadsheet[]; viewMode: ViewMode; onOpen: () => void;
  onStar: (id: string) => void; onDelete: (id: string) => void; onDuplicate: (id: string) => void;
  formatDate: (d: Date) => string;
}) {
  if (viewMode === 'list') {
    return (
      <div className="rounded-xl border border-border/40 overflow-hidden bg-card/50 backdrop-blur-sm">
        {items.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors cursor-pointer border-b border-border/10 last:border-0"
            onClick={onOpen}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-600/10 flex items-center justify-center">
              <Sheet className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-foreground block truncate">{s.title}</span>
              <span className="text-[9px] text-muted-foreground">{s.sheetCount} sheets · {formatDate(s.lastModified)}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onStar(s.id); }} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-secondary/60">
              <Star className={cn("h-3 w-3", s.starred ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40")} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-secondary/60" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-3 w-3 text-muted-foreground" /></button></DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl w-40">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onDuplicate(s.id); }} className="text-xs gap-2"><Copy className="h-3 w-3" /> Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(s.id); }} className="text-xs gap-2 text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((s, i) => (
        <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
          className="group rounded-xl border border-border/30 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 hover:border-border/50 transition-all bg-card/50 cursor-pointer"
          onClick={onOpen}>
          {/* Thumbnail */}
          <div className={cn("aspect-[4/3] bg-gradient-to-br flex items-center justify-center relative", s.color)}>
            <div className="w-4/5 space-y-1.5 px-3">
              {[...Array(6)].map((_, r) => (
                <div key={r} className="flex gap-1">
                  {[...Array(4)].map((_, c) => (
                    <div key={c} className="flex-1 h-2.5 rounded-[2px] bg-foreground/[0.06]" />
                  ))}
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/90 text-black text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-lg">
                <Edit3 className="h-3 w-3" /> Open
              </div>
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                <h3 className="text-[11px] font-semibold text-foreground truncate">{s.title}</h3>
                <span className="text-[9px] text-muted-foreground">{s.sheetCount} sheets · {formatDate(s.lastModified)}</span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onStar(s.id); }} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-secondary/60">
                  <Star className={cn("h-3 w-3", s.starred ? "fill-emerald-500 text-emerald-500" : "text-muted-foreground/40")} />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><button className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-secondary/60" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-3 w-3 text-muted-foreground" /></button></DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl w-40">
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onDuplicate(s.id); }} className="text-xs gap-2"><Copy className="h-3 w-3" /> Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(s.id); }} className="text-xs gap-2 text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
