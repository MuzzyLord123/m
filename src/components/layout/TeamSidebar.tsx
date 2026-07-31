import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminControls } from '@/hooks/useAdminControls';
import { usePlatformOwner } from '@/hooks/usePlatformOwner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent } from
'@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable } from
'@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Mail, Users, Megaphone, Share2, FileText, Calendar, Globe,
  CreditCard, MessageSquare, Shield, ChevronLeft, ChevronRight, ChevronUp,
  AlertTriangle, Target, HardDrive, Settings, Workflow, BarChart3, Monitor,
  LogOut, FolderPlus, FolderOpen, Hammer, BookOpen, Zap, Paintbrush, PenTool, FileSpreadsheet, ClipboardList, Crown, Sparkles, MessageCircle, ShoppingBag, Server, GripVertical, X } from
'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AccountSwitcher } from '@/components/auth/AccountSwitcher';
import { SidebarFolderComponent } from '@/components/lounge/SidebarFolderComponent';
import { MoveToFolderSheet } from '@/components/lounge/MoveToFolderSheet';
import { useLongPress } from '@/hooks/useLongPress';
import { useTeamSidebarLayout } from '@/hooks/useTeamSidebarLayout';
import { useUIPreferences } from '@/hooks/useUIPreferences';
import quooroLogo from '@/assets/quooro-logo.png';

// --- Team Nav item registry ---
export interface TeamNavItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{className?: string;}>;
  tab: string;
  path: string; // needed by SidebarFolderComponent
}

export const ALL_TEAM_NAV_ITEMS: TeamNavItemDef[] = [
{ id: 'command-center', label: 'Command Center', icon: BarChart3, tab: 'command-center', path: '/dashboard?tab=command-center' },
{ id: 'executive', label: 'Executive Dashboard', icon: Crown, tab: 'executive', path: '/executive' },
{ id: 'enquiries', label: 'Enquiries', icon: Mail, tab: 'enquiries', path: '/dashboard?tab=enquiries' },
{ id: 'leads', label: 'Business Relationships', icon: Target, tab: 'leads', path: '/dashboard?tab=leads' },
{ id: 'clients', label: 'Clients', icon: Users, tab: 'clients', path: '/dashboard?tab=clients' },
{ id: 'client-accounts', label: 'Client Accounts', icon: Users, tab: 'client-accounts', path: '/dashboard?tab=client-accounts' },
{ id: 'account-creation', label: 'Account Creation', icon: Shield, tab: 'account-creation', path: '/dashboard?tab=account-creation' },
{ id: 'greeting-messages', label: 'Greeting Messages', icon: MessageCircle, tab: 'greeting-messages', path: '/dashboard?tab=greeting-messages' },
{ id: 'apps', label: 'App Projects', icon: Globe, tab: 'apps', path: '/dashboard?tab=apps' },
{ id: 'ads', label: 'Ad Campaigns', icon: Megaphone, tab: 'ads', path: '/dashboard?tab=ads' },
{ id: 'social', label: 'Social Media', icon: Share2, tab: 'social', path: '/dashboard?tab=social' },
{ id: 'content', label: 'Content', icon: FileText, tab: 'content', path: '/dashboard?tab=content' },
{ id: 'calendar', label: 'Calendar', icon: Calendar, tab: 'calendar', path: '/dashboard?tab=calendar' },
{ id: 'websites', label: 'Websites', icon: Globe, tab: 'websites', path: '/dashboard?tab=websites' },
{ id: 'marketing-site', label: 'Marketing Site', icon: Sparkles, tab: 'marketing-site', path: '/admin/marketing-site' },
{ id: 'website-designer', label: 'Website Designer', icon: Paintbrush, tab: 'website-designer', path: '/dashboard?tab=website-designer' },
{ id: 'cad-studio', label: 'CAD Studio', icon: PenTool, tab: 'cad-studio', path: '/dashboard?tab=cad-studio' },
{ id: 'office', label: 'Quooro Office', icon: FileSpreadsheet, tab: 'office', path: '/dashboard?tab=office' },
{ id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag, tab: 'ecommerce', path: '/dashboard?tab=ecommerce' },
{ id: 'client-websites', label: 'Client Websites', icon: Server, tab: 'client-websites', path: '/team/websites' },
{ id: 'splash', label: 'Website Splash', icon: Sparkles, tab: 'splash', path: '/team/splash' },
{ id: 'invoices', label: 'Invoices', icon: FileText, tab: 'invoices', path: '/dashboard?tab=invoices' },
{ id: 'billing', label: 'Billing', icon: CreditCard, tab: 'billing', path: '/dashboard?tab=billing' },
{ id: 'messages', label: 'Messages', icon: MessageSquare, tab: 'messages', path: '/dashboard?tab=messages' },
{ id: 'assets', label: 'Assets', icon: HardDrive, tab: 'assets', path: '/dashboard?tab=assets' },
{ id: 'tickets', label: 'Tickets', icon: MessageSquare, tab: 'tickets', path: '/dashboard?tab=tickets' },
{ id: 'security', label: 'Security', icon: Shield, tab: 'security', path: '/dashboard?tab=security' },
{ id: 'site-analytics', label: 'Site Analytics', icon: BarChart3, tab: 'site-analytics', path: '/dashboard?tab=site-analytics' },
{ id: 'announcements', label: 'Announcements', icon: Megaphone, tab: 'announcements', path: '/dashboard?tab=announcements' },
{ id: 'workflows', label: 'Workflows', icon: Workflow, tab: 'workflows', path: '/dashboard?tab=workflows' },

{ id: 'live-sessions', label: 'Live Sessions', icon: Monitor, tab: 'live-sessions', path: '/dashboard?tab=live-sessions' },
{ id: 'settings', label: 'Settings', icon: Settings, tab: 'settings', path: '/dashboard?tab=settings' },
{ id: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen, tab: 'knowledge-base', path: '/dashboard?tab=knowledge-base' },
{ id: 'automation-rules', label: 'Automation Rules', icon: Zap, tab: 'automation-rules', path: '/dashboard?tab=automation-rules' },
{ id: 'team-comms', label: 'Team Comms', icon: MessageSquare, tab: 'team-comms', path: '/dashboard?tab=team-comms' },
{ id: 'roles-permissions', label: 'Roles & Permissions', icon: Shield, tab: 'roles-permissions', path: '/dashboard?tab=roles-permissions' },
{ id: 'planner', label: 'Planner', icon: ClipboardList, tab: 'planner', path: '/dashboard/planner' }];


