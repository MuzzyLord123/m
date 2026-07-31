import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Trash2, Settings2,
  FileText, Sheet, Presentation, BookOpen, Cloud,
  Briefcase, Receipt, Users, Layout, Clock, FileSignature,
  TrendingUp, BookMarked, ClipboardList, BarChart3, FileCheck,
  Palette, PenLine, StickyNote, KeyRound, Calculator, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface QuickApp {
  id: string;
  name: string;
  route: string;
  icon: string;
  color: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Sheet, Presentation, BookOpen, Cloud,
  Briefcase, Receipt, Users, Layout, Clock, FileSignature,
  TrendingUp, BookMarked, ClipboardList, BarChart3, FileCheck,
  Palette, PenLine, StickyNote, KeyRound, Calculator, Timer,
};

const ALL_OFFICE_APPS: QuickApp[] = [
  { id: 'docs', name: 'Docs', route: '/lounge/office/word-home', icon: 'FileText', color: '#3b82f6' },
  { id: 'sheets', name: 'Sheets', route: '/lounge/office/sheets-home', icon: 'Sheet', color: '#10b981' },
  { id: 'slides', name: 'Slides', route: '/lounge/office/powerpoint-home', icon: 'Presentation', color: '#f97316' },
  { id: 'notes', name: 'Notes', route: '/lounge/office/onenote-home', icon: 'BookOpen', color: '#8b5cf6' },
  { id: 'files', name: 'Files', route: '/lounge/office/onedrive', icon: 'Cloud', color: '#0ea5e9' },
  { id: 'operations', name: 'Operations', route: '/lounge/office/operations', icon: 'Briefcase', color: '#f97316' },
  { id: 'invoices', name: 'Invoices', route: '/lounge/office/invoices', icon: 'Receipt', color: '#10b981' },
  { id: 'hr', name: 'HR', route: '/lounge/office/hr', icon: 'Users', color: '#06b6d4' },
  { id: 'tasks', name: 'Tasks', route: '/lounge/office/tasks', icon: 'Layout', color: '#22c55e' },
  { id: 'expenses', name: 'Expenses', route: '/lounge/office/expenses', icon: 'Receipt', color: '#059669' },
  { id: 'contracts', name: 'Contracts', route: '/lounge/office/contracts', icon: 'FileSignature', color: '#7c3aed' },
  { id: 'time-tracker', name: 'Time Tracker', route: '/lounge/office/time-tracker', icon: 'Clock', color: '#e11d48' },
  { id: 'analytics', name: 'Analytics', route: '/lounge/office/analytics', icon: 'TrendingUp', color: '#6366f1' },
  { id: 'wiki', name: 'Wiki', route: '/lounge/office/wiki', icon: 'BookMarked', color: '#a855f7' },
  { id: 'forms', name: 'Forms', route: '/lounge/office/forms-home', icon: 'ClipboardList', color: '#14b8a6' },
  { id: 'polls', name: 'Polls', route: '/lounge/office/polls-home', icon: 'BarChart3', color: '#6366f1' },
  { id: 'pdf', name: 'PDF', route: '/lounge/office/pdf-home', icon: 'FileCheck', color: '#ef4444' },
  { id: 'design', name: 'Design', route: '/lounge/office/design-studio', icon: 'Palette', color: '#06b6d4' },
  { id: 'whiteboard', name: 'Whiteboard', route: '/lounge/office/whiteboard-home', icon: 'PenLine', color: '#ec4899' },
  { id: 'sticky', name: 'Sticky Wall', route: '/lounge/office/sticky-wall-home', icon: 'StickyNote', color: '#eab308' },
  { id: 'passwords', name: 'Passwords', route: '/lounge/office/passwords', icon: 'KeyRound', color: '#334155' },
  { id: 'calculator', name: 'Calculator', route: '/lounge/office/calculator', icon: 'Calculator', color: '#14b8a6' },
  { id: 'pomodoro', name: 'Pomodoro', route: '/lounge/office/pomodoro', icon: 'Timer', color: '#f43f5e' },
];

const DEFAULT_IDS = ['docs', 'sheets', 'tasks', 'analytics', 'files'];
const STORAGE_KEY = 'office-quick-actions';
const RECENT_KEY = 'office-recent-apps';
const MAX_RECENT = 3;

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Plus;
}

