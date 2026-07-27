import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Activity, FileText, Code, MessageSquare, Users, Radio } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FeedItem {
  id: string;
  type: 'content' | 'app' | 'conversation' | 'lead';
  title: string;
  status?: string;
  timestamp: string;
  isNew?: boolean;
}

function typeIcon(type: string) {
  const cls = 'w-3.5 h-3.5';
  switch (type) {
    case 'app': return <Code className={cls} />;
    case 'content': return <FileText className={cls} />;
    case 'conversation': return <MessageSquare className={cls} />;
    case 'lead': return <Users className={cls} />;
    default: return <Activity className={cls} />;
  }
}

function typeColor(type: string) {
  switch (type) {
    case 'app': return '#60a5fa';
    case 'content': return '#fbbf24';
    case 'conversation': return '#34d399';
    case 'lead': return '#a78bfa';
    default: return 'hsl(var(--muted-foreground))';
  }
}

export default function LiveActivityFeed() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initial fetch
  useEffect(() => {
    if (!user) return;

    async function loadInitial() {
      const [contentRes, appsRes, leadsRes] = await Promise.all([
        supabase.from('content_requests').select('id, title, status, updated_at').order('updated_at', { ascending: false }).limit(5),
        supabase.from('app_projects').select('id, project_name, status, updated_at').order('updated_at', { ascending: false }).limit(5),
        supabase.from('leads').select('id, business_name, contact_name, status, updated_at').order('updated_at', { ascending: false }).limit(5),
      ]);

      const feed: FeedItem[] = [];
      (contentRes.data || []).forEach(c => feed.push({ id: `c-${c.id}`, type: 'content', title: c.title, status: c.status, timestamp: c.updated_at }));
      (appsRes.data || []).forEach(a => feed.push({ id: `a-${a.id}`, type: 'app', title: a.project_name, status: a.status, timestamp: a.updated_at }));
      (leadsRes.data || []).forEach(l => feed.push({ id: `l-${l.id}`, type: 'lead', title: l.business_name || l.contact_name || 'Lead', status: l.status, timestamp: l.updated_at }));
      feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setItems(feed.slice(0, 15));
    }

    loadInitial();
  }, [user]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('live-dashboard-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_requests' }, (payload) => {
        const d = payload.new as any;
        if (!d) return;
        setItems(prev => {
          const item: FeedItem = { id: `c-${d.id}`, type: 'content', title: d.title || 'Content Request', status: d.status, timestamp: d.updated_at || new Date().toISOString(), isNew: true };
          return [item, ...prev.filter(p => p.id !== item.id)].slice(0, 20);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_projects' }, (payload) => {
        const d = payload.new as any;
        if (!d) return;
        setItems(prev => {
          const item: FeedItem = { id: `a-${d.id}`, type: 'app', title: d.project_name || 'App Project', status: d.status, timestamp: d.updated_at || new Date().toISOString(), isNew: true };
          return [item, ...prev.filter(p => p.id !== item.id)].slice(0, 20);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        const d = payload.new as any;
        if (!d) return;
        setItems(prev => {
          const item: FeedItem = { id: `l-${d.id}`, type: 'lead', title: d.name || 'New Lead', status: d.status, timestamp: d.updated_at || new Date().toISOString(), isNew: true };
          return [item, ...prev.filter(p => p.id !== item.id)].slice(0, 20);
        });
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="rounded-lg bg-card border border-border">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Radio className="w-3.5 h-3.5 text-[#34d399]" />
        <span className="text-[11px] font-semibold text-foreground/80">Live Activity</span>
        {isLive && (
          <span className="ml-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
            <span className="text-[9px] font-medium text-[#34d399]">Live</span>
          </span>
        )}
      </div>
      <ScrollArea className="h-[320px]">
        <div className="p-2">
          <AnimatePresence initial={false}>
            {items.length > 0 ? items.map(item => (
              <motion.div
                key={item.id}
                initial={item.isNew ? { opacity: 0, x: -20 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <div className="p-1 rounded" style={{ backgroundColor: `${typeColor(item.type)}15` }}>
                  <div style={{ color: typeColor(item.type) }}>{typeIcon(item.type)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground/80 truncate">{item.title}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </p>
                </div>
                {item.status && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize shrink-0">
                    {item.status}
                  </span>
                )}
                {item.isNew && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0073E6] shrink-0 animate-pulse" />
                )}
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="w-5 h-5 text-muted-foreground/40 mb-2" />
                <p className="text-[11px] text-muted-foreground">No activity yet</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
