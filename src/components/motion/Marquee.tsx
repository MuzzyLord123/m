import { ReactNode } from "react";

/**
 * Full-bleed horizontal ticker.
 *
 * Runs on a CSS keyframe rather than rAF, so it costs nothing on the main thread
 * and keeps running while React is busy. The track is duplicated once and
 * translated by exactly -50%, which is what makes the loop seamless — any other
 * distance shows a seam every cycle.
 *
 * Content is what the studio does, never who has bought it. A logo wall of
 * clients that do not exist is the thing this component must not become.
 */
export function Marquee({
  items,
  speed = 42,
  reverse = false,
  className = "",
  separator,
}: {
  items: string[];
  /** Seconds for one full pass. Higher is slower. */
  speed?: number;
  reverse?: boolean;
  className?: string;
  separator?: ReactNode;
}) {
  const sep = separator ?? (
    <span aria-hidden className="mx-6 inline-block h-1 w-1 rounded-full bg-primary/70 align-middle sm:mx-9" />
  );

  const track = (
    <div className="flex shrink-0 items-center" aria-hidden>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="flex items-center whitespace-nowrap">
          <span className="font-display text-lg font-medium tracking-tight text-foreground/70 sm:text-2xl">
            {item}
          </span>
          {sep}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`group relative flex overflow-hidden ${className}`}
      style={{
        maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <span className="sr-only">{items.join(", ")}</span>
      <div
        className="flex motion-reduce:animate-none"
        style={{
          animation: `marquee-scroll ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {track}
        {track}
      </div>
    </div>
  );
}
