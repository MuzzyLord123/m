import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_SECTION_BLOCKS, SECTION_CATEGORIES, SectionCategory, SectionBlock } from './constants/sectionBlocks';
import { EditorElement } from './types';
import { useEditor } from './EditorContext';
import { SectionPreview } from './SectionPreview';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, LayoutGrid, Plus, ChevronRight, Star, Layers, Sparkles } from 'lucide-react';

const CATEGORY_COLORS: Partial<Record<SectionCategory, string>> = {
  Navbars: '#6366f1', Heroes: '#ec4899', Features: '#10b981', Content: '#f59e0b',
  CTA: '#ef4444', Testimonials: '#8b5cf6', Pricing: '#06b6d4', FAQ: '#84cc16',
  Team: '#f97316', Stats: '#14b8a6', Gallery: '#a855f7', Logos: '#64748b',
  Contact: '#3b82f6', Footers: '#78716c', Banners: '#e11d48',
};

const FAVORITES_KEY = 'workshop-section-favorites';
function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; }
}

export function SectionsLibrary() {
  const { dispatch } = useEditor();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [favorites, setFavorites] = useState(getFavorites);

  const toggleCollapse = (cat: string) => setCollapsed(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const toggleFav = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  const filtered = useMemo(() => {
    return ALL_SECTION_BLOCKS.filter(b => {
      const matchesCat = activeCategory === 'All' || b.category === activeCategory;
      const matchesSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.description.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, search]);

  const insertSection = (block: SectionBlock) => {
    const freshElements = JSON.parse(JSON.stringify(block.elements)) as EditorElement[];
    const assignIds = (els: EditorElement[]) => {
      for (const el of els) {
        el.id = crypto.randomUUID();
        if (el.children) assignIds(el.children);
      }
    };
    assignIds(freshElements);
    freshElements.forEach(el => dispatch({ type: 'ADD_ELEMENT', payload: { element: el } }));
  };

  const activeCategories = SECTION_CATEGORIES.filter(cat => ALL_SECTION_BLOCKS.some(b => b.category === cat));

  const groupedByCategory = useMemo(() => {
    if (activeCategory !== 'All' || search) return null;
    const groups: Record<string, SectionBlock[]> = {};
    for (const block of ALL_SECTION_BLOCKS) {
      if (!groups[block.category]) groups[block.category] = [];
      groups[block.category].push(block);
    }
    return groups;
  }, [activeCategory, search]);

  const favoriteBlocks = useMemo(() => ALL_SECTION_BLOCKS.filter(b => favorites.includes(b.id)), [favorites]);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.15)' }}>
              <Layers className="h-3 w-3" style={{ color: '#8b5cf6' }} />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: '#ccc' }}>Sections</span>
          </div>
          <span className="text-[9px] tabular-nums px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(139,92,246,0.08)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.1)' }}>
            {ALL_SECTION_BLOCKS.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: '#555' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search sections…`}
            className="w-full h-7 pl-7 pr-3 rounded-lg text-[10px] outline-none transition-colors"
            style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a', color: '#ddd' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(139,92,246,0.08)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full hover:bg-white/10" style={{ color: '#555', fontSize: '9px' }}>✕</button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-0.5">
          <button
            onClick={() => setActiveCategory('All')}
            className="px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wider transition-all"
            style={{
              backgroundColor: activeCategory === 'All' ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: activeCategory === 'All' ? '#8b5cf6' : '#666',
              border: `1px solid ${activeCategory === 'All' ? 'rgba(139,92,246,0.25)' : 'transparent'}`,
            }}
          >
            All
          </button>
          {activeCategories.map(cat => {
            const catColor = CATEGORY_COLORS[cat] || '#555';
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: activeCategory === cat ? `${catColor}15` : 'transparent',
                  color: activeCategory === cat ? catColor : '#666',
                  border: `1px solid ${activeCategory === cat ? `${catColor}30` : 'transparent'}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Favorites */}
        {!search && favoriteBlocks.length > 0 && activeCategory === 'All' && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#555' }}>Favorites</span>
              <span className="text-[7px] tabular-nums px-1 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{favoriteBlocks.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {favoriteBlocks.map(block => (
                <SectionCard key={block.id} block={block} hovered={hoveredId === block.id} onHover={setHoveredId} onInsert={insertSection} isFavorite onToggleFavorite={toggleFav} />
              ))}
            </div>
          </div>
        )}

        {/* Count bar */}
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-2.5 w-2.5" style={{ color: '#444' }} />
          <span className="text-[9px] tabular-nums" style={{ color: '#555' }}>
            {filtered.length} section{filtered.length !== 1 ? 's' : ''}
            {search && ` for "${search}"`}
          </span>
        </div>

        {/* Grouped or flat list */}
        {groupedByCategory ? (
          Object.entries(groupedByCategory).map(([category, blocks]) => {
            const catColor = CATEGORY_COLORS[category as SectionCategory] || '#555';
            const isCollapsed = collapsed.includes(category);
            return (
              <div key={category}>
                <button onClick={() => toggleCollapse(category)} className="flex items-center gap-1.5 mb-1.5 mt-2 w-full group">
                  <ChevronRight className={`h-2.5 w-2.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} style={{ color: '#444' }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider flex-1 text-left" style={{ color: '#888' }}>{category}</span>
                  <span className="text-[8px] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#444' }}>{blocks.length}</span>
                </button>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
                      <div className="grid grid-cols-1 gap-1.5">
                        {blocks.map(block => (
                          <SectionCard key={block.id} block={block} hovered={hoveredId === block.id} onHover={setHoveredId} onInsert={insertSection} isFavorite={favorites.includes(block.id)} onToggleFavorite={toggleFav} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            <AnimatePresence mode="popLayout">
              {filtered.map(block => (
                <SectionCard key={block.id} block={block} hovered={hoveredId === block.id} onHover={setHoveredId} onInsert={insertSection} isFavorite={favorites.includes(block.id)} onToggleFavorite={toggleFav} />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="text-center py-8" style={{ color: '#555', fontSize: '11px' }}>No sections found</div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function SectionCard({ block, hovered, onHover, onInsert, isFavorite, onToggleFavorite }: {
  block: SectionBlock; hovered: boolean; onHover: (id: string | null) => void; onInsert: (block: SectionBlock) => void; isFavorite: boolean; onToggleFavorite: (id: string) => void;
}) {
  const accentColor = CATEGORY_COLORS[block.category] || '#555';
  const elementCount = countElements(block.elements);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="group rounded-lg overflow-hidden cursor-pointer"
      style={{
        backgroundColor: '#1e1e1e',
        border: `1px solid ${hovered ? `${accentColor}40` : '#252525'}`,
        transition: 'border-color 0.2s ease',
      }}
      onMouseEnter={() => onHover(block.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onInsert(block)}
    >
      <SectionPreview elements={block.elements} />
      <div className="p-2">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
            <span className="text-[10px] font-semibold truncate" style={{ color: '#ddd' }}>{block.name}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={e => { e.stopPropagation(); onToggleFavorite(block.id); }}
              className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-white/[0.06] transition-all"
              style={{ opacity: isFavorite ? 1 : undefined }}
            >
              <Star className={`h-2.5 w-2.5 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-[#555]'}`} />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}25` }}
            >
              <Plus className="h-2.5 w-2.5" style={{ color: accentColor }} />
              <span className="text-[8px] font-semibold" style={{ color: accentColor }}>Add</span>
            </motion.div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[8px] leading-snug flex-1 truncate" style={{ color: '#555' }}>{block.description}</p>
          <span className="text-[7px] tabular-nums shrink-0" style={{ color: '#444' }}>{elementCount} els</span>
        </div>
      </div>
    </motion.div>
  );
}

function countElements(els: EditorElement[]): number {
  let count = els.length;
  for (const el of els) {
    if (el.children) count += countElements(el.children);
  }
  return count;
}
