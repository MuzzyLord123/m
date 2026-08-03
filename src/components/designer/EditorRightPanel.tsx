import { useEditor } from './EditorContext';
import { getResolvedStyles } from './utils/cssCompiler';
import { StyleEditor } from './StyleEditor';
import { AnimationEditor } from './AnimationEditor';
import { SettingsPanel } from './SettingsPanel';
import { Paintbrush, Sparkles, Settings, Copy, Trash2, Lock, Unlock, Eye, EyeOff, Info, Clipboard, Check, ChevronRight, Layers, Box, Edit3 } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_COLORS: Record<string, string> = {
  section: 'hsl(var(--studio-ink-3))', container: 'hsl(var(--studio-ink-3))', columns: 'hsl(var(--studio-accent))', grid: 'hsl(var(--studio-accent))',
  heading: 'hsl(var(--studio-warn))', text: 'hsl(var(--studio-ink-2))', button: 'hsl(var(--studio-ok))', image: 'hsl(var(--studio-ink-3))',
  video: 'hsl(var(--studio-ink-3))', card: 'hsl(var(--studio-ink-3))', form: 'hsl(var(--studio-ink-3))', navbar: 'hsl(var(--studio-ink-3))',
  footer: 'hsl(var(--studio-ink-3))', input: 'hsl(var(--studio-warn))', divider: 'hsl(var(--studio-ink-3))', spacer: 'hsl(var(--studio-ink-3))',
};

