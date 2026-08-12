import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The signature: colour arrives as finished work comes into view.
 *
 * grayscale(1) → grayscale(0) over 900ms with a small scale settle, once per
 * image and never again. Nothing else in the band animates while it happens —
 * that restraint is what makes it read as deliberate rather than as decoration.
 *
 * There is no JavaScript in this component. It marks the element; the inline
 * observer in src/lib/reveal-script.ts flips the attribute when it scrolls in,
 * and the transition itself is CSS on the compositor. Crucially, the greyscale
 * state only applies inside `html[data-js]`, so a visitor whose JavaScript
 * fails gets the photograph in colour rather than a permanently grey one.
 */
export function Arrive({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-arrive className={cn('arrive', className)}>
      {children}
    </div>
  );
}
