/**
 * Signature interaction 4 — the drip.
 *
 * One paint drip hanging off the services heading rule. It runs once, as the
 * heading comes into view, and then it is finished. No loop.
 *
 * A CSS view timeline drives it (see `.drip` in globals.css), so this is a
 * server component with no JavaScript behind it. Where view timelines are
 * unsupported, or under reduced motion, the drip is simply present.
 */
export function DripAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 14 30"
      fill="none"
      className={`drip h-[38px] w-[17px] overflow-visible ${className}`}
    >
      {/* A run of wet paint: heavy where it leaves the rule, thinning as it
          falls, gathering into the bead that hangs at the tip. */}
      <path
        d="M3.4 0h7.2c-.15 2.6-1.05 4.3-1.6 6.4-.5 1.9-.5 3.8-.75 5.7-.2 1.6-.5 3.2-.5 4.8 0 .9 1.4 1.5 2.35 2.4a4.6 4.6 0 1 1-7.4 0c.95-.9 2.35-1.5 2.35-2.4 0-1.6-.3-3.2-.5-4.8-.25-1.9-.25-3.8-.75-5.7C3.25 4.3 2.35 2.6 2.2 0Z"
        fill="var(--color-accent-bright)"
      />
    </svg>
  );
}
