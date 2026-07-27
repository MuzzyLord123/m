import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface IPCheckResult {
  isKnownIP: boolean;
  currentIP: string;
  requiresVerification: boolean;
  hasTwoFactorSetup: boolean;
  role: 'admin' | 'user';
}

interface KnownIPsResult {
  knownIPs: string[];
  currentIP: string;
  isCurrentIPKnown: boolean;
}

export function useIPCheck() {
  const { session } = useAuth();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the user's public IP address
  const getPublicIP = async (): Promise<string> => {
    try {
      // Use a public IP detection service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (err) {
      console.error('Failed to get public IP:', err);
      return 'unknown';
    }
  };

  const checkIP = useCallback(async (): Promise<IPCheckResult | null> => {
    if (!session?.access_token) {
      return null;
    }

    setChecking(true);
    setError(null);

    try {
      // Get the user's public IP
      const ip = await getPublicIP();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'check-ip', ip }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check IP');
      }

      const result = await response.json();
      return result as IPCheckResult;
    } catch (err: any) {
      console.error('IP check error:', err);
      setError(err.message);
      return null;
    } finally {
      setChecking(false);
    }
  }, [session?.access_token]);

  const verifyIPWithCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!session?.access_token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const ip = await getPublicIP();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'verify-ip', code, ip }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Verification failed' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [session?.access_token]);

  const addKnownIP = useCallback(async (): Promise<boolean> => {
    if (!session?.access_token) {
      return false;
    }

    try {
      const ip = await getPublicIP();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'add-known-ip', ip }),
        }
      );

      return response.ok;
    } catch (err) {
      console.error('Failed to add known IP:', err);
      return false;
    }
  }, [session?.access_token]);

  const getKnownIPs = useCallback(async (): Promise<KnownIPsResult | null> => {
    if (!session?.access_token) {
      return null;
    }

    try {
      const ip = await getPublicIP();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'get-known-ips', ip }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get known IPs');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to get known IPs:', err);
      return null;
    }
  }, [session?.access_token]);

  const removeKnownIP = useCallback(async (ipToRemove: string): Promise<boolean> => {
    if (!session?.access_token) {
      return false;
    }

    try {
      const ip = await getPublicIP();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'remove-known-ip', ip, ipToRemove }),
        }
      );

      return response.ok;
    } catch (err) {
      console.error('Failed to remove known IP:', err);
      return false;
    }
  }, [session?.access_token]);

  return {
    checkIP,
    verifyIPWithCode,
    addKnownIP,
    getKnownIPs,
    removeKnownIP,
    checking,
    error,
    clearError: () => setError(null),
  };
}