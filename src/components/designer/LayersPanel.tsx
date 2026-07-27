import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import { useEditor } from './EditorContext';
import { EditorElement, ElementType } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, Eye, EyeOff, Lock, Unlock, GripVertical, Search, Trash2, Copy, Layers, Plus, ChevronDown, Filter, FolderOpen, FolderClosed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type DropPosition = 'before' | 'after' | 'inside' | null;

interface DragContext {
  draggedId: string | null;
  overId: string | null;
  dropPosition: DropPosition;
}

const DragCtx = React.createContext<{
  drag: DragContext;
  setDrag: React.Dispatch<React.SetStateAction<DragContext>>;
}>({
  drag: { draggedId: null, overId: null, dropPosition: null },
  setDrag: () => {},
});

const TYPE_ICONS: Record<string, string> = {
  section: '▣', container: '□', columns: '⫼', grid: '⊞',
  heading: 'H', text: 'T', button: '▶', image: '◻',
  video: '▷', card: '◰', form: '⊡', navbar: '≡',
  footer: '⊥', input: '⊏', divider: '—', spacer: '⊘',
  icon: '✦', link: '↗', badge: '●', quote: '❝',
};

const TYPE_COLORS: Record<string, string> = {
  section: '#8b5cf6', container: '#6366f1', columns: '#3b82f6', grid: '#0ea5e9',
  heading: '#f59e0b', text: '#a3a3a3', button: '#22c55e', image: '#ec4899',
  video: '#f43f5e', card: '#a855f7', form: '#14b8a6', navbar: '#06b6d4',
  footer: '#64748b', input: '#f59e0b', divider: '#555', spacer: '#555',
  icon: '#a855f7', link: '#0073E6', badge: '#f59e0b', quote: '#e879f9',
};

const TYPE_GROUPS: Record<string, string> = {
  section: 'Layout', container: 'Layout', columns: 'Layout', grid: 'Layout',
  heading: 'Content', text: 'Content', quote: 'Content', badge: 'Content',
  button: 'Interactive', input: 'Interactive', form: 'Interactive', link: 'Interactive',
  image: 'Media', video: 'Media', icon: 'Media',
  navbar: 'Navigation', footer: 'Navigation',
  card: 'Components', divider: 'Components', spacer: 'Components',
};

function countDescendants(el: EditorElement): number {
  let count = 0;
  for (const child of el.children) {
    count++;
    count += countDescendants(child);
  }
  return count;
}

