import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet, Plus, Search, Star, LayoutGrid, List,
  SortAsc, SortDesc, MoreHorizontal, Copy, Trash2, ArrowLeft,
  BarChart3, Calculator, TrendingUp, Table2, FileSpreadsheet, DollarSign
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PageHeader, EmptyState, FIELD } from '@/components/platform';

interface SavedSpreadsheet {
  id: string;
  title: string;
  sheetCount: number;
  lastModified: Date;
  createdAt: Date;
  starred: boolean;
  cellCount: number;
}

const DEMO_SPREADSHEETS: SavedSpreadsheet[] = [
  { id: '1', title: 'Budget 2026', sheetCount: 3, cellCount: 245, lastModified: new Date(2026, 1, 22), createdAt: new Date(2026, 1, 5), starred: true },
  { id: '2', title: 'Revenue Tracker', sheetCount: 2, cellCount: 180, lastModified: new Date(2026, 1, 20), createdAt: new Date(2026, 0, 28), starred: true },
  { id: '3', title: 'Employee Roster', sheetCount: 1, cellCount: 96, lastModified: new Date(2026, 1, 18), createdAt: new Date(2026, 1, 1), starred: false },
  { id: '4', title: 'Inventory Count', sheetCount: 4, cellCount: 520, lastModified: new Date(2026, 1, 15), createdAt: new Date(2026, 0, 20), starred: false },
  { id: '5', title: 'Sales Pipeline', sheetCount: 2, cellCount: 310, lastModified: new Date(2026, 1, 12), createdAt: new Date(2026, 0, 15), starred: false },
  { id: '6', title: 'Project Timeline', sheetCount: 1, cellCount: 64, lastModified: new Date(2026, 1, 10), createdAt: new Date(2026, 0, 10), starred: false },
];

