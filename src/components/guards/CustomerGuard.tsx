import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { GuardSkeleton } from '@/components/auth/AuthSkeleton';
import { quickSignOut, setLastPortal } from '@/hooks/useAuthSync';

interface CustomerGuardProps {
  children: React.ReactNode;
}

// Cache authorization status to prevent re-verification on every navigation
const authCache = new Map<string, { authorized: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function CustomerGuard({ children }: CustomerGuardProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, isUser, isAdmin } = useUserRole();
  const { logSecurityEvent } = useSecurityLog();
  const [authorized, setAuthorized] = useState<boolean | null>(() => {
    // Check cache immediately on mount
    if (user?.id) {
      const cached = authCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.authorized;
      }
    }
    return null;
  });
  const hasChecked = useRef(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      // Wait for auth and role to load
      if (authLoading || roleLoading) return;

      // If not logged in, redirect to unified sign-in
      if (!user) {
        setLastPortal('customer');
        navigate('/sign-in', { replace: true });
        return;
      }

      // Admins are redirected to Team portal ONLY when landing on the
      // customer lounge home. Shared apps under /lounge/office/*, /lounge/creative/*,
      // and standalone editors are usable by admins too, so let them through.
      const path = window.location.pathname;
      const isSharedAppPath =
        path.startsWith('/lounge/office') ||
        path.startsWith('/lounge/creative') ||
        path.startsWith('/lounge/editor') ||
        path.startsWith('/lounge/cad-studio') ||
        path.startsWith('/lounge/ai-builder') ||
        path.startsWith('/lounge/site-settings') ||
        path.startsWith('/lounge/crm');

      if (isAdmin && !isSharedAppPath) {
        authCache.delete(user.id);
        setLastPortal('team');
        navigate('/dashboard', { replace: true });
        return;
      }

      if (isAdmin && isSharedAppPath) {
        // Cache authorization so navigation between office sub-routes is instant
        authCache.set(user.id, { authorized: true, timestamp: Date.now() });
        setAuthorized(true);
        return;
      }

      // Check cache first
      const cached = authCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setAuthorized(cached.authorized);
        return;
      }

      // Prevent duplicate checks
      if (hasChecked.current) return;
      hasChecked.current = true;


      // Customer portal is for 'user' role only
      if (isUser) {
        authCache.set(user.id, { authorized: true, timestamp: Date.now() });
        setAuthorized(true);
      } else if (role === null) {
        // Role not yet determined — treat as still loading, don't sign out
        hasChecked.current = false;
        return;
      } else {
        // Unknown role - log and redirect to unauthorized
        await logSecurityEvent({
          event_type: 'unauthorized_customer_portal_access',
          portal_attempted: 'customer',
          actual_role: role || 'unknown',
          details: {
            attempted_path: window.location.pathname,
            timestamp: new Date().toISOString(),
          },
        });

        await quickSignOut('customer');
        navigate('/unauthorized', { 
          replace: true,
          state: { 
            attemptedPortal: 'customer',
            actualRole: role 
          }
        });
      }
    };

    checkAuthorization();
  }, [authLoading, roleLoading, user, isUser, isAdmin, role, navigate, logSecurityEvent]);

  // Reset check flag when user changes
  useEffect(() => {
    hasChecked.current = false;
  }, [user?.id]);

  // If already authorized from cache, render immediately
  if (authorized === true) {
    return <>{children}</>;
  }

  // Show minimal skeleton only on initial auth check (not cached)
  if (authLoading || roleLoading || authorized === null) {
    return <GuardSkeleton />;
  }

  // Only render children if authorized
  return authorized ? <>{children}</> : null;
}
