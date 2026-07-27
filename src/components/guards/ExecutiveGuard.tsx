import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { GuardSkeleton } from '@/components/auth/AuthSkeleton';
import { quickSignOut } from '@/hooks/useAuthSync';

interface ExecutiveGuardProps {
  children: React.ReactNode;
}

export function ExecutiveGuard({ children }: ExecutiveGuardProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, isAdmin, isExecutive } = useUserRole();
  const { logSecurityEvent } = useSecurityLog();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const hasChecked = useRef(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (authLoading || roleLoading) return;

      if (!user) {
        navigate('/sign-in', { replace: true });
        return;
      }

      if (hasChecked.current) return;
      hasChecked.current = true;

      // Allow admins and executives
      if (isAdmin || isExecutive) {
        setAuthorized(true);
      } else {
        await logSecurityEvent({
          event_type: 'unauthorized_executive_access',
          portal_attempted: 'executive',
          actual_role: role || 'unknown',
          details: {
            attempted_path: window.location.pathname,
            timestamp: new Date().toISOString(),
          },
        });

        await quickSignOut('team');
        navigate('/unauthorized', {
          replace: true,
          state: {
            attemptedPortal: 'executive',
            actualRole: role,
          },
        });
      }
    };

    checkAuthorization();
  }, [authLoading, roleLoading, user, isAdmin, isExecutive, role, navigate, logSecurityEvent]);

  useEffect(() => {
    hasChecked.current = false;
  }, [user?.id]);

  if (authLoading || roleLoading || authorized === null) {
    return <GuardSkeleton message="Verifying executive access..." />;
  }

  return authorized ? <>{children}</> : null;
}
