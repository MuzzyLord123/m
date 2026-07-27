import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Presentation, ArrowLeft, Plus, Search, Star, Clock, LayoutGrid, List,
  SortAsc, SortDesc, MoreHorizontal, Copy, Trash2, Edit3, FolderOpen,
  ChevronDown, Sparkles, Palette, FileText, TrendingUp, Layers, Eye,
  Filter, Calendar, Hash, ArrowRight, Wand2, Image, Monitor, Smartphone
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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
  { id: 'blank', label: 'Blank', desc: 'Start fresh', icon: Layers, color: 'text-muted-foreground', gradient: 'from-muted/40 to-muted/20', theme: THEMES[0] },
  { id: 'pitch', label: 'Pitch Deck', desc: 'Win investors', icon: TrendingUp, color: 'text-orange-500', gradient: 'from-orange-500/10 to-orange-600/5', theme: THEMES[4] },
  { id: 'business', label: 'Business Report', desc: 'Data-driven', icon: FileText, color: 'text-blue-500', gradient: 'from-blue-500/10 to-blue-600/5', theme: THEMES[14] },
  { id: 'creative', label: 'Creative Brief', desc: 'Stand out', icon: Palette, color: 'text-violet-500', gradient: 'from-violet-500/10 to-violet-600/5', theme: THEMES[7] },
  { id: 'minimal', label: 'Minimalist', desc: 'Clean & simple', icon: Sparkles, color: 'text-emerald-500', gradient: 'from-emerald-500/10 to-emerald-600/5', theme: THEMES[12] },
  { id: 'dark', label: 'Dark Pro', desc: 'Bold & modern', icon: Eye, color: 'text-cyan-500', gradient: 'from-cyan-500/10 to-cyan-600/5', theme: THEMES[11] },
];

const FEATURES = [
  { icon: Monitor, label: 'Present Mode', desc: 'Fullscreen with transitions' },
  { icon: Wand2, label: '18+ Themes', desc: 'Professional designs' },
  { icon: Image, label: 'Rich Media', desc: 'Images, charts & shapes' },
  { icon: Smartphone, label: 'Responsive', desc: 'Looks great everywhere' },
];

type SortField = 'lastModified' | 'createdAt' | 'title' | 'slideCount';
type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'starred' | 'recent';

