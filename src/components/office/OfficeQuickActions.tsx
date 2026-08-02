import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Search, Settings2, ChevronLeft,
  FileText, Sheet, Presentation, BookOpen, Cloud,
  Briefcase, Receipt, Users, Layout, Clock, FileSignature,
  TrendingUp, BookMarked, ClipboardList, BarChart3, FileCheck,
  Palette, PenLine, KeyRound,
  PoundSterling, Mail, CalendarDays, CalendarCheck, MessagesSquare, Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppTile } from '@/pages/lounge/office/AppTile';

/**
 * The quick launcher.
 *
 * One press opens a launcher panel - the corner of the suite you reach
 * for when you are three screens deep in one app and need another. It
 * is a panel, not a fountain of bubbles: shortcuts first, recents
 * underneath, search across everything, and a manage mode for choosing
 * what earns a slot. All colour comes from the app marks themselves.
 */

interface QuickApp {
  id: string;
  name: string;
  route: string;
  icon: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Sheet, Presentation, BookOpen, Cloud,
  Briefcase, Receipt, Users, Layout, Clock, FileSignature,
  TrendingUp, BookMarked, ClipboardList, BarChart3, FileCheck,
  Palette, PenLine, KeyRound,
  PoundSterling, Mail, CalendarDays, CalendarCheck, MessagesSquare, Boxes,
};

const ALL_OFFICE_APPS: QuickApp[] = [
  { id: 'docs', name: 'Docs', route: '/lounge/office/word-home', icon: 'FileText' },
  { id: 'sheets', name: 'Sheets', route: '/lounge/office/sheets-home', icon: 'Sheet' },
  { id: 'slides', name: 'Slides', route: '/lounge/office/powerpoint-home', icon: 'Presentation' },
  { id: 'notes', name: 'Notes', route: '/lounge/office/onenote-home', icon: 'BookOpen' },
  { id: 'files', name: 'Files', route: '/lounge/office/onedrive', icon: 'Cloud' },
  { id: 'operations', name: 'Operations', route: '/lounge/office/operations', icon: 'Briefcase' },
  { id: 'invoices', name: 'Invoices', route: '/lounge/office/invoices', icon: 'Receipt' },
  { id: 'hr', name: 'HR', route: '/lounge/office/hr', icon: 'Users' },
  { id: 'tasks', name: 'Tasks', route: '/lounge/office/tasks', icon: 'Layout' },
  { id: 'expenses', name: 'Expenses', route: '/lounge/office/expenses', icon: 'Receipt' },
  { id: 'contracts', name: 'Contracts', route: '/lounge/office/contracts', icon: 'FileSignature' },
  { id: 'time-tracker', name: 'Time Tracker', route: '/lounge/office/time-tracker', icon: 'Clock' },
  { id: 'analytics', name: 'Analytics', route: '/lounge/office/analytics', icon: 'TrendingUp' },
  { id: 'wiki', name: 'Wiki', route: '/lounge/office/wiki', icon: 'BookMarked' },
  { id: 'forms', name: 'Forms', route: '/lounge/office/forms-home', icon: 'ClipboardList' },
  { id: 'polls', name: 'Polls', route: '/lounge/office/polls-home', icon: 'BarChart3' },
  { id: 'pdf', name: 'PDF', route: '/lounge/office/pdf-home', icon: 'FileCheck' },
  { id: 'design', name: 'Design', route: '/lounge/office/design-studio', icon: 'Palette' },
  { id: 'profitability', name: 'Profitability', route: '/lounge/office/profitability', icon: 'PoundSterling' },
  { id: 'mail', name: 'Mail', route: '/lounge/mail', icon: 'Mail' },
  { id: 'calendar', name: 'Calendar', route: '/lounge/calendar', icon: 'CalendarDays' },
  { id: 'bookings', name: 'Bookings', route: '/lounge/bookings', icon: 'CalendarCheck' },
  { id: 'team-comms', name: 'Team chat', route: '/lounge/team-comms', icon: 'MessagesSquare' },
  { id: 'inventory', name: 'Inventory', route: '/lounge/inventory', icon: 'Boxes' },
  { id: 'passwords', name: 'Passwords', route: '/lounge/office/passwords', icon: 'KeyRound' },
  { id: 'whiteboard', name: 'Whiteboard', route: '/lounge/office/whiteboard-home', icon: 'PenLine' },
];

const DEFAULT_IDS = ['mail', 'docs', 'invoices', 'profitability', 'calendar'];
const STORAGE_KEY = 'office-quick-actions';
const RECENT_KEY = 'office-recent-apps';
const MAX_RECENT = 3;

const KICK = 'text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/90';

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Plus;
}

