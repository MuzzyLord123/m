import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounce a value - returns the debounced value after delay ms of inactivity.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback - returns a stable function that only fires after delay ms of inactivity.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 300
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
    }) as T,
    [delay]
  );
}

/**
 * Throttled callback - fires at most once per interval ms.
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  interval = 100
): T {
  const lastRunRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      const remaining = interval - (now - lastRunRef.current);

      if (remaining <= 0) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, remaining);
      }
    }) as T,
    [interval]
  );
}
