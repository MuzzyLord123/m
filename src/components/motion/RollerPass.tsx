/**
 * Signature interaction 2 — roller-pass section transition.
 *
 * A solid band of accent sits over the section and is carried off to the right
 * as the section rises into view, laying the section down behind it like a coat
 * off a roller.
 *
 * Scroll-linked through a CSS view timeline rather than a scroll handler, so it
 * still tracks the reader's hand exactly but runs on the compositor and ships
 * no JavaScript. Reserved for major section boundaries — three or four on the
 * site, not every section. See `.roller-band` in globals.css, which also
 * removes the band entirely under reduced motion and on browsers without view
 * timelines.
 */
export function RollerPass({
  children,
  className = "",
  tone = "accent",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "accent" | "plaster";
}) {
  return (
    <div className={`relative isolate ${className}`}>
      {children}
      <div
        aria-hidden="true"
        className={`roller-band pointer-events-none absolute inset-y-0 -left-[2%] z-20 w-[104%] ${
          tone === "accent" ? "bg-accent" : "bg-plaster"
        }`}
      />
    </div>
  );
}
