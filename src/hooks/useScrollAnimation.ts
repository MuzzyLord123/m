import { useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef } from "react";

interface UseParallaxOptions {
  offset?: number;
  clamp?: boolean;
}

export function useParallax(value: MotionValue<number>, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

export function useScrollParallax(options: UseParallaxOptions = {}) {
  const { offset = 300 } = options;
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);

  return { ref, y, opacity, scrollYProgress };
}

export function useHeroParallax() {
  const { scrollY } = useScroll();
  
  // Parallax for background - moves slower than scroll
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 400]);
  
  // Content moves up faster creating depth
  const contentY = useTransform(scrollY, [0, 500], [0, -100]);
  
  // Fade out as you scroll
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  
  // Scale down slightly
  const contentScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  return { backgroundY, contentY, contentOpacity, contentScale };
}

// Animation variants for scroll-triggered sections
export const scrollRevealVariants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

export const fadeUpVariants = {
  hidden: { 
    opacity: 0, 
    y: 40 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

export const scaleInVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const slideInLeftVariants = {
  hidden: { 
    opacity: 0, 
    x: -60 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const slideInRightVariants = {
  hidden: { 
    opacity: 0, 
    x: 60 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};
