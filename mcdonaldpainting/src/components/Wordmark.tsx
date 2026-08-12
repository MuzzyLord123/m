/**
 * The mark, and the lockup it sits in.
 *
 * The glyph is a coating build in section: substrate, primer, intermediate,
 * finish — the finish coat in hi-vis. It is the drawing that appears on every
 * steelwork specification this company prices against, which is the point. A
 * paint roller or a swoosh would say "decorator"; a coating section says the
 * firm reads specifications, and it means something to exactly the person the
 * site is written for.
 *
 * It is drawn rather than set, so it holds up at 20px in the header and at
 * 64px on a favicon without a second file.
 */
export function Mark({ size = 26, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* Substrate — the thing being painted. Heaviest line on the drawing. */}
      <rect x="0" y="20" width="26" height="6" fill="currentColor" />
      {/* Primer, then intermediate: each coat thinner than the one below it. */}
      <rect x="0" y="15" width="26" height="3.5" fill="currentColor" opacity="0.55" />
      <rect x="0" y="10.5" width="26" height="3" fill="currentColor" opacity="0.35" />
      {/* Finish coat. The only hi-vis on the mark, and the only one you see. */}
      <rect x="0" y="6" width="26" height="3" fill="#E4FF32" />
    </svg>
  );
}

/**
 * The full lockup. `compact` drops the descriptor for the header bar on a
 * phone, where the descriptor would wrap and the name is what matters.
 */
export function Wordmark({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Mark size={compact ? 22 : 26} className="shrink-0 text-[var(--ink)]" />
      <span className="inline-flex items-baseline gap-2.5">
        <span className="font-display text-[17px] font-extrabold leading-none tracking-[-0.02em] text-[var(--ink)] md:text-[19px]">
          McDonald
        </span>
        <span className={`t-label ${compact ? 'hidden sm:inline' : ''}`}>
          Painting Contractors
        </span>
      </span>
    </span>
  );
}
