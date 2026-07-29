import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCheck, Trash2, CreditCard, Upload,
  FolderCheck, Clock, Rocket, Settings2, Search, X, BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { format, isToday, isYesterday } from 'date-fns';
import {
  PageHeader, Panel, StatusBadge, EmptyState, SkeletonLedger, FIELD,
} from '@/components/platform';

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  project_update: { icon: Rocket, label: 'Project updates' },
  payment: { icon: CreditCard, label: 'Payments' },
  file_upload: { icon: Upload, label: 'File uploads' },
  approval_needed: { icon: FolderCheck, label: 'Approvals' },
  deadline: { icon: Clock, label: 'Deadlines' },
  system: { icon: Settings2, label: 'System' },
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
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Client portal"
        title="Notifications"
        description="Everything that happened on your account, in one place"
      />

      {/* Push notification permission */}
      {pushPermission !== 'granted' && typeof Notification !== 'undefined' && (
        <div className="mt-5 flex items-center gap-3 rounded-[10px] border border-border/60 bg-card p-3">
          <BellRing className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium">Desktop notifications are off</p>
            <p className="text-[11.5px] text-muted-foreground">Turn them on to get alerts when this tab is not focused</p>
          </div>
          <Button size="sm" className="h-7 rounded-lg text-[11px]" onClick={requestPushPermission}>
            Turn on
          </Button>
        </div>
      )}

      {/* Type filter chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        {Object.entries(typeConfig).map(([key, cfg]) => {
          const count = typeCounts[key] || 0;
          const isActive = typeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setTypeFilter(isActive ? null : key)}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors duration-150',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {cfg.label}
              <span className={cn('font-mono text-[10px] tabular-nums', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notifications"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(FIELD, 'h-9 pl-9 text-sm')}
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button
              key={f}
              onClick={() => setReadFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-[11px] font-medium capitalize transition-colors duration-150',
                readFilter === f ? 'bg-foreground/[0.06] text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f} {f === 'unread' && unreadCount > 0 && `(${unreadCount})`}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[11px]" onClick={markAllAsRead}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[11px] text-risk hover:text-risk" onClick={clearAll}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="mt-5">
        {loading ? (
          <div className="rounded-[10px] border border-border/60">
            <SkeletonLedger rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <Panel>
            <EmptyState
              title={notifications.length === 0 ? 'Nothing to report' : 'No matching notifications'}
              body={
                notifications.length === 0
                  ? 'Project updates, payments and approvals will appear here as they happen.'
                  : 'Adjust your search or filters to find what you need.'
              }
            />
          </Panel>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <h3 className="mb-2 px-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {dateLabel}
                </h3>
                <Panel>
                  {items.map((notif) => {
                    const cfg = typeConfig[notif.type] || typeConfig.system;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          'group flex w-full cursor-pointer items-start gap-3 border-t border-border/60 px-4 py-3 text-left transition-colors duration-150 first:border-t-0 hover:bg-foreground/[0.025]',
                          notif.is_read && 'opacity-60 hover:opacity-90',
                        )}
                        onClick={() => {
                          if (!notif.is_read) markAsRead(notif.id);
                          if (notif.link) navigate(notif.link);
                        }}
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className={cn('text-[13px] leading-snug', !notif.is_read && 'font-[550]')}>
                              {notif.title}
                            </span>
                            <span className="mt-0.5 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                              {format(new Date(notif.created_at), 'HH:mm')}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[12px] text-muted-foreground">{notif.message}</span>
                          <span className="mt-1.5 flex items-center gap-3">
                            <span className="text-[10.5px] text-muted-foreground">{cfg.label}</span>
                            {!notif.is_read && <StatusBadge tone="accent" label="New" className="text-[10.5px]" />}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                          {!notif.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                              className="rounded-md p-1.5 transition-colors duration-150 hover:bg-foreground/[0.05]"
                              title="Mark as read"
                            >
                              <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                            className="rounded-md p-1.5 transition-colors duration-150 hover:bg-foreground/[0.05]"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-risk" />
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </Panel>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
