import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

interface ScrollSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
}

const directionVariants = {
  up: {
    hidden: { opacity: 0, y: 80 },
    visible: { opacity: 1, y: 0 }
  },
  down: {
    hidden: { opacity: 0, y: -80 },
    visible: { opacity: 1, y: 0 }
  },
  left: {
    hidden: { opacity: 0, x: -80 },
    visible: { opacity: 1, x: 0 }
  },
  right: {
    hidden: { opacity: 0, x: 80 },
    visible: { opacity: 1, x: 0 }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1 }
  }
};

export function ScrollSection({ 
  children, 
  className = "", 
  delay = 0,
  direction = "up"
}: ScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: "-100px 0px -100px 0px"
  });

  const variants = directionVariants[direction];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredScrollSectionProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredScrollSection({ 
  children, 
  className = "",
  staggerDelay = 0.1
}: StaggeredScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: "-50px 0px -50px 0px"
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ScrollItemProps {
  children: ReactNode;
  className?: string;
}

export function ScrollItem({ children, className = "" }: ScrollItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
