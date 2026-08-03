import { memo, useMemo, useState, useRef, useCallback } from 'react';
import { useEditor } from './EditorContext';
import { EditorElement } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Map, Crosshair, Focus } from 'lucide-react';

interface FlatItem {
  type: string;
  depth: number;
  id: string;
  name: string;
  isSelected: boolean;
  isContainer: boolean;
  childCount: number;
  yOffset: number; // approximate vertical position for viewport indicator
}

const CONTAINER_TYPES = new Set(['section', 'navbar', 'footer', 'container', 'columns', 'grid', 'card']);

const TYPE_COLORS: Record<string, string> = {
  section: 'hsl(var(--studio-accent) / 0.5)',
  navbar: 'hsl(var(--studio-ink-3) / 0.5)',
  footer: 'hsl(var(--studio-ink-3) / 0.4)',
  container: 'hsl(var(--studio-accent) / 0.3)',
  columns: 'hsl(var(--studio-accent) / 0.25)',
  grid: 'hsl(var(--studio-accent) / 0.25)',
  card: 'hsl(var(--studio-accent) / 0.3)',
  heading: 'rgba(255,255,255,0.25)',
  text: 'rgba(255,255,255,0.15)',
  image: 'hsl(var(--studio-ink-3) / 0.35)',
  video: 'hsl(var(--studio-ink-3) / 0.3)',
  button: 'rgba(34,197,94,0.4)',
  form: 'rgba(245,158,11,0.35)',
  input: 'rgba(245,158,11,0.25)',
  icon: 'hsl(var(--studio-ink-3) / 0.3)',
  divider: 'rgba(255,255,255,0.08)',
};

const TYPE_LABELS: Record<string, string> = {
  section: '§', navbar: '≡', footer: '⊥', container: '⊞', columns: '‖', grid: '#',
  heading: 'H', text: 'T', image: '◻', button: '▣', card: '◫', form: '⊡',
  video: '▶', input: '⊡', badge: '●', link: '→',
};

function flattenElements(els: EditorElement[], selectedId: string | null, depth = 0, yOffset = 0): FlatItem[] {
  const result: FlatItem[] = [];
  let currentY = yOffset;
  for (const el of els) {
    const isContainer = CONTAINER_TYPES.has(el.type);
    const height = isContainer ? 14 : 10;
    result.push({
      type: el.type,
      depth,
      id: el.id,
      name: el.name || el.type,
      isSelected: el.id === selectedId,
      isContainer,
      childCount: el.children?.length || 0,
      yOffset: currentY,
    });
    currentY += height + 1;
    if (el.children?.length) {
      const children = flattenElements(el.children, selectedId, depth + 1, currentY);
      result.push(...children);
      currentY += children.length * 11;
    }
  }
  return result;
}

