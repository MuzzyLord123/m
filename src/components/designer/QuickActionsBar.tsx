import { memo, useMemo, useState, useCallback } from 'react';
import { useEditor } from './EditorContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Trash2, ArrowUp, ArrowDown, Lock, Unlock, Eye, EyeOff,
  WrapText, CopyCheck, ClipboardPaste, Layers, Repeat, FlipHorizontal2,
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical,
  AlignEndVertical, Maximize2, Type, Pipette, Rows3, Columns3,
  StretchHorizontal, Minus, Plus, Grid3X3, LayoutGrid, Link, Unlink,
  Palette, Sparkles, Smartphone, Monitor, Tablet, ChevronDown, ChevronRight,
  Move, Box, PaintBucket, Circle, Square, RectangleHorizontal
} from 'lucide-react';
import { getStyleClipboard } from './EditorContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TYPE_COLORS: Record<string, string> = {
  section: '#8b5cf6', container: '#6366f1', columns: '#3b82f6', grid: '#0ea5e9',
  heading: '#f59e0b', text: '#a3a3a3', button: '#22c55e', image: '#ec4899',
  video: '#f43f5e', card: '#a855f7', form: '#14b8a6', navbar: '#06b6d4',
  footer: '#64748b', input: '#f59e0b', badge: '#f97316', quote: '#8b5cf6', link: '#3b82f6',
};

const TYPE_LABELS: Record<string, string> = {
  section: 'Section', container: 'Container', columns: 'Columns', grid: 'Grid',
  heading: 'Heading', text: 'Text', button: 'Button', image: 'Image',
  video: 'Video', card: 'Card', form: 'Form', navbar: 'Navbar',
  footer: 'Footer', input: 'Input', badge: 'Badge', quote: 'Quote', link: 'Link',
};

