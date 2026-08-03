import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor } from './EditorContext';
import { COMPONENT_REGISTRY } from './constants/componentRegistry';
import { ComponentCategory, ElementType } from './types';
import { createElement } from './utils/elementFactory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ROW, GLYPH } from './studio';
import {
  LayoutTemplate, Square, Columns3, Grid3x3, MoveVertical, Minus,
  Type, AlignLeft, MousePointerClick, Tag, CreditCard,
  ImageIcon, Video, Smile,
  FormInput, TextCursorInput, Text,
  PanelTop, PanelBottom, Link,
  Code, Globe, Search, Quote, List, Music, MapPin, Sparkles,
  ChevronDown, LayoutList, MessageCircle, Maximize2, SlidersHorizontal,
  MoveHorizontal, Timer, BarChart3, Table, CheckSquare,
  Star, Heart, Grid2x2, LayoutGrid, ChevronRight, Plus, Zap,
  Package, Layers,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutTemplate, Square, Columns3, Grid3x3, MoveVertical, Minus,
  Type, AlignLeft, MousePointerClick, Tag, CreditCard,
  ImageIcon, Video, Smile,
  FormInput, TextCursorInput, Text,
  PanelTop, PanelBottom, Link,
  Code, Globe, Quote, List, Music, MapPin, Sparkles,
  ChevronDown, LayoutList, MessageCircle, Maximize2, SlidersHorizontal,
  MoveHorizontal, Timer, BarChart3, Table, CheckSquare,
};

const CATEGORIES: ComponentCategory[] = ['Layout', 'Content', 'Media', 'Marketing', 'Interactive', 'Data', 'Forms', 'Navigation', 'Social', 'Charts', 'Advanced'];

/**
 * The library used to give every category its own hue - eleven of them, each
 * with a coloured dot on its chip and a coloured tile on every row. Eleven
 * colours are not a hierarchy; they are noise, and they were the single
 * loudest reason the builder read as generated rather than designed.
 *
 * The category is now carried by position (rows sit under their own heading)
 * and by the glyph. Colour is reserved for state.
 */
const CATEGORY_COLORS: Record<string, string> = {};

const CATEGORY_ICONS: Record<string, typeof Layers> = {
  Layout: LayoutTemplate, Content: Type, Media: ImageIcon, Marketing: Sparkles,
  Interactive: MousePointerClick, Data: BarChart3, Forms: FormInput, Navigation: PanelTop,
  Social: MessageCircle, Charts: BarChart3, Advanced: Code,
};

const FAVORITES_KEY = 'workshop-favorite-components';
const RECENT_KEY = 'workshop-recent-components';
const MAX_RECENT = 8;

function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
  catch { return []; }
}

