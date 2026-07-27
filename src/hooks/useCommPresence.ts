import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCommPresence() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const updatePresence = useCallback(async (status: string = 'online') => {
    if (!user?.id) return;
    await supabase.from('comm_presence').upsert({
      user_id: user.id,
      status,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Set online
    updatePresence('online');

    // Heartbeat every 30s
    intervalRef.current = setInterval(() => updatePresence('online'), 30000);

    // Set offline on unload
    const handleBeforeUnload = () => {
      navigator.sendBeacon && updatePresence('offline');
    };

    // Set away on visibility hidden
    const handleVisibility = () => {
      if (document.hidden) updatePresence('away');
      else updatePresence('online');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      updatePresence('offline');
    };
  }, [user?.id, updatePresence]);

  return { updatePresence };
}
