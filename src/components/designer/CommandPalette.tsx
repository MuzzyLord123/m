import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor } from './EditorContext';
import { createElement } from './utils/elementFactory';
import { ElementType } from './types';
import { COMPONENT_REGISTRY } from './constants/componentRegistry';
import {
  Search, LayoutGrid, Layers, FileText, Eye, Download, Undo2, Redo2,
  Trash2, Copy, Lock, Unlock, EyeOff, Monitor, Tablet, Smartphone,
  ZoomIn, ZoomOut, Save, Palette, Blocks, Database, ShoppingBag,
  Code2, History, Zap, PaintBucket, FormInput, Sparkles, Command,
  ArrowUp, ArrowDown, WrapText, FlipHorizontal2, Sun, Moon,
  Hash, Clock,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  category: string;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
  priority?: number;
}

const CATEGORY_ICONS: Record<string, { icon: typeof Search; color: string }> = {
  Recent: { icon: Clock, color: '#f59e0b' },
  Navigate: { icon: LayoutGrid, color: '#3b82f6' },
  Edit: { icon: Undo2, color: '#22c55e' },
  View: { icon: Eye, color: '#8b5cf6' },
  Breakpoint: { icon: Monitor, color: '#0ea5e9' },
  Element: { icon: Layers, color: '#ec4899' },
  'Add Component': { icon: Sparkles, color: '#a855f7' },
};