const LayerItem = memo(function LayerItem({ element, depth = 0 }: { element: EditorElement; depth?: number }) {
  const { state, dispatch } = useEditor();
  const { drag, setDrag } = React.useContext(DragCtx);
  const isSelected = state.selectedIds.includes(element.id);
  const isHovered = state.hoveredId === element.id;
  const hasChildren = element.children.length > 0;
  const [collapsed, setCollapsed] = useState(depth > 2);
  const rowRef = useRef<HTMLDivElement>(null);

  const descendantCount = useMemo(() => countDescendants(element), [element]);
  const dotColor = TYPE_COLORS[element.type] || '#555';
  const typeIcon = TYPE_ICONS[element.type] || '○';

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('element-id', element.id);
    e.dataTransfer.effectAllowed = 'move';
    setDrag(d => ({ ...d, draggedId: element.id }));
    if (rowRef.current) {
      const clone = rowRef.current.cloneNode(true) as HTMLElement;
      clone.style.opacity = '0.7';
      clone.style.position = 'absolute';
      clone.style.top = '-1000px';
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, 0, 0);
      setTimeout(() => document.body.removeChild(clone), 0);
    }
  };

  const handleDragEnd = () => {
    setDrag({ draggedId: null, overId: null, dropPosition: null });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (drag.draggedId === element.id) return;

    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    const height = rect.height;
    const isContainer = hasChildren || ['section', 'container', 'columns', 'grid', 'card', 'navbar', 'footer', 'form'].includes(element.type);

    let position: DropPosition;
    if (isContainer) {
      if (y < height * 0.25) position = 'before';
      else if (y > height * 0.75) position = 'after';
      else position = 'inside';
    } else {
      position = y < height * 0.5 ? 'before' : 'after';
    }

    setDrag(d => ({ ...d, overId: element.id, dropPosition: position }));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (drag.overId === element.id) {
      setDrag(d => ({ ...d, overId: null, dropPosition: null }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('element-id');
    if (!draggedId || draggedId === element.id) {
      setDrag({ draggedId: null, overId: null, dropPosition: null });
      return;
    }

    const pos = drag.dropPosition;
    if (pos === 'inside') {
      dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: draggedId, newParentId: element.id, newIndex: 0 } });
    } else if (pos === 'before' || pos === 'after') {
      const findParentAndIndex = (els: EditorElement[], targetId: string, parentId?: string): { parentId?: string; index: number } | null => {
        for (let i = 0; i < els.length; i++) {
          if (els[i].id === targetId) return { parentId, index: i };
          const found = findParentAndIndex(els[i].children, targetId, els[i].id);
          if (found) return found;
        }
        return null;
      };
      const info = findParentAndIndex(state.elements, element.id);
      if (info) {
        const idx = pos === 'after' ? info.index + 1 : info.index;
        dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: draggedId, newParentId: info.parentId, newIndex: idx } });
      }
    }
    setDrag({ draggedId: null, overId: null, dropPosition: null });
  };

  const isDragging = drag.draggedId === element.id;
  const isDropTarget = drag.overId === element.id && drag.draggedId !== element.id;
  const dropPos = isDropTarget ? drag.dropPosition : null;

  return (
    <div className="relative">
      {/* Drop indicator: before */}
      {dropPos === 'before' && (
        <div className="absolute left-2 right-2 top-0 h-[2px] rounded-full z-10" style={{ backgroundColor: '#0073E6', boxShadow: '0 0 8px rgba(0,115,230,0.5)' }}>
          <div className="absolute -left-[3px] -top-[3px] w-2 h-2 rounded-full" style={{ backgroundColor: '#0073E6' }} />
        </div>
      )}

      <div
        ref={rowRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="flex items-center gap-0.5 h-[28px] cursor-pointer transition-all group"
        style={{
          paddingLeft: `${4 + depth * 12}px`,
          paddingRight: '4px',
          opacity: isDragging ? 0.3 : 1,
          backgroundColor: dropPos === 'inside'
            ? 'rgba(0, 115, 230, 0.1)'
            : isSelected ? 'rgba(0, 115, 230, 0.12)' : isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderLeft: dropPos === 'inside'
            ? '2px dashed #0073E6'
            : isSelected ? `2px solid ${dotColor}` : '2px solid transparent',
          outline: dropPos === 'inside' ? '1px dashed rgba(0,115,230,0.3)' : 'none',
          borderRadius: dropPos === 'inside' ? '4px' : '0',
        }}
        onMouseEnter={() => dispatch({ type: 'HOVER', payload: element.id })}
        onMouseLeave={() => dispatch({ type: 'HOVER', payload: null })}
        onClick={(e) => {
          e.stopPropagation();
          if (e.shiftKey) {
            dispatch({ type: 'MULTI_SELECT', payload: element.id });
          } else {
            dispatch({ type: 'SELECT', payload: element.id });
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (hasChildren) setCollapsed(c => !c);
        }}
      >
        <GripVertical className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing transition-opacity" style={{ color: '#666' }} />

        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }} className="shrink-0 h-4 w-4 flex items-center justify-center rounded hover:bg-white/5">
            <ChevronRight className={`h-2.5 w-2.5 transition-transform duration-150 ${collapsed ? '' : 'rotate-90'}`} style={{ color: '#555' }} />
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        {/* Type icon */}
        <span
          className="w-4 h-4 flex items-center justify-center rounded shrink-0 text-[8px] font-bold"
          style={{
            backgroundColor: `${dotColor}15`,
            color: dotColor,
            border: `1px solid ${dotColor}25`,
          }}
        >
          {typeIcon}
        </span>

        <span
          className="truncate flex-1 text-[10.5px] font-medium ml-1"
          style={{
            color: isSelected ? '#fff' : element.hidden ? '#444' : '#aaa',
            textDecoration: element.hidden ? 'line-through' : undefined,
            opacity: element.hidden ? 0.5 : 1,
          }}
        >
          {element.name || element.type}
        </span>

        {/* Element type badge - show on hover */}
        {isSelected && (
          <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded shrink-0" style={{ backgroundColor: `${dotColor}12`, color: dotColor }}>
            {element.type}
          </span>
        )}

        {/* Descendant count for containers */}
        {hasChildren && !collapsed && descendantCount > 0 && (
          <span className="text-[8px] tabular-nums shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#444' }}>
            {descendantCount}
          </span>
        )}

        {/* Locked badge always visible */}
        {element.locked && (
          <Lock className="h-2.5 w-2.5 shrink-0" style={{ color: '#f59e0b' }} />
        )}
        {element.hidden && (
          <EyeOff className="h-2.5 w-2.5 shrink-0" style={{ color: '#555' }} />
        )}

        <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="h-[18px] w-[18px] flex items-center justify-center rounded hover:bg-white/5"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DUPLICATE_ELEMENT', payload: element.id }); }}
            title="Duplicate"
          >
            <Copy className="h-2.5 w-2.5" style={{ color: '#555' }} />
          </button>
          <button
            className="h-[18px] w-[18px] flex items-center justify-center rounded hover:bg-white/5"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_ELEMENT', payload: { id: element.id, updates: { hidden: !element.hidden } } }); }}
          >
            {element.hidden ? <EyeOff className="h-2.5 w-2.5" style={{ color: '#555' }} /> : <Eye className="h-2.5 w-2.5" style={{ color: '#555' }} />}
          </button>
          <button
            className="h-[18px] w-[18px] flex items-center justify-center rounded hover:bg-white/5"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_ELEMENT', payload: { id: element.id, updates: { locked: !element.locked } } }); }}
          >
            {element.locked ? <Lock className="h-2.5 w-2.5" style={{ color: '#f59e0b' }} /> : <Unlock className="h-2.5 w-2.5" style={{ color: '#555' }} />}
          </button>
          <button
            className="h-[18px] w-[18px] flex items-center justify-center rounded hover:bg-red-500/10"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_ELEMENT', payload: element.id }); }}
          >
            <Trash2 className="h-2.5 w-2.5" style={{ color: '#555' }} />
          </button>
        </div>
      </div>

      {/* Drop indicator: after */}
      {dropPos === 'after' && (
        <div className="absolute left-2 right-2 bottom-0 h-[2px] rounded-full z-10" style={{ backgroundColor: '#0073E6', boxShadow: '0 0 8px rgba(0,115,230,0.5)' }}>
          <div className="absolute -left-[3px] -top-[3px] w-2 h-2 rounded-full" style={{ backgroundColor: '#0073E6' }} />
        </div>
      )}

      <AnimatePresence>
        {!collapsed && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Depth connector line */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: `${12 + depth * 12}px`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: `${dotColor}18`,
              }} />
              {element.children.map(child => (
                <LayerItem key={child.id} element={child} depth={depth + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export function LayersPanel() {
  const { state, dispatch } = useEditor();
  const [search, setSearch] = useState('');
  const [drag, setDrag] = useState<DragContext>({ draggedId: null, overId: null, dropPosition: null });
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const totalCount = useMemo(() => {
    const count = (els: EditorElement[]): number => {
      let c = 0;
      for (const el of els) { c++; c += count(el.children); }
      return c;
    };
    return count(state.elements);
  }, [state.elements]);

  const filterElements = (els: EditorElement[], query: string, typeFilter: string | null): EditorElement[] => {
    return els.filter(el => {
      const nameMatch = !query || (el.name || el.type).toLowerCase().includes(query.toLowerCase());
      const typeMatch = !typeFilter || el.type === typeFilter;
      const childMatch = el.children.length > 0 && filterElements(el.children, query, typeFilter).length > 0;
      return (nameMatch && typeMatch) || childMatch;
    });
  };

  const filtered = filterElements(state.elements, search, filterType);

  // Count types for stats
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const walk = (els: EditorElement[]) => {
      for (const el of els) {
        counts[el.type] = (counts[el.type] || 0) + 1;
        walk(el.children);
      }
    };
    walk(state.elements);
    return counts;
  }, [state.elements]);

  const topTypes = useMemo(() =>
    Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4),
    [typeCounts]
  );

  // Group counts
  const groupCounts = useMemo(() => {
    const gc: Record<string, number> = {};
    Object.entries(typeCounts).forEach(([type, count]) => {
      const group = TYPE_GROUPS[type] || 'Other';
      gc[group] = (gc[group] || 0) + count;
    });
    return gc;
  }, [typeCounts]);

  const hiddenCount = useMemo(() => {
    let c = 0;
    const walk = (els: EditorElement[]) => { for (const el of els) { if (el.hidden) c++; walk(el.children); } };
    walk(state.elements);
    return c;
  }, [state.elements]);

  const lockedCount = useMemo(() => {
    let c = 0;
    const walk = (els: EditorElement[]) => { for (const el of els) { if (el.locked) c++; walk(el.children); } };
    walk(state.elements);
    return c;
  }, [state.elements]);

  return (
    <DragCtx.Provider value={{ drag, setDrag }}>
      <ScrollArea className="h-full">
        <div className="py-1">
          {/* Search */}
          <div className="px-2 py-1.5">
            <div className="relative flex gap-1">
              <div className="relative flex-1">
                <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2" style={{ color: '#444' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter layers…"
                  className="w-full h-6 pl-7 pr-2 rounded text-[10px] outline-none transition-all"
                  style={{ backgroundColor: '#181818', border: '1px solid #252525', color: '#ccc' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#0073E6'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,115,230,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#252525'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className="h-6 w-6 flex items-center justify-center rounded transition-colors"
                style={{ backgroundColor: showFilters || filterType ? 'rgba(0,115,230,0.08)' : '#181818', border: `1px solid ${showFilters || filterType ? 'rgba(0,115,230,0.2)' : '#252525'}` }}>
                <Filter className="h-3 w-3" style={{ color: filterType ? '#0073E6' : '#444' }} />
              </button>
            </div>
          </div>

          {/* Type filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.12 }} style={{ overflow: 'hidden' }}>
                <div className="px-2 pb-1.5 flex flex-wrap gap-0.5">
                  <button onClick={() => setFilterType(null)}
                    className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md transition-colors"
                    style={{ backgroundColor: !filterType ? 'rgba(0,115,230,0.1)' : 'transparent', color: !filterType ? '#0073E6' : '#555', border: `1px solid ${!filterType ? 'rgba(0,115,230,0.2)' : 'transparent'}` }}>
                    All
                  </button>
                  {Object.keys(typeCounts).sort().map(type => (
                    <button key={type} onClick={() => setFilterType(filterType === type ? null : type)}
                      className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md transition-colors flex items-center gap-0.5"
                      style={{
                        backgroundColor: filterType === type ? `${TYPE_COLORS[type] || '#555'}12` : 'transparent',
                        color: filterType === type ? (TYPE_COLORS[type] || '#555') : '#444',
                        border: `1px solid ${filterType === type ? `${TYPE_COLORS[type] || '#555'}25` : 'transparent'}`,
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] || '#555' }} />
                      {type}
                      <span className="tabular-nums opacity-70">{typeCounts[type]}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header with stats + collapse/expand all */}
          <div className="flex items-center justify-between px-3 py-1">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3 w-3" style={{ color: '#444' }} />
              <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: '#555' }}>
                Layers
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Collapse / Expand all buttons */}
              <button
                onClick={() => document.querySelectorAll<HTMLElement>('[data-layer-collapse]').forEach(b => b.click())}
                className="h-4 px-1.5 rounded flex items-center gap-0.5 transition-colors"
                style={{ backgroundColor: '#181818', border: '1px solid #222' }}
                title="Collapse all"
              >
                <FolderClosed className="h-2 w-2" style={{ color: '#555' }} />
                <span className="text-[7px] font-mono" style={{ color: '#444' }}>−</span>
              </button>
              <button
                onClick={() => document.querySelectorAll<HTMLElement>('[data-layer-expand]').forEach(b => b.click())}
                className="h-4 px-1.5 rounded flex items-center gap-0.5 transition-colors"
                style={{ backgroundColor: '#181818', border: '1px solid #222' }}
                title="Expand all"
              >
                <FolderOpen className="h-2 w-2" style={{ color: '#555' }} />
                <span className="text-[7px] font-mono" style={{ color: '#444' }}>+</span>
              </button>
              <div className="w-px h-3" style={{ backgroundColor: '#222' }} />
              {topTypes.map(([type, count]) => (
                <span key={type} className="flex items-center gap-0.5" title={`${count} ${type}(s)`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] || '#555' }} />
                  <span className="text-[8px] tabular-nums" style={{ color: '#444' }}>{count}</span>
                </span>
              ))}
              <span className="text-[9px] tabular-nums font-mono" style={{ color: '#444' }}>{totalCount}</span>
            </div>
          </div>

          {/* Type distribution bar */}
          {totalCount > 0 && (
            <div className="px-3 pb-1.5 space-y-1">
              {/* Visual distribution bar */}
              <div className="h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: '#181818' }}>
                {Object.entries(typeCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div
                      key={type}
                      style={{
                        width: `${(count / totalCount) * 100}%`,
                        backgroundColor: TYPE_COLORS[type] || '#555',
                        opacity: 0.7,
                        minWidth: '2px',
                      }}
                      title={`${type}: ${count} (${Math.round((count / totalCount) * 100)}%)`}
                    />
                  ))}
              </div>
              {/* Group badges + status counts */}
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(groupCounts).slice(0, 4).map(([group, count]) => (
                  <span key={group} className="text-[7px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#181818', color: '#555', border: '1px solid #222' }}>
                    {group} <span className="tabular-nums" style={{ color: '#888' }}>{count}</span>
                  </span>
                ))}
                {hiddenCount > 0 && (
                  <span className="text-[7px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(107,114,128,0.08)', color: '#6b7280' }}>
                    <EyeOff className="h-2 w-2" />{hiddenCount}
                  </span>
                )}
                {lockedCount > 0 && (
                  <span className="text-[7px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
                    <Lock className="h-2 w-2" />{lockedCount}
                  </span>
                )}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-8 px-3">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,115,230,0.06), rgba(0,115,230,0.02))', border: '1px solid rgba(0,115,230,0.08)' }}>
                <Layers className="w-5 h-5" style={{ color: 'rgba(0,115,230,0.25)' }} />
              </div>
              <p className="text-[10px] font-medium" style={{ color: '#555' }}>
                {search || filterType ? 'No matching layers' : 'No elements on canvas'}
              </p>
              {(search || filterType) && (
                <button onClick={() => { setSearch(''); setFilterType(null); }} className="text-[9px] mt-1" style={{ color: '#0073E6' }}>Clear filters</button>
              )}
            </div>
          ) : (
            filtered.map(el => <LayerItem key={el.id} element={el} />)
          )}
        </div>
      </ScrollArea>
    </DragCtx.Provider>
  );
}
