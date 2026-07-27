import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { usePushNotifications } from './usePushNotifications';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  icon: string | null;
  link: string | null;
  is_read: boolean;
  is_email_sent: boolean;
  metadata: Record<string, any>;
  created_at: string;
  read_at: string | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showNotification, requestPermission, permission } = usePushNotifications();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data as unknown as Notification[]);
      setUnreadCount((data as any[]).filter((n: any) => !n.is_read).length);
    }
    setLoading(false);
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    setUnreadCount(0);
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
  }, [notifications]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifications([]);
    setUnreadCount(0);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotif = payload.new as unknown as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);

          // In-app toast
          toast(newNotif.title, {
            description: newNotif.message,
            action: newNotif.link ? { label: 'View', onClick: () => window.location.href = newNotif.link! } : undefined,
          });

          // Browser push notification
          showNotification(newNotif.title, {
            body: newNotif.message,
            tag: newNotif.id,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const deleted = payload.old as any;
          setNotifications(prev => prev.filter(n => n.id !== deleted.id));
          if (!deleted.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications,
    pushPermission: permission,
    requestPushPermission: requestPermission,
  };
}
