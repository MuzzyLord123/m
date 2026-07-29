import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUIPreferences } from '@/hooks/useUIPreferences';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Home,
  FolderKanban,
  TrendingUp,
  FolderOpen,
  Settings2,
  Globe,
  Layout,
  FileText,
  Search,
  Megaphone,
  Share2,
  Calendar,
  HardDrive,
  Upload,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  LogOut,
  AlertTriangle,
  Sparkles,
  Ticket,
  Paintbrush,
  Hammer,
  Package,
  Target,
  Wand2,
  Workflow,
  FolderPlus,
  GripVertical,
  BarChart3,
  Bell,
  Radio,
  Boxes,
  FileSpreadsheet,
  ClipboardList,
  Palette,
  Crown,
  ShieldCheck,
  Mail } from
'lucide-react';
import { cn } from '@/lib/utils';
import { preloadRoute } from '@/lib/routePreloader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
'@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger } from
'@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AccountSwitcher } from '@/components/auth/AccountSwitcher';
import { NotificationBell } from '@/components/NotificationBell';
import { SidebarFolderComponent } from './SidebarFolderComponent';
import { useSidebarLayout } from '@/hooks/useSidebarLayout';
import { useAccountType } from '@/hooks/useAccountType';
import quooroLogo from '@/assets/quooro-logo.png';
import { useBranding } from '@/contexts/BrandingContext';
import { useLongPress } from '@/hooks/useLongPress';
import { MoveToFolderSheet } from './MoveToFolderSheet';

function SidebarBrandedTitle() {
  const branding = useBranding();
  if (branding.isCustomLogo) {
    return <img src={branding.logoUrl} alt="Logo" className="h-8 max-w-[160px] object-contain" />;
  }
  return <h1 className="text-foreground tracking-tight font-semibold text-lg">Quooro Lounge</h1>;
}

function SidebarBrandedCollapsed() {
  const branding = useBranding();
  if (branding.isCustomLogo) {
    return <img src={branding.logoUrl} alt="Logo" className="h-7 w-7 object-contain rounded" />;
  }
  return <span className="text-xs font-bold text-foreground">QL</span>;
}

// --- Nav item registry ---
export interface NavItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{className?: string;}>;
  path: string;
}

export const ALL_NAV_ITEMS: NavItemDef[] = [
{ id: 'dashboard', label: 'Dashboard', icon: Home, path: '/lounge' },
{ id: 'ai-assistant', label: 'Quooro AI', icon: Sparkles, path: '/lounge/ai' },
{ id: 'website', label: 'Website', icon: Globe, path: '/lounge/website' },
{ id: 'website-designer', label: 'Workshop', icon: Paintbrush, path: '/lounge/website-designer' },

{ id: 'products', label: 'Products & CMS', icon: Package, path: '/lounge/products' },
{ id: 'apps', label: 'App Projects', icon: Layout, path: '/lounge/apps' },
{ id: 'crm', label: 'CRM', icon: Target, path: '/lounge/crm' },
{ id: 'workflows', label: 'Workflows', icon: Workflow, path: '/lounge/workflows' },

{ id: 'content', label: 'Content Requests', icon: FileText, path: '/lounge/content' },
{ id: 'seo', label: 'SEO Checker', icon: Search, path: '/lounge/seo-checker' },
{ id: 'ads', label: 'Ad Campaigns', icon: Megaphone, path: '/lounge/ads' },
{ id: 'social', label: 'Social Media', icon: Share2, path: '/lounge/social' },
{ id: 'calendar', label: 'Calendar', icon: Calendar, path: '/lounge/calendar' },
{ id: 'bookings', label: 'Bookings', icon: Calendar, path: '/lounge/bookings' },
{ id: 'assets', label: 'Asset Storage', icon: HardDrive, path: '/lounge/assets' },
{ id: 'uploads', label: 'Uploads', icon: Upload, path: '/lounge/uploads' },
{ id: 'team', label: 'Team', icon: Users, path: '/lounge/team' },
{ id: 'billing', label: 'Plan & Billing', icon: CreditCard, path: '/lounge/billing' },
{ id: 'mail', label: 'Quooro Mail', icon: Mail, path: '/lounge/mail' },
{ id: 'messages', label: 'Messages', icon: MessageSquare, path: '/lounge/messages' },
{ id: 'team-comms', label: 'Team Comms', icon: Radio, path: '/lounge/team-comms' },
{ id: 'tickets', label: 'Support Tickets', icon: Ticket, path: '/lounge/tickets' },
{ id: 'notifications', label: 'Notifications', icon: Bell, path: '/lounge/notifications' },
{ id: 'inventory', label: 'Inventory', icon: Boxes, path: '/lounge/inventory' },
{ id: 'office', label: 'Quooro Office', icon: FileSpreadsheet, path: '/lounge/office' },

{ id: 'white-label', label: 'White-Label', icon: Palette, path: '/lounge/white-label' },
{ id: 'automations-pro', label: 'Automations Pro', icon: Workflow, path: '/lounge/automations-pro' },
{ id: 'planner', label: 'Planner', icon: ClipboardList, path: '/lounge/planner' },

{ id: 'settings', label: 'Settings', icon: Settings, path: '/lounge/settings' }];