const PINNED_TOP = ['command-center'];
const DRAGGABLE_IDS = ALL_TEAM_NAV_ITEMS.filter((i) => !PINNED_TOP.includes(i.id)).map((i) => i.id);
const itemMap = new Map(ALL_TEAM_NAV_ITEMS.map((i) => [i.id, i]));

// --- Sortable Item ---
function SortableTeamNavItem({
  item, collapsed, isActive, show2FAWarning, onNavigate, isDragActive, overId, editMode, onEnterEditMode, onLongPress
}: {item: TeamNavItemDef;collapsed: boolean;isActive: boolean;show2FAWarning: boolean;onNavigate: (tab: string) => void;isDragActive: boolean;overId: string | null;editMode: boolean;onEnterEditMode: () => void;onLongPress?: (itemId: string) => void;}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !editMode });
  const Icon = item.icon;
  const isDropTarget = isDragActive && overId === item.id && !isDragging;
  const isSecurityTab = item.tab === 'security';
  const showWarning = isSecurityTab && show2FAWarning;
  const lp = useLongPress(() => onLongPress?.(item.id), 500);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1
  };

  const button =
  <div ref={setNodeRef} style={style} className="group/sortable relative">
      <AnimatePresence>
        {isDropTarget &&
      <motion.div
        initial={{ opacity: 0, scaleX: 0.8 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0, scaleX: 0.8 }}
        className="absolute inset-0 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 z-0 pointer-events-none" />

      }
      </AnimatePresence>
      <motion.button
      {...(editMode ? attributes : {})} {...(editMode ? listeners : {})}
      onClick={() => !isDragActive && onNavigate(item.tab)}
      onClickCapture={lp.onClickCapture}
      onTouchStart={onLongPress ? lp.onTouchStart : undefined}
      onTouchMove={onLongPress ? lp.onTouchMove : undefined}
      onTouchEnd={onLongPress ? lp.onTouchEnd : undefined}
      onTouchCancel={onLongPress ? lp.onTouchCancel : undefined}
      onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); onEnterEditMode(); }}
      className={cn(
        "flex h-[30px] items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 w-full text-left relative z-10 select-none",
        collapsed ? "px-3 justify-center" : "px-3",
        isActive ?
        "bg-foreground/[0.05] text-foreground border-l-2 border-primary" :
        "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
        editMode && "ring-1 ring-primary/20 cursor-grab",
        isDragging && "scale-105 shadow-xl shadow-brand/10 ring-2 ring-brand/20 rounded-lg"
      )}
      style={{ touchAction: editMode ? 'none' : 'auto' }}>

        <div className="relative flex-shrink-0">
          {editMode && !collapsed && <GripVertical className="w-3 h-3 mr-0.5 opacity-60" />}
          <Icon className="w-[18px] h-[18px]" />
          {showWarning && collapsed &&
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-attend ring-2 ring-sidebar" />
        }
        </div>
        {!collapsed &&
      <>
            <span className="flex-1 tracking-wide truncate">{item.label}</span>
            {showWarning && <AlertTriangle className="w-3.5 h-3.5 ml-auto text-attend" />}
          </>
      }
      </motion.button>
      <AnimatePresence>
        {isDropTarget && !collapsed &&
      <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }}
      className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
            <span className="text-[9px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Drop to create folder
            </span>
          </motion.div>
      }
      </AnimatePresence>
    </div>;


  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10} className="font-medium">{item.label}</TooltipContent>
      </Tooltip>);

  }
  return button;
}

