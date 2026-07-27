/**
 * Client-side Rate Limiting Hook
 * 
 * Provides client-side rate limiting to complement server-side protection.
 * Uses localStorage to persist rate limit state across page reloads.
 */

import { useState, useCallback, useEffect } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  key: string;
}

interface RateLimitState {
  attempts: number;
  windowStart: number;
}

export function useRateLimit({ maxAttempts, windowMs, key }: RateLimitConfig) {
  const storageKey = `rateLimit_${key}`;
  
  const [state, setState] = useState<RateLimitState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as RateLimitState;
        // Check if window has expired
        if (Date.now() - parsed.windowStart > windowMs) {
          return { attempts: 0, windowStart: Date.now() };
        }
        return parsed;
      }
    } catch {
      // Invalid stored data
    }
    return { attempts: 0, windowStart: Date.now() };
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const isLimited = state.attempts >= maxAttempts && Date.now() - state.windowStart < windowMs;
  
  const remainingTime = isLimited 
    ? Math.ceil((windowMs - (Date.now() - state.windowStart)) / 1000) 
    : 0;

  const recordAttempt = useCallback(() => {
    setState((prev) => {
      const now = Date.now();
      
      // Reset if window has expired
      if (now - prev.windowStart > windowMs) {
        return { attempts: 1, windowStart: now };
      }
      
      return { ...prev, attempts: prev.attempts + 1 };
    });
  }, [windowMs]);

  const reset = useCallback(() => {
    setState({ attempts: 0, windowStart: Date.now() });
  }, []);

  const checkLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Reset if window has expired
    if (now - state.windowStart > windowMs) {
      setState({ attempts: 0, windowStart: now });
      return false;
    }
    
    return state.attempts >= maxAttempts;
  }, [state, maxAttempts, windowMs]);

  return {
    isLimited,
    remainingTime,
    remainingAttempts: Math.max(0, maxAttempts - state.attempts),
    recordAttempt,
    checkLimit,
    reset,
  };
}

// Pre-configured rate limiters
export function useLoginRateLimit() {
  return useRateLimit({
    key: 'login',
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });
}

export function use2FARateLimit() {
  return useRateLimit({
    key: '2fa',
    maxAttempts: 3,
    windowMs: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePasswordResetRateLimit() {
  return useRateLimit({
    key: 'passwordReset',
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  });
}
