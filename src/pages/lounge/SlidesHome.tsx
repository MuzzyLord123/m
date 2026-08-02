import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Presentation, ArrowLeft, Plus, Search, Star, LayoutGrid, List,
  SortAsc, SortDesc, MoreHorizontal, Copy, Trash2, Edit3,
  ChevronDown, Palette, FileText, TrendingUp, Layers, Eye, Sparkles
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';
import { PageHeader, EmptyState, FIELD } from '@/components/platform';
import { THEMES, type SlideTheme } from '@/components/slides/types';

interface SavedPresentation {
  id: string;
  title: string;
  slideCount: number;
  lastModified: Date;
  createdAt: Date;
  starred: boolean;
  theme: SlideTheme;
  thumbnail?: string;
  folder?: string;
  tags?: string[];
}

const DEMO_PRESENTATIONS: SavedPresentation[] = [
  { id: '1', title: 'Q4 Business Review', slideCount: 18, lastModified: new Date(2026, 1, 22), createdAt: new Date(2026, 1, 15), starred: true, theme: THEMES[0], tags: ['business', 'review'] },
  { id: '2', title: 'Product Launch Deck', slideCount: 24, lastModified: new Date(2026, 1, 21), createdAt: new Date(2026, 1, 10), starred: true, theme: THEMES[4], tags: ['product', 'launch'] },
  { id: '3', title: 'Team Onboarding', slideCount: 12, lastModified: new Date(2026, 1, 20), createdAt: new Date(2026, 1, 8), starred: false, theme: THEMES[7], tags: ['HR', 'onboarding'] },
  { id: '4', title: 'Marketing Strategy 2026', slideCount: 32, lastModified: new Date(2026, 1, 18), createdAt: new Date(2026, 0, 25), starred: false, theme: THEMES[10], tags: ['marketing'] },
  { id: '5', title: 'Investor Pitch', slideCount: 15, lastModified: new Date(2026, 1, 15), createdAt: new Date(2026, 0, 20), starred: true, theme: THEMES[14], tags: ['investor', 'pitch'] },
  { id: '6', title: 'Design System Overview', slideCount: 22, lastModified: new Date(2026, 1, 12), createdAt: new Date(2026, 0, 15), starred: false, theme: THEMES[11], tags: ['design'] },
];

const TEMPLATES = [
  { id: 'blank', label: 'Blank', desc: 'Start fresh', icon: Layers, theme: THEMES[0] },
  { id: 'pitch', label: 'Pitch deck', desc: 'Win investors', icon: TrendingUp, theme: THEMES[4] },
  { id: 'business', label: 'Business report', desc: 'Data-driven', icon: FileText, theme: THEMES[14] },
  { id: 'creative', label: 'Creative brief', desc: 'Stand out', icon: Palette, theme: THEMES[7] },
  { id: 'minimal', label: 'Minimalist', desc: 'Clean and simple', icon: Sparkles, theme: THEMES[12] },
  { id: 'dark', label: 'Dark pro', desc: 'Bold and modern', icon: Eye, theme: THEMES[11] },
];

type SortField = 'lastModified' | 'createdAt' | 'title' | 'slideCount';
type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'starred' | 'recent';

