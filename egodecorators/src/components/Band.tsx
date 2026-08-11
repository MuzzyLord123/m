import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A horizontal band of the page.
 *
 * A band declares its tone once — paper or ink — and everything inside it
 * resolves: type colour, metadata grey, hairline rules. No component has to
 * know which kind of band it is sitting in.
 *
 * The seam runs over the top of all of them, unbroken, from the first band to
 * the last.
 */
export function Band({
  tone = 'paper',
  children,
  className,
  id,
  as: Tag = 'section',
  labelledBy,
}: {
  tone?: 'paper' | 'ink';
  children: ReactNode;
  className?: string;
  id?: string;
  as?: 'section' | 'div' | 'header' | 'footer';
  labelledBy?: string;
}) {
  return (
    <Tag
      id={id}
      data-tone={tone}
      aria-labelledby={labelledBy}
      className={cn('py-band', className)}
    >
      {children}
    </Tag>
  );
}

/**
 * The measure. Centred on the viewport, which is where the seam is, so the
 * grid and the centre line always agree.
 */
export function Container({
  children,
  className,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  /** Full-bleed: comparisons only. */
  wide?: boolean;
}) {
  return (
    <div className={cn('mx-auto w-full', wide ? 'max-w-none' : 'max-w-[104rem] px-gutter', className)}>
      {children}
    </div>
  );
}
