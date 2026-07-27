import { useRef, useCallback } from 'react';

/**
 * Long-press detection for touch devices. Fires `onLongPress` after `ms`
 * of continuous touch on the same spot. Cancels on move (>tolerance px),
 * touch end, or touch cancel. Also cancels click by calling preventDefault.
 */
export function useLongPress(onLongPress: () => void, ms = 500, tolerance = 8) {
  const timer = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const triggered = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    startPos.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    triggered.current = false;
    const t = e.touches[0];
    startPos.current = { x: t.clientX, y: t.clientY };
    timer.current = window.setTimeout(() => {
      triggered.current = true;
      if (navigator.vibrate) navigator.vibrate(35);
      onLongPress();
    }, ms);
  }, [onLongPress, ms]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPos.current) return;
    const t = e.touches[0];
    const dx = t.clientX - startPos.current.x;
    const dy = t.clientY - startPos.current.y;
    if (Math.hypot(dx, dy) > tolerance) clear();
  }, [clear, tolerance]);

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  const onTouchCancel = useCallback(() => {
    clear();
  }, [clear]);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (triggered.current) {
      e.preventDefault();
      e.stopPropagation();
      triggered.current = false;
    }
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, onClickCapture };
}