export const QuickActionsBar = memo(function QuickActionsBar() {
  const { state, dispatch, selectedElement, wrapInContainer, moveSelectedUp, moveSelectedDown, copyStyles, pasteStyles } = useEditor();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const updateStyle = useCallback((prop: string, value: string) => {
    if (!selectedElement) return;
    const bp = state.breakpoint;
    const newStyles = { ...selectedElement.styles };
    if (bp === 'desktop') {
      newStyles.desktop = { ...newStyles.desktop, [prop]: value };
    } else {
      newStyles[bp] = { ...(newStyles[bp] ?? {}), [prop]: value };
    }
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { styles: newStyles } } });
  }, [selectedElement, state.breakpoint, dispatch]);

  const adjustSpacing = useCallback((prop: string, delta: number) => {
    if (!selectedElement) return;
    const currentVal = parseInt(selectedElement.styles.desktop?.[prop] as string) || 0;
    updateStyle(prop, `${Math.max(0, currentVal + delta)}px`);
  }, [selectedElement, updateStyle]);

  if (!selectedElement) return null;

  const currentStyles = state.breakpoint === 'desktop'
    ? selectedElement.styles.desktop
    : { ...selectedElement.styles.desktop, ...selectedElement.styles[state.breakpoint] };

  const isContainer = ['section', 'container', 'columns', 'grid', 'navbar', 'footer', 'card'].includes(selectedElement.type);
  const isText = ['heading', 'text', 'button', 'badge', 'link', 'quote'].includes(selectedElement.type);
  const typeColor = TYPE_COLORS[selectedElement.type] || '#555';

  type ActionItem = { icon: any; label: string; onClick: () => void; active?: boolean; danger?: boolean; disabled?: boolean; color?: string } | 'sep';

  const actions: ActionItem[] = [
    { icon: ArrowUp, label: 'Move up (⌥↑)', onClick: moveSelectedUp },
    { icon: ArrowDown, label: 'Move down (⌥↓)', onClick: moveSelectedDown },
    'sep',
    { icon: Copy, label: 'Duplicate (⌘D)', onClick: () => dispatch({ type: 'DUPLICATE_ELEMENT', payload: selectedElement.id }) },
    { icon: Layers, label: 'Wrap (⌘G)', onClick: wrapInContainer },
    'sep',
  ];

  if (isContainer) {
    actions.push(
      { icon: Rows3, label: 'Vertical', onClick: () => updateStyle('flexDirection', 'column'), active: currentStyles?.flexDirection === 'column' || !currentStyles?.flexDirection, color: '#8b5cf6' },
      { icon: Columns3, label: 'Horizontal', onClick: () => updateStyle('flexDirection', 'row'), active: currentStyles?.flexDirection === 'row', color: '#3b82f6' },
      'sep',
      { icon: AlignStartVertical, label: 'Start', onClick: () => updateStyle('alignItems', 'flex-start'), active: currentStyles?.alignItems === 'flex-start' },
      { icon: AlignCenterVertical, label: 'Center', onClick: () => updateStyle('alignItems', 'center'), active: currentStyles?.alignItems === 'center' },
      { icon: AlignEndVertical, label: 'End', onClick: () => updateStyle('alignItems', 'flex-end'), active: currentStyles?.alignItems === 'flex-end' },
      { icon: StretchHorizontal, label: 'Stretch', onClick: () => updateStyle('alignItems', 'stretch'), active: currentStyles?.alignItems === 'stretch' },
      'sep',
      { icon: AlignLeft, label: 'Justify start', onClick: () => updateStyle('justifyContent', 'flex-start'), active: currentStyles?.justifyContent === 'flex-start' },
      { icon: AlignCenter, label: 'Justify center', onClick: () => updateStyle('justifyContent', 'center'), active: currentStyles?.justifyContent === 'center' },
      { icon: AlignRight, label: 'Justify end', onClick: () => updateStyle('justifyContent', 'flex-end'), active: currentStyles?.justifyContent === 'flex-end' },
      'sep',
      { icon: Maximize2, label: 'Toggle wrap', onClick: () => updateStyle('flexWrap', currentStyles?.flexWrap === 'wrap' ? 'nowrap' : 'wrap'), active: currentStyles?.flexWrap === 'wrap' },
      'sep',
    );
  }

  if (isText) {
    actions.push(
      { icon: AlignLeft, label: 'Left', onClick: () => updateStyle('textAlign', 'left'), active: currentStyles?.textAlign === 'left' },
      { icon: AlignCenter, label: 'Center', onClick: () => updateStyle('textAlign', 'center'), active: currentStyles?.textAlign === 'center' },
      { icon: AlignRight, label: 'Right', onClick: () => updateStyle('textAlign', 'right'), active: currentStyles?.textAlign === 'right' },
      'sep',
      // Font size adjust
      { icon: Minus, label: '−2px font', onClick: () => { const cur = parseInt(currentStyles?.fontSize as string) || 16; updateStyle('fontSize', `${Math.max(8, cur - 2)}px`); }, color: '#f59e0b' },
      { icon: Type, label: `Font: ${currentStyles?.fontSize || '16px'}`, onClick: () => dispatch({ type: 'SET_RIGHT_TAB', payload: 'style' }), color: '#f59e0b' },
      { icon: Plus, label: '+2px font', onClick: () => { const cur = parseInt(currentStyles?.fontSize as string) || 16; updateStyle('fontSize', `${cur + 2}px`); }, color: '#f59e0b' },
      'sep',
    );
  }

  // Border radius presets
  const currentRadius = currentStyles?.borderRadius as string || '0';
  actions.push(
    { icon: Square, label: 'Sharp (0)', onClick: () => updateStyle('borderRadius', '0px'), active: currentRadius === '0px' || currentRadius === '0', color: '#64748b' },
    { icon: RectangleHorizontal, label: 'Rounded (8px)', onClick: () => updateStyle('borderRadius', '8px'), active: currentRadius === '8px', color: '#64748b' },
    { icon: Circle, label: 'Pill (999px)', onClick: () => updateStyle('borderRadius', '999px'), active: currentRadius === '999px', color: '#64748b' },
    'sep',
  );

  // Spacing quick-adjust
  actions.push(
    { icon: Minus, label: '−4px padding', onClick: () => adjustSpacing('padding', -4), color: '#06b6d4' },
    { icon: Plus, label: '+4px padding', onClick: () => adjustSpacing('padding', 4), color: '#06b6d4' },
    'sep',
  );

  // Opacity quick-adjust
  const currentOpacity = parseFloat(currentStyles?.opacity as string) ?? 1;
  actions.push(
    { icon: Eye, label: `Opacity: ${Math.round(currentOpacity * 100)}%`, onClick: () => updateStyle('opacity', currentOpacity >= 0.9 ? '0.5' : currentOpacity <= 0.3 ? '1' : '0.25'), color: '#06b6d4',
      active: currentOpacity < 1 },
    'sep',
  );

  actions.push(
    { icon: CopyCheck, label: 'Copy styles (⌘⌥C)', onClick: copyStyles },
    { icon: ClipboardPaste, label: 'Paste styles (⌘⌥V)', onClick: pasteStyles, disabled: !getStyleClipboard() },
    'sep',
    { icon: selectedElement.hidden ? EyeOff : Eye, label: selectedElement.hidden ? 'Show' : 'Hide', onClick: () => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { hidden: !selectedElement.hidden } } }), active: selectedElement.hidden },
    { icon: selectedElement.locked ? Unlock : Lock, label: selectedElement.locked ? 'Unlock' : 'Lock', onClick: () => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { locked: !selectedElement.locked } } }), active: selectedElement.locked, color: '#f59e0b' },
    'sep',
    { icon: Palette, label: 'Style panel', onClick: () => dispatch({ type: 'SET_RIGHT_TAB', payload: 'style' }) },
    { icon: Sparkles, label: 'Animate', onClick: () => dispatch({ type: 'SET_RIGHT_TAB', payload: 'animation' }) },
    'sep',
    { icon: Trash2, label: 'Delete (Del)', onClick: () => dispatch({ type: 'DELETE_ELEMENT', payload: selectedElement.id }), danger: true },
  );

  const currentPadding = currentStyles?.padding || '0';
  const currentGap = currentStyles?.gap || '0';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-0 rounded-2xl"
        style={{
          backgroundColor: 'rgba(14, 14, 14, 0.97)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: `0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 30px ${typeColor}08`,
          backdropFilter: 'blur(28px)',
          maxWidth: 'calc(100vw - 40px)',
          overflowX: 'auto',
          padding: '4px 6px',
        }}
      >
        {/* Element type badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl mr-1 shrink-0"
          style={{ backgroundColor: `${typeColor}08`, border: `1px solid ${typeColor}12` }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColor }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: typeColor }}>
            {TYPE_LABELS[selectedElement.type] || selectedElement.type}
          </span>
        </div>

        {/* Spacing readout */}
        {isContainer && (
          <>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg shrink-0"
              style={{ backgroundColor: 'rgba(6,182,212,0.05)' }}
              title={`Padding: ${currentPadding} | Gap: ${currentGap}`}
            >
              <Move className="h-2.5 w-2.5" style={{ color: '#06b6d4' }} />
              <span className="text-[8px] font-mono font-semibold" style={{ color: '#06b6d4' }}>
                P:{typeof currentPadding === 'string' ? currentPadding.replace(/px/g, '') : currentPadding}
              </span>
              <span className="text-[8px] font-mono" style={{ color: '#0ea5e9' }}>
                G:{typeof currentGap === 'string' ? currentGap.replace(/px/g, '') : currentGap}
              </span>
            </div>
            <div className="w-px h-5 mx-0.5 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </>
        )}

        <TooltipProvider delayDuration={200}>
          {actions.map((action, i) => {
            if (action === 'sep') {
              return <div key={`sep-${i}`} className="w-px h-5 mx-0.5 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />;
            }
            const Icon = action.icon;
            const activeColor = action.color || '#0073E6';
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <button
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="h-7 w-7 flex items-center justify-center rounded-lg transition-all duration-100 shrink-0 disabled:opacity-20"
                    style={{
                      color: action.danger ? '#ef4444' : action.active ? activeColor : '#666',
                      backgroundColor: action.active ? `${activeColor}0d` : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!action.active) {
                        e.currentTarget.style.backgroundColor = action.danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = action.danger ? '#ef4444' : '#fff';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = action.active ? `${activeColor}0d` : 'transparent';
                      e.currentTarget.style.color = action.danger ? '#ef4444' : action.active ? activeColor : '#666';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="text-[10px] px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#ccc', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                >
                  {action.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </motion.div>
    </AnimatePresence>
  );
});
