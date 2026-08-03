import { useEffect, useState, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor } from './EditorContext';
import {
  Copy, Trash2, ArrowUp, ArrowDown, EyeOff, Eye, Lock, Unlock,
  GripVertical, Palette, Sparkles, AlignLeft, AlignCenter, AlignRight,
  Box, CopyCheck, ClipboardPaste, Maximize2, FlipHorizontal2,
  Rows3, Columns3, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  StretchHorizontal, Minus, Plus, RotateCcw, Link, Unlink, Type, Move
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TYPE_ICONS: Record<string, string> = {
  section: '§', container: '⊞', heading: 'H', text: 'T', button: '▣', image: '◻', columns: '⊟',
  grid: '⊞', card: '◫', navbar: '≡', footer: '⊥', form: '⊡', video: '▶', link: '🔗',
};

const TYPE_COLORS: Record<string, string> = {
  section: 'hsl(var(--studio-ink-3))', container: 'hsl(var(--studio-ink-3))', columns: 'hsl(var(--studio-accent))', grid: 'hsl(var(--studio-accent))',
  heading: 'hsl(var(--studio-warn))', text: 'hsl(var(--studio-ink-2))', button: 'hsl(var(--studio-ok))', image: 'hsl(var(--studio-ink-3))',
  video: 'hsl(var(--studio-ink-3))', card: 'hsl(var(--studio-ink-3))', form: 'hsl(var(--studio-ink-3))', navbar: 'hsl(var(--studio-ink-3))',
  footer: 'hsl(var(--studio-ink-3))', input: 'hsl(var(--studio-warn))', badge: 'hsl(var(--studio-warn))', quote: 'hsl(var(--studio-ink-3))',
};

export const FloatingToolbar = memo(function FloatingToolbar() {
  const { state, dispatch, selectedElement, wrapInContainer, moveSelectedUp, moveSelectedDown, copyStyles, pasteStyles } = useEditor();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showSpacingInput, setShowSpacingInput] = useState(false);
  const [spacingValue, setSpacingValue] = useState('');
  const spacingInputRef = useRef<HTMLInputElement>(null);

  /**
   * Keep the toolbar over its element.
   *
   * This used to be a setInterval firing every 200ms for as long as anything
   * was selected: a querySelector plus a getBoundingClientRect, five times a
   * second, forever. Reading layout on a timer forces the browser to flush
   * style and layout synchronously and defeats its own batching, and it was
   * the single largest cost in the editor - getBoundingClientRect was the
   * hottest identifiable function in a CPU profile of ordinary clicking.
   *
   * Now it measures when something has actually moved: the element resizes,
   * the canvas scrolls, or the window changes. Each measurement is deferred
   * to an animation frame so a burst of scroll events costs one read.
   */
  useEffect(() => {
    if (!selectedElement) return;
    const target = document.querySelector(`[data-element-id="${selectedElement.id}"]`);
    if (!target) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const toolbarWidth = 520;
      let left = rect.left + rect.width / 2 - toolbarWidth / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8));
      let top = rect.top - 56;
      if (top < 56) top = rect.bottom + 8;
      setPosition(prev =>
        Math.abs(prev.top - top) < 1 && Math.abs(prev.left - left) < 1 ? prev : { top, left });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };

    measure();

    const ro = new ResizeObserver(schedule);
    ro.observe(target);

    const scroller = target.closest('[data-canvas="true"]') || window;
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [selectedElement, state.elements]);

  const updateStyle = useCallback((prop: string, value: string) => {
    if (!selectedElement) return;
    const newStyles = { ...selectedElement.styles };
    const bp = state.breakpoint;
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
  const typeColor = TYPE_COLORS[selectedElement.type] || 'hsl(var(--studio-accent))';

  type ActionItem = { icon: typeof Copy; label: string; onClick: () => void; danger?: boolean; active?: boolean; color?: string } | 'sep';

  const currentOpacity = parseFloat(currentStyles?.opacity as string ?? '1');

  const actions: ActionItem[] = [
    { icon: ArrowUp, label: 'Move up (⌥↑)', onClick: () => moveSelectedUp() },
    { icon: ArrowDown, label: 'Move down (⌥↓)', onClick: () => moveSelectedDown() },
    'sep',
  ];

  if (isText) {
    actions.push(
      { icon: AlignLeft, label: 'Align left', onClick: () => updateStyle('textAlign', 'left'), active: currentStyles?.textAlign === 'left' },
      { icon: AlignCenter, label: 'Align center', onClick: () => updateStyle('textAlign', 'center'), active: currentStyles?.textAlign === 'center' },
      { icon: AlignRight, label: 'Align right', onClick: () => updateStyle('textAlign', 'right'), active: currentStyles?.textAlign === 'right' },
      'sep',
      { icon: Minus, label: 'Decrease font size', onClick: () => {
        const size = parseInt(currentStyles?.fontSize as string) || 16;
        updateStyle('fontSize', `${Math.max(8, size - 2)}px`);
      }, color: 'hsl(var(--studio-warn))' },
      { icon: Type, label: `Font: ${(currentStyles?.fontSize as string) || '16px'}`, onClick: () => {}, color: 'hsl(var(--studio-warn))' },
      { icon: Plus, label: 'Increase font size', onClick: () => {
        const size = parseInt(currentStyles?.fontSize as string) || 16;
        updateStyle('fontSize', `${Math.min(200, size + 2)}px`);
      }, color: 'hsl(var(--studio-warn))' },
      'sep',
    );
  }

  if (isContainer) {
    actions.push(
      { icon: Rows3, label: 'Stack vertical', onClick: () => updateStyle('flexDirection', 'column'), active: currentStyles?.flexDirection === 'column' || !currentStyles?.flexDirection, color: 'hsl(var(--studio-ink-3))' },
      { icon: Columns3, label: 'Stack horizontal', onClick: () => updateStyle('flexDirection', 'row'), active: currentStyles?.flexDirection === 'row', color: 'hsl(var(--studio-accent))' },
      'sep',
      { icon: AlignStartVertical, label: 'Align start', onClick: () => updateStyle('alignItems', 'flex-start'), active: currentStyles?.alignItems === 'flex-start' },
      { icon: AlignCenterVertical, label: 'Align center', onClick: () => updateStyle('alignItems', 'center'), active: currentStyles?.alignItems === 'center' },
      { icon: AlignEndVertical, label: 'Align end', onClick: () => updateStyle('alignItems', 'flex-end'), active: currentStyles?.alignItems === 'flex-end' },
      { icon: StretchHorizontal, label: 'Stretch', onClick: () => updateStyle('alignItems', 'stretch'), active: currentStyles?.alignItems === 'stretch' },
      'sep',
      { icon: Maximize2, label: 'Toggle wrap', onClick: () => updateStyle('flexWrap', currentStyles?.flexWrap === 'wrap' ? 'nowrap' : 'wrap'), active: currentStyles?.flexWrap === 'wrap' },
      'sep',
    );
  }

  actions.push(
    { icon: Minus, label: 'Reduce padding', onClick: () => adjustSpacing('padding', -4), color: 'hsl(var(--studio-ink-3))' },
    { icon: Plus, label: 'Increase padding', onClick: () => adjustSpacing('padding', 4), color: 'hsl(var(--studio-ink-3))' },
    'sep',
    { icon: Copy, label: 'Duplicate (⌘D)', onClick: () => dispatch({ type: 'DUPLICATE_ELEMENT', payload: selectedElement.id }) },
    { icon: Box, label: 'Wrap (⌘G)', onClick: () => wrapInContainer() },
    { icon: CopyCheck, label: 'Copy Style (⌘⌥C)', onClick: () => copyStyles() },
    { icon: ClipboardPaste, label: 'Paste Style (⌘⌥V)', onClick: () => pasteStyles() },
    'sep',
    {
      icon: selectedElement.hidden ? Eye : EyeOff,
      label: selectedElement.hidden ? 'Show' : 'Hide',
      onClick: () => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { hidden: !selectedElement.hidden } } }),
    },
    {
      icon: selectedElement.locked ? Unlock : Lock,
      label: selectedElement.locked ? 'Unlock' : 'Lock',
      onClick: () => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { locked: !selectedElement.locked } } }),
      color: selectedElement.locked ? 'hsl(var(--studio-warn))' : undefined,
    },
    'sep',
    { icon: Palette, label: 'Style panel', onClick: () => dispatch({ type: 'SET_RIGHT_TAB', payload: 'style' }) },
    { icon: Sparkles, label: 'Animate', onClick: () => dispatch({ type: 'SET_RIGHT_TAB', payload: 'animation' }) },
    'sep',
    { icon: Trash2, label: 'Delete (Del)', onClick: () => dispatch({ type: 'DELETE_ELEMENT', payload: selectedElement.id }), danger: true },
  );

  const currentPadding = currentStyles?.padding || '0';

  return (
    <AnimatePresence>
      <motion.div
        ref={toolbarRef}
        key={selectedElement.id}
        initial={{ opacity: 0, y: 8, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: 200,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1px',
            padding: '4px 6px',
            backgroundColor: 'rgba(14, 14, 14, 0.98)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 30px ${typeColor}08`,
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Element type badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', marginRight: '2px',
            borderRadius: '8px',
            backgroundColor: `${typeColor}0c`,
            border: `1px solid ${typeColor}18`,
            boxShadow: `0 0 8px ${typeColor}08`,
          }}>
            <span style={{ fontSize: '11px', lineHeight: '1' }}>{TYPE_ICONS[selectedElement.type] || '◻'}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {selectedElement.name || selectedElement.type}
            </span>
          </div>

          <div style={{ width: '1px', height: '22px', backgroundColor: '#282828' }} />

          {/* Padding indicator — clickable with inline input */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => {
                setShowSpacingInput(v => !v);
                setSpacingValue(typeof currentPadding === 'string' ? currentPadding.replace(/px/g, '') : String(currentPadding));
                setTimeout(() => spacingInputRef.current?.focus(), 50);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                padding: '2px 8px', borderRadius: '6px',
                backgroundColor: showSpacingInput ? 'hsl(var(--studio-ink-3) / 0.12)' : 'hsl(var(--studio-ink-3) / 0.06)',
                cursor: 'pointer',
                border: showSpacingInput ? '1px solid hsl(var(--studio-ink-3) / 0.25)' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
              title="Click to edit padding"
            >
              <Move className="h-2.5 w-2.5" style={{ color: 'hsl(var(--studio-ink-3))' }} />
              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'hsl(var(--studio-ink-3))', fontWeight: 600 }}>
                {typeof currentPadding === 'string' ? currentPadding.replace(/px/g, '') : currentPadding}
              </span>
            </div>
            {showSpacingInput && (
              <div
                style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  marginTop: '6px', padding: '8px', borderRadius: '10px',
                  backgroundColor: 'rgba(14,14,14,0.98)', border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)',
                  zIndex: 300, minWidth: '140px',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ fontSize: '8px', fontWeight: 700, color: 'hsl(var(--studio-ink-3))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Padding (px)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => adjustSpacing('padding', -4)}
                    style={{ width: '22px', height: '22px', borderRadius: '5px', border: '1px solid hsl(var(--studio-line))', backgroundColor: 'hsl(var(--studio-panel))', color: 'hsl(var(--studio-ink-2))', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >−</button>
                  <input
                    ref={spacingInputRef}
                    value={spacingValue}
                    onChange={e => setSpacingValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = parseInt(spacingValue);
                        if (!isNaN(val)) updateStyle('padding', `${Math.max(0, val)}px`);
                        setShowSpacingInput(false);
                      }
                      if (e.key === 'Escape') setShowSpacingInput(false);
                    }}
                    onBlur={() => {
                      const val = parseInt(spacingValue);
                      if (!isNaN(val)) updateStyle('padding', `${Math.max(0, val)}px`);
                      setShowSpacingInput(false);
                    }}
                    style={{
                      width: '48px', height: '22px', borderRadius: '5px', border: '1px solid hsl(var(--studio-ink-3))',
                      backgroundColor: 'hsl(var(--studio-sunken))', color: 'hsl(var(--studio-ink-3))', fontSize: '11px', fontFamily: 'monospace',
                      textAlign: 'center', outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => adjustSpacing('padding', 4)}
                    style={{ width: '22px', height: '22px', borderRadius: '5px', border: '1px solid hsl(var(--studio-line))', backgroundColor: 'hsl(var(--studio-panel))', color: 'hsl(var(--studio-ink-2))', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
                {/* Quick presets */}
                <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                  {['0', '8', '16', '24', '32', '48'].map(v => (
                    <button
                      key={v}
                      onClick={() => { updateStyle('padding', `${v}px`); setShowSpacingInput(false); }}
                      style={{
                        flex: 1, height: '20px', borderRadius: '4px', border: '1px solid #282828',
                        backgroundColor: currentPadding === `${v}px` ? 'hsl(var(--studio-ink-3) / 0.12)' : 'hsl(var(--studio-panel))',
                        color: currentPadding === `${v}px` ? 'hsl(var(--studio-ink-3))' : 'hsl(var(--studio-ink-3))',
                        fontSize: '8px', fontFamily: 'monospace', cursor: 'pointer',
                      }}
                    >{v}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opacity control with slider */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '2px 6px', borderRadius: '6px',
              backgroundColor: currentOpacity < 1 ? 'hsl(var(--studio-ink-3) / 0.06)' : 'transparent',
            }}
            title={`Opacity: ${Math.round(currentOpacity * 100)}%`}
          >
            <Eye className="h-2.5 w-2.5" style={{ color: currentOpacity < 1 ? 'hsl(var(--studio-ink-3))' : 'hsl(var(--studio-line))', cursor: 'pointer' }}
              onClick={() => {
                const next = currentOpacity >= 1 ? 0.5 : currentOpacity <= 0.3 ? 1 : currentOpacity - 0.25;
                updateStyle('opacity', String(Math.max(0.05, next)));
              }}
            />
            <input
              type="range"
              min="5" max="100"
              value={Math.round(currentOpacity * 100)}
              onChange={e => updateStyle('opacity', String(parseInt(e.target.value) / 100))}
              style={{
                width: '40px', height: '3px', accentColor: 'hsl(var(--studio-ink-3))',
                cursor: 'pointer', opacity: 0.8,
              }}
            />
            <span style={{ fontSize: '8px', fontFamily: 'monospace', color: currentOpacity < 1 ? 'hsl(var(--studio-ink-3))' : 'hsl(var(--studio-ink-3))', fontWeight: 600, minWidth: '24px', textAlign: 'right' }}>
              {Math.round(currentOpacity * 100)}%
            </span>
          </div>

          <div style={{ width: '1px', height: '18px', backgroundColor: '#282828' }} />

          <TooltipProvider delayDuration={150}>
            {actions.map((action, i) => {
              if (action === 'sep') {
                return <div key={`sep-${i}`} style={{ width: '1px', height: '18px', backgroundColor: '#282828', margin: '0 1px' }} />;
              }
              const Icon = action.icon;
              const activeColor = action.color || 'hsl(var(--studio-accent))';
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '26px', borderRadius: '7px',
                        border: 'none', cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        backgroundColor: action.active ? `${activeColor}12` : 'transparent',
                        color: action.active ? activeColor : action.danger ? 'hsl(var(--studio-risk))' : 'hsl(var(--studio-ink-3))',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = action.danger ? 'rgba(239,68,68,0.1)' : `${activeColor}12`;
                        e.currentTarget.style.color = action.danger ? 'hsl(var(--studio-risk))' : activeColor;
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = action.active ? `${activeColor}12` : 'transparent';
                        e.currentTarget.style.color = action.active ? activeColor : action.danger ? 'hsl(var(--studio-risk))' : 'hsl(var(--studio-ink-3))';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                  >
                    {action.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