export function OfficeQuickActions() {
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
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

  const [searchTerm, setSearchTerm] = useState('');

  const shortcutApps = shortcuts.map(id => ALL_OFFICE_APPS.find(a => a.id === id)).filter(Boolean) as QuickApp[];
  const recentApps = recentIds
    .filter(id => !shortcuts.includes(id))
    .map(id => ALL_OFFICE_APPS.find(a => a.id === id))
    .filter(Boolean) as QuickApp[];
  const availableToAdd = ALL_OFFICE_APPS.filter(a => !shortcuts.includes(a.id));

  const searchResults = searchTerm.trim()
    ? ALL_OFFICE_APPS.filter(a => a.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : [];

  const trackRecent = (id: string) => {
    setRecentIds(prev => [id, ...prev.filter(r => r !== id)].slice(0, MAX_RECENT + shortcuts.length));
  };

  const close = () => { setOpen(false); setSearchTerm(''); setManaging(false); };

  const handleAction = (route: string, appId?: string) => {
    if (appId) trackRecent(appId);
    navigate(route);
    close();
  };

  const AppRow = ({ app, note }: { app: QuickApp; note?: string }) => {
    const Icon = getIcon(app.icon);
    return (
      <button
        onClick={() => handleAction(app.route, app.id)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150 hover:bg-foreground/[0.04]"
      >
        <AppTile id={app.id} icon={Icon as any} size={24} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">{app.name}</span>
        {note && <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">{note}</span>}
      </button>
    );
  };

  return (
    /* On mobile the Office tab bar owns the bottom edge, so the launcher
       sits clear of it rather than on top of the Recents tab. */
    <div className="fixed right-4 z-[60] bottom-[calc(58px_+_env(safe-area-inset-bottom)_+_14px)] md:bottom-5 md:right-5">
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="fixed inset-0 z-[59] bg-background/55 backdrop-blur-[2px]"
              onClick={close}
            />

            {/* The launcher panel */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-[60px] right-0 z-[60] w-[300px] overflow-hidden rounded-[16px] border border-border/40 bg-card shadow-2xl"
            >
              {/* Panel header: search, or the manage title */}
              <div className="flex h-11 items-center gap-2.5 border-b border-border/60 px-3">
                {managing ? (
                  <>
                    <button
                      onClick={() => setManaging(false)}
                      aria-label="Back to launcher"
                      className="flex h-7 w-7 items-center justify-center rounded-[7px] text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[12.5px] font-semibold">Choose your shortcuts</span>
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Open anything"
                      autoFocus
                      className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </>
                )}
              </div>

              <div className="max-h-[min(52vh,420px)] overflow-y-auto py-1">
                {managing ? (
                  <>
                    {shortcutApps.length > 0 && (
                      <>
                        <p className={cn(KICK, 'px-3 pb-1 pt-2')}>Pinned</p>
                        {shortcutApps.map(app => {
                          const Icon = getIcon(app.icon);
                          return (
                            <div key={app.id} className="flex items-center gap-2.5 px-3 py-1.5">
                              <AppTile id={app.id} icon={Icon as any} size={24} />
                              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{app.name}</span>
                              <button
                                onClick={() => setShortcuts(prev => prev.filter(s => s !== app.id))}
                                className="shrink-0 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </>
                    )}
                    {availableToAdd.length > 0 && (
                      <>
                        <div className="mx-3 my-1.5 h-px bg-border/60" />
                        <p className={cn(KICK, 'px-3 pb-1')}>Everything else</p>
                        {availableToAdd.map(app => {
                          const Icon = getIcon(app.icon);
                          return (
                            <div key={app.id} className="flex items-center gap-2.5 px-3 py-1.5">
                              <AppTile id={app.id} icon={Icon as any} size={24} />
                              <span className="min-w-0 flex-1 truncate text-[12.5px]">{app.name}</span>
                              <button
                                onClick={() => setShortcuts(prev => [...prev, app.id])}
                                className="shrink-0 text-[11px] font-medium text-primary transition-opacity hover:opacity-80"
                              >
                                Pin
                              </button>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </>
                ) : searchTerm.trim() ? (
                  searchResults.length === 0 ? (
                    <p className="px-3 py-5 text-center text-[12.5px] text-muted-foreground">No app by that name.</p>
                  ) : (
                    searchResults.map(app => <AppRow key={app.id} app={app} />)
                  )
                ) : (
                  <>
                    <p className={cn(KICK, 'px-3 pb-1 pt-2')}>Pinned</p>
                    {shortcutApps.map(app => <AppRow key={app.id} app={app} />)}
                    {recentApps.length > 0 && (
                      <>
                        <div className="mx-3 my-1.5 h-px bg-border/60" />
                        <p className={cn(KICK, 'px-3 pb-1')}>Recent</p>
                        {recentApps.slice(0, MAX_RECENT).map(app => <AppRow key={app.id} app={app} note="recent" />)}
                      </>
                    )}
                  </>
                )}
              </div>

              {!managing && !searchTerm.trim() && (
                <button
                  onClick={() => setManaging(true)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-border/60 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.03] hover:text-foreground"
                >
                  <Settings2 className="h-3.5 w-3.5" /> Manage shortcuts
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* The trigger */}
      <button
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? 'Close quick launch' : 'Open quick launch'}
        className={cn(
          'relative z-[61] flex h-11 w-11 items-center justify-center rounded-[12px] shadow-lg transition-colors duration-150',
          open
            ? 'border border-border/60 bg-card text-foreground'
            : 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18),0_8px_20px_-8px_hsl(17_88%_40%/0.5)]',
        )}
      >
        {open ? <X className="h-4.5 w-4.5" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
  );
}
