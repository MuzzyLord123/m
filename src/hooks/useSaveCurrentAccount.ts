import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { upsertSavedAccount } from '@/lib/savedAccounts';

/**
 * Sync the currently-authenticated user (with their session tokens) into
 * the saved-accounts registry whenever the session changes. The stored
 * tokens let the AccountSwitcher swap accounts without a password prompt.
 */
export function useSaveCurrentAccount() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !user?.email) return;
    let cancelled = false;

    (async () => {
      const [{ data: profile }, { data: sessionData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.auth.getSession(),
      ]);

      if (cancelled) return;

      const session = sessionData?.session;

      upsertSavedAccount({
        id: user.id,
        email: user.email!,
        fullName: profile?.full_name ?? (user.user_metadata?.full_name as string) ?? null,
        avatarUrl: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? null,
        session: session
          ? {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at ?? null,
            }
          : null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email]);

  // Keep the saved session fresh whenever Supabase rotates the token.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user?.id || !session?.user?.email) return;
      if (event !== 'TOKEN_REFRESHED' && event !== 'SIGNED_IN') return;

      upsertSavedAccount({
        id: session.user.id,
        email: session.user.email,
        fullName:
          (session.user.user_metadata?.full_name as string) ?? null,
        avatarUrl:
          (session.user.user_metadata?.avatar_url as string) ?? null,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at ?? null,
        },
      });
    });

    return () => sub.subscription.unsubscribe();
  }, []);
}