// Box Model Visualizer — mini CSS box model diagram
function BoxModelVisualizer({ element, breakpoint }: { element: any; breakpoint: string }) {
  const styles = useMemo(() => {
    const desktop = element.styles?.desktop || {};
    const bp = breakpoint !== 'desktop' ? element.styles?.[breakpoint] || {} : {};
    return { ...desktop, ...bp };
  }, [element.styles, breakpoint]);

  const parse = (v: any) => parseInt(v as string) || 0;
  const margin = {
    top: parse(styles.marginTop || styles.margin),
    right: parse(styles.marginRight || styles.margin),
    bottom: parse(styles.marginBottom || styles.margin),
    left: parse(styles.marginLeft || styles.margin),
  };
  const padding = {
    top: parse(styles.paddingTop || styles.padding),
    right: parse(styles.paddingRight || styles.padding),
    bottom: parse(styles.paddingBottom || styles.padding),
    left: parse(styles.paddingLeft || styles.padding),
  };
  const w = styles.width || 'auto';
  const h = styles.height || 'auto';
  const valStyle = (v: number, color: string): React.CSSProperties => ({
    fontSize: '7px', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 700,
    color: v > 0 ? color: 'hsl(var(--studio-hover))', minWidth: '14px', textAlign: 'center',
  });

  return (
    <div style={{ backgroundColor: 'hsl(var(--studio-sunken))', borderRadius: '6px', padding: '6px', border: '1px solid hsl(var(--studio-line))' }}>
      <div style={{ border: '1px dashed rgba(245,158,11,0.25)', borderRadius: '4px', padding: '2px', position: 'relative' }}>
        <div className="flex items-center justify-center" style={{ height: '12px' }}>
          <span style={valStyle(margin.top, 'hsl(var(--studio-warn))')}>{margin.top}</span>
        </div>
        <div className="flex items-center">
          <div className="flex items-center justify-center" style={{ width: '20px' }}>
            <span style={valStyle(margin.left, 'hsl(var(--studio-warn))')}>{margin.left}</span>
          </div>
          <div style={{ flex: 1, border: '1px dashed rgba(34,197,94,0.3)', borderRadius: '3px', padding: '2px' }}>
            <div className="flex items-center justify-center" style={{ height: '10px' }}>
              <span style={valStyle(padding.top, 'hsl(var(--studio-ok))')}>{padding.top}</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center" style={{ width: '18px' }}>
                <span style={valStyle(padding.left, 'hsl(var(--studio-ok))')}>{padding.left}</span>
              </div>
              <div style={{ flex: 1, height: '18px', backgroundColor: 'hsl(var(--studio-accent) / 0.08)', borderRadius: '2px', border: '1px solid hsl(var(--studio-accent) / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '7px', fontFamily: 'monospace', color: 'hsl(var(--studio-accent))', fontWeight: 600 }}>
                  {typeof w === 'string' && w !== 'auto' ? w : '—'} × {typeof h === 'string' && h !== 'auto' ? h : '—'}
                </span>
              </div>
              <div className="flex items-center justify-center" style={{ width: '18px' }}>
                <span style={valStyle(padding.right, 'hsl(var(--studio-ok))')}>{padding.right}</span>
              </div>
            </div>
            <div className="flex items-center justify-center" style={{ height: '10px' }}>
              <span style={valStyle(padding.bottom, 'hsl(var(--studio-ok))')}>{padding.bottom}</span>
            </div>
          </div>
          <div className="flex items-center justify-center" style={{ width: '20px' }}>
            <span style={valStyle(margin.right, 'hsl(var(--studio-warn))')}>{margin.right}</span>
          </div>
        </div>
        <div className="flex items-center justify-center" style={{ height: '12px' }}>
          <span style={valStyle(margin.bottom, 'hsl(var(--studio-warn))')}>{margin.bottom}</span>
        </div>
        <span style={{ position: 'absolute', top: '1px', left: '4px', fontSize: '6px', color: 'hsl(var(--studio-warn))', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', opacity: 0.6 }}>margin</span>
      </div>
    </div>
  );
}

export function EditorRightPanel({ siteId }: { siteId?: string }) {
  const { state, dispatch, selectedElement } = useEditor();
  const [copied, setCopied] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [isRenaming]);

  const startRename = () => {
    if (!selectedElement) return;
    setRenameValue(selectedElement.name || selectedElement.type);
    setIsRenaming(true);
  };

  const commitRename = () => {
    if (selectedElement && renameValue.trim()) {
      dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { name: renameValue.trim() } } });
    }
    setIsRenaming(false);
  };

  const tabs = [
    { key: 'style' as const, label: 'Style', icon: Paintbrush, color: 'hsl(var(--studio-accent))' },
    { key: 'settings' as const, label: 'Settings', icon: Settings, color: 'hsl(var(--studio-ok))' },
    { key: 'animation' as const, label: 'Animate', icon: Sparkles, color: 'hsl(var(--studio-ink-3))' },
  ];

  const copyId = () => {
    if (!selectedElement) return;
    navigator.clipboard.writeText(selectedElement.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const typeColor = selectedElement ? (TYPE_COLORS[selectedElement.type] || 'hsl(var(--studio-ink-3))') : 'hsl(var(--studio-ink-3))';

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'hsl(var(--studio-panel))' }}>
      {/* Tab bar */}
      <div className="flex shrink-0 px-1 pt-1" style={{ borderBottom: '1px solid hsl(var(--studio-line))', backgroundColor: 'hsl(var(--studio-panel))' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = state.rightPanelTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: tab.key })}
              className="relative flex-1 h-9 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wider transition-all rounded-t-md"
              style={{
                color: active ? 'hsl(var(--studio-ink))' : 'hsl(var(--studio-ink-3))',
                backgroundColor: active ? 'rgba(255,255,255,0.04)' : 'transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'hsl(var(--studio-ink-2))'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'hsl(var(--studio-ink-3))'; }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: active ? tab.color : undefined }} />
              {tab.label}
              {active && (
                <motion.div
                  layoutId="right-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full"
                  style={{ backgroundColor: tab.color }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Element info header with box model */}
      {selectedElement && (
        <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid hsl(var(--studio-line))', backgroundColor: 'rgba(255,255,255,0.015)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold uppercase"
                style={{
                  backgroundColor: `${typeColor}12`,
                  color: typeColor,
                  border: `1px solid ${typeColor}20`,
                }}
              >
                {selectedElement.type.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                    className="text-[11px] font-medium text-[hsl(var(--studio-ink-2))] block leading-tight w-full bg-transparent border-b border-[hsl(var(--studio-accent))] outline-none pb-0.5"
                    style={{ caretColor: 'hsl(var(--studio-accent))' }}
                  />
                ) : (
                  <button
                    onDoubleClick={startRename}
                    className="text-[11px] font-medium text-[hsl(var(--studio-ink-2))] block leading-tight truncate max-w-[140px] text-left hover:text-white transition-colors group"
                    title="Double-click to rename"
                  >
                    {selectedElement.name || selectedElement.type}
                    <Edit3 className="inline-block h-2.5 w-2.5 ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />
                  </button>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] uppercase tracking-wider font-semibold" style={{ color: typeColor }}>
                    {selectedElement.type}
                  </span>
                  {selectedElement.children?.length > 0 && (
                    <span className="text-[8px] tabular-nums" style={{ color: 'hsl(var(--studio-hover))' }}>
                      • {selectedElement.children.length} children
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {selectedElement.locked && (
                <div className="h-5 w-5 flex items-center justify-center rounded" style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}>
                  <Lock className="h-2.5 w-2.5" style={{ color: 'hsl(var(--studio-warn))' }} />
                </div>
              )}
              {selectedElement.hidden && (
                <div className="h-5 w-5 flex items-center justify-center rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                  <EyeOff className="h-2.5 w-2.5" style={{ color: 'hsl(var(--studio-risk))' }} />
                </div>
              )}
              <button onClick={copyId} className="h-5 w-5 flex items-center justify-center rounded hover:bg-white/[0.06] transition-colors" title="Copy element ID">
                {copied ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Clipboard className="h-2.5 w-2.5 text-[hsl(var(--studio-ink-3))]" />}
              </button>
            </div>
          </div>

          {/* Breadcrumb path */}
          <div className="flex items-center gap-0.5 text-[8px] overflow-x-auto scrollbar-none mb-2">
            <span style={{ color: 'hsl(var(--studio-hover))' }}>body</span>
            <ChevronRight className="h-2 w-2 shrink-0" style={{ color: 'hsl(var(--studio-hover))' }} />
            <span style={{ color: typeColor }}>{selectedElement.type}</span>
          </div>

          {/* Mini Box Model Visualizer */}
          <BoxModelVisualizer element={selectedElement} breakpoint={state.breakpoint} />
        </div>
      )}

      {/* With nothing selected the panel used to stack two empty states -
          this one, and StyleEditor's own "Select an element to style" -
          plus a 2x2 grid of shortcuts to other panels and a keyboard hint.
          Three explanations of the same nothing. One quiet line is enough;
          the style editor below says the rest. */}
      {!selectedElement && (
        <div className="shrink-0 border-b border-[hsl(var(--studio-line))] px-4 py-5">
          <p className="text-[12px] text-[hsl(var(--studio-ink-2))]">Nothing selected</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[hsl(var(--studio-ink-3))]">
            Click an element on the canvas to style it, or press{' '}
            <kbd className="rounded-[4px] border border-[hsl(var(--studio-line))] bg-[hsl(var(--studio-sunken))] px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>{' '}
            to search everything.
          </p>
        </div>
      )}

      {/* Panel content */}
      <div className="flex-1 overflow-hidden" style={{ backgroundColor: 'hsl(var(--studio-panel))' }}>
        {state.rightPanelTab === 'style' && <StyleEditor siteId={siteId} />}
        {state.rightPanelTab === 'settings' && <SettingsPanel siteId={siteId} />}
        {state.rightPanelTab === 'animation' && <AnimationEditor />}
      </div>

      {/* Element actions footer — enhanced with labels */}
      {selectedElement && (
        <div className="p-1.5 shrink-0" style={{ borderTop: '1px solid hsl(var(--studio-line))', backgroundColor: 'hsl(var(--studio-panel))' }}>
          <div className="grid grid-cols-4 gap-1">
            {[
              { icon: selectedElement.hidden ? EyeOff : Eye, label: selectedElement.hidden ? 'Show' : 'Hide', onClick: () => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { hidden: !selectedElement.hidden } } }), active: selectedElement.hidden },
              { icon: selectedElement.locked ? Unlock : Lock, label: selectedElement.locked ? 'Unlock' : 'Lock', onClick: () => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { locked: !selectedElement.locked } } }), active: selectedElement.locked, color: 'hsl(var(--studio-warn))' },
              { icon: Copy, label: 'Clone', onClick: () => dispatch({ type: 'DUPLICATE_ELEMENT', payload: selectedElement.id }) },
              { icon: Trash2, label: 'Delete', onClick: () => dispatch({ type: 'DELETE_ELEMENT', payload: selectedElement.id }), danger: true },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  className="h-8 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all text-[9px] font-medium group"
                  style={{
                    color: action.danger ? 'hsl(var(--studio-risk))' : action.active ? (action.color || 'hsl(var(--studio-accent))') : 'hsl(var(--studio-ink-3))',
                    backgroundColor: action.active ? `${action.color || 'hsl(var(--studio-accent))'}08` : 'transparent',
                    border: `1px solid ${action.active ? `${action.color || 'hsl(var(--studio-accent))'}15` : 'transparent'}`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = action.danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = action.danger ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = action.active ? `${action.color || 'hsl(var(--studio-accent))'}08` : 'transparent';
                    e.currentTarget.style.borderColor = action.active ? `${action.color || 'hsl(var(--studio-accent))'}15` : 'transparent';
                  }}
                  onClick={action.onClick}
                  title={action.label}
                >
                  <Icon className="h-3 w-3 transition-transform group-hover:scale-110" />
                  <span className="text-[7px] uppercase tracking-wider opacity-60">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