export default function SlidesHome() {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState<SavedPresentation[]>([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('lastModified');
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');

  const filtered = useMemo(() => {
    let items = [...presentations];
    if (search) items = items.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())));
    if (filter === 'starred') items = items.filter(p => p.starred);
    if (filter === 'recent') items = items.filter(p => Date.now() - p.lastModified.getTime() < 7 * 24 * 60 * 60 * 1000);
    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortField === 'slideCount') cmp = a.slideCount - b.slideCount;
      else if (sortField === 'createdAt') cmp = a.createdAt.getTime() - b.createdAt.getTime();
      else cmp = a.lastModified.getTime() - b.lastModified.getTime();
      return sortAsc ? cmp : -cmp;
    });
    return items;
  }, [presentations, search, sortField, sortAsc, filter]);

  const toggleStar = (id: string) => {
    setPresentations(prev => prev.map(p => p.id === id ? { ...p, starred: !p.starred } : p));
  };

  const deletePresentation = (id: string) => {
    setPresentations(prev => prev.filter(p => p.id !== id));
  };

  const duplicatePresentation = (id: string) => {
    const orig = presentations.find(p => p.id === id);
    if (!orig) return;
    const dup: SavedPresentation = { ...orig, id: `dup-${Date.now()}`, title: `${orig.title} (Copy)`, createdAt: new Date(), lastModified: new Date(), starred: false };
    setPresentations(prev => [dup, ...prev]);
  };

  const openEditor = () => {
    navigate('/lounge/office/slides/edit');
  };

  const totalSlides = presentations.reduce((s, p) => s + p.slideCount, 0);
  const starredCount = presentations.filter(p => p.starred).length;

  const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="h-full flex flex-col overflow-auto bg-background">
      <div className="sticky top-0 z-30 bg-background">
        <OfficeModuleBand appId="slides" icon={Presentation} title="Slides" />
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        {/* Header */}
        <div className="flex items-start gap-3 pt-5 sm:pt-7">
          <PageHeader
            className="min-w-0 flex-1"
            title="Presentations"
            description="Decks, pitches and talks"
            actions={
              <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={openEditor}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New presentation</span>
                <span className="sm:hidden">New</span>
              </Button>
            }
          />
        </div>

        {/* Fact line */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
          <span className="tabular-nums">{presentations.length} presentations</span>
          <span className="tabular-nums">{totalSlides} slides</span>
          <span className="tabular-nums">{starredCount} starred</span>
        </div>

        {/* Templates */}
        <section className="pb-6 pt-6">
          <div className="mb-3 flex items-center gap-2.5">
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Start from a template</h2>
            <div className="h-px flex-1 bg-border/60" />
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">{TEMPLATES.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={openEditor}
                  className="group overflow-hidden rounded-[10px] border border-border/60 bg-card text-left transition-colors duration-150 hover:border-border"
                >
                  <div className="flex aspect-video items-center justify-center bg-sunken/50">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-foreground/[0.04]">
                      <Icon className="h-4 w-4 text-ink-2" strokeWidth={1.7} />
                    </span>
                  </div>
                  <div className="border-t border-border/60 px-3 py-2.5">
                    <span className="block text-[11.5px] font-medium text-foreground">{tmpl.label}</span>
                    <span className="text-[10px] text-muted-foreground">{tmpl.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pb-4">
          <div className="relative min-w-0 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search presentations"
              className={cn(FIELD, 'h-8 pl-9 text-xs')}
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
            {(['all', 'starred', 'recent'] as FilterMode[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'h-7 rounded-md px-3 text-[11px] font-medium capitalize transition-colors duration-150',
                  filter === f ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-lg text-[11px]">
                {sortAsc ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                Sort <ChevronDown className="h-2.5 w-2.5 opacity-40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 rounded-[10px]">
              {[
                { field: 'lastModified' as SortField, label: 'Last modified' },
                { field: 'createdAt' as SortField, label: 'Date created' },
                { field: 'title' as SortField, label: 'Title' },
                { field: 'slideCount' as SortField, label: 'Slide count' },
              ].map(s => (
                <DropdownMenuItem key={s.field} onClick={() => { if (sortField === s.field) { setSortAsc(!sortAsc); } else { setSortField(s.field); setSortAsc(false); } }}
                  className={cn('text-xs', sortField === s.field && 'font-semibold')}>
                  {s.label} {sortField === s.field && (sortAsc ? '↑' : '↓')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
            <button aria-label="Grid view" onClick={() => setView('grid')} className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150', view === 'grid' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button aria-label="List view" onClick={() => setView('list')} className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150', view === 'list' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Presentations */}
        <div className="pb-8">
          {filtered.length === 0 ? (
            <EmptyState
              title="No presentations found"
              body="Create your first presentation or adjust your search."
              action={{ label: 'New presentation', onClick: openEditor }}
            />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="group overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:border-border"
                >
                  {/* Thumbnail */}
                  <button onClick={openEditor} className="relative block w-full overflow-hidden aspect-video">
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: p.theme.bgGradient || p.theme.bg }}>
                      {/* Mock slide content */}
                      <div className="w-3/4 space-y-2 px-4">
                        <div className="mx-auto h-3 w-2/3 rounded-sm" style={{ background: p.theme.titleColor, opacity: 0.15 }} />
                        <div className="h-1.5 w-full rounded-sm" style={{ background: p.theme.textColor, opacity: 0.08 }} />
                        <div className="h-1.5 w-4/5 rounded-sm" style={{ background: p.theme.textColor, opacity: 0.08 }} />
                        <div className="mx-auto h-1.5 w-3/5 rounded-sm" style={{ background: p.theme.textColor, opacity: 0.06 }} />
                      </div>
                    </div>
                  </button>

                  {/* Info */}
                  <div className="border-t border-border/60 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[12px] font-medium text-foreground">{p.title}</h3>
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                          <span>{p.slideCount} slides</span>
                          <span aria-hidden>·</span>
                          <span>{formatDate(p.lastModified)}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button aria-label={p.starred ? 'Unstar' : 'Star'} onClick={() => toggleStar(p.id)} className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.04]">
                          <Star className={cn('h-3 w-3', p.starred ? 'fill-gold text-gold' : 'text-muted-foreground/40')} />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button aria-label="More actions" className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.04]">
                              <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-40 rounded-[10px]" align="end">
                            <DropdownMenuItem onClick={openEditor} className="gap-2 text-xs"><Edit3 className="h-3 w-3" /> Open</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicatePresentation(p.id)} className="gap-2 text-xs"><Copy className="h-3 w-3" /> Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStar(p.id)} className="gap-2 text-xs"><Star className="h-3 w-3" /> {p.starred ? 'Unstar' : 'Star'}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deletePresentation(p.id)} className="gap-2 text-xs text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {/* Tags */}
                    {p.tags && p.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.tags.map(t => (
                          <span key={t} className="rounded-md bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List view */
            <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-3 border-b border-border/60 bg-sunken px-3 py-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                <span>Name</span>
                <span className="text-center">Slides</span>
                <span className="hidden sm:block">Modified</span>
                <span className="hidden sm:block">Created</span>
                <span />
              </div>
              {filtered.map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    'group grid cursor-pointer grid-cols-[1fr_80px_100px_100px_40px] items-center gap-3 px-3 py-2 transition-colors duration-150 hover:bg-foreground/[0.025]',
                    i > 0 && 'border-t border-border/60',
                  )}
                  onClick={openEditor}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-8 w-14 shrink-0 overflow-hidden rounded-md border border-border/60" style={{ background: p.theme.bgGradient || p.theme.bg }}>
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="w-2/3 space-y-0.5">
                          <div className="mx-auto h-1 w-3/4 rounded-sm" style={{ background: p.theme.titleColor, opacity: 0.15 }} />
                          <div className="h-0.5 w-full rounded-sm" style={{ background: p.theme.textColor, opacity: 0.08 }} />
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-[13px] font-[450] text-foreground">{p.title}</h3>
                        {p.starred && <Star className="h-2.5 w-2.5 shrink-0 fill-gold text-gold" />}
                      </div>
                      {p.tags && (
                        <div className="mt-0.5 flex gap-1">
                          {p.tags.map(t => (
                            <span key={t} className="rounded bg-foreground/[0.04] px-1 py-0.5 font-mono text-[9px] text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-center font-mono text-[10.5px] tabular-nums text-muted-foreground">{p.slideCount}</span>
                  <span className="hidden font-mono text-[10.5px] tabular-nums text-muted-foreground sm:block">{formatDate(p.lastModified)}</span>
                  <span className="hidden font-mono text-[10.5px] tabular-nums text-muted-foreground sm:block">{formatDate(p.createdAt)}</span>
                  <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button aria-label="More actions" className="flex h-6 w-6 items-center justify-center rounded-md opacity-0 transition-opacity duration-150 hover:bg-foreground/[0.04] group-hover:opacity-100">
                          <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-40 rounded-[10px]" align="end">
                        <DropdownMenuItem onClick={openEditor} className="gap-2 text-xs"><Edit3 className="h-3 w-3" /> Open</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicatePresentation(p.id)} className="gap-2 text-xs"><Copy className="h-3 w-3" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStar(p.id)} className="gap-2 text-xs"><Star className="h-3 w-3" /> {p.starred ? 'Unstar' : 'Star'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deletePresentation(p.id)} className="gap-2 text-xs text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
