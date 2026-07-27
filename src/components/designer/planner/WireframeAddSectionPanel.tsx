import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { ALL_SECTION_BLOCKS, SECTION_CATEGORIES, SectionBlock } from '../constants/sectionBlocks';
import { SectionPreview } from '../SectionPreview';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WireframeAddSectionPanelProps {
  onAdd: (block: SectionBlock) => void;
  onClose: () => void;
}

export function WireframeAddSectionPanel({ onAdd, onClose }: WireframeAddSectionPanelProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    return ALL_SECTION_BLOCKS.filter(b => {
      const matchesCat = activeCategory === 'All' || b.category === activeCategory;
      const matchesSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, search]);

  const activeCategories = SECTION_CATEGORIES.filter(cat =>
    ALL_SECTION_BLOCKS.some(b => b.category === cat)
  );

  return (
    <div
      className="w-[280px] flex flex-col h-full shrink-0"
      style={{ backgroundColor: '#1e1e1e', borderRight: '1px solid #2a2a2a' }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <span className="text-xs font-semibold text-[#e0e0e0]">Add Section</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
          <X className="h-3.5 w-3.5 text-[#888]" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sections…"
            className="w-full pl-8 pr-3 py-2 rounded-md text-xs text-[#e0e0e0] placeholder:text-[#555] outline-none"
            style={{ backgroundColor: '#252525', border: '1px solid #333' }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-3 py-2 flex flex-wrap gap-1" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <button
          onClick={() => setActiveCategory('All')}
          className="px-2 py-1 rounded text-[9px] font-medium"
          style={{
            backgroundColor: activeCategory === 'All' ? '#0073E6' : '#252525',
            color: activeCategory === 'All' ? '#fff' : '#888',
            border: `1px solid ${activeCategory === 'All' ? '#0073E6' : '#333'}`,
          }}
        >
          All
        </button>
        {activeCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-2 py-1 rounded text-[9px] font-medium"
            style={{
              backgroundColor: activeCategory === cat ? '#0073E6' : '#252525',
              color: activeCategory === cat ? '#fff' : '#888',
              border: `1px solid ${activeCategory === cat ? '#0073E6' : '#333'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sections list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filtered.map(block => (
            <button
              key={block.id}
              onClick={() => onAdd(block)}
              className="w-full rounded-md overflow-hidden transition-all hover:ring-1 hover:ring-[#0073E6] text-left"
              style={{ border: '1px solid #333' }}
            >
              <SectionPreview elements={block.elements} />
              <div className="px-2 py-1.5" style={{ backgroundColor: '#1e1e1e' }}>
                <div className="text-[9px] font-medium text-[#e0e0e0]">{block.name}</div>
                <div className="text-[8px] text-[#666]">{block.description}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-[10px] text-[#555]">No sections found</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