let recentCommandIds: string[] = [];
const MAX_RECENT = 5;
function addToRecent(id: string) { recentCommandIds = [id, ...recentCommandIds.filter(r => r !== id)].slice(0, MAX_RECENT); }

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<span style={{ color: '#0073E6', fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</span>{text.slice(idx + query.length)}</>;
}

export function CommandPalette() {
  const { state, dispatch, selectedElement, wrapInContainer, moveSelectedUp, moveSelectedDown, saveToDatabase } = useEditor();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(v => !v); setSearch(''); setSelectedIndex(0); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];
    items.push(
      { id: 'tab-components', label: 'Components', description: 'Open component library', icon: LayoutGrid, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'components' }), priority: 1 },
      { id: 'tab-sections', label: 'Sections', description: 'Browse section templates', icon: Blocks, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'sections' }), priority: 1 },
      { id: 'tab-pages', label: 'Pages', description: 'Manage site pages', icon: FileText, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'pages' }), priority: 1 },
      { id: 'tab-layers', label: 'Layers', description: 'Element tree navigator', icon: Layers, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'layers' }), priority: 1 },
      { id: 'tab-design', label: 'Design', description: 'Design system presets', icon: Palette, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'design' }) },
      { id: 'tab-cms', label: 'CMS', description: 'Content management', icon: Database, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'cms' }) },
      { id: 'tab-products', label: 'Products', description: 'E-commerce products', icon: ShoppingBag, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'products' }) },
      { id: 'tab-interactions', label: 'Interactions', description: 'Animation triggers', icon: Zap, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'interactions' }) },
      { id: 'tab-styles', label: 'Advanced Styles', description: 'Layout & filters', icon: PaintBucket, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'styles' }) },
      { id: 'tab-forms', label: 'Forms', description: 'Form builder', icon: FormInput, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'forms' }) },
      { id: 'tab-history', label: 'History', description: 'Version history', icon: History, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'history' }) },
      { id: 'tab-embed', label: 'Embed', description: 'Custom code & embeds', icon: Code2, category: 'Navigate', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'embed' }) },
    );
    items.push(
      { id: 'undo', label: 'Undo', icon: Undo2, category: 'Edit', shortcut: '⌘Z', action: () => dispatch({ type: 'UNDO' }), priority: 2 },
      { id: 'redo', label: 'Redo', icon: Redo2, category: 'Edit', shortcut: '⌘⇧Z', action: () => dispatch({ type: 'REDO' }), priority: 2 },
      { id: 'save', label: 'Save', icon: Save, category: 'Edit', shortcut: '⌘S', action: () => saveToDatabase(), priority: 3 },
      { id: 'preview', label: 'Toggle Preview', icon: Eye, category: 'View', action: () => dispatch({ type: 'TOGGLE_PREVIEW' }), priority: 2 },
    );
    items.push(
      { id: 'bp-desktop', label: 'Desktop View', icon: Monitor, category: 'Breakpoint', shortcut: '1', action: () => dispatch({ type: 'SET_BREAKPOINT', payload: 'desktop' }) },
      { id: 'bp-tablet', label: 'Tablet View', icon: Tablet, category: 'Breakpoint', shortcut: '2', action: () => dispatch({ type: 'SET_BREAKPOINT', payload: 'tablet' }) },
      { id: 'bp-mobile', label: 'Mobile View', icon: Smartphone, category: 'Breakpoint', shortcut: '3', action: () => dispatch({ type: 'SET_BREAKPOINT', payload: 'mobile' }) },
    );
    items.push(
      { id: 'zoom-in', label: 'Zoom In', icon: ZoomIn, category: 'View', shortcut: '⌘+', action: () => dispatch({ type: 'SET_ZOOM', payload: state.zoom + 0.1 }) },
      { id: 'zoom-out', label: 'Zoom Out', icon: ZoomOut, category: 'View', shortcut: '⌘-', action: () => dispatch({ type: 'SET_ZOOM', payload: state.zoom - 0.1 }) },
      { id: 'zoom-fit', label: 'Zoom to 100%', icon: ZoomIn, category: 'View', shortcut: '⌘0', action: () => dispatch({ type: 'SET_ZOOM', payload: 1 }) },
      { id: 'zoom-50', label: 'Zoom to 50%', icon: ZoomOut, category: 'View', action: () => dispatch({ type: 'SET_ZOOM', payload: 0.5 }) },
      { id: 'zoom-150', label: 'Zoom to 150%', icon: ZoomIn, category: 'View', action: () => dispatch({ type: 'SET_ZOOM', payload: 1.5 }) },
    );
    if (selectedElement) {
      items.push(
        { id: 'duplicate', label: 'Duplicate Element', icon: Copy, category: 'Element', shortcut: '⌘D', action: () => dispatch({ type: 'DUPLICATE_ELEMENT', payload: selectedElement.id }), priority: 3 },
        { id: 'delete', label: 'Delete Element', icon: Trash2, category: 'Element', shortcut: 'Del', action: () => dispatch({ type: 'DELETE_ELEMENT', payload: selectedElement.id }), priority: 3 },
        { id: 'wrap', label: 'Wrap in Container', icon: WrapText, category: 'Element', shortcut: '⌘G', action: wrapInContainer },
        { id: 'move-up', label: 'Move Up', icon: ArrowUp, category: 'Element', shortcut: '⌥↑', action: moveSelectedUp },
        { id: 'move-down', label: 'Move Down', icon: ArrowDown, category: 'Element', shortcut: '⌥↓', action: moveSelectedDown },
        { id: 'toggle-lock', label: selectedElement.locked ? 'Unlock Element' : 'Lock Element', icon: selectedElement.locked ? Unlock : Lock, category: 'Element', action: () => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { locked: !selectedElement.locked } } }) },
        { id: 'toggle-vis', label: selectedElement.hidden ? 'Show Element' : 'Hide Element', icon: selectedElement.hidden ? Eye : EyeOff, category: 'Element', action: () => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { hidden: !selectedElement.hidden } } }) },
      );
    }
    COMPONENT_REGISTRY.slice(0, 30).forEach(comp => {
      items.push({ id: `add-${comp.type}`, label: `Add ${comp.label}`, description: comp.category, icon: Sparkles, category: 'Add Component', keywords: [comp.type, comp.category], action: () => dispatch({ type: 'ADD_ELEMENT', payload: { element: createElement(comp.type as ElementType) } }) });
    });
    return items;
  }, [state, selectedElement, dispatch, wrapInContainer, moveSelectedUp, moveSelectedDown, saveToDatabase]);

  // Fuzzy matching with scoring
  const filtered = useMemo(() => {
    if (!search.trim()) return commands;
    const q = search.toLowerCase();
    const scored = commands.map(c => {
      let score = 0;
      const label = c.label.toLowerCase();
      const cat = c.category.toLowerCase();
      const desc = c.description?.toLowerCase() || '';
      
      // Exact prefix match = highest
      if (label.startsWith(q)) score += 100;
      // Word boundary match
      else if (label.split(' ').some(w => w.startsWith(q))) score += 80;
      // Contains match
      else if (label.includes(q)) score += 60;
      // Category match
      else if (cat.includes(q)) score += 40;
      // Description match
      else if (desc.includes(q)) score += 30;
      // Keyword match
      else if (c.keywords?.some(k => k.toLowerCase().includes(q))) score += 20;
      // Initials match (e.g. "ac" → "Add Component")
      else {
        const initials = c.label.split(' ').map(w => w[0]?.toLowerCase()).join('');
        if (initials.includes(q)) score += 50;
      }
      
      // Priority boost
      score += (c.priority || 0) * 5;
      
      return { item: c, score };
    }).filter(s => s.score > 0);
    
    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.item);
  }, [search, commands]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    if (!search.trim() && recentCommandIds.length > 0) {
      const recent = recentCommandIds.map(id => commands.find(c => c.id === id)).filter(Boolean) as CommandItem[];
      if (recent.length > 0) map.set('Recent', recent);
    }
    filtered.forEach(item => {
      if (map.get('Recent')?.some(r => r.id === item.id)) return;
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    });
    return map;
  }, [filtered, search, commands]);

  const flatItems = useMemo(() => { const items: CommandItem[] = []; grouped.forEach(group => items.push(...group)); return items; }, [grouped]);

  useEffect(() => { setSelectedIndex(0); }, [search]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && flatItems[selectedIndex]) { e.preventDefault(); addToRecent(flatItems[selectedIndex].id); flatItems[selectedIndex].action(); setOpen(false); }
  }, [flatItems, selectedIndex]);

  useEffect(() => { const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`); el?.scrollIntoView({ block: 'nearest' }); }, [selectedIndex]);

  if (!open) return null;

  let globalIdx = 0;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-start justify-center pt-[12vh]" onClick={() => setOpen(false)}>
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="relative w-[560px] max-h-[460px] flex flex-col rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#151515', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 80px rgba(0,115,230,0.05)' }}
          onClick={e => e.stopPropagation()}>

          {/* Search with gradient border */}
          <div className="relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,115,230,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(0,115,230,0.12)' }}>
                <Search className="h-3.5 w-3.5" style={{ color: '#0073E6' }} />
              </div>
              <input
                ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Search commands, components, actions…"
                className="flex-1 bg-transparent text-[13px] text-[#e0e0e0] placeholder:text-[#444] outline-none"
              />
              <div className="flex items-center gap-1">
                {search && (
                  <span className="text-[8px] tabular-nums px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(0,115,230,0.08)', color: '#0073E6' }}>
                    {flatItems.length}
                  </span>
                )}
                <kbd className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: '#222', color: '#555', border: '1px solid #2a2a2a' }}>ESC</kbd>
              </div>
            </div>
            {/* Active search indicator */}
            {search && (
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{ background: 'linear-gradient(90deg, transparent, #0073E6, transparent)', transformOrigin: 'center' }} />
            )}
          </div>

          {/* Quick filters when no search */}
          {!search.trim() && (
            <div className="flex items-center gap-1 px-5 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              {Object.entries(CATEGORY_ICONS).filter(([k]) => k !== 'Recent').map(([category, { icon: Icon, color }]) => {
                const count = commands.filter(c => c.category === category).length;
                if (count === 0) return null;
                return (
                  <button key={category} onClick={() => setSearch(category)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-semibold uppercase tracking-wider transition-all"
                    style={{ backgroundColor: 'transparent', color: '#444' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${color}10`; e.currentTarget.style.color = color; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#444'; }}>
                    <Icon className="h-2.5 w-2.5" /> {category}
                  </button>
                );
              })}
            </div>
          )}

          {/* Results */}
          <div ref={listRef} className="flex-1 overflow-y-auto py-1.5" style={{ maxHeight: '370px' }}>
            {flatItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,115,230,0.06), rgba(139,92,246,0.04))', border: '1px solid rgba(0,115,230,0.08)' }}>
                  <Search className="h-5 w-5" style={{ color: 'rgba(0,115,230,0.3)' }} />
                </div>
                <div className="text-[12px] font-medium" style={{ color: '#555' }}>No results for "{search}"</div>
                <div className="text-[10px] mt-1" style={{ color: '#333' }}>Try a different search term</div>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([category, items]) => {
                const catConfig = CATEGORY_ICONS[category] || { icon: Hash, color: '#555' };
                const CatIcon = catConfig.icon;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 px-5 py-1.5">
                      <CatIcon className="h-2.5 w-2.5" style={{ color: catConfig.color }} />
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: catConfig.color }}>{category}</span>
                      <span className="text-[7px] tabular-nums" style={{ color: '#333' }}>{items.length}</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: `${catConfig.color}08` }} />
                    </div>
                    {items.map(item => {
                      const idx = globalIdx++;
                      const Icon = item.icon;
                      const isSel = idx === selectedIndex;
                      const itemColor = CATEGORY_ICONS[item.category]?.color || '#0073E6';
                      return (
                        <button key={item.id} data-index={idx}
                          onClick={() => { addToRecent(item.id); item.action(); setOpen(false); }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className="w-full flex items-center gap-3 px-5 py-[7px] text-left transition-all"
                          style={{
                            backgroundColor: isSel ? `${itemColor}08` : 'transparent',
                            borderLeft: isSel ? `2px solid ${itemColor}` : '2px solid transparent',
                          }}>
                          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: isSel ? `${itemColor}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${isSel ? `${itemColor}20` : 'rgba(255,255,255,0.04)'}` }}>
                            <Icon className="h-3 w-3" style={{ color: isSel ? itemColor : '#666' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium truncate" style={{ color: isSel ? '#fff' : '#bbb' }}>{highlightMatch(item.label, search)}</div>
                            {item.description && <div className="text-[9px] truncate mt-0.5" style={{ color: '#444' }}>{item.description}</div>}
                          </div>
                          {item.shortcut && (
                            <kbd className="text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0" style={{ backgroundColor: '#1e1e1e', color: isSel ? itemColor : '#555', border: `1px solid ${isSel ? `${itemColor}20` : '#252525'}` }}>
                              {item.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', backgroundColor: '#121212' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Command className="h-2.5 w-2.5" style={{ color: '#333' }} />
                <span className="text-[9px] tabular-nums" style={{ color: '#444' }}>{flatItems.length} command{flatItems.length !== 1 ? 's' : ''}</span>
              </div>
              {search && flatItems.length > 0 && (
                <div className="flex items-center gap-1">
                  <Zap className="h-2 w-2" style={{ color: '#22c55e' }} />
                  <span className="text-[8px] font-mono" style={{ color: '#22c55e' }}>Best: {flatItems[0]?.label}</span>
                </div>
              )}
              {/* Category breakdown */}
              {search && flatItems.length > 0 && (
                <div className="flex items-center gap-1">
                  {Array.from(grouped.entries()).filter(([k]) => k !== 'Recent').slice(0, 4).map(([cat, items]) => {
                    const c = CATEGORY_ICONS[cat]?.color || '#555';
                    return (
                      <span key={cat} className="text-[7px] tabular-nums px-1 py-0.5 rounded" style={{ backgroundColor: `${c}08`, color: c }}>
                        {cat.slice(0, 3)} {items.length}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {[['↑↓', 'navigate'], ['↵', 'run'], ['esc', 'close']].map(([key, label]) => (
                <span key={label} className="text-[9px] flex items-center gap-1" style={{ color: '#444' }}>
                  <kbd className="px-1 py-0.5 rounded text-[8px] font-mono" style={{ backgroundColor: '#1e1e1e', color: '#555', border: '1px solid #252525' }}>{key}</kbd> {label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
