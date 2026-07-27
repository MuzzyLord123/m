import { ReactNode, CSSProperties } from "react";
import { motion, Variants } from "framer-motion";

type Direction = "up" | "down" | "left" | "right" | "none";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  scale?: boolean;
  blur?: boolean;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
}

const getVariants = (
  direction: Direction,
  distance: number,
  scale: boolean,
  blur: boolean
): Variants => {
  const translate: Record<Direction, { x?: number; y?: number }> = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  };

  return {
    hidden: {
      opacity: 0,
      ...translate[direction],
      ...(scale ? { scale: 0.95 } : {}),
      ...(blur ? { filter: "blur(8px)" } : {}),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
    },
  };
};

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  distance = 30,
  scale = false,
  blur = false,
  className,
  style,
  once = true,
}: ScrollRevealProps) {
  return (
    <motion.div
      variants={getVariants(direction, distance, scale, blur)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-60px" }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container for child ScrollReveal items */
export function StaggerContainer({
  children,
  className,
  stagger = 0.1,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ staggerChildren: stagger }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual stagger child */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
