import { useState, useEffect, useRef, forwardRef } from 'react';
import { useCAD } from './CADContext';
import { generateId } from './cadGeometry';
import { cn } from '@/lib/utils';
import { Copy, Trash2, Eye, EyeOff, Lock, Unlock, Group, Ungroup, FlipHorizontal2, Info, Scissors, MousePointer2, ZoomIn, RotateCcw, Box } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  entityId?: string;
  onClose: () => void;
}

export const CADContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(function CADContextMenu({ x, y, entityId, onClose }, ref) {
  const { state, dispatch } = useCAD();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', handler);
    window.addEventListener('keydown', keyHandler);
    return () => { window.removeEventListener('mousedown', handler); window.removeEventListener('keydown', keyHandler); };
  }, [onClose]);

  const entity = entityId ? state.entities.find(e => e.id === entityId) : null;
  const hasSelection = state.selectedIds.length > 0;

  const items = entity || hasSelection ? [
    { label: 'Select All', icon: MousePointer2, action: () => { dispatch({ type: 'SELECT_ALL' }); onClose(); }, shortcut: 'Ctrl+A' },
    { divider: true },
    { label: 'Make Component', icon: Box, action: () => {
      if (state.selectedIds.length > 0) {
        const selected = state.entities.filter(e => state.selectedIds.includes(e.id));
        dispatch({ type: 'ADD_BLOCK_DEFINITION', payload: {
          id: generateId(), name: `Component ${state.blockDefinitions.length + 1}`,
          basePoint: { x: 0, y: 0, z: 0 }, entities: selected, createdAt: Date.now(),
        }});
        dispatch({ type: 'ADD_COMMAND', payload: `Component created from ${selected.length} entities` });
      }
      onClose();
    }, shortcut: 'G' },
    { label: 'Group', icon: Group, action: () => {
      if (state.selectedIds.length > 1) {
        dispatch({ type: 'CREATE_GROUP', payload: { name: `Group ${state.groups.length + 1}`, entityIds: [...state.selectedIds] } });
      }
      onClose();
    } },
    { label: 'Ungroup', icon: Ungroup, action: () => {
      const groupIds = [...new Set(state.entities.filter(e => state.selectedIds.includes(e.id) && e.groupId).map(e => e.groupId!))];
      groupIds.forEach(gid => dispatch({ type: 'DELETE_GROUP', payload: gid }));
      onClose();
    } },
    { divider: true },
    { label: 'Copy', icon: Copy, action: () => { dispatch({ type: 'SET_TOOL', payload: 'copy' }); onClose(); }, shortcut: 'CO' },
    { label: 'Move', icon: MousePointer2, action: () => { dispatch({ type: 'SET_TOOL', payload: 'move' }); onClose(); }, shortcut: 'M' },
    { label: 'Rotate', icon: RotateCcw, action: () => { dispatch({ type: 'SET_TOOL', payload: 'rotate' }); onClose(); }, shortcut: 'Q' },
    { label: 'Flip Along X', icon: FlipHorizontal2, action: () => {
      dispatch({ type: 'SET_TOOL', payload: 'mirror' }); onClose();
    } },
    { divider: true },
    { label: 'Hide', icon: EyeOff, action: () => { dispatch({ type: 'HIDE_SELECTED' }); onClose(); } },
    { label: 'Lock', icon: Lock, action: () => {
      state.selectedIds.forEach(id => dispatch({ type: 'UPDATE_ENTITY', payload: { id, changes: { locked: true } } }));
      onClose();
    } },
    { label: 'Unlock', icon: Unlock, action: () => {
      state.selectedIds.forEach(id => dispatch({ type: 'UPDATE_ENTITY', payload: { id, changes: { locked: false } } }));
      onClose();
    } },
    { divider: true },
    { label: 'Entity Info', icon: Info, action: () => { (window as any).__cadOpenEntityInfo?.(); onClose(); } },
    { label: 'Delete', icon: Trash2, action: () => { dispatch({ type: 'DELETE_SELECTED' }); onClose(); }, shortcut: 'Del', danger: true },
  ] : [
    { label: 'Select All', icon: MousePointer2, action: () => { dispatch({ type: 'SELECT_ALL' }); onClose(); }, shortcut: 'Ctrl+A' },
    { divider: true },
    { label: 'Zoom Extents', icon: ZoomIn, action: () => { dispatch({ type: 'ADD_COMMAND', payload: 'Zoom Extents' }); onClose(); } },
    { label: 'Show All', icon: Eye, action: () => { dispatch({ type: 'SHOW_ALL' }); onClose(); } },
    { divider: true },
    { label: 'Reset Axes', icon: RotateCcw, action: () => { dispatch({ type: 'ADD_COMMAND', payload: 'Axes reset to origin' }); onClose(); } },
  ];

  // Adjust position to keep menu in viewport
  const menuW = 200, menuH = items.length * 28;
  const posX = Math.min(x, window.innerWidth - menuW - 10);
  const posY = Math.min(y, window.innerHeight - menuH - 10);

  return (
    <div
      ref={menuRef}
      className="fixed z-[1100] bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/[0.08] rounded-lg shadow-2xl shadow-black/70 py-1 min-w-[200px] select-none"
      style={{ left: posX, top: posY }}
    >
      {items.map((item, i) => {
        if ('divider' in item && item.divider) return <div key={i} className="h-px bg-white/[0.06] my-1 mx-2" />;
        const Icon = (item as any).icon;
        return (
          <button
            key={i}
            onClick={(item as any).action}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] hover:bg-white/[0.06] transition-colors text-left",
              (item as any).danger ? "text-red-400 hover:text-red-300" : "text-white/70 hover:text-white/90"
            )}
          >
            {Icon && <Icon className="h-3 w-3 opacity-50 shrink-0" />}
            <span className="flex-1">{(item as any).label}</span>
            {(item as any).shortcut && (
              <span className="text-[9px] text-white/20 font-mono">{(item as any).shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
});
