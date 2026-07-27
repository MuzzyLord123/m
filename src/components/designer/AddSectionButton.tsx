import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronRight, Search } from 'lucide-react';
import { useEditor } from './EditorContext';
import { ALL_SECTION_BLOCKS, SectionCategory } from './constants/sectionBlocks';
import { EditorElement } from './types';
import { SectionPreview } from './SectionPreview';

const QUICK_CATEGORIES: SectionCategory[] = ['Heroes', 'Features', 'Content', 'CTA', 'Testimonials', 'Pricing', 'FAQ', 'Contact', 'Footers'];

export function AddSectionButton() {
  const { state, dispatch } = useEditor();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SectionCategory>('Heroes');
  const [search, setSearch] = useState('');

  const sections = useMemo(() => {
    const catSections = ALL_SECTION_BLOCKS.filter(b => b.category === activeCategory);
    if (!search.trim()) return catSections;
    const q = search.toLowerCase();
    return catSections.filter(b => b.name.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q));
  }, [activeCategory, search]);

  const allCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of QUICK_CATEGORIES) {
      counts[cat] = ALL_SECTION_BLOCKS.filter(b => b.category === cat).length;
    }
    return counts;
  }, []);

  if (state.elements.length === 0) return null;

  const insertSection = (elements: EditorElement[]) => {
    const fresh = JSON.parse(JSON.stringify(elements)) as EditorElement[];
    const assignIds = (els: EditorElement[]) => {
      for (const el of els) {
        el.id = crypto.randomUUID();
        if (el.children) assignIds(el.children);
      }
    };
    assignIds(fresh);
    fresh.forEach(el => dispatch({ type: 'ADD_ELEMENT', payload: { element: el } }));
    setOpen(false);
  };


  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setOpen(true)}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all hover:scale-105"
        style={{
          backgroundColor: 'rgba(0, 115, 230, 0.9)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(0,115,230,0.4)',
          backdropFilter: 'blur(8px)',
        }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Section
      </motion.button>

      {/* Section picker overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative z-10 w-full max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden flex"
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* Categories sidebar */}
              <div className="w-48 shrink-0 border-r border-[#2a2a2a] p-3 space-y-1 overflow-y-auto" style={{ backgroundColor: '#161616' }}>
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#555] mb-3 px-2">Categories</div>
                {QUICK_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setSearch(''); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-medium flex items-center justify-between transition-all ${
                      activeCategory === cat ? 'bg-[#0073E6]/15 text-[#4da6ff]' : 'text-[#888] hover:text-[#ccc] hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{cat}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] tabular-nums px-1 py-0.5 rounded" style={{
                        backgroundColor: activeCategory === cat ? 'rgba(0,115,230,0.15)' : 'rgba(255,255,255,0.04)',
                        color: activeCategory === cat ? '#4da6ff' : '#555',
                      }}>
                        {allCategoryCounts[cat] || 0}
                      </span>
                      <ChevronRight className={`h-3 w-3 transition-opacity ${activeCategory === cat ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Sections grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#e0e0e0]">{activeCategory}</h3>
                    <p className="text-[10px] text-[#666]">{sections.length} sections available</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors">
                    <X className="h-4 w-4 text-[#666]" />
                  </button>
                </div>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: '#555' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={`Search ${activeCategory.toLowerCase()}…`}
                    className="w-full h-8 pl-8 pr-3 rounded-lg text-[11px] outline-none"
                    style={{ backgroundColor: '#222', border: '1px solid #2a2a2a', color: '#ddd' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#0073E6'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#2a2a2a'; }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {sections.map(block => (
                    <motion.button
                      key={block.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => insertSection(block.elements)}
                      className="rounded-lg overflow-hidden text-left transition-all group"
                      style={{ backgroundColor: '#222', border: '1px solid #2a2a2a' }}
                    >
                      <SectionPreview elements={block.elements} />
                      <div className="p-2.5">
                        <div className="text-[11px] font-semibold text-[#ddd] mb-0.5">{block.name}</div>
                        <div className="text-[9px] text-[#666] leading-snug">{block.description}</div>
                      </div>
                      <div className="px-2.5 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 text-[9px] font-semibold text-[#0073E6]">
                          <Plus className="h-2.5 w-2.5" /> Click to add
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
