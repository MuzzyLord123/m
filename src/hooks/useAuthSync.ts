import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AUTH_CHANNEL = 'auth_sync';
const LAST_PORTAL_KEY = 'lastLoggedInPortal';

type AuthSyncMessage = {
  type: 'SIGNED_OUT' | 'SIGNED_IN' | 'SESSION_EXPIRED';
  portal?: 'customer' | 'team';
  timestamp: number;
};

export function useAuthSync() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(AUTH_CHANNEL);

    channel.onmessage = (event: MessageEvent<AuthSyncMessage>) => {
      const { type, timestamp } = event.data;
      
      // Ignore old messages (older than 5 seconds)
      if (Date.now() - timestamp > 5000) return;

      switch (type) {
        case 'SIGNED_OUT':
          // Redirect to sign-in if signed out in another tab
          toast.info('Signed out from another tab');
          navigate('/sign-in', { replace: true });
          break;
        case 'SESSION_EXPIRED':
          toast.warning('Session expired');
          navigate('/sign-in', { replace: true });
          break;
      }
    };

    return () => channel.close();
  }, [navigate]);

  const broadcastSignOut = useCallback((portal?: 'customer' | 'team') => {
    if (typeof BroadcastChannel === 'undefined') return;
    
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage({
      type: 'SIGNED_OUT',
      portal,
      timestamp: Date.now(),
    } as AuthSyncMessage);
    channel.close();
  }, []);

  const broadcastSignIn = useCallback(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage({
      type: 'SIGNED_IN',
      timestamp: Date.now(),
    } as AuthSyncMessage);
    channel.close();
  }, []);

  return { broadcastSignOut, broadcastSignIn };
}

// Quick sign out function with toast feedback
export async function quickSignOut(portal?: 'customer' | 'team'): Promise<void> {
  // Store portal preference
  if (portal) {
    localStorage.setItem(LAST_PORTAL_KEY, portal);
  }
  
  // Show toast immediately (non-blocking)
  toast.success('Signed out successfully', { duration: 2000 });
  
  // Broadcast to other tabs
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage({
      type: 'SIGNED_OUT',
      portal,
      timestamp: Date.now(),
    });
    channel.close();
  }
  
  // Sign out from Supabase (fast, parallel with navigation)
  await supabase.auth.signOut();
}

// Get last used portal
export function getLastPortal(): 'customer' | 'team' | null {
  return localStorage.getItem(LAST_PORTAL_KEY) as 'customer' | 'team' | null;
}

// Set last used portal
export function setLastPortal(portal: 'customer' | 'team'): void {
  localStorage.setItem(LAST_PORTAL_KEY, portal);
}
