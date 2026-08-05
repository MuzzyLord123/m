/**
 * Hand-drawn brush-stroke underline. Two overlapping tapered strokes give it
 * the loaded-then-drying weight of a real brush rather than a ruled line.
 *
 * `pathLength="1"` normalises each path so a single dash unit covers it,
 * letting a CSS transition on stroke-dashoffset draw it left to right on hover,
 * focus, or permanently on the active page. See `.brush-underline` in
 * globals.css. No JavaScript: a server component.
 */
export function BrushStroke({
  className = "",
  colour = "currentColor",
}: {
  className?: string;
  colour?: string;
}) {
  return (
    <svg
      className={`brush-underline ${className}`}
      viewBox="0 0 120 10"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path
        pathLength={1}
        d="M1.5 6.2c14-2.3 30.4-3.4 47.8-3.3 19.4.1 38.6 1.4 69.2 3.6"
        stroke={colour}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      {/* Dry-brush trail — lighter, slightly offset, a beat behind. */}
      <path
        pathLength={1}
        d="M4 8.4c16-1.6 34-2.4 52-2.2 17 .2 34 1 62 2.4"
        stroke={colour}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.45}
      />
    </svg>
  );
}