export function OfficeQuickActions() {
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const navigate = useNavigate();

  const [shortcuts, setShortcuts] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_IDS;
    } catch { return DEFAULT_IDS; }
  });

  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  }, [shortcuts]);

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds));
  }, [recentIds]);

  const shortcutApps = shortcuts.map(id => ALL_OFFICE_APPS.find(a => a.id === id)).filter(Boolean) as QuickApp[];
  const recentApps = recentIds
    .filter(id => !shortcuts.includes(id))
    .map(id => ALL_OFFICE_APPS.find(a => a.id === id))
    .filter(Boolean) as QuickApp[];
  const availableToAdd = ALL_OFFICE_APPS.filter(a => !shortcuts.includes(a.id));

  const trackRecent = (id: string) => {
    setRecentIds(prev => [id, ...prev.filter(r => r !== id)].slice(0, MAX_RECENT + shortcuts.length));
  };

  const handleAction = (route: string, appId?: string) => {
    if (appId) trackRecent(appId);
    navigate(route);
    setOpen(false);
  };

  const removeShortcut = (id: string) => {
    setShortcuts(prev => prev.filter(s => s !== id));
  };

  const addShortcut = (id: string) => {
    setShortcuts(prev => [...prev, id]);
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredShortcutApps = searchTerm
    ? shortcutApps.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : shortcutApps;

  const searchResults = searchTerm
    ? ALL_OFFICE_APPS.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) && !shortcuts.includes(a.id))
    : [];

  return (
    /* On mobile the Office tab bar owns the bottom edge, so the launcher
       sits clear of it rather than on top of the Recents tab. */
    <div className="fixed right-5 z-[60] bottom-[calc(58px_+_env(safe-area-inset-bottom)_+_14px)] md:bottom-5">
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[59]"
              onClick={() => { setOpen(false); setSearchTerm(''); }}
            />

            <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-2 items-end z-[60]">
              {/* Search input */}
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.85 }}
                transition={{ delay: 0 }}
                className="mb-1"
              >
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search apps…"
                  autoFocus
                  className="w-48 px-3 py-2 rounded-xl bg-card border border-border/40 shadow-lg text-[11px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30"
                />
              </motion.div>

              {/* Search results from all apps */}
              {searchResults.map((app, index) => {
                const Icon = getIcon(app.icon);
                return (
                  <motion.button
                    key={`search-${app.id}`}
                    initial={{ opacity: 0, y: 16, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.85 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleAction(app.route, app.id)}
                    className="flex items-center gap-2.5 group"
                  >
                    <span className="px-3 py-1.5 rounded-xl bg-card border border-border/40 shadow-lg text-[11px] font-semibold whitespace-nowrap text-muted-foreground">
                      {app.name}
                    </span>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 opacity-70"
                      style={{ background: `linear-gradient(135deg, ${app.color}88, ${app.color}66)` }}
                    >
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </motion.button>
                );
              })}

              {/* Recent apps section */}
              {!searchTerm && recentApps.length > 0 && (
                <>
                  {recentApps.map((app, index) => {
                    const Icon = getIcon(app.icon);
                    return (
                      <motion.button
                        key={`recent-${app.id}`}
                        initial={{ opacity: 0, y: 16, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.85 }}
                        transition={{ delay: index * 0.04 }}
                        onClick={() => handleAction(app.route, app.id)}
                        className="flex items-center gap-2.5 group"
                      >
                        <span className="px-3 py-1.5 rounded-xl bg-card border border-border/40 shadow-lg text-[11px] font-semibold whitespace-nowrap text-muted-foreground/70">
                          <span className="text-[8px] uppercase tracking-wider mr-1.5 text-muted-foreground/40">Recent</span>
                          {app.name}
                        </span>
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 opacity-70"
                          style={{ background: `linear-gradient(135deg, ${app.color}88, ${app.color}66)` }}
                        >
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                      </motion.button>
                    );
                  })}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-8 h-px bg-border/20 mr-1 self-center"
                  />
                </>
              )}

              {filteredShortcutApps.map((app, index) => {
                const Icon = getIcon(app.icon);
                return (
                  <motion.button
                    key={app.id}
                    initial={{ opacity: 0, y: 16, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.85 }}
                    transition={{ delay: (recentApps.length + index) * 0.04 }}
                    onClick={() => handleAction(app.route, app.id)}
                    className="flex items-center gap-2.5 group"
                  >
                    <span className="px-3 py-1.5 rounded-xl bg-card border border-border/40 shadow-lg text-[11px] font-semibold whitespace-nowrap text-foreground">
                      {app.name}
                    </span>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      style={{ background: `linear-gradient(135deg, ${app.color}, ${app.color}cc)` }}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </motion.button>
                );
              })}

              {/* Manage shortcuts button */}
              {!searchTerm && (
                <motion.button
                  initial={{ opacity: 0, y: 16, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.85 }}
                  transition={{ delay: shortcutApps.length * 0.04 }}
                  onClick={() => { setManageOpen(true); setOpen(false); setSearchTerm(''); }}
                  className="flex items-center gap-2.5 group"
                >
                  <span className="px-3 py-1.5 rounded-xl bg-card border border-border/40 shadow-lg text-[11px] font-semibold whitespace-nowrap text-muted-foreground">
                    Manage shortcuts
                  </span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted border border-border/30 shadow-lg transition-transform hover:scale-110">
                    <Settings2 className="w-4 h-4 text-foreground" />
                  </div>
                </motion.button>
              )}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors",
          open
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        )}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
      >
        {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </motion.button>

      {/* Manage Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Manage Quick Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Current shortcuts */}
            {shortcutApps.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Your shortcuts</p>
                <div className="space-y-1">
                  {shortcutApps.map(app => {
                    const Icon = getIcon(app.icon);
                    return (
                      <div key={app.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/30">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${app.color}15` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: app.color }} />
                          </div>
                          <span className="text-[12px] font-semibold text-foreground">{app.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeShortcut(app.id)}>
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
                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                  {shortcutApps.length > 0 ? 'Add more' : 'Choose shortcuts'}
                </p>
                <div className="grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto">
                  {availableToAdd.map(app => {
                    const Icon = getIcon(app.icon);
                    return (
                      <button
                        key={app.id}
                        onClick={() => addShortcut(app.id)}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                      >
                        <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${app.color}15` }}>
                          <Icon className="w-3 h-3" style={{ color: app.color }} />
                        </div>
                        <span className="text-[11px] font-medium truncate text-foreground">{app.name}</span>
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
