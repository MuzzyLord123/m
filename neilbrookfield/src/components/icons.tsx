/**
 * The only icons on the site, drawn here rather than pulled from an icon set.
 *
 * Every stroke is 1px, the same weight as the brass hairlines, so an icon sits
 * in the page as another rule rather than as a piece of borrowed furniture.
 * There is no icon grid anywhere and there never should be — if a third one is
 * ever needed, question the layout first.
 */

type GlyphProps = {
  className?: string;
};

/** Handset. Used beside the number in the footer and the mobile menu. */
export function PhoneGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d="M8.1 3.5H5.6a2.1 2.1 0 0 0-2.1 2.3 15.2 15.2 0 0 0 14.7 14.7 2.1 2.1 0 0 0 2.3-2.1v-2.5a1 1 0 0 0-.8-1l-3.2-.7a1 1 0 0 0-1 .34l-1.16 1.36a12.4 12.4 0 0 1-5.74-5.74l1.36-1.16a1 1 0 0 0 .34-1L9.1 4.3a1 1 0 0 0-1-.8Z" />
    </svg>
  );
}

/**
 * Chevron for the one <select> on the site. Native dropdown indicators are
 * drawn by the operating system and look like somebody else's software, so the
 * control is stripped back and this is drawn in its place.
 */
export function ChevronGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d="m3.5 6 4.5 4.5L12.5 6" />
    </svg>
  );
}
