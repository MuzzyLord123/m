import { useState, useRef, useEffect } from 'react';
import { useLongPress } from '@/hooks/useLongPress';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronRight,
  Pencil,
  Trash2,
  Palette,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SidebarFolder, FOLDER_COLORS } from '@/hooks/useSidebarLayout';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface SidebarFolderComponentProps {
  folder: SidebarFolder;
  items: NavItem[];
  collapsed: boolean;
  isPathActive: (path: string) => boolean;
  hasNotification: (path: string) => boolean;
  unreadCount: number;
  onToggle: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onChangeColor: (color: string) => void;
  onRemoveItem: (itemId: string) => void;
  isDragActive?: boolean;
  overId?: string | null;
  onNavigate?: (item: NavItem) => void;
  onItemLongPress?: (itemId: string) => void;
  dragEnabled?: boolean;
}

export function SidebarFolderComponent({
  folder,
  items,
  collapsed,
  isPathActive,
  hasNotification,
  unreadCount,
  onToggle,
  onRename,
  onDelete,
  onChangeColor,
  onRemoveItem,
  isDragActive,
  overId,
  onNavigate,
  onItemLongPress,
  dragEnabled = true,
}: SidebarFolderComponentProps) {
  const navigate = useNavigate();
  const handleItemClick = (item: NavItem) => {
    if (onNavigate) {
      onNavigate(item);
    } else {
      navigate(item.path);
    }
  };
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: folder.id, disabled: !dragEnabled });

  const isDropTarget = isDragActive && overId === folder.id && !isDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const totalNotifications = items.reduce((acc, item) => {
    if (item.path === '/lounge/messages') return acc + unreadCount;
    return acc;
  }, 0);
  const hasAnyNotification = items.some(item => hasNotification(item.path));

  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextMenu(null);
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== folder.name) onRename(trimmed);
    setRenaming(false);
  };

  // Collapsed: stacked circular icons with expandable items
  if (collapsed) {
    return (
      <div ref={setNodeRef} style={style}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={onToggle}
              onContextMenu={handleContextMenu}
              className="relative flex items-center justify-center w-full py-1.5"
            >
              <div
                className={cn(
                  "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                  isDropTarget && "ring-2 ring-primary scale-110",
                  folder.expanded && "ring-2 ring-offset-1 ring-offset-card"
                )}
                style={{
                  backgroundColor: `${folder.color}18`,
                  border: `1px solid ${folder.color}30`,
                  ...(folder.expanded ? { ringColor: folder.color } : {}),
                }}
              >
                <FolderOpen className="w-4 h-4" style={{ color: folder.color }} />
                {hasAnyNotification && !folder.expanded && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive ring-2 ring-card flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">
                      {totalNotifications > 0 ? (totalNotifications > 9 ? '9+' : totalNotifications) : '!'}
                    </span>
                  </span>
                )}
                {!folder.expanded && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ backgroundColor: folder.color }}
                  >
                    {items.length}
                  </span>
                )}
              </div>
            </button>
          </TooltipTrigger>
          {!folder.expanded && (
            <TooltipContent side="right" sideOffset={10} className="space-y-1">
              <p className="font-semibold text-xs">{folder.name}</p>
              {items.map(item => (
                <p key={item.id} className="text-[11px] text-muted-foreground">{item.label}</p>
              ))}
            </TooltipContent>
          )}
        </Tooltip>

        {/* Expanded items in collapsed sidebar */}
        <AnimatePresence>
          {folder.expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden flex flex-col items-center gap-0.5 mt-0.5"
            >
              {items.map((item) => {
                const active = isPathActive(item.path);
                const Icon = item.icon;
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                       <button
                        onClick={() => handleItemClick(item)}
                        className={cn(
                          "relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200",
                          active
                            ? "bg-brand/10 text-primary ring-1 ring-brand/25 shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                        {hasNotification(item.path) && (
                          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10} className="font-medium">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drop target indicator */}
      <AnimatePresence>
        {isDropTarget && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.8 }}
            className="absolute inset-0 rounded-lg border-2 border-dashed bg-primary/5 z-0 pointer-events-none"
            style={{ borderColor: `${folder.color}60` }}
          />
        )}
      </AnimatePresence>

      {/* Folder Header */}
      <motion.button
        {...(dragEnabled ? attributes : {})}
        {...(dragEnabled ? listeners : {})}
        onClick={onToggle}
        onContextMenu={handleContextMenu}
        onDoubleClick={() => { setRenaming(true); setRenameValue(folder.name); }}
        className={cn(
          "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative z-10 select-none",
          "text-muted-foreground hover:text-foreground hover:bg-accent/50 group/folder",
          isDragging && "scale-105 shadow-xl ring-2 ring-primary/20"
        )}
        style={{ touchAction: dragEnabled ? 'none' : 'pan-y' }}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${folder.color}20` }}
        >
          <FolderOpen className="w-3 h-3" style={{ color: folder.color }} />
        </div>

        {renaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setRenaming(false);
            }}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-transparent text-foreground text-[13px] outline-none border-b border-primary/40"
          />
        ) : (
          <span className="flex-1 truncate text-left">{folder.name}</span>
        )}

        {hasAnyNotification && (
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
        )}

        <Badge
          variant="secondary"
          className="h-4 min-w-4 flex items-center justify-center text-[9px] px-1 rounded-full"
        >
          {items.length}
        </Badge>

        <motion.div
          animate={{ rotate: folder.expanded ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
        </motion.div>
      </motion.button>

      {/* "Drop to add" hint */}
      <AnimatePresence>
        {isDropTarget && (
          <motion.div
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap"
          >
            <span
              className="text-[9px] font-medium px-2 py-0.5 rounded-full border"
              style={{
                color: folder.color,
                backgroundColor: `${folder.color}10`,
                borderColor: `${folder.color}30`,
              }}
            >
              Drop to add to folder
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Items */}
      <AnimatePresence>
        {folder.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className="ml-[22px] mt-0.5 mb-1 space-y-px pl-3"
              style={{ borderLeft: `2px solid ${folder.color}30` }}
            >
              {items.length === 0 && (
                <p className="text-[11px] text-muted-foreground/40 py-2 px-3 italic">
                  Drop items here
                </p>
              )}
              {items.map((item, idx) => (
                <FolderChildButton
                  key={item.id}
                  item={item}
                  idx={idx}
                  active={isPathActive(item.path)}
                  hasNotif={hasNotification(item.path)}
                  onClick={() => handleItemClick(item)}
                  onLongPress={onItemLongPress ? () => onItemLongPress(item.id) : undefined}
                  dragEnabled={dragEnabled}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[100] min-w-[180px] rounded-lg border border-border bg-popover p-1 shadow-lg"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => { setRenaming(true); setRenameValue(folder.name); setContextMenu(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-md hover:bg-accent text-foreground"
            >
              <Pencil className="w-3.5 h-3.5" /> Rename Folder
            </button>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-md hover:bg-accent text-foreground"
            >
              <Palette className="w-3.5 h-3.5" /> Change Color
            </button>
            {showColorPicker && (
              <div className="px-3 py-2 grid grid-cols-4 gap-1.5">
                {FOLDER_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => { onChangeColor(c.value); setContextMenu(null); setShowColorPicker(false); }}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all hover:scale-110 ring-offset-2 ring-offset-popover",
                      folder.color === c.value ? "ring-2 ring-primary" : ""
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
            <div className="h-px bg-border my-1" />
            <button
              onClick={() => { onDelete(); setContextMenu(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-md hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Folder
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FolderChildButton({
  item, idx, active, hasNotif, onClick, onLongPress, dragEnabled = true,
}: {
  item: NavItem;
  idx: number;
  active: boolean;
  hasNotif: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  dragEnabled?: boolean;
}) {
  const Icon = item.icon;
  const lp = useLongPress(() => onLongPress?.(), 500);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !dragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <motion.button
      ref={setNodeRef}
      {...(dragEnabled ? attributes : {})}
      {...(dragEnabled ? listeners : {})}
      onClick={onClick}
      onClickCapture={lp.onClickCapture}
      onTouchStart={onLongPress ? lp.onTouchStart : undefined}
      onTouchMove={onLongPress ? lp.onTouchMove : undefined}
      onTouchEnd={onLongPress ? lp.onTouchEnd : undefined}
      onTouchCancel={onLongPress ? lp.onTouchCancel : undefined}
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: isDragging ? 0.3 : 1, x: 0 }}
      transition={{ delay: idx * 0.03, duration: 0.15 }}
      whileHover={{ x: 2 }}
      style={{ ...style, touchAction: dragEnabled ? 'none' : 'pan-y' }}
      className={cn(
        "flex items-center gap-2.5 w-full px-3 py-2 text-[13px] rounded-md transition-all duration-200 group/item select-none",
        active
          ? "bg-brand/10 text-primary font-medium border-l-2 border-brand shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        isDragging && "ring-2 ring-primary/30 shadow-lg"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate flex-1 text-left">{item.label}</span>
      {hasNotif && (
        <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
      )}
    </motion.button>
  );
}
