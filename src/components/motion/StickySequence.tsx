import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

export type SequenceStep = {
  id: string;
  label: string;
  title: string;
  body: string;
  meta?: string;
};

/**
 * The page's one pinned moment: a left rail that holds still and re-titles itself
 * while the right column scrolls through its steps.
 *
 * Worth being deliberate about — a site can afford exactly one of these. Two and
 * scrolling starts to feel like it is being taken away from the reader. Which
 * step is active is derived from an IntersectionObserver over the real
 * positions, so it stays correct at any viewport height and with any number of
 * steps.
 *
 * At `lg` and below the rail unpins and the steps read as an ordinary list.
 * Position: sticky with no fallback is how these break on phones.
 */
export function StickySequence({
  steps,
  eyebrow,
  heading,
  intro,
  renderVisual,
}: {
  steps: SequenceStep[];
  eyebrow: ReactNode;
  heading: ReactNode;
  intro?: ReactNode;
  renderVisual?: (step: SequenceStep, index: number) => ReactNode;
}) {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const nodes = itemRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!nodes.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Take the entry nearest the band, not simply the last to fire —
        // fast scrolling delivers several entries in one callback and order is
        // not guaranteed.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = nodes.indexOf(visible.target as HTMLDivElement);
        if (idx >= 0) setActive(idx);
      },
      // A band across the middle of the viewport: a step becomes active when it
      // reaches the reading position, not when it first appears at the bottom.
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.5, 1] }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [steps.length]);

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      {/* ── Pinned rail ─────────────────────────────────────────── */}
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-32">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px]">
              {eyebrow}
            </span>
          </div>

          <h2 className="heading-lg mb-5">{heading}</h2>
          {intro && <p className="body-md max-w-md">{intro}</p>}

          {/* Progress rail — doubles as the section's table of contents. */}
          <ol className="mt-10 hidden lg:block">
            {steps.map((step, i) => {
              const isActive = i === active;
              return (
                <li key={step.id} className="relative flex items-center gap-4 py-2">
                  <span className="relative flex h-px w-10 overflow-hidden bg-border">
                    <motion.span
                      className="absolute inset-y-0 left-0 bg-primary"
                      initial={false}
                      animate={{ width: isActive ? "100%" : "0%" }}
                      transition={{ duration: reduce ? 0 : 0.5, ease: EASE_OUT }}
                    />
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-500 ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ── Scrolling steps ─────────────────────────────────────── */}
      <div className="lg:col-span-7">
        {steps.map((step, i) => (
          <div
            key={step.id}
            ref={(el) => (itemRefs.current[i] = el)}
            className="border-t border-border/60 py-10 last:border-b sm:py-14"
          >
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
              transition={{ duration: 0.65, ease: EASE_OUT }}
            >
              <div className="mb-4 flex items-baseline gap-4">
                <span className="font-mono text-[11px] tabular-nums text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step.meta && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {step.meta}
                  </span>
                )}
              </div>

              <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-muted-foreground sm:text-[15px]">
                {step.body}
              </p>

              {renderVisual && <div className="mt-7">{renderVisual(step, i)}</div>}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
