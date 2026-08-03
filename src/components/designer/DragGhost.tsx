import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor } from './EditorContext';
import { COMPONENT_REGISTRY } from './constants/componentRegistry';
import {
  LayoutTemplate, Square, Columns3, Grid3x3, MoveVertical, Minus,
  Type, AlignLeft, MousePointerClick, Tag, CreditCard,
  ImageIcon, Video, Smile,
  FormInput, TextCursorInput, Text,
  PanelTop, PanelBottom, Link,
  Code, Globe, ArrowDown
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  LayoutTemplate, Square, Columns3, Grid3x3, MoveVertical, Minus,
  Type, AlignLeft, MousePointerClick, Tag, CreditCard,
  ImageIcon, Video, Smile,
  FormInput, TextCursorInput, Text,
  PanelTop, PanelBottom, Link,
  Code, Globe,
};

const CATEGORY_COLORS: Record<string, string> = {
  Layout: 'hsl(var(--studio-ink-3))',
  Basic: 'hsl(var(--studio-accent))',
  Typography: 'hsl(var(--studio-ink-3))',
  Media: 'hsl(var(--studio-warn))',
  Forms: 'hsl(var(--studio-ok))',
  Interactive: 'hsl(var(--studio-ink-3))',
  Navigation: 'hsl(var(--studio-ink-3))',
};

export const DragGhost = memo(function DragGhost() {
  const { state } = useEditor();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!state.dragState?.elementType) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const onUp = () => setVisible(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [state.dragState]);

  const dragType = state.dragState?.elementType;
  const comp = dragType ? COMPONENT_REGISTRY.find(c => c.type === dragType) : null;
  const Icon = comp ? ICON_MAP[comp.icon] || Square : Square;
  const category = comp?.category || 'Basic';
  const catColor = CATEGORY_COLORS[category] || 'hsl(var(--studio-accent))';

  return (
    <AnimatePresence>
      {visible && comp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          style={{
            position: 'fixed',
            left: pos.x + 16,
            top: pos.y - 20,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '8px 14px 6px',
              backgroundColor: 'rgba(12, 12, 12, 0.97)',
              borderRadius: '12px',
              boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${catColor}30, 0 0 20px ${catColor}10`,
              backdropFilter: 'blur(16px)',
              minWidth: '120px',
            }}
          >
            {/* Main row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '22px', height: '22px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${catColor}18`,
                  border: `1px solid ${catColor}25`,
                }}
              >
                <Icon className="h-3 w-3" style={{ color: catColor }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--studio-ink))', letterSpacing: '0.01em' }}>
                {comp.label}
              </span>
              {/* Container badge */}
              {(comp.type === 'section' || comp.type === 'container' || comp.type === 'columns' || comp.type === 'grid') && (
                <span style={{
                  fontSize: '6px', fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.1em', padding: '1px 4px', borderRadius: '3px',
                  backgroundColor: 'rgba(34,197,94,0.1)', color: 'hsl(var(--studio-ok))',
                  border: '1px solid rgba(34,197,94,0.15)',
                }}>
                  Container
                </span>
              )}
            </div>

            {/* Category badge + drop hint */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <span
                style={{
                  fontSize: '7px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', padding: '1px 5px', borderRadius: '4px',
                  backgroundColor: `${catColor}12`, color: catColor,
                  border: `1px solid ${catColor}18`,
                }}
              >
                {category}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', color: 'hsl(var(--studio-hover))' }}>
                  <ArrowDown className="h-2 w-2" style={{ color: 'hsl(var(--studio-hover))' }} />
                  Drop to place
                </span>
                {/* Snap indicator */}
                <span style={{
                  fontSize: '6px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', padding: '1px 4px', borderRadius: '3px',
                  backgroundColor: 'hsl(var(--studio-ink-3) / 0.08)', color: 'hsl(var(--studio-ink-3))',
                  border: '1px solid hsl(var(--studio-ink-3) / 0.12)',
                }}>
                  Snap
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
