import { useRef, useCallback, useEffect, useState } from 'react';

/** Haptic feedback helper (no-op on unsupported devices) */
export function haptic(ms = 50) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

/** Detect if device supports touch */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  return isTouch;
}

/** Swipe detection hook */
export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold = 50
) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy && absDx > threshold) {
        if (dx > 0) onSwipeRight?.();
        else onSwipeLeft?.();
      } else if (absDy > absDx && absDy > threshold) {
        if (dy > 0) onSwipeDown?.();
        else onSwipeUp?.();
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]
  );

  return { onTouchStart, onTouchEnd };
}

/** Pull-to-refresh hook */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current === 0) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && dy < 150) {
      setPullDistance(dy);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 80 && !refreshing) {
      setRefreshing(true);
      haptic(30);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = 0;
  }, [pullDistance, refreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, refreshing, pullDistance };
}