function DragGhostItem({ item }: {item: TeamNavItemDef;}) {
  const Icon = item.icon;
  return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1.05, opacity: 0.9 }}
    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card border border-primary/30 shadow-2xl shadow-primary/20 text-[13px] font-medium text-foreground w-56 cursor-grabbing">
      <Icon className="w-[18px] h-[18px] text-primary" />
      <span>{item.label}</span>
    </motion.div>);

}

// --- Main Component ---
interface TeamSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  profile: {full_name: string | null;company: string | null;avatar_url: string | null;} | null;
  user: {email?: string;id?: string;} | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  show2FAWarning: boolean;
  onSignOut: () => void;
  mobile?: boolean;
}

export default function TeamSidebar({
  collapsed, onCollapsedChange, profile, user, activeTab, onTabChange, show2FAWarning, onSignOut, mobile = false
}: TeamSidebarProps) {
  if (mobile) collapsed = false;
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { preferences: uiPrefs } = useUIPreferences();
  const expandAllGroups = uiPrefs.sidebarExpandAll;

  const {
    layout, loaded, createFolder, renameFolder, deleteFolder, changeFolderColor,
    toggleFolder, moveToFolder, moveOutOfFolder, mergeIntoFolder, reorderRoot, resetToPresets, update
  } = useTeamSidebarLayout();

  // Sync folder expanded state with preference
  useEffect(() => {
    if (!loaded || layout.folders.length === 0) return;
    const allMatch = layout.folders.every((f) => f.expanded === expandAllGroups);
    if (!allMatch) {
      update((prev) => ({ ...prev, folders: prev.folders.map((f) => ({ ...f, expanded: expandAllGroups })) }));
    }
  }, [expandAllGroups, loaded]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [moveItemId, setMoveItemId] = useState<string | null>(null);
  const openMoveSheet = (itemId: string) => setMoveItemId(itemId);

  // Exit edit mode on Escape or when clicking outside the sidebar
  useEffect(() => {
    if (!editMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditMode(false); };
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('aside[data-team-sidebar="true"]')) setEditMode(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick); };
  }, [editMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 300, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } })
  );

  const orderedRootEntries = useMemo(() => {
    if (!loaded || layout.itemOrder.length === 0) return DRAGGABLE_IDS;
    const inLayout = new Set<string>();
    layout.itemOrder.forEach((id) => {
      inLayout.add(id);
      const folder = layout.folders.find((f) => f.id === id);
      if (folder) folder.itemIds.forEach((i) => inLayout.add(i));
    });
    const missing = DRAGGABLE_IDS.filter((id) => !inLayout.has(id));
    return [...layout.itemOrder, ...missing];
  }, [layout, loaded]);

  const handleDragStart = (e: DragStartEvent) => {setActiveId(e.active.id as string);if (navigator.vibrate) navigator.vibrate(50);};
  const handleDragOver = (e: DragOverEvent) => {setOverId(e.over?.id as string | null);};
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);setOverId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeStr = active.id as string;
    const overStr = over.id as string;
    const isActiveItem = itemMap.has(activeStr);
    const isOverFolder = layout.folders.some((f) => f.id === overStr);
    const isActiveInFolder = layout.folders.some((f) => f.itemIds.includes(activeStr));
    const isOverItem = itemMap.has(overStr);
    const isOverInRoot = orderedRootEntries.includes(overStr);

    if (isActiveItem && isOverFolder) {
      if (isActiveInFolder) {
        const src = layout.folders.find((f) => f.itemIds.includes(activeStr));
        if (src) moveOutOfFolder(activeStr, src.id);
      }
      moveToFolder(activeStr, overStr);
      return;
    }
    if (isActiveItem && isOverItem && isOverInRoot && !isActiveInFolder) {
      mergeIntoFolder(activeStr, overStr);
      return;
    }
    const fromIdx = orderedRootEntries.indexOf(activeStr);
    const toIdx = orderedRootEntries.indexOf(overStr);
    if (fromIdx >= 0 && toIdx >= 0) reorderRoot(fromIdx, toIdx);
  };
  const handleDragCancel = () => {setActiveId(null);setOverId(null);};

  useEffect(() => {
    if (!activeId) return;
    const handler = (e: KeyboardEvent) => {if (e.key === 'Escape') handleDragCancel();};
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeId]);

  // isTabActive is defined below handleNavClick
  const navigate = useNavigate();
  const location = useLocation();
  // For SidebarFolderComponent compatibility
  const isPathActive = useCallback((path: string) => {
    if (!path.includes('?tab=')) {
      return location.pathname === path;
    }
    const tabParam = new URL(path, 'http://x').searchParams.get('tab');
    return tabParam ? activeTab === tabParam : false;
  }, [activeTab, location.pathname]);
  const hasNotification = useCallback((path: string) => {
    const tabParam = new URL(path, 'http://x').searchParams.get('tab');
    return tabParam === 'security' && show2FAWarning;
  }, [show2FAWarning]);

  const handleNavClick = (tab: string) => {
    const navItem = ALL_TEAM_NAV_ITEMS.find(i => i.tab === tab);
    if (navItem && navItem.path && !navItem.path.includes('?tab=')) {
      navigate(navItem.path);
      return;
    }
    onTabChange(tab);
  };
  const isTabActive = useCallback((tab: string) => {
    const navItem = ALL_TEAM_NAV_ITEMS.find(i => i.tab === tab);
    if (navItem && navItem.path && !navItem.path.includes('?tab=')) {
      return location.pathname === navItem.path;
    }
    return activeTab === tab;
  }, [activeTab, location.pathname]);

  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.trim().split(' ');
      return names.length >= 2 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : 'A';
  };

  // Owner-set controls: tabs hidden for this admin never render here.
  const { hiddenTabs } = useAdminControls();
  const { isOwner } = usePlatformOwner();
  // The splash is the front door of the business, so only owners see it.
  const OWNER_ONLY = new Set(['splash']);
  const visibleItem = (id: string) => {
    const it = itemMap.get(id);
    if (!it || hiddenTabs.has(it.id)) return undefined;
    if (OWNER_ONLY.has(it.id) && !isOwner) return undefined;
    return it;
  };

  const activeItem = activeId ? itemMap.get(activeId) : null;
  const pinnedItems = PINNED_TOP.map((id) => visibleItem(id)!).filter(Boolean);

  return (
    <>
    <aside data-team-sidebar="true" className={cn(
      "flex flex-col border-border/60 bg-sidebar transition-all duration-300",
      mobile
        ? "w-full h-dvh max-h-dvh overflow-hidden"
        : cn(
            "hidden lg:flex fixed top-0 h-screen z-40 left-0 border-r",
            collapsed ? "w-[72px]" : "w-[272px]"
          ),
      editMode && "ring-2 ring-primary/40"
    )}>
      {/* Title */}
      <div className={cn("flex items-center justify-center transition-all duration-300 shrink-0", collapsed ? "px-3 py-3" : "px-4 py-4")}>
        {collapsed ?
        <span className="text-xs font-bold text-foreground">Q</span> :
        <h1 className="text-foreground tracking-tight font-semibold text-[15px]">Quooro Office</h1>
        }
      </div>

      {editMode && !collapsed && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-primary">Edit mode · drag pages into folders</span>
          <button onClick={() => setEditMode(false)} className="text-primary/70 hover:text-primary">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="mx-4 h-px bg-border/60" />


      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto min-h-0 transition-all duration-300 sidebar-thin-scroll overscroll-contain",
          mobile && "mobile-menu-scroll",
          collapsed ? "px-2 py-2" : "px-3 py-2"
        )}
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter}
        onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <div className="space-y-0.5">
            {/* Pinned items */}
            {pinnedItems.map((item) => {
              const Icon = item.icon;
              const active = isTabActive(item.tab);
              const btn =
              <motion.button key={item.id} onClick={() => handleNavClick(item.tab)}
              whileHover={{ x: collapsed ? 0 : 2 }} whileTap={{ scale: 0.98 }}
              className={cn(
                "flex h-[30px] items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 w-full text-left",
                collapsed ? "px-3 justify-center" : "px-3",
                active ? "bg-foreground/[0.05] text-foreground border-l-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
              )}>
                  <Icon className="w-[18px] h-[18px]" />
                  {!collapsed && <span className="flex-1 tracking-wide truncate">{item.label}</span>}
                </motion.button>;

              if (collapsed) {
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10} className="font-medium">{item.label}</TooltipContent>
                  </Tooltip>);

              }
              return <div key={item.id}>{btn}</div>;
            })}

            {!collapsed && <div className="relative mx-2 my-2"><div className="h-px bg-border/60" /></div>}

            {/* Draggable zone */}
            <SortableContext items={orderedRootEntries} strategy={verticalListSortingStrategy}>
              {orderedRootEntries.map((entryId) => {
                const folder = layout.folders.find((f) => f.id === entryId);
                if (folder) {
                  const folderItems = folder.itemIds.map((id) => visibleItem(id)).filter(Boolean) as TeamNavItemDef[];
                  return (
                    <SidebarFolderComponent
                      key={folder.id}
                      folder={folder}
                      items={folderItems}
                      collapsed={collapsed}
                      isPathActive={isPathActive}
                      hasNotification={hasNotification}
                      unreadCount={0}
                      onToggle={() => toggleFolder(folder.id)}
                      onRename={(name) => renameFolder(folder.id, name)}
                      onDelete={() => deleteFolder(folder.id)}
                      onChangeColor={(color) => changeFolderColor(folder.id, color)}
                      onRemoveItem={(itemId) => moveOutOfFolder(itemId, folder.id)}
                      onItemLongPress={mobile ? openMoveSheet : undefined}
                      isDragActive={!!activeId}
                      overId={overId}
                      onNavigate={(item) => handleNavClick(item.id)}
                      dragEnabled={!mobile} />);


                }
                const item = visibleItem(entryId);
                if (!item) return null;
                return (
                  <SortableTeamNavItem key={item.id} item={item} collapsed={collapsed}
                  isActive={isTabActive(item.tab)} show2FAWarning={show2FAWarning}
                  onNavigate={handleNavClick} isDragActive={!!activeId} overId={overId}
                  onLongPress={mobile ? openMoveSheet : undefined}
                  editMode={editMode} onEnterEditMode={() => setEditMode(true)} />);

              })}
            </SortableContext>

            {/* Folder actions */}
            {!collapsed &&
            <div className="space-y-0.5 mt-1">
                <button onClick={() => createFolder('New Folder', '#6b7280')}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[11px] text-muted-foreground/50 hover:text-muted-foreground rounded-lg hover:bg-foreground/[0.03] transition-all">
                  <FolderPlus className="w-3.5 h-3.5" />Create folder
                </button>
                <button onClick={() => resetToPresets()}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[11px] text-muted-foreground/50 hover:text-muted-foreground rounded-lg hover:bg-foreground/[0.03] transition-all">
                  <Hammer className="w-3.5 h-3.5" />Preset folders
                </button>
              </div>
            }
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeItem ? <DragGhostItem item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      </nav>

      {/* Footer Controls */}
      <div className="mt-auto">
        {!mobile && <div className="mx-4 h-px bg-border/60" />}
        {!mobile && (
          <div className={cn("transition-all duration-300", collapsed ? "p-2 space-y-0.5" : "px-3 py-1.5 space-y-0.5")}>
            <Button variant="ghost" size="sm" onClick={() => onCollapsedChange(!collapsed)}
            className={cn("w-full gap-2.5 text-muted-foreground hover:text-foreground h-8 rounded-lg text-[13px]", collapsed ? "justify-center px-2" : "justify-start")}>
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
            </Button>
          </div>
        )}

        {/* Account Section */}
        <div className="mx-4 h-px bg-border/60" />
        <div className={cn("transition-all duration-300", collapsed ? "p-2" : "p-2")}>
          <Popover open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
            <PopoverTrigger asChild>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className={cn("flex items-center w-full rounded-lg hover:bg-foreground/[0.04] transition-all duration-200", collapsed ? "justify-center p-2" : "gap-3 p-2.5")}>
                <Avatar className={cn("border border-border/60 transition-all duration-300", collapsed ? "h-8 w-8" : "h-9 w-9")}>
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'Admin'} />
                  <AvatarFallback className="bg-primary/12 text-primary font-semibold text-sm">{getInitials()}</AvatarFallback>
                </Avatar>
                {!collapsed &&
                <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">{profile?.full_name || 'Admin'}</p>
                      <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{user?.email}</p>
                    </div>
                    <motion.div animate={{ rotate: accountMenuOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                      <ChevronUp className="w-4 h-4 text-muted-foreground/60" />
                    </motion.div>
                  </>
                }
              </motion.button>
            </PopoverTrigger>
            <PopoverContent side="top" align={collapsed ? "center" : "start"} className={cn("p-1.5 rounded-lg", collapsed ? "w-64" : "w-[calc(272px-1.5rem)]")} sideOffset={8}>
              <div className="space-y-0.5">
                <div className="px-3 py-2.5 border-b border-border/60 mb-1.5">
                  <p className="text-sm font-semibold truncate">{profile?.full_name || 'Admin'}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {setAccountMenuOpen(false);onTabChange('settings');}}
                className="w-full justify-start text-muted-foreground hover:text-foreground text-[13px] h-9 rounded-md">
                  <Settings className="w-4 h-4 mr-2.5" />Settings
                </Button>
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-[13px] text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <div className="h-px bg-border/60 my-1" />
                <AccountSwitcher portal="team" onSwitch={() => setAccountMenuOpen(false)} />
                <div className="h-px bg-border/60 my-1" />
                <Button variant="ghost" size="sm" onClick={() => {setAccountMenuOpen(false);onSignOut();}}
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[13px] h-9 rounded-md">
                  <LogOut className="w-4 h-4 mr-2.5" />Sign out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </aside>
    {mobile && (
      <MoveToFolderSheet
        open={!!moveItemId}
        onOpenChange={(o) => { if (!o) setMoveItemId(null); }}
        itemLabel={moveItemId ? (itemMap.get(moveItemId)?.label ?? '') : ''}
        folders={layout.folders}
        currentFolderId={moveItemId ? (layout.folders.find(f => f.itemIds.includes(moveItemId))?.id ?? null) : null}
        onMoveToFolder={(folderId) => {
          if (!moveItemId) return;
          const src = layout.folders.find(f => f.itemIds.includes(moveItemId));
          if (src && src.id !== folderId) moveOutOfFolder(moveItemId, src.id);
          moveToFolder(moveItemId, folderId);
          setMoveItemId(null);
        }}
        onRemoveFromFolder={() => {
          if (!moveItemId) return;
          const src = layout.folders.find(f => f.itemIds.includes(moveItemId));
          if (src) moveOutOfFolder(moveItemId, src.id);
          setMoveItemId(null);
        }}
        onCreateFolder={(name, color) => {
          const id = createFolder(name, color);
          return id as unknown as string;
        }}
      />
    )}
    </>);

}