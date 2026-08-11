import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A row either side of the seam.
 *
 * The left column is right-aligned into the centre line and the right column is
 * left-aligned out of it, so every row on the site hangs off the same vertical
 * axis. Below md the columns stack and the seam becomes a rule between them.
 *
 * Each column carries data-seam-side, which is how links know which way their
 * underline should grow: always outward, away from the centre.
 */
export function Split({
  left,
  right,
  className,
  align = 'start',
  stackRule = true,
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end' | 'baseline';
  /**
   * Stacked below md, the seam becomes a rule between the two halves. Turn it
   * off for rows where one side is only a label — a 2px rule under a five-word
   * eyebrow reads as a section break that is not there.
   */
  stackRule?: boolean;
}) {
  const alignment = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
  }[align];

  return (
    <div className={cn('split', alignment, !stackRule && 'split-no-rule', className)}>
      <div data-seam-side="right">{left}</div>
      <div data-seam-side="left">{right}</div>
    </div>
  );
}

/**
 * A single column that knows which side of the seam it is on. For the rows that
 * are not a simple two-up — a list of services running down one side, say.
 */
export function SeamColumn({
  side,
  children,
  className,
}: {
  side: 'left' | 'right';
  children: ReactNode;
  className?: string;
}) {
  // A column on the LEFT of the page has the seam on its RIGHT.
  return (
    <div data-seam-side={side === 'left' ? 'right' : 'left'} className={className}>
      {children}
    </div>
  );
}

/** Dates, locations, source lines. The only place the metadata grey is used. */
export function Meta({
  children,
  className,
  as: Tag = 'p',
}: {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'dt';
}) {
  return <Tag className={cn('meta', className)}>{children}</Tag>;
}
