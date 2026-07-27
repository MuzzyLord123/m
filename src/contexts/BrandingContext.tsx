import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import quooroLogo from '@/assets/quooro-logo.png';

interface BrandingState {
  logoUrl: string;
  hidePlatformBadge: boolean;
  isCustomLogo: boolean;
  loading: boolean;
}

const defaultState: BrandingState = {
  logoUrl: quooroLogo,
  hidePlatformBadge: false,
  isCustomLogo: false,
  loading: true,
};

const BrandingContext = createContext<BrandingState>(defaultState);

export function useBranding() {
  return useContext(BrandingContext);
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<BrandingState>(defaultState);

  const loadBranding = useCallback(async () => {
    if (!user) {
      setState({ ...defaultState, loading: false });
      return;
    }

    try {
      // 1. Fetch user's own branding
      const { data: userBranding } = await supabase
        .from('user_branding')
        .select('logo_url, hide_platform_badge')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userBranding?.logo_url) {
        setState({
          logoUrl: userBranding.logo_url,
          hidePlatformBadge: userBranding.hide_platform_badge ?? false,
          isCustomLogo: true,
          loading: false,
        });
        return;
      }

      // 2. Fallback: check if user belongs to a team and get manager's team branding
      const { data: membership } = await supabase
        .from('team_memberships')
        .select('team_id, client_teams!team_memberships_team_id_fkey(primary_account_id)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (membership) {
        const team = membership.client_teams as any;
        const managerId = team?.primary_account_id;
        if (managerId) {
          const { data: teamBranding } = await supabase
            .from('team_branding')
            .select('default_logo_url')
            .eq('manager_id', managerId)
            .maybeSingle();

          if (teamBranding?.default_logo_url) {
            setState({
              logoUrl: teamBranding.default_logo_url,
              hidePlatformBadge: userBranding?.hide_platform_badge ?? false,
              isCustomLogo: true,
              loading: false,
            });
            return;
          }
        }
      }

      // 3. Also check if the user IS a team owner with team branding
      const { data: ownTeamBranding } = await supabase
        .from('team_branding')
        .select('default_logo_url')
        .eq('manager_id', user.id)
        .maybeSingle();

      if (ownTeamBranding?.default_logo_url) {
        setState({
          logoUrl: ownTeamBranding.default_logo_url,
          hidePlatformBadge: userBranding?.hide_platform_badge ?? false,
          isCustomLogo: true,
          loading: false,
        });
        return;
      }

      // 4. Default Quooro logo
      setState({
        logoUrl: quooroLogo,
        hidePlatformBadge: userBranding?.hide_platform_badge ?? false,
        isCustomLogo: false,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to load branding:', err);
      setState({ ...defaultState, loading: false });
    }
  }, [user]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  return (
    <BrandingContext.Provider value={state}>
      {children}
    </BrandingContext.Provider>
  );
}