export default function SlidesHome() {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState<SavedPresentation[]>(DEMO_PRESENTATIONS);
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
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-5 h-14 bg-card/90 backdrop-blur-xl border-b border-border/20 shrink-0">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
          <Presentation className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground leading-tight">Slides</h1>
          <p className="text-[10px] text-muted-foreground">Presentations & Pitches</p>
        </div>

        <div className="flex-1" />

        {/* Stats pills */}
        <div className="hidden md:flex items-center gap-2">
          {[
            { label: 'Presentations', value: presentations.length, icon: Layers },
            { label: 'Total Slides', value: totalSlides, icon: Hash },
            { label: 'Starred', value: starredCount, icon: Star },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/20">
              <s.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-foreground tabular-nums">{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        <Button onClick={openEditor} size="sm" className="h-8 text-xs gap-1.5 rounded-xl shadow-sm font-semibold bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white border-0 ml-2">
          <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline"> New Presentation</span><span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Templates Section */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Start from Template</h2>
            <span className="text-[10px] text-muted-foreground">{TEMPLATES.length} templates</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {TEMPLATES.map((tmpl, i) => (
              <motion.button
                key={tmpl.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={openEditor}
                className={cn(
                  "group rounded-xl border border-border/20 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-border/40 text-left"
                )}
              >
                <div className={cn("aspect-video bg-gradient-to-br flex items-center justify-center", tmpl.gradient)}>
                  <div className="h-10 w-10 rounded-xl bg-card/60 backdrop-blur-sm border border-border/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <tmpl.icon className={cn("h-5 w-5", tmpl.color)} />
                  </div>
                </div>
                <div className="px-3 py-2.5 bg-card/60">
                  <span className="text-[11px] font-semibold text-foreground block">{tmpl.label}</span>
                  <span className="text-[8px] text-muted-foreground/60">{tmpl.desc}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Feature highlights */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {FEATURES.map((f, i) => (
              <motion.div key={f.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-card/40 border border-border/15">
                <f.icon className="h-4 w-4 text-orange-500/60 shrink-0" />
                <div>
                  <span className="text-[10px] font-semibold text-foreground block">{f.label}</span>
                  <span className="text-[8px] text-muted-foreground/60">{f.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 pt-5 pb-3 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search presentations…"
              className="h-8 pl-9 text-xs rounded-xl bg-secondary/40 border-border/20"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-0.5 bg-secondary/40 rounded-xl p-0.5 border border-border/20">
            {(['all', 'starred', 'recent'] as FilterMode[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-7 px-3 text-[10px] font-semibold rounded-lg transition-all capitalize",
                  filter === f ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-1 rounded-xl">
                {sortAsc ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                Sort <ChevronDown className="h-2.5 w-2.5 opacity-40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl w-44">
              {[
                { field: 'lastModified' as SortField, label: 'Last Modified' },
                { field: 'createdAt' as SortField, label: 'Date Created' },
                { field: 'title' as SortField, label: 'Title' },
                { field: 'slideCount' as SortField, label: 'Slide Count' },
              ].map(s => (
                <DropdownMenuItem key={s.field} onClick={() => { if (sortField === s.field) { setSortAsc(!sortAsc); } else { setSortField(s.field); setSortAsc(false); } }}
                  className={cn("text-xs", sortField === s.field && "font-semibold")}>
                  {s.label} {sortField === s.field && (sortAsc ? '↑' : '↓')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-secondary/40 rounded-xl p-0.5 border border-border/20">
            <button onClick={() => setView('grid')} className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all", view === 'grid' ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setView('list')} className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all", view === 'list' ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Presentations */}
        <div className="px-6 pb-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                <Presentation className="h-8 w-8 text-orange-500/50" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">No presentations found</h3>
              <p className="text-xs text-muted-foreground mb-4">Create your first presentation or adjust your search</p>
              <Button onClick={openEditor} size="sm" className="h-8 text-xs rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline"> New Presentation</span><span className="sm:hidden">New</span>
              </Button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group rounded-xl border border-border/20 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-border/40 bg-card/50"
                >
                  {/* Thumbnail */}
                  <button onClick={openEditor} className="w-full aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: p.theme.bgGradient || p.theme.bg }}>
                      {/* Mock slide content */}
                      <div className="w-3/4 space-y-2 px-4">
                        <div className="h-3 w-2/3 rounded-sm mx-auto" style={{ background: p.theme.titleColor, opacity: 0.15 }} />
                        <div className="h-1.5 w-full rounded-sm" style={{ background: p.theme.textColor, opacity: 0.08 }} />
                        <div className="h-1.5 w-4/5 rounded-sm" style={{ background: p.theme.textColor, opacity: 0.08 }} />
                        <div className="h-1.5 w-3/5 rounded-sm mx-auto" style={{ background: p.theme.textColor, opacity: 0.06 }} />
                      </div>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/90 text-black text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-lg">
                        <Edit3 className="h-3 w-3" /> Open
                      </div>
                    </div>
                  </button>

                  {/* Info */}
                  <div className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[11px] font-semibold text-foreground truncate">{p.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-muted-foreground">{p.slideCount} slides</span>
                          <span className="text-[9px] text-muted-foreground">•</span>
                          <span className="text-[9px] text-muted-foreground">{formatDate(p.lastModified)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => toggleStar(p.id)} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-secondary/60 transition-colors">
                          <Star className={cn("h-3 w-3", p.starred ? "fill-orange-500 text-orange-500" : "text-muted-foreground/40")} />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-secondary/60 transition-colors">
                              <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-xl w-40" align="end">
                            <DropdownMenuItem onClick={openEditor} className="text-xs gap-2"><Edit3 className="h-3 w-3" /> Open</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicatePresentation(p.id)} className="text-xs gap-2"><Copy className="h-3 w-3" /> Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStar(p.id)} className="text-xs gap-2"><Star className="h-3 w-3" /> {p.starred ? 'Unstar' : 'Star'}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deletePresentation(p.id)} className="text-xs gap-2 text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {/* Tags */}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {p.tags.map(t => (
                          <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-md bg-secondary/60 text-muted-foreground font-medium">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-3 px-3 py-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Name</span>
                <span className="text-center">Slides</span>
                <span>Modified</span>
                <span>Created</span>
                <span />
              </div>
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-3 items-center px-3 py-2.5 rounded-xl hover:bg-card/60 border border-transparent hover:border-border/20 transition-all cursor-pointer group"
                  onClick={openEditor}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-14 rounded-lg overflow-hidden border border-border/20 shrink-0" style={{ background: p.theme.bgGradient || p.theme.bg }}>
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="w-2/3 space-y-0.5">
                          <div className="h-1 w-3/4 rounded-sm mx-auto" style={{ background: p.theme.titleColor, opacity: 0.15 }} />
                          <div className="h-0.5 w-full rounded-sm" style={{ background: p.theme.textColor, opacity: 0.08 }} />
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-semibold text-foreground truncate">{p.title}</h3>
                        {p.starred && <Star className="h-2.5 w-2.5 fill-orange-500 text-orange-500 shrink-0" />}
                      </div>
                      {p.tags && (
                        <div className="flex gap-1 mt-0.5">
                          {p.tags.map(t => (
                            <span key={t} className="text-[8px] px-1 py-0.5 rounded bg-secondary/50 text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center tabular-nums">{p.slideCount}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(p.lastModified)}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(p.createdAt)}</span>
                  <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-6 w-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-secondary/60 transition-all">
                          <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-xl w-40" align="end">
                        <DropdownMenuItem onClick={openEditor} className="text-xs gap-2"><Edit3 className="h-3 w-3" /> Open</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicatePresentation(p.id)} className="text-xs gap-2"><Copy className="h-3 w-3" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStar(p.id)} className="text-xs gap-2"><Star className="h-3 w-3" /> {p.starred ? 'Unstar' : 'Star'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deletePresentation(p.id)} className="text-xs gap-2 text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
