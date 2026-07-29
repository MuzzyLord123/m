import { useState, useEffect } from 'react';
import { Users, Globe, Clock, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Panel, AvatarID, StatusDot, EmptyState } from '@/components/platform';

interface PresenceUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  current_page: string;
  online_at: string;
}

const PAGE_LABELS: Record<string, string> = {
  '/lounge': 'Overview',
  '/lounge/website': 'Website Management',
  '/lounge/website-designer': 'Website Designer',
  '/lounge/apps': 'App Projects',
  '/lounge/billing': 'Billing',
  '/lounge/messages': 'Messages',
  '/lounge/settings': 'Settings',
  '/lounge/ai': 'AI Assistant',
  '/lounge/content': 'Content Requests',
  '/lounge/calendar': 'Calendar',
  '/lounge/social': 'Social Media',
  '/lounge/ads': 'Ad Management',
  '/lounge/uploads': 'Uploads',
  '/lounge/assets': 'Asset Storage',
  '/lounge/team': 'Team',
  '/lounge/tickets': 'Tickets',
  '/lounge/products': 'Products',
  '/lounge/seo-checker': 'SEO Checker',
  '/lounge/workflows': 'Workflows',

  '/lounge/notifications': 'Notifications',
  '/lounge/crm': 'CRM',
  '/lounge/ai-builder': 'AI Builder',
  '/lounge/marketing-calendar': 'Marketing Calendar',
};

function getPageLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith('/lounge/editor/')) return 'Website Editor';
  const segment = path.split('/').pop() || '';
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ') || 'Dashboard';
}

export default function AdminLiveSessions() {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const channel = supabase.channel('lounge-presence', {
      config: { presence: { key: 'admin-viewer' } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          if (key === 'admin-viewer') return; // Skip admin's own presence
          const latest = (presences as any[])[0];
          if (latest?.user_id) {
            users.push({
              user_id: latest.user_id,
              full_name: latest.full_name || 'Unknown',
              avatar_url: latest.avatar_url || null,
              email: latest.email || '',
              current_page: latest.current_page || '/lounge',
              online_at: latest.online_at || new Date().toISOString(),
            });
          }
        });

        setOnlineUsers(users);
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Panel className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-sunken p-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Live client sessions</h2>
            <p className="text-[11px] text-muted-foreground">Real-time view of active Lounge users</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <StatusDot tone={connected ? 'ok' : 'risk'} />
            <span className="text-[10px] text-muted-foreground">{connected ? 'Connected' : 'Connecting'}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-sunken px-2.5 py-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-[12px] font-semibold tabular-nums text-foreground">{onlineUsers.length}</span>
            <span className="text-[10px] text-muted-foreground">online</span>
          </div>
        </div>
      </Panel>

      {/* Sessions Grid */}
      {onlineUsers.length === 0 ? (
        <Panel>
          <EmptyState
            title="No clients online right now"
            body="Sessions appear here when clients are active in the Lounge."
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {onlineUsers.map((u) => (
            <Panel key={u.user_id} className="p-3">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <AvatarID
                    name={u.full_name}
                    email={u.email}
                    src={u.avatar_url || undefined}
                    size="lg"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-ok" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-foreground">{u.full_name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{u.email}</p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-md border border-border/60 bg-sunken px-2.5 py-1.5">
                  <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="truncate text-[11px] text-ink-2">{getPageLabel(u.current_page)}</span>
                </div>
                <div className="flex items-center gap-2 px-2.5">
                  <Clock className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    Online {formatDistanceToNow(new Date(u.online_at), { addSuffix: false })}
                  </span>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
