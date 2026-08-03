import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor } from './EditorContext';
import { findParent } from './utils/treeUtils';
import {
  Copy, Clipboard, Trash2, ArrowUp, ArrowDown, Eye, EyeOff,
  Lock, Unlock, Layers, Sparkles, Paintbrush, Settings, CopyPlus,
  Box, CopyCheck, ClipboardPaste, Wand2, Scissors, Replace,
  ChevronRight, Type, Image, Layout, MousePointer, CornerLeftUp, Users
} from 'lucide-react';
import { AIEditDialog } from './AIEditDialog';

interface MenuPosition { x: number; y: number; }
interface MenuItem {
  icon: typeof Copy;
  label: string;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
  highlight?: boolean;
  group: string;
  desc?: string;
}

const GROUP_LABELS: Record<string, { label: string; icon: typeof Copy; color: string }> = {
  AI: { label: 'AI', icon: Wand2, color: 'hsl(var(--studio-ink-3))' },
  Clipboard: { label: 'Clipboard', icon: Copy, color: 'hsl(var(--studio-accent))' },
  Style: { label: 'Style', icon: Paintbrush, color: 'hsl(var(--studio-ink-3))' },
  Transform: { label: 'Transform', icon: Box, color: 'hsl(var(--studio-warn))' },
  Visibility: { label: 'Visibility', icon: Eye, color: 'hsl(var(--studio-ok))' },
  Open: { label: 'Open Panel', icon: Layout, color: 'hsl(var(--studio-ink-3))' },
  Danger: { label: 'Destructive', icon: Trash2, color: 'hsl(var(--studio-risk))' },
};

const TYPE_ICONS: Record<string, typeof Copy> = {
  section: Layout, text: Type, heading: Type, image: Image,
  button: MousePointer, container: Box, navbar: Layout, footer: Layout,
};

