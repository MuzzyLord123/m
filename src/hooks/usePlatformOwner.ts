import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Platform owners (Finley and Zak) sit above admins: the owners' desk in
 * the CRM, admin controls and team analytics are gated on this. Resolved
 * server-side by the am_i_platform_owner rpc against platform_owners.
 */
export function usePlatformOwner() {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setIsOwner(false); setLoading(false); return; }
    supabase.rpc('am_i_platform_owner' as any).then(({ data }) => {
      if (!cancelled) { setIsOwner(data === true); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  return { isOwner, loading };
}
