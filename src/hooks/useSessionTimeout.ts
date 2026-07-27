/**
 * Session Timeout Hook
 * 
 * Implements 30-minute inactivity timeout.
 * Shows warning before auto-logout.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const TIMEOUT_MINUTES = 30;
const WARNING_MINUTES = 2; // Show warning 2 minutes before timeout
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;
const WARNING_MS = (TIMEOUT_MINUTES - WARNING_MINUTES) * 60 * 1000;

const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const;

// Storage key for last activity timestamp
const LAST_ACTIVITY_KEY = 'lastActivityTimestamp';

export function useSessionTimeout(enabled: boolean = true) {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showingWarning, setShowingWarning] = useState(false);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    if (!user) return;
    
    const now = Date.now();
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    
    // Reset warning if user becomes active
    if (showingWarning) {
      setShowingWarning(false);
    }
  }, [user, showingWarning]);

  // Show timeout warning
  const showTimeoutWarning = useCallback(() => {
    if (!user) return;
    
    setShowingWarning(true);
    toast.warning(
      `You will be logged out in ${WARNING_MINUTES} minutes due to inactivity.`,
      {
        duration: WARNING_MINUTES * 60 * 1000,
        action: {
          label: 'Stay logged in',
          onClick: () => {
            updateActivity();
            resetTimers();
          },
        },
      }
    );
  }, [user, updateActivity]);

  // Handle session timeout
  const handleTimeout = useCallback(async () => {
    if (!user) return;
    
    toast.info('You have been logged out due to inactivity.');
    await signOut();
  }, [user, signOut]);

  // Reset timers
  const resetTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    if (user && enabled) {
      // Set warning timer
      warningRef.current = setTimeout(showTimeoutWarning, WARNING_MS);
      // Set timeout timer
      timeoutRef.current = setTimeout(handleTimeout, TIMEOUT_MS);
    }
  }, [user, enabled, showTimeoutWarning, handleTimeout]);

  // Check for timeout on mount (in case tab was inactive)
  const checkStoredTimeout = useCallback(() => {
    if (!user || !enabled) return false;

    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivity) {
      // No stored timestamp = fresh session, initialize it
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      return false;
    }

    const lastActivityTime = parseInt(lastActivity, 10);
    const elapsed = Date.now() - lastActivityTime;
    
    // Only timeout if the stored timestamp is recent (within last hour)
    // AND the user has been idle for longer than the timeout period.
    // This prevents instant logout from stale timestamps from previous sessions.
    const ONE_HOUR = 60 * 60 * 1000;
    if (elapsed >= TIMEOUT_MS && elapsed < ONE_HOUR) {
      handleTimeout();
      return true;
    }
    
    // If timestamp is too old or within timeout window, treat as active - reset it
    if (elapsed >= ONE_HOUR) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }

    return false;
  }, [user, enabled, handleTimeout]);

  // Set up activity listeners
  useEffect(() => {
    if (!user || !enabled) {
      // Clear timers if disabled or logged out
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      return;
    }

    // Check if already timed out
    if (checkStoredTimeout()) return;

    // Initialize timers
    updateActivity();
    resetTimers();

    // Throttled activity handler
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const throttledActivity = () => {
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, 1000); // Throttle to 1 second

      updateActivity();
      resetTimers();
    };

    // Add event listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, throttledActivity, { passive: true });
    });

    // Handle visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if timed out while tab was hidden
        if (!checkStoredTimeout()) {
          updateActivity();
          resetTimers();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, throttledActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [user, enabled, updateActivity, resetTimers, checkStoredTimeout]);

  return {
    showingWarning,
    extendSession: () => {
      updateActivity();
      resetTimers();
    },
  };
}
