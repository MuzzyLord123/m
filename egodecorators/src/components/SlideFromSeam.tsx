import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Display type slides outward from the seam: 40px of travel, 450ms, staggered
 * by column so the two halves of a row do not arrive in lockstep.
 *
 * It starts at the centre line and moves away from it — the same gesture as the
 * link underlines and the same idea as the comparison. Everything on this site
 * originates at the seam.
 *
 * Like <Arrive>, the hidden starting state exists only inside `html[data-js]`,
 * so without JavaScript the heading is simply in place. Text that is invisible
 * until a script runs is text that some people never see.
 */
export function SlideFromSeam({
  side,
  children,
  delay = 0,
  className,
}: {
  /** Which side of the page this sits on. It travels away from the centre. */
  side: 'left' | 'right';
  children: ReactNode;
  /** Seconds. Used to stagger the two columns of a row. */
  delay?: number;
  className?: string;
}) {
  // A left-hand column starts pushed towards the seam (to its right) and
  // travels back out to the left.
  const from = side === 'left' ? '40px' : '-40px';

  return (
    <div
      data-slide
      className={cn('slide-seam', className)}
      style={
        {
          '--slide-from': from,
          '--slide-delay': `${Math.round(delay * 1000)}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
