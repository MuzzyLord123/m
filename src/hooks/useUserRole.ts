import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user' | 'financial' | 'team_member' | 'executive' | null;

interface UseUserRoleReturn {
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isUser: boolean;
  isExecutive: boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const { user, session } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user?.id || !session?.access_token) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } else {
        // Default to 'user' role if no role is assigned (new customers)
        setRole(data?.role || 'user');
      }
    } catch (err) {
      console.error('Error in useUserRole:', err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, session?.access_token]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isUser: role === 'user',
    isExecutive: role === 'executive',
    refetch: fetchRole,
  };
}
