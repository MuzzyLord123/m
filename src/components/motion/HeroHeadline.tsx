/**
 * Signature interaction 1 — hero brush reveal.
 *
 * Each headline line carries an SVG mask shaped like a loaded brush: a solid
 * field with a bristled leading edge. The mask is 220% of the line's width with
 * its opaque half to the right, so sliding it from 0% to 100% drags that
 * bristled edge across the line — the words are painted on, not faded in.
 * Lines stagger 80ms apart.
 *
 * The slide is a CSS keyframe over a registered `--wipe` custom property (see
 * `.hero-line` and `@property --wipe` in globals.css). That keeps the site's
 * opening moment out of the JavaScript that would otherwise sit on the critical
 * path in front of the hero image — this is a server component. Under
 * prefers-reduced-motion the mask starts fully drawn and nothing moves.
 *
 * MASK GEOMETRY, which has to be exact: the box shows image units 0–100 at
 * --wipe: 0% and units 120–220 at 100%. Everything left of unit 100 must be
 * fully transparent (nothing showing at the start) and everything right of unit
 * 120 fully opaque (nothing clipped at the end). The bristled edge lives in the
 * 20-unit corridor between them.
 */
const BRUSH = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="100" preserveAspectRatio="none">
    <path fill="#fff" d="M220 0H115.5c-4.6 2.9-6.1 5.6-4.2 8.2 2.1 2.8 3.2 5.5 1.1 8.3-2.3 3-7.4 4.6-8.6 7.7-1.1 3 1.9 6 2.4 9 .5 3.1-2.4 5.9-3.1 8.9-.7 3 2.6 6 2.9 9 .3 3-2.6 5.9-2.4 8.9.2 3 3.4 5.9 3.2 8.9-.2 3-3.6 5.9-3.4 8.9.2 3 3.8 5.9 3.4 8.8-.4 2.9-4.4 5.7-4 8.6.3 2.1 2.4 3.4 4.4 4.8H220Z"/>
    <path fill="#fff" opacity=".85" d="M112.4 3.5c1.4 3.4.4 6.6-1.9 9.4-2 2.4-4.6 4.4-4.4 7.2.2 2.9 2.9 5.4 2.4 8.3-.4 2.8-3.4 5-3.6 7.9-.2 2.9 2.4 5.6 2.1 8.5-.3 2.9-3.2 5.2-3.2 8.1 0 2.9 2.7 5.5 2.5 8.4-.2 2.9-3.1 5.3-3 8.2.1 2.9 2.9 5.5 2.6 8.4-.3 2.9-3.3 5.2-3.2 8.1.1 2.4 2 4.2 3.6 6.2l3.1-.7c-1.5-2-3.3-3.7-3.3-6 0-2.8 2.9-5.1 3.2-8 .3-2.9-2.5-5.5-2.6-8.4-.1-2.9 2.8-5.3 3-8.2.2-2.9-2.5-5.5-2.5-8.4 0-2.9 2.9-5.2 3.2-8.1.3-2.9-2.3-5.6-2.1-8.5.2-2.9 3.2-5.1 3.6-7.9.5-2.9-2.2-5.4-2.4-8.3-.2-2.8 2.4-4.8 4.4-7.2 1.7-2.1 2.7-4.4 2.4-7l-3.9-2Z"/>
  </svg>`,
);

export function HeroHeadline({
  lines,
  className = "",
}: {
  lines: React.ReactNode[];
  className?: string;
}) {
  return (
    <h1
      className={className}
      style={{ ["--brush-mask" as string]: `url("data:image/svg+xml,${BRUSH}")` }}
    >
      {lines.map((line, index) => (
        <span
          key={index}
          className="hero-line block"
          style={{ animationDelay: `${0.12 + index * 0.08}s` }}
        >
          {line}
        </span>
      ))}
    </h1>
  );
}
