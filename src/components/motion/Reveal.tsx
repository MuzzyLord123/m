import { ReactNode, ElementType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  VIEWPORT,
  reducedVariants,
  revealSide,
  revealUp,
  staggerChild,
  staggerParent,
} from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Direction the content arrives from. `up` is the default and the right answer most of the time. */
  from?: "up" | "left" | "right";
  delay?: number;
  as?: ElementType;
};

/**
 * The single entry animation for the site. Wrap a block; it reveals once.
 *
 * Replaces the per-file `initial/whileInView/transition` triples that were
 * scattered across every page with slightly different numbers.
 */
export function Reveal({ children, className, from = "up", delay = 0, as }: RevealProps) {
  const reduce = useReducedMotion();
  const Comp = motion(as ?? "div");
  const variants = reduce
    ? reducedVariants
    : from === "up"
      ? revealUp
      : revealSide(from);

  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </Comp>
  );
}

/** Parent for a list or grid whose children should arrive in sequence. */
export function RevealGroup({
  children,
  className,
  stagger,
  delay = 0,
  as,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  const Comp = motion(as ?? "div");

  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={reduce ? reducedVariants : staggerParent(stagger, delay)}
    >
      {children}
    </Comp>
  );
}

/** Child of `RevealGroup`. */
export function RevealItem({
  children,
  className,
  as,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  const Comp = motion(as ?? "div");

  return (
    <Comp className={className} variants={reduce ? reducedVariants : staggerChild}>
      {children}
    </Comp>
  );
}
