import Link from 'next/link';

import { SECTORS } from '@content/sectors';
import { Arrow } from '@/components/Arrow';

/**
 * The sector index, as content.
 *
 * The same eight rows that make up the navigation, set into the home page at
 * full size. That is deliberate: the index is the argument, so it should be
 * readable without anyone having to open a menu to find it.
 *
 * Numbers are display type. Rules between rows. Hi-vis on hover and focus, and
 * nowhere else.
 */
export function SectorIndexList({ ground = 'paper' }: { ground?: 'paper' | 'mist' | 'graphite' }) {
  return (
    <ol data-ground={ground} className="border-t border-[var(--rule)]">
      {SECTORS.map((sector, i) => (
        <li key={sector.number} className="border-b border-[var(--rule)]">
          <Link
            href={sector.href}
            data-reveal
            className="row-mark group grid grid-cols-[3.5rem_1fr] items-baseline gap-x-6 py-7 md:grid-cols-[6rem_1fr_auto] md:gap-x-10"
            style={{ '--stagger': `${i * 40}ms` } as React.CSSProperties}
          >
            <span className="t-figure block text-[clamp(1.75rem,3vw,2.75rem)] transition-colors group-hover:text-[var(--mark)] group-focus-visible:text-[var(--mark)]">
              {sector.number}
            </span>
            <span className="block">
              <span className="t-section block transition-colors group-hover:text-[var(--mark)] group-focus-visible:text-[var(--mark)]">
                {sector.label}
              </span>
              <span className="mt-2 block max-w-[54ch] text-[15px] leading-[1.5] text-[var(--muted)]">
                {sector.summary}
              </span>
            </span>
            <span className="t-label hidden items-center gap-2 self-center md:inline-flex">
              {sector.depth === 'full' ? 'Full page' : 'Page'}
              <Arrow />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
