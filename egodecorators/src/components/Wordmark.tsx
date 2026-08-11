import { cn } from '@/lib/cn';

/**
 * The logo.
 *
 * "EGO" in Syne 800, sitting astride the seam — the centre line passes between
 * the G and the O, which is the point in the word closest to its optical
 * centre. The seam is the gap between the letters. There is no other mark, no
 * roundel and no strapline lockup; this is it.
 *
 * Below md, where there is no seam, it sets as one word.
 *
 * The two halves are aria-hidden and the real name is given once to a screen
 * reader, so nobody hears "E G, O".
 */
export function Wordmark({
  as: Tag = 'div',
  className,
  size = 'display',
}: {
  as?: 'h1' | 'div';
  className?: string;
  /** display — the home page. small — the header. */
  size?: 'display' | 'small';
}) {
  const type =
    size === 'display'
      ? 'text-[clamp(4rem,17vw,13rem)]'
      : 'text-[clamp(1.5rem,2.4vw,2rem)]';

  return (
    <Tag className={cn('font-display font-extrabold leading-[0.9] tracking-[-0.02em]', className)}>
      <span className="sr-only">Ego Decorators</span>
      <span aria-hidden="true" className={cn('wordmark-split', type)}>
        <span data-seam-side="right">EG</span>
        <span data-seam-side="left">O</span>
      </span>
    </Tag>
  );
}
