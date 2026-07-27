import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TwoFactorStatus {
  enabled: boolean;
  verifiedAt: string | null;
  role: 'admin' | 'user';
}

interface SetupData {
  secret: string;
  qrCodeUrl: string;
  otpAuthUrl: string;
}

export function useTwoFactor() {
  const { user, session } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!session?.access_token || !user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'status' }),
        }
      );

      // Silently handle 401 - user is logged out or session expired
      if (response.status === 401) {
        setStatus(null);
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch 2FA status');
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
      setError('Failed to load security status');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const setupTwoFactor = async (): Promise<SetupData | null> => {
    if (!session?.access_token) return null;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'setup' }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to setup 2FA');
      }
      
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const verifySetup = async (code: string): Promise<{ success: boolean; backupCodes?: string[] }> => {
    if (!session?.access_token) return { success: false };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'verify-setup', code }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      
      await fetchStatus();
      return { success: true, backupCodes: data.backupCodes };
    } catch (err: any) {
      setError(err.message);
      return { success: false };
    }
  };

  const verifyCode = async (code: string, isBackupCode = false): Promise<{ success: boolean; error?: string }> => {
    if (!session?.access_token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            action: isBackupCode ? 'verify-backup' : 'verify', 
            code 
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Verification failed' };
      }
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const disableTwoFactor = async (code: string): Promise<boolean> => {
    if (!session?.access_token) return false;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'disable', code }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }
      
      await fetchStatus();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getAdminStats = async () => {
    if (!session?.access_token) return null;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'admin-stats' }),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch stats');
      
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  return {
    status,
    loading,
    error,
    clearError: () => setError(null),
    setupTwoFactor,
    verifySetup,
    verifyCode,
    disableTwoFactor,
    getAdminStats,
    refetch: fetchStatus,
  };
}