const TEMPLATES = [
  { id: 'blank', label: 'Blank spreadsheet', description: 'Start with an empty grid', icon: Table2 },
  { id: 'budget', label: 'Budget planner', description: 'Track income and expenses', icon: DollarSign },
  { id: 'tracker', label: 'Project tracker', description: 'Milestones and timelines', icon: TrendingUp },
  { id: 'inventory', label: 'Inventory list', description: 'Stock and quantities', icon: BarChart3 },
  { id: 'invoice', label: 'Invoice template', description: 'Client billing', icon: FileSpreadsheet },
  { id: 'analytics', label: 'Data analysis', description: 'Charts and formulas', icon: Calculator },
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
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        {/* Header */}
        <div className="flex items-start gap-3 pt-5 sm:pt-7">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to Office"
            className="mt-0.5 h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            className="min-w-0 flex-1"
            kicker="Quooro Office · Sheets"
            title="Spreadsheets"
            description="Create, analyse and manage your data"
            actions={
              <Button className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={openEditor}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New spreadsheet</span>
                <span className="sm:hidden">New</span>
              </Button>
            }
          />
        </div>

        {/* Fact line */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
          <span className="tabular-nums">{spreadsheets.length} spreadsheets</span>
          <span className="tabular-nums">{totalSheets} sheets</span>
          <span className="tabular-nums">{starredCount} starred</span>
        </div>

        {/* Templates */}
        <section className="pb-6 pt-6">
          <div className="mb-3 flex items-center gap-2.5">
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Start from a template</h2>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={openEditor}
                  className="flex flex-col items-start gap-2.5 rounded-[10px] border border-border/60 bg-card p-3.5 text-left transition-colors duration-150 hover:bg-foreground/[0.025]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.04]">
                    <Icon className="h-4 w-4 text-ink-2" strokeWidth={1.7} />
                  </span>
                  <span>
                    <span className="block text-[11.5px] font-medium leading-tight text-foreground">{t.label}</span>
                    <span className="mt-0.5 block text-[10.5px] leading-tight text-muted-foreground">{t.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search and controls */}
        <div className="flex flex-wrap items-center gap-2 pb-4">
          <div className="relative min-w-[120px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search spreadsheets" className={cn(FIELD, 'h-8 pl-9 text-xs')} />
          </div>
          <Select value={sortField} onValueChange={v => setSortField(v as SortField)}>
            <SelectTrigger className="h-8 w-[110px] rounded-lg border-border/60 bg-card text-[11px] sm:w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-[10px]">
              <SelectItem value="lastModified" className="text-xs">Last modified</SelectItem>
              <SelectItem value="createdAt" className="text-xs">Date created</SelectItem>
              <SelectItem value="title" className="text-xs">Title</SelectItem>
              <SelectItem value="sheetCount" className="text-xs">Sheet count</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" aria-label="Reverse sort order" className="h-8 w-8 rounded-lg" onClick={() => setSortAsc(d => !d)}>
            {sortAsc ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />}
          </Button>
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" aria-label="Grid view" className="h-7 w-7 rounded-md" onClick={() => setView('grid')}><LayoutGrid className="h-3.5 w-3.5" /></Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" aria-label="List view" className="h-7 w-7 rounded-md" onClick={() => setView('list')}><List className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        {/* Spreadsheets */}
        <div className="flex-1 pb-8">
          {filtered.length === 0 ? (
            <EmptyState
              title={search.trim() ? 'No matching spreadsheets' : 'No spreadsheets yet'}
              body={search.trim() ? 'Try a different search.' : 'Create your first spreadsheet to start analysing data.'}
              action={search.trim() ? undefined : { label: 'New spreadsheet', onClick: openEditor }}
            />
          ) : (
            <div className="space-y-7">
              {starred.length > 0 && (
                <div>
                  <h2 className="mb-2.5 flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    <Star className="h-3 w-3 fill-gold text-gold" /> Starred
                  </h2>
                  <SheetGrid items={starred} viewMode={view} onOpen={openEditor} onStar={toggleStar} onDelete={deleteSheet} onDuplicate={duplicateSheet} formatDate={formatDate} />
                </div>
              )}
              <div>
                {starred.length > 0 && (
                  <h2 className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Recent
                  </h2>
                )}
                <SheetGrid items={recent} viewMode={view} onOpen={openEditor} onStar={toggleStar} onDelete={deleteSheet} onDuplicate={duplicateSheet} formatDate={formatDate} />
              </div>
            </div>
          )}
        </div>
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
      <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
        {items.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'flex h-10 cursor-pointer items-center gap-3 px-3.5 transition-colors duration-150 hover:bg-foreground/[0.025]',
              i > 0 && 'border-t border-border/60',
            )}
            onClick={onOpen}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
              <Sheet className="h-3.5 w-3.5 text-ink-2" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-[450] text-foreground">{s.title}</span>
            </div>
            <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">
              {s.sheetCount} sheets · {formatDate(s.lastModified)}
            </span>
            <button aria-label={s.starred ? 'Unstar' : 'Star'} onClick={(e) => { e.stopPropagation(); onStar(s.id); }} className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.04]">
              <Star className={cn('h-3 w-3', s.starred ? 'fill-gold text-gold' : 'text-muted-foreground/40')} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button aria-label="More actions" className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.04]" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-3 w-3 text-muted-foreground" /></button></DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 rounded-[10px]">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onDuplicate(s.id); }} className="gap-2 text-xs"><Copy className="h-3 w-3" /> Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(s.id); }} className="gap-2 text-xs text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((s) => (
        <div
          key={s.id}
          className="group cursor-pointer overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:border-border"
          onClick={onOpen}
        >
          {/* Grid preview */}
          <div className="flex aspect-[4/3] items-center justify-center bg-sunken/50">
            <div className="w-4/5 space-y-1.5 px-3">
              {[...Array(6)].map((_, r) => (
                <div key={r} className="flex gap-1">
                  {[...Array(4)].map((_, c) => (
                    <div key={c} className="h-2.5 flex-1 rounded-[2px] bg-foreground/[0.06]" />
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* Caption */}
          <div className="border-t border-border/60 px-3 py-2.5">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[12px] font-medium text-foreground">{s.title}</h3>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{s.sheetCount} sheets · {formatDate(s.lastModified)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button aria-label={s.starred ? 'Unstar' : 'Star'} onClick={(e) => { e.stopPropagation(); onStar(s.id); }} className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.04]">
                  <Star className={cn('h-3 w-3', s.starred ? 'fill-gold text-gold' : 'text-muted-foreground/40')} />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><button aria-label="More actions" className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.04]" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-3 w-3 text-muted-foreground" /></button></DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40 rounded-[10px]">
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onDuplicate(s.id); }} className="gap-2 text-xs"><Copy className="h-3 w-3" /> Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(s.id); }} className="gap-2 text-xs text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