const PINNED_TOP = ['dashboard', 'ai-assistant'];
const DRAGGABLE_IDS = ALL_NAV_ITEMS.filter((i) => !PINNED_TOP.includes(i.id)).map((i) => i.id);

const itemMap = new Map(ALL_NAV_ITEMS.map((i) => [i.id, i]));

// Legacy grouped nav for the classic grouped view mode
interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{className?: string;}>;
  path?: string;
  items?: {label: string;icon: React.ComponentType<{className?: string;}>;path: string;}[];
}

const navGroups: NavGroup[] = [
{ id: 'dashboard', label: 'Dashboard', icon: Home, path: '/lounge' },
{ id: 'ai-assistant', label: 'Quooro AI', icon: Sparkles, path: '/lounge/ai' },
{
  id: 'projects', label: 'Projects', icon: FolderKanban,
  items: [
  { label: 'Website', icon: Globe, path: '/lounge/website' },
  { label: 'Website Dashboard', icon: Paintbrush, path: '/lounge/website-designer' },

  { label: 'AI Builder', icon: Wand2, path: '/lounge/ai-builder' },
  { label: 'Products & CMS', icon: Package, path: '/lounge/products' },
  { label: 'App Projects', icon: Layout, path: '/lounge/apps' },
  { label: 'CRM', icon: Target, path: '/lounge/crm' },
  { label: 'Workflows', icon: Workflow, path: '/lounge/workflows' },
  
  { label: 'Content Requests', icon: FileText, path: '/lounge/content' },
  { label: 'Inventory', icon: Boxes, path: '/lounge/inventory' },
  { label: 'Quooro Office', icon: FileSpreadsheet, path: '/lounge/office' },
  { label: 'Planner', icon: ClipboardList, path: '/lounge/planner' },
  { label: 'Bookings', icon: Calendar, path: '/lounge/bookings' }]

},
{
  id: 'subscriptions', label: 'Subscriptions', icon: Crown,
  items: [
  { label: 'Workshop', icon: Paintbrush, path: '/lounge/website-designer' },
  { label: 'Inventory', icon: Boxes, path: '/lounge/inventory' },
  { label: 'Quooro Office', icon: FileSpreadsheet, path: '/lounge/office' },
  
  { label: 'White-Label', icon: Palette, path: '/lounge/white-label' },
  { label: 'Automations Pro', icon: Workflow, path: '/lounge/automations-pro' }]

},
{
  id: 'marketing', label: 'Marketing', icon: TrendingUp,
  items: [
  { label: 'SEO Checker', icon: Search, path: '/lounge/seo-checker' },
  { label: 'Ad Campaigns', icon: Megaphone, path: '/lounge/ads' },
  { label: 'Social Media', icon: Share2, path: '/lounge/social' },
  { label: 'Calendar', icon: Calendar, path: '/lounge/calendar' },
  { label: 'Bookings', icon: Calendar, path: '/lounge/bookings' }]

},
{
  id: 'files', label: 'Files', icon: FolderOpen,
  items: [
  { label: 'Asset Storage', icon: HardDrive, path: '/lounge/assets' },
  { label: 'Uploads', icon: Upload, path: '/lounge/uploads' }]

},
{
  id: 'manage', label: 'Manage', icon: Settings2,
  items: [
  { label: 'Team', icon: Users, path: '/lounge/team' },
  { label: 'Plan & Billing', icon: CreditCard, path: '/lounge/billing' },
  { label: 'Quooro Mail', icon: Mail, path: '/lounge/mail' },
  { label: 'Messages', icon: MessageSquare, path: '/lounge/messages' },
  { label: 'Team Comms', icon: Radio, path: '/lounge/team-comms' },
  { label: 'Support Tickets', icon: Ticket, path: '/lounge/tickets' },
  { label: 'Notifications', icon: Bell, path: '/lounge/notifications' },
  { label: 'Settings', icon: Settings, path: '/lounge/settings' }]

}];


const flatNavItems = navGroups.flatMap((group) => {
  if (group.path) return [{ label: group.label, icon: group.icon, path: group.path }];
  return group.items || [];
});

