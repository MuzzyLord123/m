import { ReactNode, createContext, useContext } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_IN_OUT, VIEWPORT } from "@/lib/motion";

/**
 * Line Draw — the signature move of the natural-graphics layer.
 *
 * Wrap an SVG in <LineDraw>; every `<DrawPath>` inside draws itself with a
 * stroke-dashoffset sweep when the graphic enters the viewport, once. Plotted
 * points (`<DrawPoint>`) pop in after their line has mostly drawn, which reads
 * as the pen touching down.
 *
 * pathLength is normalised to 1 by framer, so no measuring pass is needed and
 * the same component serves a 40px tick and an 800px orbit.
 */

const DrawCtx = createContext<{ reduce: boolean; base: number }>({ reduce: false, base: 0 });

export function LineDraw({
  children,
  className,
  /** Seconds before the first stroke starts. */
  delay = 0,
  viewBox,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  viewBox: string;
  ariaLabel?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <DrawCtx.Provider value={{ reduce, base: delay }}>
      <motion.svg
        viewBox={viewBox}
        fill="none"
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        aria-hidden={ariaLabel ? undefined : true}
        aria-label={ariaLabel}
        role={ariaLabel ? "img" : undefined}
      >
        {children}
      </motion.svg>
    </DrawCtx.Provider>
  );
}

export function DrawPath({
  d,
  stroke = "currentColor",
  strokeWidth = 1,
  opacity = 1,
  dashed = false,
  /** Seconds after the group's base delay. */
  at = 0,
  duration = 1.1,
}: {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dashed?: boolean;
  at?: number;
  duration?: number;
}) {
  const { reduce, base } = useContext(DrawCtx);
  return (
    <motion.path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      /* A dashed meridian cannot use pathLength draw (it would fight the dash
         pattern), so it fades instead. */
      strokeDasharray={dashed ? "3 6" : undefined}
      variants={
        reduce || dashed
          ? { hidden: { opacity: 0 }, visible: { opacity, transition: { duration: 0.3, delay: base + at } } }
          : {
              hidden: { pathLength: 0, opacity },
              visible: {
                pathLength: 1,
                opacity,
                transition: { duration, ease: EASE_IN_OUT, delay: base + at },
              },
            }
      }
    />
  );
}

export function DrawPoint({
  cx,
  cy,
  r = 3,
  fill = "currentColor",
  ring = false,
  at = 0,
}: {
  cx: number;
  cy: number;
  r?: number;
  fill?: string;
  ring?: boolean;
  at?: number;
}) {
  const { reduce, base } = useContext(DrawCtx);
  const common = {
    variants: {
      hidden: { scale: 0, opacity: 0 },
      visible: {
        scale: 1,
        opacity: 1,
        transition: reduce
          ? { duration: 0.25, delay: base + at }
          : { type: "spring" as const, stiffness: 340, damping: 22, delay: base + at },
      },
    },
    style: { transformOrigin: `${cx}px ${cy}px` },
  };
  return (
    <>
      <motion.circle cx={cx} cy={cy} r={r} fill={fill} {...common} />
      {ring && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={r * 2.4}
          stroke={fill}
          strokeOpacity={0.4}
          strokeWidth={1}
          fill="none"
          {...common}
        />
      )}
    </>
  );
}

export function DrawLabel({
  x,
  y,
  children,
  at = 0,
  fill = "currentColor",
  opacity = 1,
  anchor,
}: {
  x: number;
  y: number;
  children: ReactNode;
  at?: number;
  fill?: string;
  opacity?: number;
  anchor?: "start" | "middle" | "end";
}) {
  const { base } = useContext(DrawCtx);
  return (
    <motion.text
      x={x}
      y={y}
      fontSize="10"
      fill={fill}
      textAnchor={anchor}
      style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.2em" }}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity, transition: { duration: 0.5, delay: base + at } },
      }}
    >
      {children}
    </motion.text>
  );
}
