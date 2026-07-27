import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, Filter, CreditCard, Upload,
  FolderCheck, Clock, Rocket, Settings2, Search, X, BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  project_update: { icon: Rocket, label: 'Project Updates', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  payment: { icon: CreditCard, label: 'Payments', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  file_upload: { icon: Upload, label: 'File Uploads', color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
  approval_needed: { icon: FolderCheck, label: 'Approvals', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  deadline: { icon: Clock, label: 'Deadlines', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  system: { icon: Settings2, label: 'System', color: 'text-muted-foreground bg-muted border-border' },
};

function groupByDate(notifications: Notification[]) {
  const groups: Record<string, Notification[]> = {};
  for (const n of notifications) {
    const d = new Date(n.created_at);
    let key: string;
    if (isToday(d)) key = 'Today';
    else if (isYesterday(d)) key = 'Yesterday';
    else key = format(d, 'EEEE, d MMMM yyyy');
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
}

export default function LoungeNotifications() {
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead, deleteNotification, clearAll,
    pushPermission, requestPushPermission
  } = useNotifications();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filtered = useMemo(() => {
    let result = notifications;
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term)
      );
    }
    if (typeFilter) result = result.filter(n => n.type === typeFilter);
    if (readFilter === 'unread') result = result.filter(n => !n.is_read);
    if (readFilter === 'read') result = result.filter(n => n.is_read);
    return result;
  }, [notifications, search, typeFilter, readFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <LoungePageHeader
        title="Notification Center"
        description="All your system events in one place"
        icon={Bell}
      />

      {/* Push notification permission banner */}
      {pushPermission !== 'granted' && typeof Notification !== 'undefined' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5"
        >
          <BellRing className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium">Enable desktop notifications</p>
            <p className="text-[11px] text-muted-foreground">Get alerts even when this tab isn't focused</p>
          </div>
          <Button size="sm" className="h-7 text-[11px] rounded-lg" onClick={requestPushPermission}>
            Enable
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(typeConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const count = typeCounts[key] || 0;
          const isActive = typeFilter === key;
          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTypeFilter(isActive ? null : key)}
              className={cn(
                'flex items-center gap-2.5 p-3 rounded-xl border transition-all',
                isActive
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border/50 bg-card hover:border-border'
              )}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cfg.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[11px] text-muted-foreground">{cfg.label}</p>
                <p className="text-sm font-semibold">{count}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-lg"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button
              key={f}
              onClick={() => setReadFilter(f)}
              className={cn(
                'px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors capitalize',
                readFilter === f ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f} {f === 'unread' && unreadCount > 0 && `(${unreadCount})`}
            </button>
          ))}
        </div>

        {typeFilter && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => setTypeFilter(null)}
          >
            {typeConfig[typeFilter]?.label}
            <X className="w-3 h-3" />
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={markAllAsRead}>
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-[11px] text-destructive hover:text-destructive" onClick={clearAll}>
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground text-sm">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {notifications.length === 0 ? 'No notifications yet' : 'No matching notifications'}
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            {notifications.length === 0
              ? "You'll see project updates, payments, and more here"
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {dateLabel}
              </h3>
              <div className="space-y-1">
                <AnimatePresence>
                  {items.map((notif) => {
                    const cfg = typeConfig[notif.type] || typeConfig.system;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -30, height: 0 }}
                        className={cn(
                          'group flex items-start gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all border',
                          notif.is_read
                            ? 'opacity-50 hover:opacity-80 border-transparent hover:border-border/30 hover:bg-accent/20'
                            : 'border-border/30 bg-card hover:bg-accent/30 shadow-sm'
                        )}
                        onClick={() => {
                          if (!notif.is_read) markAsRead(notif.id);
                          if (notif.link) navigate(notif.link);
                        }}
                      >
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn('text-[13px] leading-snug', !notif.is_read && 'font-semibold')}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground/50 shrink-0 mt-0.5">
                              {format(new Date(notif.created_at), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', cfg.color)}>
                              {cfg.label}
                            </span>
                            {!notif.is_read && (
                              <span className="text-[10px] text-primary font-medium">● New</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {!notif.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                              className="p-1.5 hover:bg-primary/10 rounded-md"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-primary" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                            className="p-1.5 hover:bg-destructive/10 rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