export function ContextMenu() {
  const { state, dispatch, selectedElement, wrapInContainer, moveSelectedUp, moveSelectedDown, copyStyles, pasteStyles } = useEditor();
  const [pos, setPos] = useState<MenuPosition | null>(null);
  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [aiEditElementId, setAiEditElementId] = useState<string>('');
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    const el = (e.target as HTMLElement)?.closest('[data-element-id]');
    if (!el) { setPos(null); return; }
    e.preventDefault();
    const id = el.getAttribute('data-element-id');
    if (id && !state.selectedIds.includes(id)) {
      dispatch({ type: 'SELECT', payload: id });
    }
    setPos({ x: e.clientX, y: e.clientY });
    setHoveredIndex(-1);
    setExpandedGroup(null);
  }, [state.selectedIds, dispatch]);

  const close = useCallback(() => setPos(null), []);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [handleContextMenu, close]);

  if (!pos || !selectedElement) return (
    <>
      {aiEditOpen && aiEditElementId && (
        <AIEditDialog open={aiEditOpen} onClose={() => setAiEditOpen(false)} elementId={aiEditElementId} />
      )}
    </>
  );

  const menuY = Math.min(pos.y, window.innerHeight - 520);
  const menuX = Math.min(pos.x, window.innerWidth - 260);

  const items: MenuItem[] = [
    { icon: Wand2, label: 'AI Edit…', desc: 'Transform with AI', action: () => { setAiEditElementId(selectedElement.id); setAiEditOpen(true); }, highlight: true, group: 'AI' },
    { icon: Copy, label: 'Copy', shortcut: '⌘C', action: () => dispatch({ type: 'COPY' }), group: 'Clipboard' },
    { icon: Clipboard, label: 'Paste', shortcut: '⌘V', action: () => dispatch({ type: 'PASTE' }), group: 'Clipboard' },
    { icon: CopyPlus, label: 'Duplicate', shortcut: '⌘D', action: () => dispatch({ type: 'DUPLICATE_ELEMENT', payload: selectedElement.id }), group: 'Clipboard' },
    { icon: CopyCheck, label: 'Copy Style', shortcut: '⌘⌥C', action: () => copyStyles(), group: 'Style' },
    { icon: ClipboardPaste, label: 'Paste Style', shortcut: '⌘⌥V', action: () => pasteStyles(), group: 'Style' },
    { icon: Box, label: 'Wrap in Container', shortcut: '⌘G', action: () => wrapInContainer(), group: 'Transform' },
    { icon: ArrowUp, label: 'Move Up', shortcut: '⌥↑', action: () => moveSelectedUp(), group: 'Transform' },
    { icon: ArrowDown, label: 'Move Down', shortcut: '⌥↓', action: () => moveSelectedDown(), group: 'Transform' },
  ];

  // Select Parent action
  const parent = findParent(state.elements, selectedElement.id);
  if (parent) {
    items.push({ icon: CornerLeftUp, label: 'Select Parent', shortcut: 'Esc', action: () => dispatch({ type: 'SELECT', payload: parent.id }), group: 'Transform' });
  }

  // Select All Children action
  if (selectedElement.children.length > 0) {
    items.push({
      icon: Users, label: `Select Children (${selectedElement.children.length})`, action: () => {
      selectedElement.children.forEach((child, i) => {
        if (i === 0) dispatch({ type: 'SELECT', payload: child.id });
        else dispatch({ type: 'MULTI_SELECT', payload: child.id });
      });
      }, group: 'Transform',
    });
  }

  items.push(
    { icon: selectedElement.hidden ? Eye : EyeOff, label: selectedElement.hidden ? 'Show' : 'Hide', action: () => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { hidden: !selectedElement.hidden } } }), group: 'Visibility' },
    { icon: selectedElement.locked ? Unlock : Lock, label: selectedElement.locked ? 'Unlock' : 'Lock', action: () => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { locked: !selectedElement.locked } } }), group: 'Visibility' },
    { icon: Paintbrush, label: 'Edit Style', action: () => dispatch({ type: 'SET_RIGHT_TAB', payload: 'style' }), group: 'Open' },
    { icon: Sparkles, label: 'Animate', action: () => dispatch({ type: 'SET_RIGHT_TAB', payload: 'animation' }), group: 'Open' },
    { icon: Settings, label: 'Settings', action: () => dispatch({ type: 'SET_RIGHT_TAB', payload: 'settings' }), group: 'Open' },
    { icon: Layers, label: 'Show in Layers', action: () => dispatch({ type: 'SET_LEFT_TAB', payload: 'layers' as any }), group: 'Open' },
    { icon: Trash2, label: 'Delete', shortcut: 'Del', action: () => dispatch({ type: 'DELETE_ELEMENT', payload: selectedElement.id }), danger: true, group: 'Danger' },
  );

  // Group items
  const groups = new Map<string, MenuItem[]>();
  items.forEach(item => {
    if (!groups.has(item.group)) groups.set(item.group, []);
    groups.get(item.group)!.push(item);
  });

  // Keyboard nav
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHoveredIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHoveredIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && hoveredIndex >= 0) {
      items[hoveredIndex].action();
      close();
    } else if (e.key === 'Escape') {
      close();
    }
  };

  let globalIdx = 0;

  const TypeIcon = TYPE_ICONS[selectedElement.type] || Box;
  const parentInfo = `${selectedElement.children.length} children`;

  return (
    <>
      <AnimatePresence>
        <motion.div
          ref={menuRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          initial={{ opacity: 0, scale: 0.92, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'fixed', top: menuY, left: menuX, zIndex: 500,
            minWidth: '260px', padding: '4px',
            backgroundColor: 'rgba(18, 18, 18, 0.98)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 80px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(24px)',
            outline: 'none',
          }}
          onClick={e => e.stopPropagation()}
          onAnimationComplete={() => menuRef.current?.focus()}
        >
          {/* Header with element info */}
          <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '2px' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: 'hsl(var(--studio-accent) / 0.1)',
                  border: '1px solid hsl(var(--studio-accent) / 0.15)',
                  boxShadow: '0 2px 8px hsl(var(--studio-accent) / 0.08)',
                }}
              >
                <TypeIcon className="h-3 w-3" style={{ color: 'hsl(var(--studio-accent))' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold truncate" style={{ color: 'hsl(var(--studio-ink-2))' }}>
                  {selectedElement.name || selectedElement.type}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ color: 'hsl(var(--studio-accent))', backgroundColor: 'hsl(var(--studio-accent) / 0.08)' }}>
                    {selectedElement.type}
                  </span>
                  <span className="text-[8px]" style={{ color: '#383838' }}>•</span>
                  <span className="text-[8px]" style={{ color: 'hsl(var(--studio-hover))' }}>
                    {selectedElement.children.length} children
                  </span>
                </div>
              </div>
              {/* Status badges */}
              <div className="flex items-center gap-1">
                {selectedElement.hidden && (
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}>
                    <EyeOff className="h-2 w-2" style={{ color: 'hsl(var(--studio-warn))' }} />
                  </div>
                )}
                {selectedElement.locked && (
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                    <Lock className="h-2 w-2" style={{ color: 'hsl(var(--studio-risk))' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grouped items with section headers */}
          {Array.from(groups.entries()).map(([group, groupItems], gi) => {
            const groupMeta = GROUP_LABELS[group];
            return (
              <div key={group}>
                {gi > 0 && <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.04)', margin: '3px 8px' }} />}
                {/* Group header */}
                <div className="flex items-center gap-1.5 px-3 pt-1.5 pb-0.5">
                  <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: groupMeta?.color || 'hsl(var(--studio-line-strong))', opacity: 0.6 }}>
                    {groupMeta?.label || group}
                  </span>
                </div>
                {groupItems.map(item => {
                  const idx = globalIdx++;
                  const Icon = item.icon;
                  const isHovered = hoveredIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => { item.action(); close(); }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                        padding: '7px 10px', borderRadius: '8px', border: 'none',
                        backgroundColor: isHovered
                          ? item.danger ? 'rgba(239,68,68,0.1)' : item.highlight ? 'rgba(167,139,250,0.1)' : 'hsl(var(--studio-accent) / 0.08)'
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s',
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isHovered
                            ? item.danger ? 'rgba(239,68,68,0.12)' : item.highlight ? 'rgba(167,139,250,0.12)' : 'hsl(var(--studio-accent) / 0.12)'
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isHovered ? (item.danger ? 'rgba(239,68,68,0.15)' : item.highlight ? 'rgba(167,139,250,0.15)' : 'hsl(var(--studio-accent) / 0.15)') : 'rgba(255,255,255,0.04)'}`,
                        }}
                      >
                        <Icon className="h-3 w-3" style={{ color: item.danger ? 'hsl(var(--studio-risk))' : item.highlight ? 'hsl(var(--studio-ink-3))' : isHovered ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-3))' }} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span style={{
                          fontSize: '12px',
                          fontWeight: item.highlight ? 600 : 500,
                          color: item.danger ? 'hsl(var(--studio-risk))' : item.highlight ? 'hsl(var(--studio-ink-3))' : isHovered ? 'hsl(var(--studio-ink))' : 'hsl(var(--studio-ink-2))',
                          display: 'block',
                        }}>
                          {item.label}
                        </span>
                        {item.desc && isHovered && (
                          <span style={{ fontSize: '9px', color: 'hsl(var(--studio-ink-3))', display: 'block', marginTop: '1px' }}>
                            {item.desc}
                          </span>
                        )}
                      </div>
                      {item.shortcut && (
                        <span style={{
                          fontSize: '9px', fontFamily: 'monospace',
                          padding: '2px 5px', borderRadius: '4px',
                          backgroundColor: 'hsl(var(--studio-panel))', color: 'hsl(var(--studio-ink-3))',
                          border: '1px solid hsl(var(--studio-line))',
                        }}>{item.shortcut}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Footer with element ID */}
          <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: '2px' }}>
            <span style={{ fontSize: '8px', fontFamily: 'monospace', color: 'hsl(var(--studio-raised))' }}>
              {selectedElement.id.slice(0, 12)}… · {parentInfo}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {aiEditOpen && aiEditElementId && (
        <AIEditDialog open={aiEditOpen} onClose={() => setAiEditOpen(false)} elementId={aiEditElementId} />
      )}
    </>
  );
}
