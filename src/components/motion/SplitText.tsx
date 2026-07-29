import { ElementType, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, VIEWPORT } from "@/lib/motion";

/**
 * Line-by-line mask reveal for headlines.
 *
 * A headline that fades in as one block is the default everywhere and reads as
 * default. Revealing it a line at a time — each line sliding up out of its own
 * clipped box — is the difference people register as "designed" without being
 * able to name it.
 *
 * Lines are measured from the real layout after render rather than guessed from
 * a character count, so the reveal survives responsive reflow, a font swap, or an
 * admin editing the copy to a different length.
 */
export function SplitText({
  text,
  className,
  as: Tag = "span",
  delay = 0,
  stagger = 0.075,
}: {
  text: string;
  className?: string;
  as?: ElementType;
  delay?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [lines, setLines] = useState<string[] | null>(null);
  const reduce = useReducedMotion();

  const words = text.split(/\s+/).filter(Boolean);

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const spans = el.querySelectorAll<HTMLElement>("[data-word]");
      if (!spans.length) return;
      const grouped: string[][] = [];
      let lastTop: number | null = null;
      spans.forEach((span) => {
        const top = Math.round(span.offsetTop);
        // A new offsetTop means the browser wrapped here. Within ~2px is the
        // same line: sub-pixel layout and different glyph heights shift it.
        if (lastTop === null || Math.abs(top - lastTop) > 2) {
          grouped.push([]);
          lastTop = top;
        }
        grouped[grouped.length - 1].push(span.textContent ?? "");
      });
      setLines(grouped.map((g) => g.join(" ")));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, reduce]);

  // Reduced motion, or before measurement: render the plain string. The
  // measuring pass below is visually identical, so there is no flash.
  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  if (!lines) {
    return (
      <Tag ref={ref as never} className={className}>
        {words.map((w, i) => (
          <span key={`${w}-${i}`} data-word>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className} aria-label={text}>
      {lines.map((line, i) => (
        <span key={`${line}-${i}`} className="block overflow-hidden" aria-hidden>
          <motion.span
            className="block"
            initial={{ y: "108%" }}
            whileInView={{ y: "0%" }}
            viewport={VIEWPORT}
            transition={{
              duration: 0.9,
              ease: EASE_OUT,
              delay: delay + i * stagger,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
