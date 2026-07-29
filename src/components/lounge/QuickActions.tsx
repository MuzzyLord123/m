import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Upload,
  MessageSquare,
  Calendar,
  Sparkles,
  Globe,
  Layout,
  FileText,
  Search,
  Megaphone,
  Share2,
  HardDrive,
  Users,
  CreditCard,
  Settings,
  Ticket,
  Home,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIPreferences, type FABShortcut } from '@/hooks/useUIPreferences';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// All available shortcuts the user can pick from
const AVAILABLE_SHORTCUTS: FABShortcut[] = [
  { id: 'home', label: 'Dashboard', path: '/lounge', icon: 'Home' },
  { id: 'ai', label: 'Quooro AI', path: '/lounge/ai', icon: 'Sparkles' },
  { id: 'website', label: 'Website', path: '/lounge/website', icon: 'Globe' },
  { id: 'apps', label: 'App Projects', path: '/lounge/apps', icon: 'Layout' },
  { id: 'content', label: 'Content Requests', path: '/lounge/content', icon: 'FileText' },
  { id: 'seo', label: 'SEO Checker', path: '/lounge/seo-checker', icon: 'Search' },
  { id: 'ads', label: 'Ad Campaigns', path: '/lounge/ads', icon: 'Megaphone' },
  { id: 'social', label: 'Social Media', path: '/lounge/social', icon: 'Share2' },
  { id: 'calendar', label: 'Calendar', path: '/lounge/calendar', icon: 'Calendar' },
  { id: 'assets', label: 'Asset Storage', path: '/lounge/assets', icon: 'HardDrive' },
  { id: 'uploads', label: 'Uploads', path: '/lounge/uploads', icon: 'Upload' },
  { id: 'team', label: 'Team', path: '/lounge/team', icon: 'Users' },
  { id: 'billing', label: 'Billing', path: '/lounge/billing', icon: 'CreditCard' },
  { id: 'messages', label: 'Messages', path: '/lounge/messages', icon: 'MessageSquare' },
  { id: 'tickets', label: 'Support Tickets', path: '/lounge/tickets', icon: 'Ticket' },
  { id: 'settings', label: 'Settings', path: '/lounge/settings', icon: 'Settings' },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Sparkles, Globe, Layout, FileText, Search, Megaphone, Share2,
  Calendar, HardDrive, Upload, Users, CreditCard, MessageSquare, Ticket, Settings,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Plus;
}

interface QuickActionsProps {
  isEmbedded?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function QuickActions({ isEmbedded, isOpen: externalOpen, onToggle }: QuickActionsProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { preferences, updatePreference } = useUIPreferences();

  if (!preferences.showFAB) return null;

  const open = isEmbedded ? (externalOpen ?? false) : internalOpen;
  const toggleOpen = isEmbedded ? (onToggle ?? (() => {})) : () => setInternalOpen(prev => !prev);

  const shortcuts = preferences.fabShortcuts;
  const isBottomSidebar = preferences.sidebarPosition === 'bottom';

  const closeMenu = () => {
    if (isEmbedded && onToggle && open) onToggle();
    else if (!isEmbedded) setInternalOpen(false);
  };

  const handleAction = (path: string) => {
    navigate(path);
    closeMenu();
  };

  const addShortcut = (shortcut: FABShortcut) => {
    if (shortcuts.find(s => s.id === shortcut.id)) return;
    updatePreference('fabShortcuts', [...shortcuts, shortcut]);
  };

  const removeShortcut = (id: string) => {
    updatePreference('fabShortcuts', shortcuts.filter(s => s.id !== id));
  };

  const availableToAdd = AVAILABLE_SHORTCUTS.filter(
    s => !shortcuts.find(existing => existing.id === s.id)
  );

  return (
    <div className={cn(
      isEmbedded ? "relative" : "fixed right-4 z-40",
      !isEmbedded && (isBottomSidebar ? "bottom-28 lg:bottom-24" : "bottom-20 lg:bottom-6")
    )}>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm"
              onClick={closeMenu}
            />
            
            {/* Action buttons - grid layout */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-24 right-4 left-4 sm:left-auto sm:w-[280px] bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl p-3 sm:p-4 max-h-[60vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-foreground/80 tracking-wide">Quick Actions</h3>
                <button
                  onClick={() => { setAddDialogOpen(true); closeMenu(); }}
                  className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                {shortcuts.map((shortcut, index) => {
                  const Icon = getIcon(shortcut.icon);
                  return (
                    <motion.button
                      key={shortcut.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleAction(shortcut.path)}
                      className="flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl hover:bg-accent/50 transition-colors group"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-primary" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight truncate w-full">
                        {shortcut.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={toggleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-11 h-11 rounded-full border border-border/60 flex items-center justify-center transition-colors duration-150",
          open 
            ? "bg-muted text-foreground" 
            : "bg-card text-ink-2 hover:text-foreground"
        )}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </motion.button>

      {/* Add Shortcut Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Manage Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Current shortcuts */}
            {shortcuts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your shortcuts</p>
                <div className="space-y-1">
                  {shortcuts.map(s => {
                    const Icon = getIcon(s.icon);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{s.label}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeShortcut(s.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available to add */}
            {availableToAdd.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {shortcuts.length > 0 ? 'Add more' : 'Choose shortcuts'}
                </p>
                <div className="grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto">
                  {availableToAdd.map(s => {
                    const Icon = getIcon(s.icon);
                    return (
                      <button
                        key={s.id}
                        onClick={() => addShortcut(s)}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
