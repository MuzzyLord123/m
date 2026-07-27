import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Convenience data keys for localStorage
const LAST_EMAIL_KEY = 'lastLoggedInEmail';
const LAST_NAME_KEY = 'lastLoggedInName';
const LAST_PORTAL_KEY = 'lastLoggedInPortal';
const REMEMBER_ME_KEY = 'rememberMe';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: (portal?: 'customer' | 'team') => Promise<void>;
  getLastLoginInfo: () => { email: string | null; name: string | null; portal: string | null; rememberMe: boolean };
  clearLastLoginInfo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes (does NOT control loading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Reset inactivity timer on fresh sign-in so stale timestamps don't cause instant logout
        if (event === 'SIGNED_IN') {
          localStorage.setItem('lastActivityTimestamp', Date.now().toString());
        }

        // Send welcome email for new OAuth signups (fire-and-forget)
        if (event === 'SIGNED_IN' && currentSession?.user) {
          const provider = currentSession.user.app_metadata?.provider;
          const isNewUser = new Date(currentSession.user.created_at || 0).getTime() > Date.now() - 5000;
          if (provider && provider !== 'email' && isNewUser) {
            setTimeout(() => {
              supabase.functions.invoke('send-welcome-email', {
                body: { user_id: currentSession.user.id }
              }).catch(err => console.error('Failed to send welcome email:', err));
            }, 0);
          }
        }
      }
    );

    // INITIAL load (controls loading state)
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error) {
      localStorage.setItem(LAST_EMAIL_KEY, email);
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
    }
    
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: { full_name: fullName }
      }
    });
    
    return { error };
  }, []);

  const signOut = useCallback(async (portal?: 'customer' | 'team') => {
    if (user?.email) {
      localStorage.setItem(LAST_EMAIL_KEY, user.email);
      if (portal) {
        localStorage.setItem(LAST_PORTAL_KEY, portal);
      }
    }
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();
      
      if (profile?.full_name) {
        localStorage.setItem(LAST_NAME_KEY, profile.full_name);
      }
    } catch {
      // Ignore errors - name is optional convenience data
    }
    
    await supabase.auth.signOut();
  }, [user]);

  const getLastLoginInfo = useCallback(() => {
    return {
      email: localStorage.getItem(LAST_EMAIL_KEY),
      name: localStorage.getItem(LAST_NAME_KEY),
      portal: localStorage.getItem(LAST_PORTAL_KEY),
      rememberMe: localStorage.getItem(REMEMBER_ME_KEY) === 'true'
    };
  }, []);

  const clearLastLoginInfo = useCallback(() => {
    localStorage.removeItem(LAST_EMAIL_KEY);
    localStorage.removeItem(LAST_NAME_KEY);
    localStorage.removeItem(LAST_PORTAL_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    getLastLoginInfo,
    clearLastLoginInfo
  }), [user, session, loading, signIn, signUp, signOut, getLastLoginInfo, clearLastLoginInfo]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
