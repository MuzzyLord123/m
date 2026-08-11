/**
 * The only icon on the site.
 *
 * 12px, and it is a rule with a head on it. There are no other icons: no
 * icon-and-heading trios, no tick lists, no phosphor set. Everything else that
 * needs to signal something does it with type, a rule or a ground change.
 *
 * It lives in its own file because the client components use it too, and
 * importing it from a module that reads the filesystem drags node:fs into the
 * browser bundle.
 */
export function Arrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden focusable="false">
      <path
        d="M1 6h9M6.5 2.5L10 6l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}
