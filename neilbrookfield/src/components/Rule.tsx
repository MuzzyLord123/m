import { cn } from '@/lib/cn';

/**
 * A brass hairline that draws itself left to right when it comes into view,
 * 500ms, once. The only decoration the design owns.
 *
 * Server component — the drawing is CSS, triggered by the single observer in
 * <RevealObserver />. See src/components/Reveal.tsx for why it is done that way
 * rather than with `whileInView`.
 */
export function Rule({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <hr
      aria-hidden
      data-reveal="rule"
      className={cn('hairline', className)}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    />
  );
}
