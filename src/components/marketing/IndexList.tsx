import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { EASE_OUT, VIEWPORT } from "@/lib/motion";

export type IndexEntry = {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
};

/**
 * A numbered index of what the studio does, built as rows rather than cards.
 *
 * This replaces a five-item list of rounded panels in a rounded container. Cards
 * are the reflex answer to "several things of equal weight" and they flatten
 * everything to the same visual value — five boxes, five icons, five titles, no
 * hierarchy, nothing to look at.
 *
 * Rows separated by hairlines let the type be the design. The interaction is the
 * point: hovering a row dims its neighbours, drives an ember rule across the
 * full width, and lifts the title a couple of pixels. Nothing moves far; the
 * change in *attention* is what the visitor feels.
 */
export function IndexList({ entries }: { entries: IndexEntry[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const reduce = useReducedMotion();

  return (
    <div className="border-t border-border/60">
      {entries.map((entry, i) => {
        const isHovered = hovered === i;
        const dimmed = hovered !== null && !isHovered;
        const Row = entry.href ? Link : "div";
        const rowProps = entry.href ? ({ to: entry.href } as const) : ({} as const);

        return (
          <motion.div
            key={entry.title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.6, delay: i * 0.05, ease: EASE_OUT }}
            className="relative border-b border-border/60"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Full-width accent rule that draws across on hover. */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px origin-left bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              style={{ transform: isHovered ? "scaleX(1)" : "scaleX(0)" }}
            />

            <Row
              {...(rowProps as never)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              className={`group grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-3 py-8 outline-none transition-opacity duration-500 sm:grid-cols-[3.5rem_3rem_1fr_2.5rem] sm:items-center sm:gap-x-8 sm:py-10 ${
                dimmed ? "opacity-45" : "opacity-100"
              } ${entry.href ? "cursor-pointer" : ""} focus-visible:opacity-100`}
            >
              <span className="font-mono text-[11px] tabular-nums tracking-[0.2em] text-primary sm:text-xs">
                {String(i + 1).padStart(2, "0")}
              </span>

              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors duration-500"
                style={{
                  borderColor: isHovered
                    ? "hsl(var(--primary) / 0.5)"
                    : "hsl(var(--border))",
                }}
              >
                <entry.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </span>

              <span className="col-span-2 min-w-0 sm:col-span-1">
                <span
                  className="block font-display text-2xl font-semibold tracking-tight transition-transform duration-500 sm:text-3xl lg:text-[2.1rem]"
                  style={{ transform: isHovered && !reduce ? "translateX(6px)" : "none" }}
                >
                  {entry.title}
                </span>
                <span className="mt-2 block max-w-2xl text-sm font-light leading-relaxed text-muted-foreground sm:text-[15px]">
                  {entry.description}
                </span>
              </span>

              {entry.href && (
                <span className="hidden items-center justify-end sm:flex">
                  <ArrowUpRight
                    className="h-5 w-5 text-primary transition-all duration-500"
                    style={{
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered && !reduce ? "translate(0,0)" : "translate(-6px, 6px)",
                    }}
                    strokeWidth={1.5}
                  />
                </span>
              )}
            </Row>
          </motion.div>
        );
      })}
    </div>
  );
}
