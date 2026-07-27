import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { GuardSkeleton } from '@/components/auth/AuthSkeleton';
import { quickSignOut } from '@/hooks/useAuthSync';

interface TeamGuardProps {
  children: React.ReactNode;
}

export function TeamGuard({ children }: TeamGuardProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, isAdmin } = useUserRole();
  const { logSecurityEvent } = useSecurityLog();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const hasChecked = useRef(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      // Wait for auth and role to load
      if (authLoading || roleLoading) return;

      // If not logged in, redirect to unified sign-in
      if (!user) {
        navigate('/sign-in', { replace: true });
        return;
      }

      // Prevent duplicate checks
      if (hasChecked.current) return;
      hasChecked.current = true;

      // Check if user is admin (only admins can access team portal)
      if (isAdmin) {
        setAuthorized(true);
      } else {
        // Log the unauthorized access attempt
        await logSecurityEvent({
          event_type: 'unauthorized_team_portal_access',
          portal_attempted: 'team',
          actual_role: role || 'unknown',
          details: {
            attempted_path: window.location.pathname,
            timestamp: new Date().toISOString(),
          },
        });

        // Sign out and redirect to unauthorized page
        await quickSignOut('team');
        navigate('/unauthorized', { 
          replace: true,
          state: { 
            attemptedPortal: 'team',
            actualRole: role 
          }
        });
      }
    };

    checkAuthorization();
  }, [authLoading, roleLoading, user, isAdmin, role, navigate, logSecurityEvent]);

  // Reset check flag when user changes
  useEffect(() => {
    hasChecked.current = false;
  }, [user?.id]);

  // Show skeleton while checking auth
  if (authLoading || roleLoading || authorized === null) {
    return <GuardSkeleton message="Verifying access..." />;
  }

  // Only render children if authorized
  return authorized ? <>{children}</> : null;
}
