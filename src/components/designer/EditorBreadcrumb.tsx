import { useState } from 'react';
import { useEditor } from './EditorContext';
import { EditorElement } from './types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ChevronRight, Layout, Type, Image, MousePointer, Box,
  Copy, Home,
} from 'lucide-react';

const TYPE_ICONS: Record<string, typeof Box> = {
  section: Layout, text: Type, heading: Type, image: Image,
  button: MousePointer, container: Box, navbar: Layout, footer: Layout,
};

const TYPE_COLORS: Record<string, string> = {
  section: '#8b5cf6', text: '#3b82f6', heading: '#6366f1', image: '#f59e0b',
  button: '#22c55e', container: '#0073E6', navbar: '#06b6d4', footer: '#06b6d4',
};

function getAncestors(elements: EditorElement[], targetId: string): EditorElement[] {
  const path: EditorElement[] = [];
  function walk(els: EditorElement[], chain: EditorElement[]): boolean {
    for (const el of els) {
      if (el.id === targetId) { path.push(...chain, el); return true; }
      if (el.children.length > 0 && walk(el.children, [...chain, el])) return true;
    }
    return false;
  }
  walk(elements, []);
  return path;
}

export function EditorBreadcrumb() {
  const { state, dispatch } = useEditor();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (state.selectedIds.length !== 1) return null;

  const ancestors = getAncestors(state.elements, state.selectedIds[0]);
  if (ancestors.length === 0) return null;

  const copyPath = () => {
    const pathStr = ['Body', ...ancestors.map(e => e.name || e.type)].join(' → ');
    navigator.clipboard.writeText(pathStr);
    toast.success('Path copied');
  };

  const depth = ancestors.length;

  return (
    <div
      className="flex items-center gap-0.5 px-2 h-7 shrink-0 overflow-x-auto"
      style={{ backgroundColor: '#161616', borderTop: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Depth badge */}
      <div
        className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md mr-1"
        style={{
          backgroundColor: depth > 4 ? 'rgba(239,68,68,0.06)' : depth > 2 ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)',
          border: `1px solid ${depth > 4 ? 'rgba(239,68,68,0.12)' : depth > 2 ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)'}`,
        }}
        title={`Nesting depth: ${depth} level${depth !== 1 ? 's' : ''}`}
      >
        <span
          className="text-[7px] font-bold uppercase tracking-wider font-mono"
          style={{ color: depth > 4 ? '#ef4444' : depth > 2 ? '#f59e0b' : '#22c55e' }}
        >
          D{depth}
        </span>
      </div>

      {/* Home / Body */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => dispatch({ type: 'SELECT', payload: null })}
        onMouseEnter={() => setHoveredId('body')}
        onMouseLeave={() => setHoveredId(null)}
        className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md transition-colors"
        style={{
          backgroundColor: hoveredId === 'body' ? 'rgba(255,255,255,0.05)' : 'transparent',
        }}
      >
        <Home className="h-2.5 w-2.5" style={{ color: '#555' }} />
        <span className="text-[9px] font-medium" style={{ color: '#555' }}>Body</span>
      </motion.button>

      {/* Ancestors */}
      {ancestors.map((el, i) => {
        const isLast = i === ancestors.length - 1;
        const Icon = TYPE_ICONS[el.type] || Box;
        const color = isLast ? (TYPE_COLORS[el.type] || '#0073E6') : '#666';
        const isHovered = hoveredId === el.id;
        const childCount = el.children?.length || 0;

        return (
          <span key={el.id} className="flex items-center gap-0.5 shrink-0">
            <ChevronRight className="h-2.5 w-2.5" style={{ color: '#333' }} />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => dispatch({ type: 'SELECT', payload: el.id })}
              onMouseEnter={() => setHoveredId(el.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors"
              style={{
                backgroundColor: isHovered
                  ? isLast ? `${color}12` : 'rgba(255,255,255,0.05)'
                  : isLast ? `${color}08` : 'transparent',
                border: isLast ? `1px solid ${color}20` : '1px solid transparent',
              }}
            >
              <Icon className="h-2.5 w-2.5" style={{ color }} />
              {/* Background color swatch */}
              {el.styles?.desktop?.backgroundColor && (
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{
                    backgroundColor: el.styles.desktop.backgroundColor as string,
                    border: '1px solid rgba(128,128,128,0.3)',
                    boxShadow: '0 0 2px rgba(0,0,0,0.3)',
                  }}
                  title={`bg: ${el.styles.desktop.backgroundColor}`}
                />
              )}
              <span
                className="text-[9px] font-medium"
                style={{ color: isLast ? color : isHovered ? '#aaa' : '#666' }}
              >
                {el.name || el.type}
              </span>
              {isLast && (
                <span
                  className="text-[7px] font-bold uppercase tracking-wider ml-0.5 px-1 py-px rounded"
                  style={{ backgroundColor: `${color}10`, color, opacity: 0.7 }}
                >
                  {el.type}
                </span>
              )}
              {childCount > 0 && (
                <span
                  className="text-[7px] font-mono tabular-nums ml-0.5 px-1 py-px rounded"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#444' }}
                >
                  {childCount}
                </span>
              )}
            </motion.button>
          </span>
        );
      })}

      {/* Esc hint */}
      {depth > 1 && (
        <span className="ml-1 shrink-0 text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#333', backgroundColor: '#141414', border: '1px solid #1a1a1a' }}>
          Esc ↑
        </span>
      )}

      {/* Copy path button */}
      <div className="ml-auto shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={copyPath}
          className="h-4 w-4 flex items-center justify-center rounded hover:bg-white/5 transition-colors"
          title="Copy path"
        >
          <Copy className="h-2.5 w-2.5" style={{ color: '#444' }} />
        </motion.button>
      </div>
    </div>
  );
}
