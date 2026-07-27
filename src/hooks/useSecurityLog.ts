import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface SecurityLogEntry {
  event_type: string;
  portal_attempted?: string;
  actual_role?: string;
  ip_address?: string;
  details?: Json;
}

export function useSecurityLog() {
  const { user } = useAuth();

  const logSecurityEvent = useCallback(async (entry: SecurityLogEntry) => {
    try {
      // Get IP address
      let ipAddress = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch {
        // Ignore IP fetch errors
      }

      // Get the current session for auth header
      const { data: { session } } = await supabase.auth.getSession();

      // Use edge function for secure logging (bypasses RLS, encrypts data)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/security-log`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && {
              'Authorization': `Bearer ${session.access_token}`,
            }),
          },
          body: JSON.stringify({
            event_type: entry.event_type,
            portal_attempted: entry.portal_attempted || null,
            actual_role: entry.actual_role || null,
            ip_address: entry.ip_address || ipAddress,
            details: entry.details || {},
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to log security event:', await response.text());
      }
    } catch (err) {
      console.error('Error logging security event:', err);
    }
  }, []);

  return { logSecurityEvent };
}