function toggleFavorite(type: string): string[] {
  const current = getFavorites();
  const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

function addRecent(type: string) {
  const current = getRecent();
  const next = [type, ...current.filter(t => t !== type)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

type ViewMode = 'grid' | 'list';

const COLLAPSED_KEY = 'workshop-collapsed-categories';
function getCollapsed(): string[] {
  try { return JSON.parse(localStorage.getItem(COLLAPSED_KEY) || '[]'); }
  catch { return []; }
}

export function ComponentLibrary() {
  const { dispatch } = useEditor();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [favorites, setFavorites] = useState(getFavorites);
  const [recent, setRecent] = useState(getRecent);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [collapsed, setCollapsed] = useState<string[]>(getCollapsed);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    const next = collapsed.includes(cat) ? collapsed.filter(c => c !== cat) : [...collapsed, cat];
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
  };

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('component-type', type);
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    dispatch({ type: 'SET_DRAG', payload: { elementType: type } });
    setDragPreview(type);
  };

  const handleClick = (type: ElementType) => {
    const el = createElement(type);
    dispatch({ type: 'ADD_ELEMENT', payload: { element: el } });
    setRecent(addRecent(type));
  };

  const handleToggleFavorite = (type: string) => {
    const next = toggleFavorite(type);
    setFavorites(next);
  };

  const filtered = search.trim()
    ? COMPONENT_REGISTRY.filter(c => c.label.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()))
    : null;

  const favoriteComponents = useMemo(
    () => COMPONENT_REGISTRY.filter(c => favorites.includes(c.type)),
    [favorites]
  );

  const recentComponents = useMemo(
    () => recent.map(t => COMPONENT_REGISTRY.find(c => c.type === t)).filter(Boolean) as typeof COMPONENT_REGISTRY[number][],
    [recent]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    COMPONENT_REGISTRY.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
    return counts;
  }, []);

  const visibleCategories = activeCategory
    ? CATEGORIES.filter(c => c === activeCategory)
    : CATEGORIES;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-accent) / 0.1), rgba(99,102,241,0.08))', border: '1px solid hsl(var(--studio-accent) / 0.15)' }}>
              <Package className="h-3 w-3" style={{ color: 'hsl(var(--studio-accent))' }} />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--studio-ink-2))' }}>Components</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(s => !s)}
              className="h-6 w-6 flex items-center justify-center rounded-md transition-colors"
              style={{ backgroundColor: showSearch ? 'hsl(var(--studio-accent) / 0.1)' : 'transparent', color: showSearch ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-3))' }}
            >
              <Search className="h-3 w-3" />
            </button>
            <div className="flex rounded overflow-hidden" style={{ border: '1px solid hsl(var(--studio-line))' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="h-6 w-6 flex items-center justify-center transition-colors"
                style={{ backgroundColor: viewMode === 'grid' ? 'hsl(var(--studio-line))' : 'hsl(var(--studio-panel))', color: viewMode === 'grid' ? 'hsl(var(--studio-ink))' : 'hsl(var(--studio-ink-3))' }}
              >
                <Grid2x2 className="h-2.5 w-2.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="h-6 w-6 flex items-center justify-center transition-colors"
                style={{ backgroundColor: viewMode === 'list' ? 'hsl(var(--studio-line))' : 'hsl(var(--studio-panel))', color: viewMode === 'list' ? 'hsl(var(--studio-ink))' : 'hsl(var(--studio-ink-3))' }}
              >
                <LayoutList className="h-2.5 w-2.5" />
              </button>
            </div>
            <span className="text-[9px] tabular-nums px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.08)', color: 'hsl(var(--studio-accent))', border: '1px solid hsl(var(--studio-accent) / 0.12)' }}>
              {COMPONENT_REGISTRY.length}
            </span>
          </div>
        </div>

        {/* Collapsible search */}
        {showSearch && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search className="h-3.5 w-3.5" style={{ position: 'absolute', left: '10px', color: 'hsl(var(--studio-ink-3))', pointerEvents: 'none' }} />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search components…"
              style={{
                width: '100%', height: '30px',
                padding: '0 28px 0 32px',
                fontSize: '11px', fontWeight: 500,
                backgroundColor: 'hsl(var(--studio-panel))',
                border: '1px solid hsl(var(--studio-line))',
                borderRadius: '8px',
                color: 'hsl(var(--studio-ink-2))',
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-raised))'; }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full hover:bg-white/10"
                style={{ color: 'hsl(var(--studio-ink-3))', fontSize: '10px' }}
              >✕</button>
            )}
          </div>
        )}

        {/* Category filter pills - wrapping */}
        {!filtered && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveCategory(null)}
              className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-1 rounded-md transition-all"
              style={{
                backgroundColor: !activeCategory ? 'hsl(var(--studio-accent) / 0.1)' : 'transparent',
                color: !activeCategory ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line-strong))',
                border: `1px solid ${!activeCategory ? 'hsl(var(--studio-accent) / 0.2)' : 'transparent'}`,
              }}
            >All</button>
            {CATEGORIES.map(cat => {
              const color = CATEGORY_COLORS[cat] || 'hsl(var(--studio-ink-3))';
              const isActive = activeCategory === cat;
              const count = categoryCounts[cat] || 0;
              if (count === 0) return null;
              return (
                <button key={cat} onClick={() => setActiveCategory(isActive ? null : cat)}
                  aria-pressed={isActive}
                  className={cn(
                    'flex items-center gap-1 rounded-[5px] px-2 py-1 text-[10.5px] font-medium leading-none transition-colors duration-100',
                    isActive
                      ? 'bg-[hsl(var(--studio-hover))] text-[hsl(var(--studio-ink))]'
                      : 'text-[hsl(var(--studio-ink-3))] hover:bg-[hsl(var(--studio-hover))] hover:text-[hsl(var(--studio-ink-2))]',
                  )}>
                  {cat}
                  <span className="text-[9.5px] tabular-nums opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick add bar - wrapping */}
        {!filtered && !activeCategory && (
          <div className="flex flex-wrap gap-1">
            {['section', 'container', 'heading', 'text', 'button', 'image'].map(type => {
              const color = CATEGORY_COLORS[COMPONENT_REGISTRY.find(c => c.type === type)?.category || 'Layout'] || 'hsl(var(--studio-accent))';
              return (
                <button
                  key={type}
                  onClick={() => handleClick(type as ElementType)}
                  className="flex items-center gap-1 h-5 px-1.5 rounded text-[8px] font-medium transition-all hover:brightness-110"
                  style={{
                    backgroundColor: `${color}08`,
                    border: `1px solid ${color}12`,
                    color: color,
                  }}
                >
                  <Plus className="h-2 w-2" />
                  {type}
                </button>
              );
            })}
          </div>
        )}

        {/* Favorites */}
        {!filtered && !activeCategory && favoriteComponents.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[hsl(var(--studio-ink-3))]">Favorites</span>
              <span className="text-[8px] tabular-nums px-1 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: 'hsl(var(--studio-warn))' }}>
                {favoriteComponents.length}
              </span>
            </div>
            <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-1' : 'space-y-1'}>
              {favoriteComponents.map((comp, i) => (
                <ComponentCard key={comp.type} comp={comp} index={i} onDragStart={handleDragStart} onClick={handleClick} viewMode={viewMode} isFavorite onToggleFavorite={handleToggleFavorite} />
              ))}
            </div>
          </div>
        )}

        {/* Recently used */}
        {!filtered && !activeCategory && recentComponents.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Zap className="h-3 w-3" style={{ color: 'hsl(var(--studio-accent))' }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[hsl(var(--studio-ink-3))]">Recent</span>
              <span className="text-[8px] tabular-nums px-1 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.1)', color: 'hsl(var(--studio-accent))' }}>
                {recentComponents.length}
              </span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {recentComponents.map((comp) => {
                const Icon = ICON_MAP[comp.icon] || Square;
                const catColor = CATEGORY_COLORS[comp.category] || 'hsl(var(--studio-ink-3))';
                return (
                  <motion.button
                    key={comp.type}
                    onClick={() => handleClick(comp.type as ElementType)}
                    draggable
                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, comp.type)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing select-none"
                    style={{
                      backgroundColor: 'hsl(var(--studio-panel))',
                      border: '1px solid hsl(var(--studio-line))',
                    }}
                    whileHover={{ borderColor: `${catColor}30`, backgroundColor: `${catColor}06` }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Icon className="h-3 w-3" style={{ color: catColor }} />
                    <span className="text-[9px] font-medium" style={{ color: 'hsl(var(--studio-ink-2))' }}>{comp.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtered or categorized */}
        {filtered ? (
          <div>
            <div className="text-[9px] font-medium mb-2 px-0.5 flex items-center gap-1.5" style={{ color: 'hsl(var(--studio-ink-3))' }}>
              <Search className="h-3 w-3" style={{ color: 'hsl(var(--studio-hover))' }} />
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "<span style={{ color: 'hsl(var(--studio-accent))' }}>{search}</span>"
            </div>
            <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-1' : 'space-y-1'}>
              {filtered.map((comp, i) => (
                <ComponentCard key={comp.type} comp={comp} index={i} onDragStart={handleDragStart} onClick={handleClick} viewMode={viewMode} isFavorite={favorites.includes(comp.type)} onToggleFavorite={handleToggleFavorite} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-3 text-center py-8">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-accent) / 0.06), hsl(var(--studio-accent) / 0.02))', border: '1px solid hsl(var(--studio-accent) / 0.08)' }}>
                    <Search className="w-5 h-5" style={{ color: 'hsl(var(--studio-accent) / 0.25)' }} />
                  </div>
                  <p className="text-[10px] font-medium" style={{ color: 'hsl(var(--studio-ink-3))' }}>No components found</p>
                  <button onClick={() => setSearch('')} className="text-[9px] mt-1" style={{ color: 'hsl(var(--studio-accent))' }}>Clear search</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          visibleCategories.map(cat => {
            const components = COMPONENT_REGISTRY.filter(c => c.category === cat);
            if (components.length === 0) return null;
            const isCollapsed = collapsed.includes(cat);
            const catColor = CATEGORY_COLORS[cat] || 'hsl(var(--studio-ink-3))';
            const CatIcon = CATEGORY_ICONS[cat] || Square;
            return (
              <div key={cat}>
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center gap-1.5 mb-2 px-0.5 group"
                >
                  <ChevronRight
                    className={`h-2.5 w-2.5 transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}
                    style={{ color: 'hsl(var(--studio-hover))' }}
                  />
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: `${catColor}12`, border: `1px solid ${catColor}18` }}>
                    <CatIcon className="h-2.5 w-2.5" style={{ color: catColor }} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] flex-1 text-left" style={{ color: 'hsl(var(--studio-ink-3))' }}>
                    {cat}
                  </span>
                  <span className="text-[8px] tabular-nums font-mono px-1 py-0.5 rounded" style={{ backgroundColor: `${catColor}08`, color: catColor }}>
                    {components.length}
                  </span>
                </button>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-1' : 'space-y-1'}>
                        {components.map((comp, i) => (
                          <ComponentCard key={comp.type} comp={comp} index={i} onDragStart={handleDragStart} onClick={handleClick} viewMode={viewMode} isFavorite={favorites.includes(comp.type)} onToggleFavorite={handleToggleFavorite} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}

        {/* Component count */}
        <div className="text-center pt-2 pb-4">
          <span className="text-[10px]" style={{ color: 'hsl(var(--studio-hover))' }}>{COMPONENT_REGISTRY.length} components • {CATEGORIES.length} categories</span>
        </div>
      </div>
    </ScrollArea>
  );
}

const ComponentCard = memo(function ComponentCard({ comp, index, onDragStart, onClick, viewMode, isFavorite, onToggleFavorite }: {
  comp: typeof COMPONENT_REGISTRY[0];
  index: number;
  onDragStart: (e: React.DragEvent, type: ElementType) => void;
  onClick: (type: ElementType) => void;
  viewMode: ViewMode;
  isFavorite: boolean;
  onToggleFavorite: (type: string) => void;
}) {
  const Icon = ICON_MAP[comp.icon] || Square;
  const catColor = CATEGORY_COLORS[comp.category] || 'hsl(var(--studio-ink-3))';

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.015, duration: 0.2 }}
        draggable
        onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, comp.type)}
        onClick={() => onClick(comp.type)}
        /* One row object, the same height and hover as the layers tree and
           the pages list. No card chrome, no repeated category caption -
           the rows already sit under their category's own heading. */
        className={cn(ROW, 'cursor-grab active:cursor-grabbing')}
      >
        <Icon className={GLYPH} />
        <span className="min-w-0 flex-1 truncate">{comp.label}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(comp.type); }}
          aria-label={isFavorite ? `Unpin ${comp.label}` : `Pin ${comp.label}`}
          className={cn(
            'grid h-5 w-5 shrink-0 place-items-center rounded-[4px] transition-opacity',
            'hover:bg-[hsl(var(--studio-raised))]',
            isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          )}
        >
          <Star className={cn('h-3 w-3', isFavorite
            ? 'fill-[hsl(var(--studio-accent))] text-[hsl(var(--studio-accent))]'
            : 'text-[hsl(var(--studio-ink-3))]')} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.15 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, comp.type)}
      onClick={() => onClick(comp.type)}
      className="flex flex-col items-center gap-1 p-1.5 rounded-lg cursor-grab active:cursor-grabbing select-none group relative"
      style={{
        backgroundColor: 'hsl(var(--studio-panel))',
        border: '1px solid hsl(var(--studio-line))',
        transition: 'all 0.2s ease',
      }}
      whileHover={{
        borderColor: `${catColor}30`,
        backgroundColor: `${catColor}04`,
      }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Favorite button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(comp.type); }}
        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 flex items-center justify-center rounded hover:bg-white/[0.08]"
        style={{ opacity: isFavorite ? 1 : undefined }}
      >
        <Star className={`h-2 w-2 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-[hsl(var(--studio-ink-3))]'}`} />
      </button>
      {/* Category dot */}
      <div className="absolute top-1 left-1 w-1 h-1 rounded-full" style={{ backgroundColor: catColor }} />
      <div style={{
        width: '24px', height: '24px', borderRadius: '6px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${catColor}10, transparent)`,
        border: `1px solid ${catColor}15`,
      }}>
        <Icon className="h-3 w-3" style={{ color: catColor }} />
      </div>
      <span className="text-[8px] leading-tight font-medium truncate w-full text-center" style={{ color: 'hsl(var(--studio-ink-2))' }}>{comp.label}</span>
    </motion.div>
  );
});
