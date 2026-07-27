import { useState, useEffect, useRef } from "react";

/**
 * Returns `true` when the user is NOT actively scrolling.
 * Hides after scrolling starts, reappears after `delay` ms of idle.
 */
export function useScrollIdle(delay = 600): boolean {
  const [isIdle, setIsIdle] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsIdle(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsIdle(true), delay);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [delay]);

  return isIdle;
}