export const CanvasMinimap = memo(function CanvasMinimap() {
  const { state, dispatch, selectedElement } = useEditor();
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'density'>('tree');
  const listRef = useRef<HTMLDivElement>(null);

  const flat = useMemo(
    () => flattenElements(state.elements, selectedElement?.id || null),
    [state.elements, selectedElement?.id]
  );

  const scrollToSelected = useCallback(() => {
    if (!selectedElement || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-minimap-id="${selectedElement.id}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [selectedElement]);

  // Type distribution for density view
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    flat.forEach(f => { counts[f.type] = (counts[f.type] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [flat]);

  const sectionCount = flat.filter(f => f.type === 'section').length;
  const containerCount = flat.filter(f => f.isContainer && f.type !== 'section').length;
  const leafCount = flat.filter(f => !f.isContainer).length;
  const maxDepth = Math.max(...flat.map(f => f.depth), 0);

  // Health score based on structure quality
  const healthScore = useMemo(() => {
    if (flat.length === 0) return { score: 0, label: '—', color: 'hsl(var(--studio-hover))' };
    let score = 100;
    // Penalize deep nesting (>4 levels)
    if (maxDepth > 5) score -= (maxDepth - 5) * 8;
    else if (maxDepth > 4) score -= 5;
    // Penalize too many elements without sections
    if (sectionCount === 0 && flat.length > 5) score -= 15;
    // Penalize very flat structures (no containers)
    if (containerCount === 0 && flat.length > 10) score -= 10;
    // Penalize excessive element count
    if (flat.length > 100) score -= Math.min(20, Math.floor((flat.length - 100) / 10));
    // Bonus for good section usage
    if (sectionCount >= 2 && sectionCount <= 12) score += 5;
    score = Math.max(0, Math.min(100, score));
    if (score >= 85) return { score, label: 'Excellent', color: 'hsl(var(--studio-ok))' };
    if (score >= 65) return { score, label: 'Good', color: 'hsl(var(--studio-accent))' };
    if (score >= 40) return { score, label: 'Fair', color: 'hsl(var(--studio-warn))' };
    return { score, label: 'Needs work', color: 'hsl(var(--studio-risk))' };
  }, [flat.length, maxDepth, sectionCount, containerCount]);

  if (flat.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-3 right-3 z-20 select-none"
      style={{
        width: '176px',
        backgroundColor: 'rgba(14,14,14,0.97)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-2">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-1.5 transition-colors hover:opacity-80"
        >
          <Map className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-3))' }} />
          <span style={{ fontSize: '9px', color: 'hsl(var(--studio-ink-3))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Structure
          </span>
        </button>
        <div className="flex items-center gap-1">
          {/* Health score ring */}
          <div className="relative" title={`Health: ${healthScore.label} (${healthScore.score}%)`}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <circle cx="9" cy="9" r="7" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
              <circle
                cx="9" cy="9" r="7" fill="none"
                stroke={healthScore.color}
                strokeWidth="2"
                strokeDasharray={`${(healthScore.score / 100) * 44} 44`}
                strokeLinecap="round"
                transform="rotate(-90 9 9)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <span style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '6px', fontWeight: 800, color: healthScore.color,
              fontFamily: 'ui-monospace, monospace',
            }}>
              {healthScore.score}
            </span>
          </div>
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(v => v === 'tree' ? 'density' : 'tree')}
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{
              color: viewMode === 'density' ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line-strong))',
              backgroundColor: viewMode === 'density' ? 'hsl(var(--studio-accent) / 0.08)' : 'transparent',
            }}
            title={viewMode === 'tree' ? 'Show density view' : 'Show tree view'}
          >
            <Crosshair className="h-2.5 w-2.5" />
          </button>
          {/* Scroll to selected */}
          {selectedElement && (
            <button
              onClick={scrollToSelected}
              className="w-5 h-5 rounded flex items-center justify-center transition-all"
              style={{ color: 'hsl(var(--studio-accent))' }}
              title="Focus selected element"
            >
              <Focus className="h-2.5 w-2.5" />
            </button>
          )}
          <span style={{ fontSize: '9px', color: 'hsl(var(--studio-hover))' }}>{flat.length}</span>
          <button onClick={() => setCollapsed(c => !c)} className="text-[hsl(var(--studio-hover))] hover:text-[hsl(var(--studio-ink-2))] transition-colors">
            {collapsed ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {viewMode === 'tree' ? (
              /* Tree view — visual map */
              <div ref={listRef} className="px-2 pb-1.5 space-y-[1px] max-h-[220px] overflow-y-auto scrollbar-none">
                {flat.map((item) => {
                  const color = TYPE_COLORS[item.type] || 'rgba(255,255,255,0.08)';
                  const isHov = hovered === item.id;
                  const isSel = item.isSelected;

                  return (
                    <button
                      key={item.id}
                      data-minimap-id={item.id}
                      onClick={() => dispatch({ type: 'SELECT', payload: item.id })}
                      onMouseEnter={() => { setHovered(item.id); dispatch({ type: 'HOVER', payload: item.id }); }}
                      onMouseLeave={() => { setHovered(null); dispatch({ type: 'HOVER', payload: null }); }}
                      className="w-full flex items-center gap-1 rounded-[3px] transition-all"
                      style={{
                        height: item.isContainer ? '14px' : '10px',
                        paddingLeft: `${item.depth * 8 + 4}px`,
                        paddingRight: '4px',
                        backgroundColor: isSel ? 'hsl(var(--studio-accent) / 0.12)' : isHov ? 'rgba(255,255,255,0.04)' : 'transparent',
                        borderLeft: isSel ? '2px solid hsl(var(--studio-accent))' : '2px solid transparent',
                      }}
                    >
                      {/* Depth connector lines */}
                      {item.depth > 0 && (
                        <div style={{
                          position: 'absolute',
                          left: `${(item.depth - 1) * 8 + 8}px`,
                          width: '1px',
                          height: '100%',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                        }} />
                      )}
                      
                      {/* Type icon */}
                      {(isHov || isSel) && (
                        <span style={{ fontSize: '7px', color: isSel ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line-strong))', width: '8px', textAlign: 'center', flexShrink: 0 }}>
                          {TYPE_LABELS[item.type] || '·'}
                        </span>
                      )}
                      
                      <div
                        style={{
                          flex: 1,
                          height: item.isContainer ? '4px' : '2px',
                          borderRadius: '1px',
                          backgroundColor: isSel ? 'hsl(var(--studio-accent))' : isHov ? 'rgba(255,255,255,0.2)' : color,
                          transition: 'background-color 0.1s',
                        }}
                      />
                      {(isHov || isSel) && (
                        <span style={{
                          fontSize: '7px',
                          color: isSel ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-3))',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}>
                          {item.name}
                        </span>
                      )}
                      {item.childCount > 0 && (isHov || isSel) && (
                        <span style={{ fontSize: '6px', color: 'hsl(var(--studio-hover))', fontFamily: 'monospace' }}>
                          ({item.childCount})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Density view — type distribution */
              <div className="px-2.5 pb-2 space-y-1.5">
                {typeDistribution.map(([type, count]) => {
                  const color = TYPE_COLORS[type] || 'rgba(255,255,255,0.15)';
                  const pct = (count / flat.length) * 100;
                  return (
                    <div key={type} className="flex items-center gap-1.5">
                      <span style={{ fontSize: '7px', fontWeight: 700, color, width: '36px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {type}
                      </span>
                      <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4, delay: 0.05 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                      <span style={{ fontSize: '8px', color: 'hsl(var(--studio-hover))', fontFamily: 'monospace', fontWeight: 600, width: '16px', textAlign: 'right' }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
                
                {/* Depth indicator */}
                <div className="flex items-center gap-1.5 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '7px', color: 'hsl(var(--studio-hover))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Max depth
                  </span>
                  <div className="flex gap-px flex-1">
                    {Array.from({ length: Math.min(maxDepth + 1, 8) }).map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-sm"
                        style={{ backgroundColor: `rgba(0,115,230,${0.15 + i * 0.12})` }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '8px', color: 'hsl(var(--studio-ink-3))', fontFamily: 'monospace', fontWeight: 600 }}>{maxDepth}</span>
                </div>
              </div>
            )}

            {/* Stats footer with health score */}
            <div
              className="flex items-center justify-between px-2.5 py-1.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2">
                {sectionCount > 0 && (
                  <span style={{ fontSize: '8px', color: 'hsl(var(--studio-ink-3))' }}>
                    <span style={{ color: 'hsl(var(--studio-accent) / 0.7)' }}>●</span> {sectionCount}s
                  </span>
                )}
                {containerCount > 0 && (
                  <span style={{ fontSize: '8px', color: 'hsl(var(--studio-ink-3))' }}>
                    <span style={{ color: 'hsl(var(--studio-accent) / 0.7)' }}>●</span> {containerCount}c
                  </span>
                )}
                {leafCount > 0 && (
                  <span style={{ fontSize: '8px', color: 'hsl(var(--studio-ink-3))' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>●</span> {leafCount}l
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Health score badge */}
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: `${healthScore.color}10`, border: `1px solid ${healthScore.color}20` }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: healthScore.color }} />
                  <span style={{ fontSize: '7px', fontWeight: 700, color: healthScore.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {healthScore.score}
                  </span>
                </div>
                <span style={{ fontSize: '8px', color: 'hsl(var(--studio-hover))', fontFamily: 'monospace' }}>
                  {Math.round(state.zoom * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});