import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Tracks the current client's presence in the Lounge.
 */
export function useClientPresence(profile: { full_name: string | null; avatar_url: string | null } | null) {
  const { user } = useAuth();
  const location = useLocation();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscribedRef = useRef(false);
  const profileRef = useRef(profile);
  const locationRef = useRef(location.pathname);

  // Keep refs current
  profileRef.current = profile;
  locationRef.current = location.pathname;

  // Set up channel once
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('lounge-presence', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {})
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true;
          await channel.track({
            user_id: user.id,
            full_name: profileRef.current?.full_name || user.email || 'Unknown',
            avatar_url: profileRef.current?.avatar_url || null,
            email: user.email || '',
            current_page: locationRef.current,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      subscribedRef.current = false;
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user]);

  // Re-track on page or profile change
  useEffect(() => {
    if (!channelRef.current || !subscribedRef.current || !user) return;
    channelRef.current.track({
      user_id: user.id,
      full_name: profileRef.current?.full_name || user.email || 'Unknown',
      avatar_url: profileRef.current?.avatar_url || null,
      email: user.email || '',
      current_page: location.pathname,
      online_at: new Date().toISOString(),
    });
  }, [location.pathname, user, profile?.full_name, profile?.avatar_url]);
}