type ViewMode = 'grouped' | 'flat';

interface PortalSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  profile: {full_name: string | null;company: string | null;avatar_url: string | null;} | null;
  user: {email?: string;id?: string;} | null;
  unreadCount: number;
  show2FAWarning: boolean;
  onSignOut: () => void;
  position?: 'left' | 'right' | 'top' | 'bottom';
  mobile?: boolean;
}

// --- Hold-to-Drag Sortable Item ---
function SortableNavItem({
  item,
  collapsed,
  isActive,
  hasNotif,
  unreadCount,
  show2FAWarning,
  onNavigate,
  isDragActive,
  overId,
  onLongPress,
  dragEnabled = true
}: {item: NavItemDef;collapsed: boolean;isActive: boolean;hasNotif: boolean;unreadCount: number;show2FAWarning: boolean;onNavigate: (path: string) => void;isDragActive: boolean;overId: string | null;onLongPress?: (itemId: string) => void;dragEnabled?: boolean;}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !dragEnabled });
  const Icon = item.icon;
  const isDropTarget = isDragActive && overId === item.id && !isDragging;
  const lp = useLongPress(() => onLongPress?.(item.id), 500);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1
  };

  const button =
  <div ref={setNodeRef} style={style} className="group/sortable relative">
      {/* Drop indicator */}
      <AnimatePresence>
        {isDropTarget &&
      <motion.div
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        exit={{ opacity: 0, scaleX: 0.8 }}
        className="absolute inset-0 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 z-0 pointer-events-none" />

      }
      </AnimatePresence>

      <motion.button
      {...(dragEnabled ? attributes : {})}
      {...(dragEnabled ? listeners : {})}
      onClick={() => !isDragActive && onNavigate(item.path)}
      onClickCapture={lp.onClickCapture}
      onTouchStart={onLongPress ? lp.onTouchStart : undefined}
      onTouchMove={onLongPress ? lp.onTouchMove : undefined}
      onTouchEnd={onLongPress ? lp.onTouchEnd : undefined}
      onTouchCancel={onLongPress ? lp.onTouchCancel : undefined}
      onMouseEnter={() => preloadRoute(item.path)}
      onFocus={() => preloadRoute(item.path)}
      className={cn(
        "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 w-full text-left relative z-10 select-none",
        collapsed ? "px-3 py-2 justify-center" : "px-3 py-2",
        isActive ?
        "bg-foreground/[0.05] text-foreground border-l-2 border-primary" :
        "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
        isDragging && "scale-105 shadow-xl shadow-brand/10 ring-2 ring-brand/20 rounded-lg"
      )}
      style={{ touchAction: dragEnabled ? 'none' : 'pan-y' }}>

        <div className="relative flex-shrink-0">
          <Icon className="w-[18px] h-[18px]" />
          {hasNotif && collapsed &&
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
        }
        </div>
        {!collapsed &&
      <>
            <span className="flex-1 tracking-wide truncate">{item.label}</span>
            {item.path === '/lounge/messages' && unreadCount > 0 &&
        <Badge
          className={cn(
            "ml-auto h-5 min-w-5 flex items-center justify-center text-[10px] font-semibold px-1.5 rounded-full",
            isActive ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
          )}>

                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
        }
            {item.path === '/lounge/settings' && show2FAWarning &&
        <AlertTriangle className="w-3.5 h-3.5 ml-auto text-destructive" />
        }
          </>
      }
      </motion.button>

      {/* "Drop to create folder" hint */}
      <AnimatePresence>
        {isDropTarget && !collapsed &&
      <motion.div
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -2 }}
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

// --- Drag Overlay Ghost ---
function DragGhostItem({ item }: {item: NavItemDef;}) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1.05, opacity: 0.9 }}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card border border-primary/30 shadow-2xl shadow-primary/20 text-[13px] font-medium text-foreground w-56 cursor-grabbing">

      <Icon className="w-[18px] h-[18px] text-primary" />
      <span>{item.label}</span>
    </motion.div>);

}

