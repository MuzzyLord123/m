import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AccountType = 'paid_client' | 'live_preview' | 'viewer_only' | 'business_management' | 'admin';

export interface AccountPreset {
  account_type: AccountType;
  visible_features: string[];
  hidden_features: string[];
  suppress_prompts: boolean;
}

interface State {
  accountType: AccountType;
  preset: AccountPreset | null;
  loading: boolean;
  canSee: (featureKey: string) => boolean;
  suppressPrompts: boolean;
  refetch: () => Promise<void>;
}

export function useAccountType(): State {
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>('paid_client');
  const [preset, setPreset] = useState<AccountPreset | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const { data: prof } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('user_id', user.id)
      .maybeSingle();
    const t = ((prof as any)?.account_type as AccountType) || 'paid_client';
    setAccountType(t);
    const { data: p } = await supabase
      .from('account_type_presets' as any)
      .select('*')
      .eq('account_type', t)
      .maybeSingle();
    setPreset((p as any) || null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const canSee = useCallback((key: string) => {
    if (!preset) return true;
    const hidden = preset.hidden_features || [];
    const visible = preset.visible_features || [];
    if (hidden.includes(key)) return false;
    // If visible_features is non-empty, it acts as an allow-list.
    if (visible.length > 0) return visible.includes(key);
    return true;
  }, [preset]);

  return {
    accountType,
    preset,
    loading,
    canSee,
    suppressPrompts: !!preset?.suppress_prompts,
    refetch: load,
  };
}
