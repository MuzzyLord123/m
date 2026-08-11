/**
 * Entrance animations, done in CSS rather than in JavaScript.
 *
 * The obvious way to write this is motion's `whileInView`, which renders
 * `opacity: 0` into the HTML and waits for JavaScript to raise it. That means a
 * visitor with scripts blocked — or anyone who hits a hydration error — gets a
 * page of invisible text. Not acceptable on a site whose job is to be read.
 *
 * So the hidden state lives inside `@media (scripting: enabled)`: browsers with
 * JavaScript switched off never apply it and simply show the content. Elements
 * are marked with `data-reveal` and a single IntersectionObserver in
 * <RevealObserver /> adds `is-in` as each one arrives. One observer for the whole
 * page, no per-element JavaScript, and nothing to hydrate.
 *
 * Reduced motion is handled in globals.css: everything is visible from the start.
 */

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Milliseconds. */
  delay?: number;
};

/** Images: 1.03 → 1 with a fade, 700ms, once, on first view. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <div
      data-reveal="image"
      className={className}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

/** Text: a fade only. Type never slides on this site. */
export function FadeIn({ children, className, delay = 0 }: RevealProps) {
  return (
    <div
      data-reveal="text"
      className={className}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
