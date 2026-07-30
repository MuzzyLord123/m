import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwner } from './usePlatformOwner';

/**
 * Per-admin controls set by the owners in Manage admins: which Team tabs
 * this admin sees and what they may do. Owners are immune. Enforced by
 * the team sidebar and the account creation surface.
 */
export interface AdminControls {
  hiddenTabs: Set<string>;
  canCreateAccounts: boolean;
}

const OPEN: AdminControls = { hiddenTabs: new Set(), canCreateAccounts: true };

export function useAdminControls(): AdminControls & { loading: boolean } {
  const { user } = useAuth();
  const { isOwner, loading: ownerLoading } = usePlatformOwner();
  const [controls, setControls] = useState<AdminControls>(OPEN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user || ownerLoading) return;
    if (isOwner) { setControls(OPEN); setLoading(false); return; }
    supabase
      .from('admin_controls' as any)
      .select('hidden_tabs, can_create_accounts')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const row = data as any;
        setControls(row ? {
          hiddenTabs: new Set((row.hidden_tabs as string[]) || []),
          canCreateAccounts: row.can_create_accounts !== false,
        } : OPEN);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id, isOwner, ownerLoading]);

  return { ...controls, loading };
}
