import { useEffect, useRef, useState } from 'react';

/**
 * Opening Office.
 *
 * The previous splash spent four seconds on orbiting 3D tiles, a
 * particle burst and a white flash, over a progress bar that narrated
 * "Loading modules…" while nothing loaded. It also painted itself in
 * Microsoft's and Canva's registered brand colours, which is not a
 * look a company can ship.
 *
 * Serious software opens fast and says its own name once. This is a
 * held breath - the mark, the wordmark, a hairline that fills while
 * the app mounts - and it is gone in under a second. It pulls in no
 * 3D engine, so the suite starts sooner as well as quieter.
 */

const DURATION = 820;

export function OfficeSplash({ onComplete }: { onComplete: () => void }) {
  const [t, setT] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    // Respect a stated preference for less motion by getting out of the way.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { onComplete(); return; }

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setT(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!done.current) {
        done.current = true;
        onComplete();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  // A single ease so the mark, the words and the rule move as one object.
  const ease = 1 - Math.pow(1 - t, 3);
  const settle = Math.min(1, t / 0.45);
  const leaving = t > 0.88 ? (t - 0.88) / 0.12 : 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
      style={{ opacity: 1 - leaving * 0.9 }}
      role="status"
      aria-label="Opening Quooro Office"
    >
      <div
        className="flex items-center gap-3"
        style={{
          opacity: settle,
          transform: `translateY(${(1 - ease) * 6}px)`,
        }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18)]">
          <span className="font-display text-[18px] font-bold leading-none tracking-[-0.03em]">Q</span>
        </span>
        <span className="font-display text-[22px] font-semibold tracking-[-0.025em] text-foreground">
          Quooro <span className="font-normal text-muted-foreground">Office</span>
        </span>
      </div>

      {/* The rule fills as the suite mounts. No invented percentages. */}
      <div className="mt-7 h-px w-[136px] overflow-hidden bg-foreground/10">
        <div
          className="h-full bg-primary"
          style={{ width: `${ease * 100}%` }}
        />
      </div>
    </div>
  );
}

export default OfficeSplash;
