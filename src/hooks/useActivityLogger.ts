import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DEBOUNCE_MS = 5000;

export function useActivityLogger() {
  const { user } = useAuth();
  const queue = useRef<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (!user || queue.current.length === 0) return;
    // Check for a valid session before calling the edge function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      queue.current = [];
      return;
    }
    const batch = [...queue.current];
    queue.current = [];
    try {
      await supabase.functions.invoke('log-user-activity', {
        body: { features: batch },
      });
    } catch {
      // silent – non-critical telemetry
    }
  }, [user]);

  const log = useCallback(
    (feature: string) => {
      if (!user) return;
      queue.current.push(feature);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [user, flush]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      flush();
    };
  }, [flush]);

  return { log };
}
