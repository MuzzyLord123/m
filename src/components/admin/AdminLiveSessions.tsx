import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, Clock, Circle, Monitor, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

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

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
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
      <div className="rounded-lg p-4 flex items-center justify-between" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#252525' }}>
            <Monitor className="h-4 w-4 text-[#0073E6]" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-[#ccc] uppercase tracking-wider">Live Client Sessions</h2>
            <p className="text-[11px] text-[#666]">Real-time view of active Lounge users</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Circle
              className={`h-2 w-2 ${connected ? 'text-emerald-500 fill-emerald-500' : 'text-red-500 fill-red-500'}`}
            />
            <span className="text-[10px] text-[#888]">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1" style={{ backgroundColor: '#252525', border: '1px solid #333' }}>
            <Users className="h-3 w-3 text-[#0073E6]" />
            <span className="text-[12px] font-semibold text-white">{onlineUsers.length}</span>
            <span className="text-[10px] text-[#888]">online</span>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {onlineUsers.length === 0 ? (
        <div
          className="rounded-lg flex flex-col items-center justify-center py-16"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
        >
          <Users className="h-10 w-10 text-[#333] mb-3" />
          <p className="text-[12px] text-[#888] mb-1">No clients currently online</p>
          <p className="text-[10px] text-[#555]">Sessions will appear here when clients are active in the Lounge</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {onlineUsers.map((u) => (
              <motion.div
                key={u.user_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className="rounded-lg p-4"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9 border border-[#333]">
                      <AvatarImage src={u.avatar_url || ''} alt={u.full_name} />
                      <AvatarFallback className="bg-[#252525] text-[#aaa] text-[11px] font-semibold">
                        {getInitials(u.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#1a1a1a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">{u.full_name}</p>
                    <p className="text-[10px] text-[#666] truncate">{u.email}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5" style={{ backgroundColor: '#151515', border: '1px solid #222' }}>
                    <Globe className="h-3 w-3 text-[#0073E6] shrink-0" />
                    <span className="text-[11px] text-[#aaa] truncate">{getPageLabel(u.current_page)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5">
                    <Clock className="h-3 w-3 text-[#555] shrink-0" />
                    <span className="text-[10px] text-[#555]">
                      Online {formatDistanceToNow(new Date(u.online_at), { addSuffix: false })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