export function PortalSidebar({
  collapsed,
  onCollapsedChange,
  profile,
  user,
  unreadCount,
  show2FAWarning,
  onSignOut,
  position = 'left',
  mobile = false
}: PortalSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  if (mobile) collapsed = false;
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const { preferences: uiPrefs } = useUIPreferences();
  const expandAllGroups = uiPrefs.sidebarExpandAll;

  const {
    layout,
    loaded,
    createFolder,
    renameFolder,
    deleteFolder,
    changeFolderColor,
    toggleFolder,
    moveToFolder,
    moveOutOfFolder,
    mergeIntoFolder,
    reorderRoot,
    reorderInFolder,
    resetToPresets,
    update
  } = useSidebarLayout(user?.id);

  const { canSee } = useAccountType();
  const filteredItemMap = useMemo(() => {
    const m = new Map<string, NavItemDef>();
    ALL_NAV_ITEMS.forEach((it) => { if (canSee(it.id)) m.set(it.id, it); });
    return m;
  }, [canSee]);

  // Sync custom folder expanded state with the "Expand all folders" preference
  useEffect(() => {
    if (!loaded || layout.folders.length === 0) return;
    const allMatch = layout.folders.every((f) => f.expanded === expandAllGroups);
    if (!allMatch) {
      update((prev) => ({
        ...prev,
        folders: prev.folders.map((f) => ({ ...f, expanded: expandAllGroups }))
      }));
    }
  }, [expandAllGroups, loaded]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [moveItemId, setMoveItemId] = useState<string | null>(null);

  const openMoveSheet = (itemId: string) => setMoveItemId(itemId);

  // 300ms hold-to-drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 300, tolerance: 5 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 }
    })
  );

  // Build the ordered list of root-level entries for DnD view
  const orderedRootEntries = useMemo(() => {
    if (!loaded || layout.itemOrder.length === 0) {
      return DRAGGABLE_IDS;
    }
    const inLayout = new Set<string>();
    layout.itemOrder.forEach((id) => {
      inLayout.add(id);
      const folder = layout.folders.find((f) => f.id === id);
      if (folder) folder.itemIds.forEach((i) => inLayout.add(i));
    });
    const missing = DRAGGABLE_IDS.filter((id) => !inLayout.has(id));
    return [...layout.itemOrder, ...missing];
  }, [layout, loaded]);

  // DnD handlers
  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleDragOver = (e: DragOverEvent) => {
    setOverId(e.over?.id as string | null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeStr = active.id as string;
    const overStr = over.id as string;

    const isActiveItem = itemMap.has(activeStr);
    const isOverItem = itemMap.has(overStr);
    const isOverFolder = layout.folders.some((f) => f.id === overStr);
    const srcFolder = layout.folders.find((f) => f.itemIds.includes(activeStr));
    const isActiveInFolder = !!srcFolder;
    const isOverInRoot = orderedRootEntries.includes(overStr);

    // ─── Dragging an item that is currently inside a folder ───
    if (isActiveItem && isActiveInFolder && srcFolder) {
      const destFolder = isOverItem ? layout.folders.find((f) => f.itemIds.includes(overStr)) : null;

      // Reorder within same folder
      if (destFolder && destFolder.id === srcFolder.id) {
        const from = srcFolder.itemIds.indexOf(activeStr);
        const to = srcFolder.itemIds.indexOf(overStr);
        if (from !== to && from >= 0 && to >= 0) reorderInFolder(srcFolder.id, from, to);
        return;
      }
      // Drop onto a different folder header
      if (isOverFolder) {
        moveToFolder(activeStr, overStr);
        return;
      }
      // Drop onto an item that lives in another folder
      if (destFolder) {
        moveToFolder(activeStr, destFolder.id);
        return;
      }
      // Drop onto a root-level item → pull out to root at that position
      if (isOverItem && isOverInRoot) {
        update((prev) => {
          const folders = prev.folders
            .map((f) => f.id === srcFolder.id ? { ...f, itemIds: f.itemIds.filter((i) => i !== activeStr) } : f)
            .filter((f) => f.itemIds.length > 0);
          let newOrder = prev.itemOrder.filter((i) => i !== activeStr);
          if (!folders.find((f) => f.id === srcFolder.id)) {
            newOrder = newOrder.filter((i) => i !== srcFolder.id);
          }
          const targetIdx = newOrder.indexOf(overStr);
          newOrder.splice(targetIdx >= 0 ? targetIdx : newOrder.length, 0, activeStr);
          return { folders, itemOrder: newOrder };
        });
        return;
      }
      return;
    }

    if (isActiveItem && isOverFolder) {
      moveToFolder(activeStr, overStr);
      return;
    }

    if (isActiveItem && isOverItem && isOverInRoot && !isActiveInFolder) {
      // If drop target is inside a folder, move active into that folder
      const destFolder = layout.folders.find((f) => f.itemIds.includes(overStr));
      if (destFolder) {
        moveToFolder(activeStr, destFolder.id);
        return;
      }
      mergeIntoFolder(activeStr, overStr);
      return;
    }

    const fromIdx = orderedRootEntries.indexOf(activeStr);
    const toIdx = orderedRootEntries.indexOf(overStr);
    if (fromIdx >= 0 && toIdx >= 0) {
      reorderRoot(fromIdx, toIdx);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // --- Existing helpers (unchanged) ---
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lounge-sidebar-view-mode' && e.newValue) setViewMode(e.newValue as ViewMode);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);


  useEffect(() => {
    if (expandAllGroups || viewMode === 'flat') return;
    const currentGroup = navGroups.find((g) =>
    g.items?.some((item) => location.pathname === item.path || item.path !== '/lounge' && location.pathname.startsWith(item.path))
    );
    if (currentGroup && !collapsed) setExpandedGroup(currentGroup.id);
  }, [location.pathname, collapsed, expandAllGroups, viewMode]);

  // Escape key cancels drag
  useEffect(() => {
    if (!activeId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDragCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeId]);

  const isGroupExpanded = (groupId: string) => expandAllGroups && !collapsed ? true : expandedGroup === groupId;

  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.trim().split(' ');
      return names.length >= 2 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  };

  const isPathActive = (path: string) => path === '/lounge' ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path + '/');
  const isGroupActive = (group: NavGroup) => group.path ? isPathActive(group.path) : group.items?.some((item) => isPathActive(item.path));
  const hasNotification = (path: string) => {
    if (path === '/lounge/messages') return unreadCount > 0;
    if (path === '/lounge/settings') return show2FAWarning;
    return false;
  };

  // --- Renderers ---

  const FlatNavItem = ({ item }: {item: {label: string;icon: React.ComponentType<{className?: string;}>;path: string;};}) => {
    const active = isPathActive(item.path);
    const Icon = item.icon;
    const button =
    <motion.button
      onClick={() => navigate(item.path)}
      onMouseEnter={() => preloadRoute(item.path)}
      onFocus={() => preloadRoute(item.path)}
      whileHover={{ x: collapsed ? 0 : 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 w-full text-left",
        collapsed ? "px-3 py-2 justify-center" : "px-3 py-2",
        active ? "bg-foreground/[0.05] text-foreground border-l-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
      )}>

        <div className="relative flex-shrink-0">
          <Icon className="w-[18px] h-[18px]" />
          {hasNotification(item.path) && collapsed &&
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
        }
        </div>
        {!collapsed &&
      <>
            <span className="flex-1 tracking-wide truncate">{item.label}</span>
            {item.path === '/lounge/messages' && unreadCount > 0 &&
        <Badge className={cn("ml-auto h-5 min-w-5 flex items-center justify-center text-[10px] font-semibold px-1.5 rounded-full", active ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground")}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
        }
            {item.path === '/lounge/settings' && show2FAWarning &&
        <AlertTriangle className="w-3.5 h-3.5 ml-auto text-destructive" />
        }
          </>
      }
      </motion.button>;

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="font-medium">{item.label}</TooltipContent>
        </Tooltip>);

    }
    return button;
  };

  const NavGroupItem = ({ group }: {group: NavGroup;}) => {
    const isActive = isGroupActive(group);
    const isExpanded = isGroupExpanded(group.id);
    const hasItems = group.items && group.items.length > 0;
    const groupHasNotification = group.items?.some((item) => hasNotification(item.path));

    const handleClick = () => {
      if (group.path) navigate(group.path);else
      if (hasItems) {
        if (expandAllGroups) return;
        setExpandedGroup(isExpanded ? null : group.id);
      }
    };

    const buttonContent =
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => { if (group.path) preloadRoute(group.path); group.items?.forEach(i => preloadRoute(i.path)); }}
      onFocus={() => { if (group.path) preloadRoute(group.path); group.items?.forEach(i => preloadRoute(i.path)); }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 w-full text-left relative group/nav",
        collapsed ? "px-3 py-2 justify-center" : "px-3 py-2",
        isActive && !hasItems ? "bg-foreground/[0.05] text-foreground border-l-2 border-primary" :
        isActive && hasItems ? "text-primary" :
        "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
      )}
      aria-expanded={hasItems ? isExpanded : undefined}>

        <div className="relative flex-shrink-0">
          <group.icon className={cn("w-[18px] h-[18px] transition-colors duration-200", isActive && !hasItems ? "text-primary-foreground" : "")} />
          {groupHasNotification && collapsed &&
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
        }
        </div>
        {!collapsed &&
      <>
            <span className="flex-1 tracking-wide">{group.label}</span>
            {hasItems &&
        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </motion.div>
        }
            {groupHasNotification && !hasItems && <span className="h-2 w-2 rounded-full bg-primary" />}
          </>
      }
      </motion.button>;


    if (collapsed) {
      return (
        <div>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-medium">{group.label}</TooltipContent>
          </Tooltip>
          <AnimatePresence>
            {hasItems && isExpanded &&
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-1 space-y-0.5 flex flex-col items-center">
                  {group.items?.map((item) =>
                <Tooltip key={item.path} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <motion.button
                      onClick={() => navigate(item.path)}
                      onMouseEnter={() => preloadRoute(item.path)}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 relative",
                        isPathActive(item.path) ? "bg-foreground/[0.05] text-primary" : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                      )}>

                          <item.icon className="w-4 h-4" />
                          {hasNotification(item.path) &&
                      <span className={cn("absolute top-0.5 right-0.5 h-2 w-2 rounded-full ring-2 ring-card", item.path === '/lounge/messages' ? "bg-primary" : "bg-destructive")} />
                      }
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10}>{item.label}</TooltipContent>
                    </Tooltip>
                )}
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>);

    }

    return buttonContent;
  };

  // --- DnD View ---
  const renderDndView = () => {
    const activeItem = activeId ? filteredItemMap.get(activeId) : null;
    const pinnedItems = PINNED_TOP.map((id) => filteredItemMap.get(id)!).filter(Boolean);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}>

        <div className="space-y-0.5">
          {/* Pinned top items (not draggable) */}
          {pinnedItems.map((item) => {
            const Icon = item.icon;
            const active = isPathActive(item.path);
            const button =
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => preloadRoute(item.path)}
              onFocus={() => preloadRoute(item.path)}
              whileHover={{ x: collapsed ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 w-full text-left",
                collapsed ? "px-3 py-2 justify-center" : "px-3 py-2",
                active ?
                "bg-foreground/[0.05] text-foreground border-l-2 border-primary" :
                "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
              )}>

                <Icon className="w-[18px] h-[18px]" />
                {!collapsed && <span className="flex-1 tracking-wide truncate">{item.label}</span>}
              </motion.button>;

            if (collapsed) {
              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10} className="font-medium">{item.label}</TooltipContent>
                </Tooltip>);

            }
            return <div key={item.id}>{button}</div>;
          })}

          {!collapsed &&
          <div className="relative mx-2 my-2">
              <div className="h-px bg-border/60" />
            </div>
          }

          {/* Draggable zone */}
          <SortableContext items={[...orderedRootEntries, ...layout.folders.flatMap((f) => f.itemIds)]} strategy={verticalListSortingStrategy}>
            {orderedRootEntries.map((entryId) => {
              const folder = layout.folders.find((f) => f.id === entryId);
              if (folder) {
                const folderItems = folder.itemIds.
                map((id) => filteredItemMap.get(id)).
                filter(Boolean) as NavItemDef[];
                return (
                  <SidebarFolderComponent
                    key={folder.id}
                    folder={folder}
                    items={folderItems}
                    collapsed={collapsed}
                    isPathActive={isPathActive}
                    hasNotification={hasNotification}
                    unreadCount={unreadCount}
                    onToggle={() => toggleFolder(folder.id)}
                    onRename={(name) => renameFolder(folder.id, name)}
                    onDelete={() => deleteFolder(folder.id)}
                    onChangeColor={(color) => changeFolderColor(folder.id, color)}
                    onRemoveItem={(itemId) => moveOutOfFolder(itemId, folder.id)}
                    onItemLongPress={mobile ? openMoveSheet : undefined}
                    isDragActive={!!activeId}
                    overId={overId}
                    dragEnabled={!mobile} />);


              }

              const item = filteredItemMap.get(entryId);
              if (!item) return null;

              return (
                <SortableNavItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  isActive={isPathActive(item.path)}
                  hasNotif={hasNotification(item.path)}
                  unreadCount={unreadCount}
                  show2FAWarning={show2FAWarning}
                  onNavigate={navigate}
                  onLongPress={mobile ? openMoveSheet : undefined}
                  dragEnabled={!mobile}
                  isDragActive={!!activeId}
                  overId={overId} />);


            })}
          </SortableContext>

          {/* Sidebar folder actions */}
          {!collapsed &&
          <div className="space-y-0.5 mt-1">
              <button
              onClick={() => createFolder('New Folder', '#8a8a8a')}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[11px] text-muted-foreground/50 hover:text-muted-foreground rounded-lg hover:bg-foreground/[0.03] transition-all">

                <FolderPlus className="w-3.5 h-3.5" />
                Create folder
              </button>
              <button
              onClick={() => {resetToPresets();}}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[11px] text-muted-foreground/50 hover:text-muted-foreground rounded-lg hover:bg-foreground/[0.03] transition-all">

                <Hammer className="w-3.5 h-3.5" />
                Preset folders
              </button>
            </div>
          }
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeItem ? <DragGhostItem item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>);

  };

  const isHorizontal = position === 'top' || position === 'bottom';

  if (isHorizontal) {
    // Build folder-aware horizontal items
    const pinnedItems = PINNED_TOP.map((id) => filteredItemMap.get(id)!).filter(Boolean);
    const horizontalEntries = orderedRootEntries;

    const renderHorizontalItem = (item: NavItemDef) => {
      const active = isPathActive(item.path);
      const Icon = item.icon;
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 shrink-0 relative",
                active ? "bg-foreground/[0.05] text-primary" : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
              )}>

              <Icon className="w-[18px] h-[18px]" />
              {hasNotification(item.path) &&
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
              }
            </button>
          </TooltipTrigger>
          <TooltipContent side={position === 'top' ? 'bottom' : 'top'} sideOffset={8} className="font-medium text-xs">{item.label}</TooltipContent>
        </Tooltip>);

    };

    return (
      <aside className={cn(
        "flex items-center border-border bg-card gap-1 px-2 sm:px-3 py-1.5 z-50 overflow-x-auto scrollbar-none",
        position === 'top' ? 'fixed top-0 left-0 right-0 border-b' : 'fixed bottom-0 left-0 right-0 border-t'
      )}>
        {/* Title */}
        <div className="flex items-center justify-center px-3 shrink-0 cursor-pointer" onClick={() => navigate('/lounge')}>
          <span className="font-display text-sm font-semibold tracking-[-0.02em] text-foreground whitespace-nowrap">Quooro Lounge</span>
        </div>
        <div className="w-px h-8 bg-border/60 mx-1 shrink-0" />

        {/* Pinned items */}
        {pinnedItems.map((item) => renderHorizontalItem(item))}
        <div className="w-px h-6 bg-border/60 mx-0.5 shrink-0" />

        {/* Folder-aware items */}
        {horizontalEntries.map((entryId) => {
          const folder = layout.folders.find((f) => f.id === entryId);
          if (folder) {
            const folderItems = folder.itemIds.map((id) => filteredItemMap.get(id)).filter(Boolean) as NavItemDef[];
            const folderHasActive = folderItems.some((fi) => isPathActive(fi.path));
            const folderHasNotif = folderItems.some((fi) => hasNotification(fi.path));

            // When expand all is on, render items inline instead of in a popover
            if (expandAllGroups) {
              return (
                <div key={folder.id} className="flex items-center gap-0.5 shrink-0">
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center w-5 h-10 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folder.color }} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side={position === 'top' ? 'bottom' : 'top'} sideOffset={8} className="font-medium text-xs">{folder.name}</TooltipContent>
                  </Tooltip>
                  {folderItems.map((fi) => renderHorizontalItem(fi))}
                  <div className="w-px h-6 bg-border/60 mx-0.5 shrink-0" />
                </div>);

            }

            // Inline expand along the horizontal bar
            const isOpen = folder.expanded;
            return (
              <div key={folder.id} className="flex items-center shrink-0">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 shrink-0",
                        folderHasActive ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                      )}>

                      <FolderOpen className="w-[18px] h-[18px]" style={{ color: folder.color }} />
                      {folderHasNotif && !isOpen &&
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
                      }
                      {!isOpen &&
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                        style={{ backgroundColor: folder.color }}>

                          {folderItems.length}
                        </span>
                      }
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={position === 'top' ? 'bottom' : 'top'} sideOffset={8} className="font-medium text-xs">
                    {folder.name} {isOpen ? '(click to collapse)' : '(click to expand)'}
                  </TooltipContent>
                </Tooltip>
                <AnimatePresence>
                  {isOpen &&
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="flex items-center gap-0.5 overflow-hidden">

                      {folderItems.map((fi) => renderHorizontalItem(fi))}
                      <div className="w-px h-6 bg-border/60 mx-0.5 shrink-0" />
                    </motion.div>
                  }
                </AnimatePresence>
              </div>);

          }

          const item = filteredItemMap.get(entryId);
          if (!item) return null;
          return renderHorizontalItem(item);
        })}

        <div className="flex-1" />
        {/* Account */}
        <Popover open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center p-1 rounded-lg hover:bg-foreground/[0.04] transition-all shrink-0">
              <Avatar className="h-8 w-8 border border-border/60">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                <AvatarFallback className="bg-primary/12 text-primary font-semibold text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent side={position === 'top' ? 'bottom' : 'top'} align="end" className="p-1.5 rounded-lg w-56" sideOffset={8}>
            <div className="space-y-0.5">
              <div className="px-3 py-2.5 border-b border-border/60 mb-1.5">
                <p className="text-sm font-semibold truncate">{profile?.full_name || 'User'}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {setAccountMenuOpen(false);navigate('/lounge/settings');}} className="w-full justify-start text-muted-foreground hover:text-foreground text-[13px] h-9 rounded-md">
                <Settings className="w-4 h-4 mr-2.5" />Account settings
              </Button>
              <div className="h-px bg-border/60 my-1" />
              <AccountSwitcher portal="customer" onSwitch={() => setAccountMenuOpen(false)} />
              <div className="h-px bg-border/60 my-1" />
              <Button variant="ghost" size="sm" onClick={() => {setAccountMenuOpen(false);onSignOut();}} className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[13px] h-9 rounded-md">
                <LogOut className="w-4 h-4 mr-2.5" />Sign out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </aside>);

  }

  return (
    <>
    <aside
      className={cn(
        "flex flex-col border-border/60 bg-sidebar transition-all duration-300",
        mobile
          ? "w-full h-dvh max-h-dvh overflow-hidden"
          : cn(
              "hidden lg:flex fixed top-0 h-screen z-50",
              collapsed ? "w-[72px]" : "w-[272px]",
              position === 'right' ? 'right-0 border-l' : 'left-0 border-r'
            )
      )}>


      {/* Logo + Title */}
      <div className={cn("flex items-center justify-center transition-all duration-300 shrink-0", collapsed ? "px-3 py-3" : "px-4 py-5")}>
        <motion.div className="flex flex-col items-center cursor-pointer gap-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/lounge')}>
          {!collapsed && <SidebarBrandedTitle />}
          {collapsed && <SidebarBrandedCollapsed />}
        </motion.div>
      </div>

      <div className="mx-4 h-px bg-border/60" />

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto min-h-0 transition-all duration-300 sidebar-thin-scroll overscroll-contain",
          mobile && "mobile-menu-scroll",
          collapsed ? "px-2 py-2" : "px-3 py-2"
        )}
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        <motion.div key="dnd" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
          {renderDndView()}
        </motion.div>
      </nav>

      {/* Footer Controls */}
      <div className="mt-auto">
        {!mobile && <div className="mx-4 h-px bg-border/60" />}
        {!mobile && (
          <div className={cn("transition-all duration-300", collapsed ? "p-2 space-y-0.5" : "px-3 py-1.5 space-y-0.5")}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCollapsedChange(!collapsed)}
              className={cn("w-full gap-2.5 text-muted-foreground hover:text-foreground h-9 rounded-lg text-[13px]", collapsed ? "justify-center px-2" : "justify-start")}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
            </Button>
          </div>
        )}

        {/* Account Section */}
        <div className="mx-4 h-px bg-border/60" />
        <div className={cn("transition-all duration-300", collapsed ? "p-2" : "p-2")}>
          <Popover open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
            <PopoverTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={cn("flex items-center w-full rounded-lg hover:bg-foreground/[0.04] transition-all duration-200", collapsed ? "justify-center p-2" : "gap-3 p-2.5")}
                aria-label="Account menu">

                <Avatar className={cn("border border-border/60 transition-all duration-300", collapsed ? "h-8 w-8" : "h-10 w-10")}>
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                  <AvatarFallback className="bg-primary/12 text-primary font-semibold text-sm">{getInitials()}</AvatarFallback>
                </Avatar>
                {!collapsed &&
                <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">{profile?.full_name || 'User'}</p>
                      <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{profile?.company || user?.email}</p>
                    </div>
                    <motion.div animate={{ rotate: accountMenuOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                      <ChevronUp className="w-4 h-4 text-muted-foreground/60" />
                    </motion.div>
                  </>
                }
              </motion.button>
            </PopoverTrigger>
            <PopoverContent side="top" align={collapsed ? "center" : "start"} className={cn("p-1.5 rounded-lg", collapsed ? "w-56" : "w-[calc(272px-1.5rem)]")} sideOffset={8}>
              <div className="space-y-0.5">
                <div className="px-3 py-2.5 border-b border-border/60 mb-1.5">
                  <p className="text-sm font-semibold truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {setAccountMenuOpen(false);navigate('/lounge/settings');}} className="w-full justify-start text-muted-foreground hover:text-foreground text-[13px] h-9 rounded-md">
                  <Settings className="w-4 h-4 mr-2.5" />Account settings
                </Button>
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-[13px] text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <div className="h-px bg-border/60 my-1" />
                <AccountSwitcher portal="customer" onSwitch={() => setAccountMenuOpen(false)} />
                <div className="h-px bg-border/60 my-1" />
                
                <Button variant="ghost" size="sm" onClick={() => {setAccountMenuOpen(false);onSignOut();}} className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[13px] h-9 rounded-md">
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
        itemLabel={moveItemId ? (filteredItemMap.get(moveItemId)?.label ?? '') : ''}
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