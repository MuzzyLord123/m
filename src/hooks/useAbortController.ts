import { useEffect, useRef } from 'react';

/**
 * Returns a stable AbortController signal that aborts on component unmount.
 * Call getSignal() before each request to get a fresh signal.
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const getSignal = () => {
    // Abort any previous in-flight request
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  };

  return { getSignal };
}
