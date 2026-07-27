import { useState } from 'react';
import { X, ChevronRight, Sparkles, ArrowUp, ArrowDown, Trash2, Copy, Layers } from 'lucide-react';
import { EditorElement } from '../types';
import { ALL_SECTION_BLOCKS, SECTION_CATEGORIES, SectionBlock } from '../constants/sectionBlocks';
import { SectionPreview } from '../SectionPreview';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WireframeSectionEditorProps {
  section: EditorElement | null;
  sectionIndex: number;
  totalSections: number;
  onClose: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReplace: (block: SectionBlock) => void;
}

export function WireframeSectionEditor({
  section, sectionIndex, totalSections,
  onClose, onMoveUp, onMoveDown, onDuplicate, onDelete, onReplace,
}: WireframeSectionEditorProps) {
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [layoutCategory, setLayoutCategory] = useState<string | null>(null);

  if (!section) return null;

  const label = section.name || section.type.charAt(0).toUpperCase() + section.type.slice(1);

  // Detect category from section type
  const detectCategory = (): string => {
    if (section.type === 'navbar') return 'Navbars';
    if (section.type === 'footer') return 'Footers';
    const name = (section.name || '').toLowerCase();
    if (name.includes('hero')) return 'Heroes';
    if (name.includes('feature')) return 'Features';
    if (name.includes('cta') || name.includes('call')) return 'CTA';
    if (name.includes('testimonial')) return 'Testimonials';
    if (name.includes('pricing')) return 'Pricing';
    if (name.includes('faq')) return 'FAQ';
    if (name.includes('contact')) return 'Contact';
    if (name.includes('gallery')) return 'Gallery';
    if (name.includes('stat')) return 'Stats';
    if (name.includes('team')) return 'Team';
    if (name.includes('logo')) return 'Logos';
    return 'Content';
  };

  const currentCategory = layoutCategory || detectCategory();
  const layoutOptions = ALL_SECTION_BLOCKS.filter(b => b.category === currentCategory);
  const availableCategories = SECTION_CATEGORIES.filter(c => ALL_SECTION_BLOCKS.some(b => b.category === c));

  return (
    <div
      className="w-[280px] flex flex-col h-full shrink-0"
      style={{ backgroundColor: '#1e1e1e', borderRight: '1px solid #2a2a2a' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <span className="text-xs font-semibold text-[#e0e0e0]">Section</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5 transition-colors">
          <X className="h-3.5 w-3.5 text-[#888]" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Section name */}
          <div>
            <label className="text-[9px] font-semibold text-[#888] uppercase tracking-wider">Name</label>
            <div className="mt-1 px-3 py-2 rounded-md text-xs text-[#e0e0e0]" style={{ backgroundColor: '#252525', border: '1px solid #333' }}>
              {label}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-[9px] font-semibold text-[#888] uppercase tracking-wider">Preview</label>
            <div className="mt-1 rounded-md overflow-hidden" style={{ border: '1px solid #333' }}>
              <SectionPreview elements={[section]} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5">
            <button
              onClick={onMoveUp}
              disabled={sectionIndex === 0}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-colors disabled:opacity-30"
              style={{ backgroundColor: '#252525', color: '#888', border: '1px solid #333' }}
            >
              <ArrowUp className="h-3 w-3" /> Up
            </button>
            <button
              onClick={onMoveDown}
              disabled={sectionIndex >= totalSections - 1}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-colors disabled:opacity-30"
              style={{ backgroundColor: '#252525', color: '#888', border: '1px solid #333' }}
            >
              <ArrowDown className="h-3 w-3" /> Down
            </button>
            <button
              onClick={onDuplicate}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-colors hover:bg-white/5"
              style={{ backgroundColor: '#252525', color: '#888', border: '1px solid #333' }}
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>

          {/* Divider */}
          <div className="h-[1px]" style={{ backgroundColor: '#2a2a2a' }} />

          {/* Layout picker toggle */}
          <button
            onClick={() => setShowLayoutPicker(!showLayoutPicker)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
            style={{ backgroundColor: '#252525', color: '#e0e0e0', border: '1px solid #333' }}
          >
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-[#0073E6]" />
              <span>Replace Layout</span>
            </div>
            <ChevronRight className={`h-3.5 w-3.5 text-[#666] transition-transform ${showLayoutPicker ? 'rotate-90' : ''}`} />
          </button>

          {/* Layout picker */}
          {showLayoutPicker && (
            <div className="space-y-2">
              {/* Category pills */}
              <div className="flex flex-wrap gap-1">
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setLayoutCategory(cat)}
                    className="px-2 py-1 rounded text-[9px] font-medium transition-colors"
                    style={{
                      backgroundColor: currentCategory === cat ? '#0073E6' : '#252525',
                      color: currentCategory === cat ? '#fff' : '#888',
                      border: `1px solid ${currentCategory === cat ? '#0073E6' : '#333'}`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Layout options */}
              <div className="space-y-2">
                {layoutOptions.slice(0, 8).map(block => (
                  <button
                    key={block.id}
                    onClick={() => onReplace(block)}
                    className="w-full rounded-md overflow-hidden transition-all hover:ring-1 hover:ring-[#0073E6]"
                    style={{ border: '1px solid #333' }}
                  >
                    <SectionPreview elements={block.elements} />
                    <div className="px-2 py-1.5 text-left" style={{ backgroundColor: '#1e1e1e' }}>
                      <div className="text-[9px] font-medium text-[#e0e0e0]">{block.name}</div>
                      <div className="text-[8px] text-[#666]">{block.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-[1px]" style={{ backgroundColor: '#2a2a2a' }} />

          {/* Delete */}
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-medium transition-colors hover:bg-red-500/10"
            style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <Trash2 className="h-3 w-3" /> Remove Section
          </button>
        </div>
      </ScrollArea>
    </div>
  );
}
